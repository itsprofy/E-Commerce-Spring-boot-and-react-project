import React, { createContext, useContext, useEffect, useState } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db, firebaseStatus } from '../firebase';

// Create Firebase Context
const FirebaseContext = createContext();

// Custom hook to use Firebase context
export const useFirebase = () => {
  const context = useContext(FirebaseContext);
  if (!context) {
    throw new Error('useFirebase must be used within a FirebaseProvider');
  }
  return context;
};

// Firebase Provider Component
export const FirebaseProvider = ({ children }) => {
  const [isInitialized, setIsInitialized] = useState(false);
  const [user, setUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Setup auth listener
  const setupAuthListener = () => {
    return onAuthStateChanged(auth, async (authUser) => {
      try {
        if (authUser) {
          setUser(authUser);
          
          // Fetch additional user data from Firestore
          const userRef = doc(db, 'users', authUser.uid);
          const userSnap = await getDoc(userRef);
          
          if (userSnap.exists()) {
            setUserProfile(userSnap.data());
          } else {
            console.log('No user profile found');
            setUserProfile(null);
          }
        } else {
          setUser(null);
          setUserProfile(null);
        }
      } catch (err) {
        console.error('Error in auth state change:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    });
  };

  useEffect(() => {
    console.log('🚀 FirebaseProvider initializing...');
    let unsubscribe;
    
    try {
      // Check if Firebase is properly initialized
      const servicesReady = Object.entries(firebaseStatus).every(([service, status]) => {
        if (status === false) {
          throw new Error(`Firebase ${service} failed to initialize`);
        }
        return status === true || status === null;
      });
      
      if (servicesReady) {
        console.log('✅ All Firebase services are ready');
        setIsInitialized(true);
        unsubscribe = setupAuthListener();
      }
    } catch (error) {
      console.error('❌ Firebase initialization error:', error);
      setError(error.message);
      setLoading(false);
    }

    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, []);

  const value = {
    isInitialized,
    user,
    userProfile,
    loading,
    error
  };

  // Don't render children until Firebase is initialized
  if (!isInitialized && loading) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        flexDirection: 'column',
        fontFamily: 'Arial, sans-serif'
      }}>
        <div style={{ fontSize: '24px', marginBottom: '20px' }}>🔥</div>
        <div>Initializing Firebase...</div>
        {error && (
          <div style={{ color: 'red', marginTop: '10px', textAlign: 'center' }}>
            {error}
            <br />
            <small>Please check your internet connection and Firebase configuration</small>
          </div>
        )}
      </div>
    );
  }

  if (error && !isInitialized) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        flexDirection: 'column',
        fontFamily: 'Arial, sans-serif'
      }}>
        <div style={{ fontSize: '24px', marginBottom: '20px', color: 'red' }}>❌</div>
        <div style={{ color: 'red', textAlign: 'center' }}>
          <strong>Firebase Initialization Failed</strong>
          <br />
          {error}
          <br />
          <button 
            onClick={() => window.location.reload()} 
            style={{
              marginTop: '20px',
              padding: '10px 20px',
              backgroundColor: '#ff6b6b',
              color: 'white',
              border: 'none',
              borderRadius: '5px',
              cursor: 'pointer'
            }}
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <FirebaseContext.Provider value={value}>
      {children}
    </FirebaseContext.Provider>
  );
};

export default FirebaseContext; 