import { getFunctions, httpsCallable } from 'firebase/functions';
import { getAuth } from 'firebase/auth';
import { db } from '../firebase';
import { collection, addDoc, serverTimestamp, doc, updateDoc, deleteDoc, getDoc } from 'firebase/firestore';

const functions = getFunctions();
const auth = getAuth();

// Helper function to extract error message from Firebase error
const extractErrorMessage = (error) => {
  console.log('Extracting error message from:', error);
  if (error.code === 'functions/unauthenticated') {
    return 'You must be logged in to perform this action';
  } else if (error.code === 'functions/not-found') {
    return 'The requested item was not found';
  } else if (error.code === 'functions/invalid-argument') {
    return error.message || 'Invalid input provided';
  } else if (error.code === 'functions/permission-denied') {
    return 'You do not have permission to perform this action';
  } else {
    console.error('Detailed error:', error);
    return error.message || 'An unexpected error occurred';
  }
};

// Helper function to ensure fresh token
const ensureFreshToken = async () => {
  console.log('Ensuring fresh token...');
  const user = auth.currentUser;
  if (!user) {
    console.error('No user found in auth.currentUser');
    throw new Error('You must be logged in to perform this action');
  }

  try {
    // Log current user state
    console.log('Current user state:', {
      uid: user.uid,
      email: user.email,
      emailVerified: user.emailVerified,
      metadata: user.metadata
    });

    // Force token refresh
    const token = await user.getIdToken(true);
    console.log('Token refreshed successfully');

    // Decode token to check claims
    const tokenParts = token.split('.');
    const tokenPayload = JSON.parse(atob(tokenParts[1]));
    console.log('Token payload:', {
      exp: new Date(tokenPayload.exp * 1000).toLocaleString(),
      auth_time: new Date(tokenPayload.auth_time * 1000).toLocaleString(),
      email: tokenPayload.email,
      email_verified: tokenPayload.email_verified
    });

    return { user, token };
  } catch (error) {
    console.error('Error refreshing token:', error);
    throw error;
  }
};

// Category Management
export const getCategories = async () => {
  try {
    console.log('Fetching categories...');
    await ensureFreshToken();
    const getCategoriesFunction = httpsCallable(functions, 'getCategoriesV2');
    const result = await getCategoriesFunction();
    console.log('Categories fetched:', result.data);
    return { categories: result.data.categories, error: null };
  } catch (error) {
    console.error('Error fetching categories:', error);
    return { categories: [], error: extractErrorMessage(error) };
  }
};

export const createCategory = async (categoryData) => {
  try {
    console.log('Creating category:', categoryData);
    
    // Get current user and ensure they're logged in
    const user = auth.currentUser;
    if (!user) {
      console.error('No user found in auth.currentUser');
      return { success: false, error: 'You must be logged in to perform this action' };
    }
    
    // Force token refresh
    try {
      console.log('Forcing token refresh for user:', user.uid);
      await user.getIdToken(true);
      console.log('Token refreshed successfully');
    } catch (tokenError) {
      console.error('Error refreshing token:', tokenError);
      return { success: false, error: 'Authentication error. Please try logging out and back in.' };
    }
    
    const data = {
      name: String(categoryData.name || '').trim(),
      description: String(categoryData.description || '').trim()
    };

    if (!data.name || !data.description) {
      return { success: false, error: 'Name and description are required' };
    }

    console.log('Calling createCategoryV2 function with data:', data);
    const createCategoryFunction = httpsCallable(functions, 'createCategoryV2');
    const result = await createCategoryFunction(data);
    console.log('Category created:', result.data);
    
    return { 
      success: result.data.success, 
      category: result.data.category, 
      error: null 
    };
  } catch (error) {
    console.error('❌ Error calling createCategoryV2:', error);
    console.error('❌ Error details:', error);
    
    // Check for specific Firebase error codes
    if (error.code === 'functions/unauthenticated' || 
        error.message?.includes('unauthenticated') || 
        error.message?.includes('logged in')) {
      return { 
        success: false, 
        error: 'Authentication error. Please try logging out and back in.' 
      };
    }
    
    return { success: false, error: extractErrorMessage(error) };
  }
};

