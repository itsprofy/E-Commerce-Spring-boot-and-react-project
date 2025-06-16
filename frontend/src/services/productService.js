import { 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  where, 
  orderBy, 
  limit, 
  serverTimestamp,
  startAfter,
  and,
  or
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { db, storage, functions } from '../firebase';
import { httpsCallable } from 'firebase/functions';

// Get all products
export const getProducts = async () => {
  try {
    const productsRef = collection(db, 'products');
    const querySnapshot = await getDocs(productsRef);
    
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  } catch (error) {
    throw error;
  }
};

// Get a single product by ID
export const getProductById = async (productId) => {
  try {
    const productRef = doc(db, 'products', productId);
    const productDoc = await getDoc(productRef);
    
    if (productDoc.exists()) {
      return {
        id: productDoc.id,
        ...productDoc.data()
      };
    } else {
      throw new Error('Product not found');
    }
  } catch (error) {
    throw error;
  }
};

// Create a new product
export const createProduct = async (productData, imageFile) => {
  try {
    // If there's an image file, upload it to Storage
    let imageUrl = null;
    
    if (imageFile) {
      const storageRef = ref(storage, `products/${Date.now()}_${imageFile.name}`);
      const snapshot = await uploadBytes(storageRef, imageFile);
      imageUrl = await getDownloadURL(snapshot.ref);
    }
    
    // Create product in Firestore
    const productRef = await addDoc(collection(db, 'products'), {
      ...productData,
      imageUrl,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
    
    return {
      id: productRef.id
    };
  } catch (error) {
    throw error;
  }
};

// Update a product
export const updateProduct = async (productId, productData, imageFile) => {
  try {
    const productRef = doc(db, 'products', productId);
    const productDoc = await getDoc(productRef);
    
    if (!productDoc.exists()) {
      throw new Error('Product not found');
    }
    
    const currentProduct = productDoc.data();
    let imageUrl = currentProduct.imageUrl;
    
    // If there's a new image, delete old one and upload new one
    if (imageFile) {
      // Delete old image if exists
      if (currentProduct.imageUrl) {
        const oldImageRef = ref(storage, currentProduct.imageUrl);
        await deleteObject(oldImageRef).catch(() => {});
      }
      
      // Upload new image
      const storageRef = ref(storage, `products/${Date.now()}_${imageFile.name}`);
      const snapshot = await uploadBytes(storageRef, imageFile);
      imageUrl = await getDownloadURL(snapshot.ref);
    }
    
    // Update product in Firestore
    await updateDoc(productRef, {
      ...productData,
      imageUrl,
      updatedAt: serverTimestamp()
    });
    
    return {
      id: productId
    };
  } catch (error) {
    throw error;
  }
};

// Delete a product
export const deleteProduct = async (productId) => {
  try {
    const productRef = doc(db, 'products', productId);
    const productDoc = await getDoc(productRef);
    
    if (!productDoc.exists()) {
      throw new Error('Product not found');
    }
    
    const currentProduct = productDoc.data();
    
    // Delete image if exists
    if (currentProduct.imageUrl) {
      const imageRef = ref(storage, currentProduct.imageUrl);
      await deleteObject(imageRef).catch(() => {});
    }
    
    // Delete product from Firestore
    await deleteDoc(productRef);
    
    return {
      id: productId
    };
  } catch (error) {
    throw error;
  }
};

// Search products (using cloud function)
export const searchProducts = async (searchParams) => {
  try {
    const searchProductsFunction = httpsCallable(functions, 'searchProducts');
    const result = await searchProductsFunction(searchParams);
    return result.data.products;
  } catch (error) {
    throw error;
  }
};

// Get products by category
export const getProductsByCategory = async (category) => {
  try {
    const productsRef = collection(db, 'products');
    const q = query(productsRef, where('category', '==', category));
    const querySnapshot = await getDocs(q);
    
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  } catch (error) {
    throw error;
  }
};

// Get featured products
export const getFeaturedProducts = async (limit = 4) => {
  try {
    const productsRef = collection(db, 'products');
    const q = query(productsRef, where('featured', '==', true), orderBy('createdAt', 'desc'), limit(limit));
    const querySnapshot = await getDocs(q);
    
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  } catch (error) {
    throw error;
  }
}; 