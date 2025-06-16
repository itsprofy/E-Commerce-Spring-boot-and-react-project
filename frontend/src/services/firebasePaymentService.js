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
import { getFunctions, httpsCallable } from 'firebase/functions';
import { db } from '../firebase';

const PAYMENTS_COLLECTION = 'payments';
const ORDERS_COLLECTION = 'orders';

// Process a payment using Stripe via Firebase Functions
export const processPayment = async (orderId, userId, paymentMethodId) => {
  try {
    // Verify order exists and belongs to user
    const orderRef = doc(db, ORDERS_COLLECTION, orderId);
    const orderSnap = await getDoc(orderRef);
    
    if (!orderSnap.exists()) {
      return { paymentId: null, error: 'Order not found' };
    }
    
    const orderData = orderSnap.data();
    
    if (orderData.userId !== userId) {
      return { paymentId: null, error: 'Unauthorized access to order' };
    }
    
    if (orderData.status === 'PAID') {
      return { paymentId: null, error: 'Order has already been paid' };
    }
    
    // Call Stripe processing function
    const functions = getFunctions();
    const processStripePayment = httpsCallable(functions, 'processStripePayment');
    
    const result = await processStripePayment({
      orderId,
      userId,
      paymentMethodId,
      amount: orderData.total * 100  // Convert to cents for Stripe
    });
    
    const { paymentIntentId, clientSecret, error } = result.data;
    
    if (error) {
      throw new Error(error);
    }
    
    // Create payment record in Firestore
    const paymentRef = await addDoc(collection(db, PAYMENTS_COLLECTION), {
      orderId,
      userId,
      amount: orderData.total,
      status: 'COMPLETED',
      paymentMethod: 'CREDIT_CARD',
      stripePaymentIntentId: paymentIntentId,
      createdAt: new Date().toISOString(),
      processedAt: new Date().toISOString()
    });
    
    // Update order status
    await updateDoc(orderRef, {
      status: 'PAID',
      paymentId: paymentRef.id,
      updatedAt: new Date().toISOString()
    });
    
    return { 
      paymentId: paymentRef.id, 
      clientSecret, // Needed for Stripe JS to complete 3D Secure if required
      error: null 
    };
  } catch (error) {
    console.error('Error processing payment:', error);
    return { paymentId: null, error: error.message };
  }
};

// Get payments by user
export const getUserPayments = async (userId) => {
  try {
    const paymentsQuery = query(
      collection(db, PAYMENTS_COLLECTION),
      where('userId', '==', userId),
      orderBy('createdAt', 'desc')
    );
    
    const querySnapshot = await getDocs(paymentsQuery);
    const payments = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    
    // Get order details for each payment
    for (let payment of payments) {
      if (payment.orderId) {
        const orderRef = doc(db, ORDERS_COLLECTION, payment.orderId);
        const orderSnap = await getDoc(orderRef);
        
        if (orderSnap.exists()) {
          payment.order = {
            id: orderSnap.id,
            ...orderSnap.data()
          };
        }
      }
    }
    
    return { payments, error: null };
  } catch (error) {
    console.error('Error getting user payments:', error);
    return { payments: [], error: error.message };
  }
};

// Get a single payment
export const getPaymentById = async (paymentId, userId) => {
  try {
    const paymentRef = doc(db, PAYMENTS_COLLECTION, paymentId);
    const paymentSnap = await getDoc(paymentRef);
    
    if (!paymentSnap.exists()) {
      return { payment: null, error: 'Payment not found' };
    }
    
    const paymentData = paymentSnap.data();
    
    // Verify user owns this payment
    if (paymentData.userId !== userId) {
      return { payment: null, error: 'Unauthorized access to payment' };
    }
    
    const payment = {
      id: paymentSnap.id,
      ...paymentData
    };
    
    // Get associated order
    if (payment.orderId) {
      const orderRef = doc(db, ORDERS_COLLECTION, payment.orderId);
      const orderSnap = await getDoc(orderRef);
      
      if (orderSnap.exists()) {
        payment.order = {
          id: orderSnap.id,
          ...orderSnap.data()
        };
      }
    }
    
    return { payment, error: null };
  } catch (error) {
    console.error('Error getting payment:', error);
    return { payment: null, error: error.message };
  }
}; 