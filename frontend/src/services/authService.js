import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  updateProfile,
  sendPasswordResetEmail,
  GoogleAuthProvider,
  signInWithPopup,
  onAuthStateChanged,
  getAuth
} from 'firebase/auth';
import { doc, setDoc, getDoc, serverTimestamp, getFirestore, collection, query, where, getDocs, updateDoc } from 'firebase/firestore';

const auth = getAuth();
const db = getFirestore();

// Helper function to get user document
const getUserDoc = async (uid) => {
  console.log('Fetching user document for:', uid);
  const userRef = doc(db, 'users', uid);
  const userSnap = await getDoc(userRef);
  console.log('User document exists:', userSnap.exists());
  return { ref: userRef, snap: userSnap };
};

// Helper function to create or update user document
const updateUserDocument = async (uid, userData) => {
  console.log('Updating user document:', { uid, userData });
  const { ref: userRef } = await getUserDoc(uid);
  await setDoc(userRef, {
    ...userData,
    updatedAt: new Date(),
    roles: userData.roles || ['USER']
  }, { merge: true });
  console.log('User document updated successfully');
};

// Register a new user
export const registerUser = async (email, password, displayName) => {
  try {
    console.log('Registering new user:', email);
    // Create user in Firebase Auth
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;
    
    // Update profile with display name
    await updateProfile(user, { displayName });
    
    // Create user document in Firestore
    await setDoc(doc(db, 'users', user.uid), {
      email,
      displayName,
      roles: ['USER'],
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
    
    // Force token refresh after registration
    await user.getIdToken(true);
    console.log('User registered and token refreshed');
    
    return user;
  } catch (error) {
    console.error('Registration error:', error);
    throw error;
  }
};

// Sign in with email and password
export const loginUser = async (email, password) => {
  try {
    console.log('Attempting to log in user:', email);
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;
    
    // Force token refresh after login
    const token = await user.getIdToken(true);
    console.log('User logged in and token refreshed');
    
    // Get user data from Firestore
    const userDoc = await getDoc(doc(db, 'users', user.uid));
    if (!userDoc.exists()) {
      console.warn('User document not found in Firestore');
      // Create user document if it doesn't exist
      await setDoc(doc(db, 'users', user.uid), {
        email: user.email,
        displayName: user.displayName,
        roles: ['USER'],
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
    } else {
      console.log('User document found:', userDoc.data());
    }
    
    return user;
  } catch (error) {
    console.error('Login error:', error);
    throw error;
  }
};

// Sign in with Google
export const loginWithGoogle = async () => {
  try {
    console.log('Attempting Google login');
    const provider = new GoogleAuthProvider();
    const userCredential = await signInWithPopup(auth, provider);
    const user = userCredential.user;
    
    // Check if user exists in Firestore
    const userDocRef = doc(db, 'users', user.uid);
    const userDoc = await getDoc(userDocRef);
    
    // If user doesn't exist in Firestore, create a document
    if (!userDoc.exists()) {
      console.log('Creating new user document for Google user');
      await setDoc(userDocRef, {
        email: user.email,
        displayName: user.displayName,
        roles: ['USER'],
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
    }
    
    // Force token refresh after Google login
    await user.getIdToken(true);
    console.log('Google login successful and token refreshed');
    
    return user;
  } catch (error) {
    console.error('Google login error:', error);
    throw error;
  }
};

// Sign out
export const logoutUser = async () => {
  try {
    console.log('Signing out user');
    await firebaseSignOut(auth);
    console.log('User signed out successfully');
  } catch (error) {
    console.error('Logout error:', error);
    throw error;
  }
};

// Reset password
export const resetPassword = async (email) => {
  try {
    console.log('Sending password reset email to:', email);
    await sendPasswordResetEmail(auth, email);
    console.log('Password reset email sent successfully');
  } catch (error) {
    console.error('Password reset error:', error);
    throw error;
  }
};

// Get current user
export const getCurrentUser = () => {
  return new Promise((resolve, reject) => {
    const unsubscribe = onAuthStateChanged(auth,
      async (user) => {
        unsubscribe();
        if (user) {
          console.log('Current user found:', user.uid);
          try {
            // Force token refresh
            await user.getIdToken(true);
            const { snap: userDoc } = await getUserDoc(user.uid);
            
            if (userDoc.exists()) {
              const userData = userDoc.data();
              console.log('User data:', userData);
              resolve({
                uid: user.uid,
                email: user.email,
                emailVerified: user.emailVerified,
                ...userData
              });
            } else {
              console.log('No user document found, creating one...');
              await updateUserDocument(user.uid, {
                email: user.email,
                roles: ['USER'],
                createdAt: new Date()
              });
              resolve({
                uid: user.uid,
                email: user.email,
                emailVerified: user.emailVerified,
                roles: ['USER']
              });
            }
          } catch (error) {
            console.error('Error getting user data:', error);
            reject(error);
          }
        } else {
          console.log('No current user');
          resolve(null);
        }
      },
      reject
    );
  });
};

// Auth state listener
export const onAuthStateChange = (callback) => {
  return onAuthStateChanged(auth, callback);
};

// Get user data from Firestore
export const getUserData = async (userId) => {
  try {
    console.log('Fetching user data for:', userId);
    const userDocRef = doc(db, 'users', userId);
    const userDoc = await getDoc(userDocRef);
    
    if (userDoc.exists()) {
      console.log('User data found:', userDoc.data());
      return userDoc.data();
    } else {
      console.warn('User document not found');
      throw new Error('User not found');
    }
  } catch (error) {
    console.error('Error fetching user data:', error);
    throw error;
  }
};

export const signIn = async (email, password) => {
  try {
    console.log('Signing in user:', email);
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const { user } = userCredential;
    
    // Force token refresh
    await user.getIdToken(true);
    
    const { snap: userDoc } = await getUserDoc(user.uid);
    if (!userDoc.exists()) {
      console.log('Creating user document for new sign-in');
      await updateUserDocument(user.uid, {
        email: user.email,
        roles: ['USER'],
        createdAt: new Date()
      });
    }
    
    const userData = userDoc.exists() ? userDoc.data() : { roles: ['USER'] };
    console.log('Sign in successful:', { uid: user.uid, ...userData });
    
    return {
      success: true,
      user: {
        uid: user.uid,
        email: user.email,
        emailVerified: user.emailVerified,
        ...userData
      }
    };
  } catch (error) {
    console.error('Sign in error:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

export const signUp = async (email, password) => {
  try {
    console.log('Creating new user:', email);
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const { user } = userCredential;
    
    // Force token refresh
    await user.getIdToken(true);
    
    console.log('Creating user document for new sign-up');
    await updateUserDocument(user.uid, {
      email: user.email,
      roles: ['USER'],
      createdAt: new Date()
    });
    
    console.log('Sign up successful:', user.uid);
    return {
      success: true,
      user: {
        uid: user.uid,
        email: user.email,
        emailVerified: user.emailVerified,
        roles: ['USER']
      }
    };
  } catch (error) {
    console.error('Sign up error:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

export const signOut = async () => {
  try {
    console.log('Signing out user');
    await firebaseSignOut(auth);
    console.log('Sign out successful');
    return { success: true };
  } catch (error) {
    console.error('Sign out error:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

export const isAdmin = async (user) => {
  if (!user || !user.uid) {
    console.log('No user provided to isAdmin check');
    return false;
  }

  try {
    console.log('Checking admin status for:', user.uid);
    const { snap: userDoc } = await getUserDoc(user.uid);
    
    if (!userDoc.exists()) {
      console.log('No user document found');
      return false;
    }
    
    const userData = userDoc.data();
    const hasAdminRole = userData.roles?.includes('ADMIN') || userData.role === 'admin';
    console.log('Admin check result:', { hasAdminRole, roles: userData.roles });
    
    return hasAdminRole;
  } catch (error) {
    console.error('Error checking admin status:', error);
    return false;
  }
};

export const setAdminRole = async (uid) => {
  try {
    console.log('Setting admin role for user:', uid);
    const { ref: userRef, snap: userDoc } = await getUserDoc(uid);
    
    if (!userDoc.exists()) {
      console.error('User document not found');
      return { success: false, error: 'User not found' };
    }

    const userData = userDoc.data();
    const updatedRoles = [...new Set([...(userData.roles || []), 'ADMIN'])];
    
    await setDoc(userRef, {
      ...userData,
      roles: updatedRoles,
      updatedAt: new Date()
    }, { merge: true });

    console.log('Admin role set successfully:', { uid, roles: updatedRoles });
    return { success: true, roles: updatedRoles };
  } catch (error) {
    console.error('Error setting admin role:', error);
    return { success: false, error: error.message };
  }
};

export const makeUserAdmin = async (email) => {
  try {
    console.log('Making user admin:', email);
    
    // Get the user document reference
    const usersRef = collection(db, 'users');
    const q = query(usersRef, where('email', '==', email));
    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty) {
      console.error('No user found with email:', email);
      return { success: false, error: 'User not found' };
    }

    const userDoc = querySnapshot.docs[0];
    console.log('Found user:', userDoc.id);

    // Update user document with admin role
    await updateDoc(doc(db, 'users', userDoc.id), {
      roles: ['USER', 'ADMIN'],
      updatedAt: new Date()
    });

    console.log('Successfully made user an admin!');
    return { success: true };
  } catch (error) {
    console.error('Error making user admin:', error);
    return { success: false, error: error.message };
  }
}; 