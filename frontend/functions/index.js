const functions = require('firebase-functions');
const admin = require('firebase-admin');
const cors = require('cors')({
  origin: true, // Allow requests from any origin
  methods: ['GET', 'POST'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
});

// Initialize Firebase Admin with explicit credential
const serviceAccount = require('./serviceAccountKey.json');
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

// Helper function to check if user is admin
async function isUserAdmin(uid) {
  try {
    console.log('Checking admin status for user:', uid);
    const userDoc = await admin.firestore().collection('users').doc(uid).get();
    if (!userDoc.exists) {
      console.log('User document not found');
      return false;
    }
    const userData = userDoc.data();
    const isAdmin = userData.roles?.includes('ADMIN') || userData.role === 'admin';
    console.log('User data:', userData);
    console.log('Is admin:', isAdmin);
    return isAdmin;
  } catch (error) {
    console.error('Error checking admin status:', error);
    return false;
  }
}

// Helper function to validate auth context
async function validateAuth(context) {
  try {
    console.log('Validating auth context:', context.auth || 'No auth context');
    
    if (!context.auth) {
      console.log('No auth context found');
      throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
    }

    if (!context.auth.uid) {
      console.log('No UID in auth context');
      throw new functions.https.HttpsError('unauthenticated', 'Invalid authentication');
    }

    if (!context.auth.token) {
      console.log('No token in auth context');
      throw new functions.https.HttpsError('unauthenticated', 'Invalid authentication token');
    }

    console.log('Auth token:', {
      uid: context.auth.uid,
      email: context.auth.token.email,
      emailVerified: context.auth.token.email_verified
    });

    const isAdmin = await isUserAdmin(context.auth.uid);
    if (!isAdmin) {
      console.log('User is not an admin');
      throw new functions.https.HttpsError('permission-denied', 'User must be an admin to perform this action');
    }

    return context.auth.uid;
  } catch (error) {
    console.error('Auth validation error:', error);
    throw error;
  }
}

// Search products (server-side) - v1 compatible
exports.searchProductsV2 = functions.https.onCall(async (data, context) => {
  try {
    const { query, category, minPrice, maxPrice, sort } = data;
    
    let productsRef = db.collection('products');
    
    // Build query based on filters
    if (category && category !== 'all') {
      productsRef = productsRef.where('categoryId', '==', category);
    }
    
    if (minPrice !== undefined) {
      productsRef = productsRef.where('price', '>=', minPrice);
    }
    
    if (maxPrice !== undefined) {
      productsRef = productsRef.where('price', '<=', maxPrice);
    }
    
    // Get products
    let productsSnapshot = await productsRef.get();
    let products = [];
    
    productsSnapshot.forEach(doc => {
      const productData = doc.data();
      products.push({
        id: doc.id,
        ...productData
      });
    });
    
    // Filter by search query if provided
    if (query && query.trim() !== '') {
      const searchTerms = query.toLowerCase().trim().split(/\s+/);
      products = products.filter(product => {
        const searchText = `${product.name || ''} ${product.description || ''}`.toLowerCase();
        return searchTerms.some(term => searchText.includes(term));
      });
    }
    
    // Sort results
    if (sort) {
      switch (sort) {
        case 'price_asc':
          products.sort((a, b) => (a.price || 0) - (b.price || 0));
          break;
        case 'price_desc':
          products.sort((a, b) => (b.price || 0) - (a.price || 0));
          break;
        case 'name_asc':
          products.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
          break;
        case 'name_desc':
          products.sort((a, b) => (b.name || '').localeCompare(a.name || ''));
          break;
        default:
          break;
      }
    }
    
    return { products };
  } catch (error) {
    console.error('Error searching products:', error);
    throw new functions.https.HttpsError('internal', error.message);
  }
});

// Category Management Functions - v1 compatible
exports.getCategoriesV2 = functions.https.onCall(async (data, context) => {
  try {
    const categoriesSnapshot = await db.collection('categories').orderBy('name').get();
    const categories = [];
    
    categoriesSnapshot.forEach(doc => {
      categories.push({
        id: doc.id,
        ...doc.data()
      });
    });
    
    return { categories };
  } catch (error) {
    console.error('Error getting categories:', error);
    throw new functions.https.HttpsError('internal', error.message);
  }
});

exports.createCategoryV2 = functions.https.onCall(async (data, context) => {
  try {
    console.log('Creating category - Request data:', data);
    console.log('Auth context:', context.auth || 'No auth context');

    // Check if user is authenticated
    if (!context.auth) {
      console.log('Authentication required but not provided');
      throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
    }
    
    // Log detailed auth info for debugging
    console.log('User authenticated with UID:', context.auth.uid);
    console.log('Auth token details:', {
      uid: context.auth.uid,
      email: context.auth.token?.email || 'No email',
      emailVerified: context.auth.token?.email_verified || false,
      authTime: context.auth.token?.auth_time || 'Unknown'
    });
    
    // Verify the user document exists in Firestore
    const userDoc = await admin.firestore().collection('users').doc(context.auth.uid).get();
    if (!userDoc.exists) {
      console.log('User document does not exist in Firestore');
      // Create a new user document if it doesn't exist
      await admin.firestore().collection('users').doc(context.auth.uid).set({
        email: context.auth.token.email,
        roles: ['USER'],
        createdAt: admin.firestore.FieldValue.serverTimestamp()
      });
      console.log('Created new user document for:', context.auth.uid);
    } else {
      console.log('User document exists:', userDoc.data());
    }
    
    const { name, description } = data;
    
    if (!name || !description) {
      console.log('Missing required fields');
      throw new functions.https.HttpsError('invalid-argument', 'Name and description are required');
    }
    
    const categoryData = {
      name: name.trim(),
      description: description.trim(),
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      createdBy: context.auth.uid
    };
    
    console.log('Creating category with data:', categoryData);
    
    const categoryRef = await admin.firestore().collection('categories').add(categoryData);
    console.log('Category created with ID:', categoryRef.id);
    
    return {
      success: true,
      category: {
        id: categoryRef.id,
        ...categoryData
      }
    };
  } catch (error) {
    console.error('Error creating category:', error);
    
    if (error instanceof functions.https.HttpsError) {
      throw error;
    }
    
    throw new functions.https.HttpsError(
      'internal',
      `Error creating category: ${error.message}`
    );
  }
});

exports.updateCategoryV2 = functions.https.onCall(async (data, context) => {
  try {
    // Check if user is authenticated
    if (!context.auth) {
      throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
    }

    // Log the incoming request
    console.log('Updating category with data:', JSON.stringify(data));
    
    const { id, name, description } = data;
    
    if (!id || !name || !description) {
      throw new functions.https.HttpsError('invalid-argument', 'ID, name and description are required');
    }
    
    const categoryRef = admin.firestore().collection('categories').doc(id);
    const categoryDoc = await categoryRef.get();
    
    if (!categoryDoc.exists) {
      throw new functions.https.HttpsError('not-found', 'Category not found');
    }
    
    const categoryData = {
      name: name.trim(),
      description: description.trim(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedBy: context.auth.uid
    };
    
    console.log('Attempting to update category with data:', JSON.stringify(categoryData));
    
    await categoryRef.update(categoryData);
    console.log('Category updated successfully:', id);
    
    return {
      success: true,
      category: {
        id: id,
        name: categoryData.name,
        description: categoryData.description
      }
    };
  } catch (error) {
    console.error('Detailed error updating category:', {
      code: error.code,
      message: error.message,
      details: error.details,
      stack: error.stack
    });
    
    if (error.code === 'unauthenticated') {
      throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
    } else if (error.code === 'not-found') {
      throw new functions.https.HttpsError('not-found', 'Category not found');
    } else if (error.code === 'invalid-argument') {
      throw new functions.https.HttpsError('invalid-argument', error.message);
    } else {
      throw new functions.https.HttpsError('internal', `Error updating category: ${error.message}`);
    }
  }
});

exports.deleteCategoryV2 = functions.https.onCall(async (data, context) => {
  try {
    // Check if user is authenticated
    if (!context.auth) {
      throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
    }

    // Log the incoming request
    console.log('Deleting category with data:', JSON.stringify(data));
    
    const { id } = data;
    
    if (!id) {
      throw new functions.https.HttpsError('invalid-argument', 'Category ID is required');
    }
    
    const categoryRef = admin.firestore().collection('categories').doc(id);
    const categoryDoc = await categoryRef.get();
    
    if (!categoryDoc.exists) {
      throw new functions.https.HttpsError('not-found', 'Category not found');
    }
    
    console.log('Attempting to delete category:', id);
    
    await categoryRef.delete();
    console.log('Category deleted successfully:', id);
    
    return {
      success: true
    };
  } catch (error) {
    console.error('Detailed error deleting category:', {
      code: error.code,
      message: error.message,
      details: error.details,
      stack: error.stack
    });
    
    if (error.code === 'unauthenticated') {
      throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
    } else if (error.code === 'not-found') {
      throw new functions.https.HttpsError('not-found', 'Category not found');
    } else if (error.code === 'invalid-argument') {
      throw new functions.https.HttpsError('invalid-argument', error.message);
    } else {
      throw new functions.https.HttpsError('internal', `Error deleting category: ${error.message}`);
    }
  }
});

// Carousel Management Functions - v1 compatible
exports.getCarouselImagesV2 = functions.https.onCall(async (data, context) => {
  try {
    const carouselSnapshot = await db.collection('carouselImages').orderBy('displayOrder').get();
    const images = [];
    
    carouselSnapshot.forEach(doc => {
      images.push({
        id: doc.id,
        ...doc.data()
      });
    });
    
    return { images };
  } catch (error) {
    console.error('Error getting carousel images:', error);
    throw new functions.https.HttpsError('internal', error.message);
  }
});

exports.createCarouselImageV2 = functions.https.onCall(async (data, context) => {
  try {
    const { imageUrl, title, subtitle, displayOrder, active } = data;
    
    if (!imageUrl) {
      throw new functions.https.HttpsError('invalid-argument', 'Image URL is required');
    }
    
    const imageData = {
      imageUrl: imageUrl.trim(),
      title: title?.trim() || '',
      subtitle: subtitle?.trim() || '',
      displayOrder: displayOrder || 0,
      active: active !== false, // Default to true
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    };
    
    const docRef = await db.collection('carouselImages').add(imageData);
    
    return { 
      success: true, 
      id: docRef.id,
      image: { id: docRef.id, ...imageData }
    };
  } catch (error) {
    console.error('Error creating carousel image:', error);
    throw new functions.https.HttpsError('internal', error.message);
  }
});

exports.updateCarouselImageV2 = functions.https.onCall(async (data, context) => {
  try {
    const { id, imageUrl, title, subtitle, displayOrder, active } = data;
    
    if (!id || !imageUrl) {
      throw new functions.https.HttpsError('invalid-argument', 'ID and image URL are required');
    }
    
    const imageRef = db.collection('carouselImages').doc(id);
    const imageDoc = await imageRef.get();
    
    if (!imageDoc.exists) {
      throw new functions.https.HttpsError('not-found', 'Carousel image not found');
    }
    
    await imageRef.update({
      imageUrl: imageUrl.trim(),
      title: title?.trim() || '',
      subtitle: subtitle?.trim() || '',
      displayOrder: displayOrder || 0,
      active: active !== false,
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });
    
    return { success: true };
  } catch (error) {
    console.error('Error updating carousel image:', error);
    throw new functions.https.HttpsError('internal', error.message);
  }
});

exports.deleteCarouselImageV2 = functions.https.onCall(async (data, context) => {
  try {
    const { id } = data;
    
    if (!id) {
      throw new functions.https.HttpsError('invalid-argument', 'Image ID is required');
    }
    
    const imageRef = db.collection('carouselImages').doc(id);
    const imageDoc = await imageRef.get();
    
    if (!imageDoc.exists) {
      throw new functions.https.HttpsError('not-found', 'Carousel image not found');
    }
    
    await imageRef.delete();
    
    return { success: true };
  } catch (error) {
    console.error('Error deleting carousel image:', error);
    throw new functions.https.HttpsError('internal', error.message);
  }
});

// Product management functions
exports.getProductsV2 = functions.https.onCall(async (data, context) => {
  try {
    const productsSnapshot = await db.collection('products').get();
    const products = [];
    
    for (const doc of productsSnapshot.docs) {
      const productData = doc.data();
      let categoryData = null;
      
      // Fetch category if categoryId exists
      if (productData.categoryId) {
        try {
          const categoryDoc = await db.collection('categories').doc(productData.categoryId).get();
          if (categoryDoc.exists) {
            categoryData = { id: categoryDoc.id, ...categoryDoc.data() };
          }
        } catch (error) {
          console.warn('Error fetching category:', error);
        }
      }
      
      products.push({
        id: doc.id,
        ...productData,
        category: categoryData
      });
    }
    
    return { products };
  } catch (error) {
    console.error('Error getting products:', error);
    throw new functions.https.HttpsError('internal', error.message);
  }
});

exports.createProductV2 = functions.https.onCall(async (data, context) => {
  try {
    const { name, description, price, mainImageUrl, stockQuantity, featured, categoryId } = data;
    
    if (!name || !description || price === undefined || stockQuantity === undefined) {
      throw new functions.https.HttpsError('invalid-argument', 'Required fields missing');
    }
    
    const productData = {
      name: name.trim(),
      description: description.trim(),
      price: parseFloat(price),
      mainImageUrl: mainImageUrl?.trim() || '',
      stockQuantity: parseInt(stockQuantity),
      featured: featured || false,
      categoryId: categoryId || null,
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    };
    
    const docRef = await db.collection('products').add(productData);
    
    return { 
      success: true, 
      id: docRef.id,
      product: { id: docRef.id, ...productData }
    };
  } catch (error) {
    console.error('Error creating product:', error);
    throw new functions.https.HttpsError('internal', error.message);
  }
});

exports.updateProductV2 = functions.https.onCall(async (data, context) => {
  try {
    const { id, name, description, price, mainImageUrl, stockQuantity, featured, categoryId } = data;
    
    if (!id || !name || !description || price === undefined || stockQuantity === undefined) {
      throw new functions.https.HttpsError('invalid-argument', 'Required fields missing');
    }
    
    const productRef = db.collection('products').doc(id);
    const productDoc = await productRef.get();
    
    if (!productDoc.exists) {
      throw new functions.https.HttpsError('not-found', 'Product not found');
    }
    
    await productRef.update({
      name: name.trim(),
      description: description.trim(),
      price: parseFloat(price),
      mainImageUrl: mainImageUrl?.trim() || '',
      stockQuantity: parseInt(stockQuantity),
      featured: featured || false,
      categoryId: categoryId || null,
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });
    
    return { success: true };
  } catch (error) {
    console.error('Error updating product:', error);
    throw new functions.https.HttpsError('internal', error.message);
  }
});

exports.deleteProductV2 = functions.https.onCall(async (data, context) => {
  try {
    const { id } = data;
    
    if (!id) {
      throw new functions.https.HttpsError('invalid-argument', 'Product ID is required');
    }
    
    const productRef = db.collection('products').doc(id);
    const productDoc = await productRef.get();
    
    if (!productDoc.exists) {
      throw new functions.https.HttpsError('not-found', 'Product not found');
    }
    
    await productRef.delete();
    
    return { success: true };
  } catch (error) {
    console.error('Error deleting product:', error);
    throw new functions.https.HttpsError('internal', error.message);
  }
});

// One-time admin initialization function
exports.initializeAdmin = functions.https.onCall(async (data, context) => {
  try {
    console.log('Attempting to initialize admin user');
    
    // Check if this is the specific email we want to make admin
    const targetEmail = 'profy401@gmail.com';
    
    if (!context.auth) {
      throw new functions.https.HttpsError('unauthenticated', 'Must be logged in');
    }

    // Get the user making the request
    const requestingUserEmail = context.auth.token.email;
    
    if (requestingUserEmail !== targetEmail) {
      throw new functions.https.HttpsError(
        'permission-denied', 
        'Only the designated admin email can be initialized as admin'
      );
    }

    // Check if any admin already exists
    const adminSnapshot = await admin.firestore()
      .collection('users')
      .where('roles', 'array-contains', 'ADMIN')
      .get();

    if (!adminSnapshot.empty) {
      throw new functions.https.HttpsError(
        'failed-precondition',
        'An admin user already exists'
      );
    }

    // Get the user document
    const userDoc = await admin.firestore()
      .collection('users')
      .doc(context.auth.uid)
      .get();

    if (!userDoc.exists) {
      // Create user document if it doesn't exist
      await admin.firestore()
        .collection('users')
        .doc(context.auth.uid)
        .set({
          email: targetEmail,
          roles: ['USER', 'ADMIN'],
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
          updatedAt: admin.firestore.FieldValue.serverTimestamp()
        });
    } else {
      // Update existing document
      await admin.firestore()
        .collection('users')
        .doc(context.auth.uid)
        .update({
          roles: ['USER', 'ADMIN'],
          updatedAt: admin.firestore.FieldValue.serverTimestamp()
        });
    }

    // Set custom claims
    await admin.auth().setCustomUserClaims(context.auth.uid, {
      admin: true
    });

    console.log('Successfully initialized admin user:', context.auth.uid);
    
    return { success: true, message: 'You are now the admin. Please sign out and sign back in.' };
  } catch (error) {
    console.error('Error initializing admin:', error);
    throw new functions.https.HttpsError('internal', error.message);
  }
});

// Simple test function to check authentication
exports.testAuthV2 = functions.https.onCall(async (data, context) => {
  try {
    console.log('Testing authentication - Auth context:', context.auth || 'No auth context');

    if (!context.auth) {
      console.log('No auth context found');
      throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
    }
    
    console.log('User authenticated with UID:', context.auth.uid);
    console.log('Auth token details:', {
      uid: context.auth.uid,
      email: context.auth.token?.email || 'No email',
      emailVerified: context.auth.token?.email_verified || false,
      authTime: context.auth.token?.auth_time || 'Unknown'
    });
    
    // Check if user document exists
    const userDoc = await admin.firestore().collection('users').doc(context.auth.uid).get();
    console.log('User document exists:', userDoc.exists);
    if (userDoc.exists) {
      console.log('User data:', userDoc.data());
    }
    
    return {
      success: true,
      message: 'Authentication successful',
      userId: context.auth.uid,
      userEmail: context.auth.token?.email || 'No email'
    };
  } catch (error) {
    console.error('Error testing authentication:', error);
    
    if (error instanceof functions.https.HttpsError) {
      throw error;
    }
    
    throw new functions.https.HttpsError(
      'internal',
      `Error testing authentication: ${error.message}`
    );
  }
});

// HTTP function to test authentication with CORS
exports.testAuthHttp = functions.https.onRequest((req, res) => {
  // Enable CORS
  cors(req, res, async () => {
    try {
      // Get auth token from Authorization header
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        res.status(403).json({ 
          success: false, 
          error: 'Unauthorized - No token provided' 
        });
        return;
      }

      const idToken = authHeader.split('Bearer ')[1];
      
      try {
        // Verify the ID token
        const decodedToken = await admin.auth().verifyIdToken(idToken);
        console.log('User authenticated with UID:', decodedToken.uid);
        
        // Check if user document exists
        const userDoc = await admin.firestore().collection('users').doc(decodedToken.uid).get();
        
        res.status(200).json({
          success: true,
          message: 'Authentication successful',
          userId: decodedToken.uid,
          email: decodedToken.email || 'No email',
          emailVerified: decodedToken.email_verified || false,
          userDocExists: userDoc.exists,
          userData: userDoc.exists ? userDoc.data() : null
        });
      } catch (verifyError) {
        console.error('Error verifying token:', verifyError);
        res.status(403).json({ 
          success: false, 
          error: 'Unauthorized - Invalid token',
          details: verifyError.message
        });
      }
    } catch (error) {
      console.error('Error in testAuthHttp:', error);
      res.status(500).json({ 
        success: false, 
        error: 'Internal server error',
        details: error.message
      });
    }
  });
}); 