export const updateCategory = async (id, categoryData) => {
  try {
    console.log('Updating category:', { id, ...categoryData });
    
    // Get current user and ensure they're logged in
    const user = auth.currentUser;
    if (!user) {
      console.error('No user found in auth.currentUser');
      return { success: false, error: 'You must be logged in to perform this action' };
    }
    
    // Validate data
    const data = {
      name: String(categoryData.name || '').trim(),
      description: String(categoryData.description || '').trim()
    };

    if (!id || !data.name || !data.description) {
      return { success: false, error: 'ID, name, and description are required' };
    }

    // Force token refresh
    console.log('Forcing token refresh for user:', user.uid);
    const idToken = await user.getIdToken(true);
    console.log('Token refreshed successfully');
    
    // Update directly in Firestore
    try {
      const categoryRef = doc(db, 'categories', id);
      await updateDoc(categoryRef, {
        name: data.name,
        description: data.description,
        updatedAt: serverTimestamp(),
        updatedBy: user.uid
      });
      
      console.log('Category updated with ID:', id);
      
      return { 
        success: true, 
        category: {
          id,
          name: data.name,
          description: data.description
        },
        error: null 
      };
    } catch (firestoreError) {
      console.error('Error updating category in Firestore:', firestoreError);
      return { 
        success: false, 
        error: 'Error updating category in database: ' + firestoreError.message
      };
    }
  } catch (error) {
    console.error('Error updating category:', error);
    return { success: false, error: extractErrorMessage(error) };
  }
};

export const deleteCategory = async (id) => {
  try {
    console.log('Deleting category:', id);
    
    // Get current user and ensure they're logged in
    const user = auth.currentUser;
    if (!user) {
      console.error('No user found in auth.currentUser');
      return { success: false, error: 'You must be logged in to perform this action' };
    }
    
    if (!id) {
      return { success: false, error: 'Category ID is required' };
    }

    // Force token refresh
    console.log('Forcing token refresh for user:', user.uid);
    const idToken = await user.getIdToken(true);
    console.log('Token refreshed successfully');
    
    // Delete directly from Firestore
    try {
      const categoryRef = doc(db, 'categories', id);
      await deleteDoc(categoryRef);
      
      console.log('Category deleted with ID:', id);
      
      return { 
        success: true,
        error: null 
      };
    } catch (firestoreError) {
      console.error('Error deleting category from Firestore:', firestoreError);
      return { 
        success: false, 
        error: 'Error deleting category from database: ' + firestoreError.message
      };
    }
  } catch (error) {
    console.error('Error deleting category:', error);
    return { success: false, error: extractErrorMessage(error) };
  }
};

// Carousel Management
export const getCarouselImages = async () => {
  try {
    console.log('🎠 Calling getCarouselImagesV2 function...');
    const getCarouselImagesFunction = httpsCallable(functions, 'getCarouselImagesV2');
    const result = await getCarouselImagesFunction();
    console.log('✅ Carousel images received:', result.data);
    return { images: result.data.images, error: null };
  } catch (error) {
    console.error('❌ Error calling getCarouselImagesV2:', error);
    return { images: [], error: error.message };
  }
};

export const createCarouselImage = async (imageData) => {
  try {
    console.log('🎠 Calling createCarouselImageV2 function with:', imageData);
    const createCarouselImageFunction = httpsCallable(functions, 'createCarouselImageV2');
    const result = await createCarouselImageFunction(imageData);
    console.log('✅ Carousel image created:', result.data);
    return { success: true, image: result.data.image, error: null };
  } catch (error) {
    console.error('❌ Error calling createCarouselImageV2:', error);
    return { success: false, error: error.message };
  }
};

