import { 
  collection, 
  doc, 
  getDocs, 
  getDoc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  where,
  orderBy,
  limit,
  startAfter
} from 'firebase/firestore';
import { db } from '../firebase';

const PRODUCTS_COLLECTION = 'products';
const PAGE_SIZE = 10;

// Get all products with pagination
export const getProducts = async (page = 1) => {
  try {
    let productsQuery = query(
      collection(db, PRODUCTS_COLLECTION),
      orderBy('name'),
      limit(PAGE_SIZE)
    );
    
    // If not the first page, get starting point
    if (page > 1) {
      const lastVisibleSnapshot = await getLastVisibleDoc(page - 1);
      if (lastVisibleSnapshot) {
        productsQuery = query(
          collection(db, PRODUCTS_COLLECTION),
          orderBy('name'),
          startAfter(lastVisibleSnapshot),
          limit(PAGE_SIZE)
        );
      }
    }

    const querySnapshot = await getDocs(productsQuery);
    const products = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    
    return { products, error: null };
  } catch (error) {
    console.error('Error getting products:', error);
    return { products: [], error: error.message };
  }
};

// Helper to get last document of a page
const getLastVisibleDoc = async (pageNum) => {
  const q = query(
    collection(db, PRODUCTS_COLLECTION),
    orderBy('name'),
    limit(pageNum * PAGE_SIZE)
  );
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs[querySnapshot.docs.length - 1];
};

// Get featured products
export const getFeaturedProducts = async () => {
  try {
    const productsQuery = query(
      collection(db, PRODUCTS_COLLECTION),
      where('featured', '==', true),
      limit(10)
    );
    
    const querySnapshot = await getDocs(productsQuery);
    const products = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    
    return { products, error: null };
  } catch (error) {
    console.error('Error getting featured products:', error);
    return { products: [], error: error.message };
  }
};

// Search products by name and/or category
export const searchProducts = async (name = '', categoryId = null) => {
  try {
    let productsQuery;
    
    if (name && categoryId) {
      productsQuery = query(
        collection(db, PRODUCTS_COLLECTION),
        where('name', '>=', name),
        where('name', '<=', name + '\uf8ff'),
        where('categoryId', '==', categoryId)
      );
    } else if (name) {
      productsQuery = query(
        collection(db, PRODUCTS_COLLECTION),
        where('name', '>=', name),
        where('name', '<=', name + '\uf8ff')
      );
    } else if (categoryId) {
      productsQuery = query(
        collection(db, PRODUCTS_COLLECTION),
        where('categoryId', '==', categoryId)
      );
    } else {
      return getProducts();
    }
    
    const querySnapshot = await getDocs(productsQuery);
    const products = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    
    return { products, error: null };
  } catch (error) {
    console.error('Error searching products:', error);
    return { products: [], error: error.message };
  }
};

// Get a single product by ID
export const getProductById = async (id) => {
  try {
    const docRef = doc(db, PRODUCTS_COLLECTION, id);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      return { product: { id: docSnap.id, ...docSnap.data() }, error: null };
    } else {
      return { product: null, error: 'Product not found' };
    }
  } catch (error) {
    console.error('Error getting product by ID:', error);
    return { product: null, error: error.message };
  }
};

// Create a new product
export const createProduct = async (productData) => {
  try {
    const docRef = await addDoc(collection(db, PRODUCTS_COLLECTION), {
      ...productData,
      createdAt: new Date().toISOString()
    });
    
    return { productId: docRef.id, error: null };
  } catch (error) {
    console.error('Error creating product:', error);
    return { productId: null, error: error.message };
  }
};

// Update a product
export const updateProduct = async (id, productData) => {
  try {
    const docRef = doc(db, PRODUCTS_COLLECTION, id);
    await updateDoc(docRef, {
      ...productData,
      updatedAt: new Date().toISOString()
    });
    
    return { success: true, error: null };
  } catch (error) {
    console.error('Error updating product:', error);
    return { success: false, error: error.message };
  }
};

// Delete a product
export const deleteProduct = async (id) => {
  try {
    await deleteDoc(doc(db, PRODUCTS_COLLECTION, id));
    return { success: true, error: null };
  } catch (error) {
    console.error('Error deleting product:', error);
    return { success: false, error: error.message };
  }
}; 