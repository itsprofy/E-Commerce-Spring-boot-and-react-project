import { 
  collection, 
  doc, 
  getDocs, 
  getDoc, 
  addDoc, 
  updateDoc, 
  query, 
  where,
  orderBy
} from 'firebase/firestore';
import { db } from '../firebase';

const ORDERS_COLLECTION = 'orders';
const ORDER_ITEMS_COLLECTION = 'orderItems';
const PRODUCTS_COLLECTION = 'products';

// Get user orders
export const getUserOrders = async (userId) => {
  try {
    const ordersQuery = query(
      collection(db, ORDERS_COLLECTION),
      where('userId', '==', userId),
      orderBy('createdAt', 'desc')
    );
    
    const querySnapshot = await getDocs(ordersQuery);
    const orders = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    
    // Get order items for each order
    for (let order of orders) {
      const itemsQuery = query(
        collection(db, ORDER_ITEMS_COLLECTION),
        where('orderId', '==', order.id)
      );
      
      const itemsSnapshot = await getDocs(itemsQuery);
      order.items = itemsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
    }
    
    return { orders, error: null };
  } catch (error) {
    console.error('Error getting user orders:', error);
    return { orders: [], error: error.message };
  }
};

// Get a single order
export const getOrderById = async (orderId, userId) => {
  try {
    const orderRef = doc(db, ORDERS_COLLECTION, orderId);
    const orderSnap = await getDoc(orderRef);
    
    if (!orderSnap.exists()) {
      return { order: null, error: 'Order not found' };
    }
    
    const orderData = orderSnap.data();
    
    // Verify user owns this order
    if (orderData.userId !== userId) {
      return { order: null, error: 'Unauthorized access to order' };
    }
    
    const order = {
      id: orderSnap.id,
      ...orderData
    };
    
    // Get order items
    const itemsQuery = query(
      collection(db, ORDER_ITEMS_COLLECTION),
      where('orderId', '==', orderId)
    );
    
    const itemsSnapshot = await getDocs(itemsQuery);
    order.items = itemsSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    
    return { order, error: null };
  } catch (error) {
    console.error('Error getting order by ID:', error);
    return { order: null, error: error.message };
  }
};

// Create an order
export const createOrder = async (userId, cartItems, shippingDetails) => {
  try {
    // Verify product availability first
    for (const [productId, quantity] of Object.entries(cartItems)) {
      const productRef = doc(db, PRODUCTS_COLLECTION, productId);
      const productSnap = await getDoc(productRef);
      
      if (!productSnap.exists()) {
        return { orderId: null, error: `Product not found: ${productId}` };
      }
      
      const product = productSnap.data();
      if (product.stockQuantity < quantity) {
        return { orderId: null, error: `Not enough stock for product: ${product.name}` };
      }
    }
    
    // Create the order
    const orderRef = await addDoc(collection(db, ORDERS_COLLECTION), {
      userId,
      status: 'PENDING',
      total: 0, // Will calculate after adding items
      createdAt: new Date().toISOString(),
      ...shippingDetails
    });
    
    let total = 0;
    
    // Add order items and update product stock
    for (const [productId, quantity] of Object.entries(cartItems)) {
      const productRef = doc(db, PRODUCTS_COLLECTION, productId);
      const productSnap = await getDoc(productRef);
      const product = productSnap.data();
      
      // Add item to order
      await addDoc(collection(db, ORDER_ITEMS_COLLECTION), {
        orderId: orderRef.id,
        productId,
        productName: product.name,
        productImageUrl: product.mainImageUrl,
        quantity,
        price: product.price,
        createdAt: new Date().toISOString()
      });
      
      // Update product stock
      await updateDoc(productRef, {
        stockQuantity: product.stockQuantity - quantity
      });
      
      // Calculate total
      total += product.price * quantity;
    }
    
    // Update order with total
    await updateDoc(orderRef, { total });
    
    return { orderId: orderRef.id, error: null };
  } catch (error) {
    console.error('Error creating order:', error);
    return { orderId: null, error: error.message };
  }
};

// Update order status
export const updateOrderStatus = async (orderId, status) => {
  try {
    const orderRef = doc(db, ORDERS_COLLECTION, orderId);
    await updateDoc(orderRef, {
      status,
      updatedAt: new Date().toISOString()
    });
    
    return { success: true, error: null };
  } catch (error) {
    console.error('Error updating order status:', error);
    return { success: false, error: error.message };
  }
}; 