export const updateCarouselImage = async (id, imageData) => {
  try {
    console.log('Updating carousel image:', { id, ...imageData });
    
    // Get current user and ensure they're logged in
    const user = auth.currentUser;
    if (!user) {
      console.error('No user found in auth.currentUser');
      return { success: false, error: 'You must be logged in to perform this action' };
    }
    
    if (!id) {
      return { success: false, error: 'Image ID is required' };
    }

    if (!imageData.imageUrl || imageData.imageUrl.trim() === '') {
      return { success: false, error: 'Image URL is required' };
    }

    // Force token refresh
    console.log('Forcing token refresh for user:', user.uid);
    const idToken = await user.getIdToken(true);
    console.log('Token refreshed successfully');
    
    // Update directly in Firestore
    try {
      const carouselRef = doc(db, 'carouselImages', id);
      await updateDoc(carouselRef, {
        imageUrl: imageData.imageUrl.trim(),
        title: (imageData.title || '').trim(),
        subtitle: (imageData.subtitle || '').trim(),
        displayOrder: Number(imageData.displayOrder) || 0,
        active: imageData.active !== false,
        updatedAt: serverTimestamp(),
        updatedBy: user.uid
      });
      
      console.log('Carousel image updated with ID:', id);
      
      return { 
        success: true,
        error: null 
      };
    } catch (firestoreError) {
      console.error('Error updating carousel image in Firestore:', firestoreError);
      return { 
        success: false, 
        error: 'Error updating carousel image: ' + firestoreError.message
      };
    }
  } catch (error) {
    console.error('❌ Error updating carousel image:', error);
    return { success: false, error: extractErrorMessage(error) };
  }
};

export const deleteCarouselImage = async (id) => {
  try {
    console.log('Deleting carousel image:', id);
    
    // Get current user and ensure they're logged in
    const user = auth.currentUser;
    if (!user) {
      console.error('No user found in auth.currentUser');
      return { success: false, error: 'You must be logged in to perform this action' };
    }
    
    if (!id) {
      return { success: false, error: 'Image ID is required' };
    }

    // Force token refresh
    console.log('Forcing token refresh for user:', user.uid);
    const idToken = await user.getIdToken(true);
    console.log('Token refreshed successfully');
    
    // Delete directly from Firestore
    try {
      const carouselRef = doc(db, 'carouselImages', id);
      await deleteDoc(carouselRef);
      
      console.log('Carousel image deleted with ID:', id);
      
      return { 
        success: true,
        error: null 
      };
    } catch (firestoreError) {
      console.error('Error deleting carousel image from Firestore:', firestoreError);
      return { 
        success: false, 
        error: 'Error deleting carousel image: ' + firestoreError.message
      };
    }
  } catch (error) {
    console.error('❌ Error deleting carousel image:', error);
    return { success: false, error: extractErrorMessage(error) };
  }
};

// Product Management (for completeness)
export const getProducts = async () => {
  try {
    console.log('🔥 Calling getProductsV2 function...');
    const getProductsFunction = httpsCallable(functions, 'getProductsV2');
    const result = await getProductsFunction();
    console.log('✅ Products received:', result.data);
    return { products: result.data.products, error: null };
  } catch (error) {
    console.error('❌ Error calling getProductsV2:', error);
    return { products: [], error: error.message };
  }
};

export const createProduct = async (productData) => {
  try {
    console.log('🔥 Calling createProductV2 function with:', productData);
    const createProductFunction = httpsCallable(functions, 'createProductV2');
    const result = await createProductFunction(productData);
    console.log('✅ Product created:', result.data);
    return { success: true, product: result.data.product, error: null };
  } catch (error) {
    console.error('❌ Error calling createProductV2:', error);
    return { success: false, error: error.message };
  }
};

export const updateProduct = async (id, productData) => {
  try {
    console.log('Updating product:', { id, ...productData });
    
    // Get current user and ensure they're logged in
    const user = auth.currentUser;
    if (!user) {
      console.error('No user found in auth.currentUser');
      return { success: false, error: 'You must be logged in to perform this action' };
    }
    
    if (!id) {
      return { success: false, error: 'Product ID is required' };
    }

    // Validate required data
    if (!productData.name || productData.name.trim() === '') {
      return { success: false, error: 'Product name is required' };
    }
    
    if (!productData.description || productData.description.trim() === '') {
      return { success: false, error: 'Product description is required' };
    }
    
    if (productData.price === undefined || productData.price === null || isNaN(Number(productData.price))) {
      return { success: false, error: 'Valid product price is required' };
    }

    if (!productData.mainImageUrl || productData.mainImageUrl.trim() === '') {
      return { success: false, error: 'Product image URL is required' };
    }
    
    if (!productData.categoryId) {
      return { success: false, error: 'Product category is required' };
    }

    // Force token refresh
    console.log('Forcing token refresh for user:', user.uid);
    const idToken = await user.getIdToken(true);
    console.log('Token refreshed successfully');
    
    // Update directly in Firestore
    try {
      const productRef = doc(db, 'products', id);
      
      // Prepare update data
      const updateData = {
        name: productData.name.trim(),
        description: productData.description.trim(),
        price: Number(productData.price),
        stockQuantity: Number(productData.stockQuantity || 0), // Changed from stock to stockQuantity
        categoryId: productData.categoryId || null,
        mainImageUrl: productData.mainImageUrl || '', // Changed from imageUrl to mainImageUrl
        active: productData.active !== false,
        featured: productData.featured === true, // Explicitly set featured based on featured property
        updatedAt: serverTimestamp(),
        updatedBy: user.uid
      };
      
      console.log('Update data:', updateData);
      
      await updateDoc(productRef, updateData);
      
      console.log('Product updated with ID:', id);
      
      return { 
        success: true,
        error: null 
      };
    } catch (firestoreError) {
      console.error('Error updating product in Firestore:', firestoreError);
      return { 
        success: false, 
        error: 'Error updating product: ' + firestoreError.message
      };
    }
  } catch (error) {
    console.error('❌ Error updating product:', error);
    return { success: false, error: extractErrorMessage(error) };
  }
};

