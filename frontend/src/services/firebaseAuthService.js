import { 
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  updateProfile,
  sendPasswordResetEmail
} from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { auth, db } from '../firebase';

// Register a new user
export const registerUser = async (email, password, fullName) => {
  try {
    // Create user in Firebase Authentication
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    // Update profile with displayName
    await updateProfile(user, {
      displayName: fullName
    });

    // Store additional user data in Firestore
    await setDoc(doc(db, 'users', user.uid), {
      uid: user.uid,
      email,
      fullName,
      createdAt: new Date().toISOString(),
      roles: ['USER']
    });

    return { user, error: null };
  } catch (error) {
    console.error('Error registering user:', error);
    return { user: null, error: error.message };
  }
};

// Register admin user
export const registerAdmin = async (email, password, fullName) => {
  try {
    // Create user
    const { user, error } = await registerUser(email, password, fullName);
    
    if (error) return { user: null, error };
    
    // Add admin role
    await setDoc(doc(db, 'users', user.uid), {
      roles: ['USER', 'ADMIN']
    }, { merge: true });
    
    return { user, error: null };
  } catch (error) {
    console.error('Error registering admin:', error);
    return { user: null, error: error.message };
  }
};

// Log in user
export const loginUser = async (email, password) => {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    return { user: userCredential.user, error: null };
  } catch (error) {
    console.error('Error logging in:', error);
    return { user: null, error: error.message };
  }
};

// Sign out user
export const logoutUser = async () => {
  try {
    await signOut(auth);
    return { error: null };
  } catch (error) {
    console.error('Error signing out:', error);
    return { error: error.message };
  }
};

// Reset password
export const resetPassword = async (email) => {
  try {
    await sendPasswordResetEmail(auth, email);
    return { error: null };
  } catch (error) {
    console.error('Error resetting password:', error);
    return { error: error.message };
  }
}; 