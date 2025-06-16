import { initializeApp } from 'firebase/app';
import { getAuth, onAuthStateChanged, setPersistence, browserLocalPersistence } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import { getFunctions, connectFunctionsEmulator } from 'firebase/functions';
import { getAnalytics } from 'firebase/analytics';

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyAEL8i_7LA3YWY-c9By3jIko4fClPdQEmY",
  authDomain: "e-commerce-final1.firebaseapp.app",
  projectId: "e-commerce-final1",
  storageBucket: "e-commerce-final1.appspot.com",
  messagingSenderId: "673744857020",
  appId: "1:673744857020:web:d1e815b067fc8de956adb9",
  measurementId: "G-TKZHD2E98E"
};

// Initialize Firebase
let app;
try {
  console.log('🔥 Initializing Firebase...');
  app = initializeApp(firebaseConfig);
  console.log('✅ Firebase app initialized successfully');
} catch (error) {
  console.error('❌ Firebase initialization failed:', error);
  throw error;
}

// Initialize Firebase services
console.log('🔧 Initializing Firebase services...');
let auth, db, storage, functions, analytics;

try {
  auth = getAuth(app);
  
  // Set up auth persistence
  setPersistence(auth, browserLocalPersistence)
    .then(() => {
      console.log('✅ Auth persistence set to LOCAL');
    })
    .catch((error) => {
      console.error('❌ Error setting auth persistence:', error);
    });

  // Set up auth state listener
  onAuthStateChanged(auth, async (user) => {
    if (user) {
      console.log('👤 User is signed in:', {
        uid: user.uid,
        email: user.email,
        emailVerified: user.emailVerified
      });
      
      try {
        // Force token refresh on auth state change
        const token = await user.getIdToken(true);
        console.log('🔑 Token refreshed on auth state change');
        
        // Log token details (expiration only)
        const tokenDetails = JSON.parse(atob(token.split('.')[1]));
        console.log('Token expires at:', new Date(tokenDetails.exp * 1000).toLocaleString());
      } catch (error) {
        console.error('❌ Error refreshing token:', error);
      }
    } else {
      console.log('👤 User is signed out');
    }
  });

  db = getFirestore(app);
  storage = getStorage(app);
  functions = getFunctions(app, 'us-central1');
  
  // Initialize analytics only in production
  if (typeof window !== 'undefined' && process.env.NODE_ENV === 'production') {
    try {
      analytics = getAnalytics(app);
      console.log('📊 Firebase Analytics initialized');
    } catch (error) {
      console.warn('⚠️ Analytics not available:', error);
    }
  }
} catch (error) {
  console.error('❌ Firebase services initialization failed:', error);
  throw error;
}

// Firebase initialization status
const firebaseStatus = {
  app: !!app,
  auth: !!auth,
  db: !!db,
  storage: !!storage,
  functions: !!functions,
  analytics: !!analytics
};

console.log('🔥 Firebase initialization complete:', firebaseStatus);

// Export all initialized services
export { 
  app, 
  auth, 
  db, 
  storage, 
  functions, 
  analytics,
  firebaseStatus 
};

export default app; 