export const deleteProduct = async (id) => {
  try {
    console.log('Deleting product:', id);
    
    // Get current user and ensure they're logged in
    const user = auth.currentUser;
    if (!user) {
      console.error('No user found in auth.currentUser');
      return { success: false, error: 'You must be logged in to perform this action' };
    }
    
    if (!id) {
      return { success: false, error: 'Product ID is required' };
    }

    // Force token refresh
    console.log('Forcing token refresh for user:', user.uid);
    const idToken = await user.getIdToken(true);
    console.log('Token refreshed successfully');
    
    // Delete directly from Firestore
    try {
      const productRef = doc(db, 'products', id);
      await deleteDoc(productRef);
      
      console.log('Product deleted with ID:', id);
      
      return { 
        success: true,
        error: null 
      };
    } catch (firestoreError) {
      console.error('Error deleting product from Firestore:', firestoreError);
      return { 
        success: false, 
        error: 'Error deleting product: ' + firestoreError.message
      };
    }
  } catch (error) {
    console.error('❌ Error deleting product:', error);
    return { success: false, error: extractErrorMessage(error) };
  }
};

// Test authentication function
export const testAuth = async () => {
  try {
    console.log('Testing authentication...');
    
    // Get current user and ensure they're logged in
    const user = auth.currentUser;
    if (!user) {
      console.error('No user found in auth.currentUser');
      return { 
        success: false, 
        error: 'You must be logged in to perform this action',
        authState: 'No user in auth.currentUser'
      };
    }
    
    // Log user details
    console.log('Current user details:', {
      uid: user.uid,
      email: user.email,
      emailVerified: user.emailVerified,
      metadata: user.metadata
    });
    
    // Force token refresh
    try {
      console.log('Forcing token refresh for user:', user.uid);
      const token = await user.getIdToken(true);
      console.log('Token refreshed successfully');
      
      // Decode token to check claims
      const tokenParts = token.split('.');
      const tokenPayload = JSON.parse(atob(tokenParts[1]));
      console.log('Token payload:', {
        exp: new Date(tokenPayload.exp * 1000).toLocaleString(),
        auth_time: new Date(tokenPayload.auth_time * 1000).toLocaleString(),
        email: tokenPayload.email,
        email_verified: tokenPayload.email_verified
      });
    } catch (tokenError) {
      console.error('Error refreshing token:', tokenError);
      return { 
        success: false, 
        error: 'Authentication error. Please try logging out and back in.',
        tokenError: tokenError.message
      };
    }
    
    // Call test function
    console.log('Calling testAuthV2 function...');
    const testAuthFunction = httpsCallable(functions, 'testAuthV2');
    const result = await testAuthFunction();
    console.log('Authentication test result:', result.data);
    
    return { 
      success: true, 
      message: 'Authentication successful',
      data: result.data
    };
  } catch (error) {
    console.error('❌ Error testing authentication:', error);
    return { 
      success: false, 
      error: extractErrorMessage(error),
      originalError: error.message
    };
  }
};

// HTTP Auth test function
export const testAuthHttp = async () => {
  try {
    console.log('Testing authentication via HTTP...');
    
    // Get current user and ensure they're logged in
    const user = auth.currentUser;
    if (!user) {
      console.error('No user found in auth.currentUser');
      return { 
        success: false, 
        error: 'You must be logged in to perform this action',
        authState: 'No user in auth.currentUser'
      };
    }
    
    // Log user details
    console.log('Current user details:', {
      uid: user.uid,
      email: user.email,
      emailVerified: user.emailVerified,
      metadata: user.metadata
    });
    
    // Force token refresh
    console.log('Forcing token refresh for user:', user.uid);
    const idToken = await user.getIdToken(true);
    console.log('Token refreshed successfully');
    
    // Make HTTP request to test auth function
    const functionUrl = 'https://us-central1-e-commerce-final1.cloudfunctions.net/testAuthHttp';
    console.log('Making request to:', functionUrl);
    
    const response = await fetch(functionUrl, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${idToken}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (!response.ok) {
      console.error('HTTP error response:', response.status, response.statusText);
      const errorText = await response.text();
      try {
        const errorJson = JSON.parse(errorText);
        return {
          success: false,
          error: errorJson.error || 'HTTP request failed',
          details: errorJson
        };
      } catch (e) {
        return {
          success: false,
          error: 'HTTP request failed',
          status: response.status,
          statusText: response.statusText,
          responseText: errorText
        };
      }
    }
    
    const result = await response.json();
    console.log('Authentication HTTP test result:', result);
    
    return { 
      success: true, 
      message: 'Authentication HTTP test successful',
      data: result
    };
  } catch (error) {
    console.error('❌ Error testing HTTP authentication:', error);
    return { 
      success: false, 
      error: extractErrorMessage(error),
      originalError: error.message
    };
  }
};

// HTTP-based category creation function
export const createCategoryHttp = async (categoryData) => {
  try {
    console.log('Creating category via HTTP:', categoryData);
    
    // Get current user and ensure they're logged in
    const user = auth.currentUser;
    if (!user) {
      console.error('No user found in auth.currentUser');
      return { 
        success: false, 
        error: 'You must be logged in to perform this action',
        authState: 'No user in auth.currentUser'
      };
    }
    
    // Force token refresh
    console.log('Forcing token refresh for user:', user.uid);
    const idToken = await user.getIdToken(true);
    console.log('Token refreshed successfully');
    
    const data = {
      name: String(categoryData.name || '').trim(),
      description: String(categoryData.description || '').trim()
    };

    if (!data.name || !data.description) {
      return { success: false, error: 'Name and description are required' };
    }
    
    // Create a new category document directly in Firestore
    try {
      // Add to Firestore
      const categoriesRef = collection(db, 'categories');
      const docRef = await addDoc(categoriesRef, {
        name: data.name,
        description: data.description,
        createdAt: serverTimestamp(),
        createdBy: user.uid
      });
      
      console.log('Category created with ID:', docRef.id);
      
      return { 
        success: true, 
        category: {
          id: docRef.id,
          name: data.name,
          description: data.description
        },
        error: null 
      };
    } catch (firestoreError) {
      console.error('Error adding category to Firestore:', firestoreError);
      return { 
        success: false, 
        error: 'Error creating category in database: ' + firestoreError.message
      };
    }
  } catch (error) {
    console.error('❌ Error creating category via HTTP:', error);
    return { 
      success: false, 
      error: extractErrorMessage(error),
      originalError: error.message
    };
  }
};

// HTTP-based carousel image creation function
export const createCarouselImageHttp = async (imageData) => {
  try {
    console.log('Creating carousel image via HTTP:', imageData);
    
    // Get current user and ensure they're logged in
    const user = auth.currentUser;
    if (!user) {
      console.error('No user found in auth.currentUser');
      return { 
        success: false, 
        error: 'You must be logged in to perform this action',
        authState: 'No user in auth.currentUser'
      };
    }
    
    // Validate required data
    if (!imageData.imageUrl || imageData.imageUrl.trim() === '') {
      return { success: false, error: 'Image URL is required' };
    }
    
    // Force token refresh
    console.log('Forcing token refresh for user:', user.uid);
    const idToken = await user.getIdToken(true);
    console.log('Token refreshed successfully');
    
    // Add directly to Firestore
    try {
      // Create carousel data with defaults for optional fields
      const carouselData = {
        imageUrl: imageData.imageUrl.trim(),
        title: (imageData.title || '').trim(),
        subtitle: (imageData.subtitle || '').trim(),
        displayOrder: imageData.displayOrder || 0,
        active: imageData.active !== false, // Default to true if not specified
        createdAt: serverTimestamp(),
        createdBy: user.uid
      };
      
      // Add to Firestore
      const carouselRef = collection(db, 'carouselImages');
      const docRef = await addDoc(carouselRef, carouselData);
      
      console.log('Carousel image created with ID:', docRef.id);
      
      return { 
        success: true, 
        image: {
          id: docRef.id,
          ...carouselData,
          createdAt: new Date() // Replace serverTimestamp for display
        }
      };
    } catch (firestoreError) {
      console.error('Error adding carousel image to Firestore:', firestoreError);
      return { 
        success: false, 
        error: 'Error creating carousel image: ' + firestoreError.message
      };
    }
  } catch (error) {
    console.error('❌ Error creating carousel image via HTTP:', error);
    return { 
      success: false, 
      error: extractErrorMessage(error),
      originalError: error.message
    };
  }
};

// HTTP-based product creation function
export const createProductHttp = async (productData) => {
  try {
    console.log('Creating product via HTTP:', productData);
    
    // Get current user and ensure they're logged in
    const user = auth.currentUser;
    if (!user) {
      console.error('No user found in auth.currentUser');
      return { 
        success: false, 
        error: 'You must be logged in to perform this action',
        authState: 'No user in auth.currentUser'
      };
    }
    
    // Validate required data
    if (!productData.name || productData.name.trim() === '') {
      return { success: false, error: 'Product name is required' };
    }
    
    if (!productData.description || productData.description.trim() === '') {
      return { success: false, error: 'Product description is required' };
    }
    
    if (productData.price === undefined || productData.price === null || isNaN(Number(productData.price))) {
      return { success: false, error: 'Valid product price is required' };
    }

    if (!productData.mainImageUrl || productData.mainImageUrl.trim() === '') {
      return { success: false, error: 'Product image URL is required' };
    }
    
    if (!productData.categoryId) {
      return { success: false, error: 'Product category is required' };
    }
    
    // Force token refresh
    console.log('Forcing token refresh for user:', user.uid);
    const idToken = await user.getIdToken(true);
    console.log('Token refreshed successfully');
    
    // Add directly to Firestore
    try {
      // Create product data with defaults for optional fields
      const product = {
        name: productData.name.trim(),
        description: productData.description.trim(),
        price: Number(productData.price),
        stockQuantity: Number(productData.stockQuantity || 0), // Changed from stock to stockQuantity
        categoryId: productData.categoryId || null,
        mainImageUrl: productData.mainImageUrl || '', // Changed from imageUrl to mainImageUrl
        active: productData.active !== false, // Default to true if not specified
        featured: productData.featured === true, // Explicitly set featured based on featured property
        createdAt: serverTimestamp(),
        createdBy: user.uid
      };
      
      console.log('Creating product with data:', product);
      
      // Add to Firestore
      const productsRef = collection(db, 'products');
      const docRef = await addDoc(productsRef, product);
      
      console.log('Product created with ID:', docRef.id);
      
      return { 
        success: true, 
        product: {
          id: docRef.id,
          ...product,
          createdAt: new Date() // Replace serverTimestamp for display
        }
      };
    } catch (firestoreError) {
      console.error('Error adding product to Firestore:', firestoreError);
      return { 
        success: false, 
        error: 'Error creating product: ' + firestoreError.message
      };
    }
  } catch (error) {
    console.error('❌ Error creating product via HTTP:', error);
    return { 
      success: false, 
      error: extractErrorMessage(error),
      originalError: error.message
    };
  }
};

// Get a single product by ID
export const getProductById = async (id) => {
  try {
    console.log('Fetching product by ID:', id);
    
    // Get product from Firestore
    const productRef = doc(db, 'products', id);
    const productSnap = await getDoc(productRef);
    
    if (!productSnap.exists()) {
      console.log('Product not found with ID:', id);
      return { product: null, error: 'Product not found' };
    }
    
    const product = {
      id: productSnap.id,
      ...productSnap.data()
    };
    
    console.log('Product fetched successfully:', product);
    return { product, error: null };
  } catch (error) {
    console.error('Error fetching product by ID:', error);
    return { product: null, error: extractErrorMessage(error) };
  }
}; 