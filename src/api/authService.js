import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  sendEmailVerification,
  sendPasswordResetEmail,
  updateProfile,
  onAuthStateChanged,
  reload
} from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { auth, db } from '../config/firebase';

export const registerUser = async (email, password, displayName) => {
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    await updateProfile(user, { displayName });
    await sendEmailVerification(user);

    await setDoc(doc(db, 'users', user.uid), {
      email: user.email,
      displayName,
      createdAt: new Date().toISOString(),
      emailVerified: false
    });

    return { success: true, user };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

export const loginUser = async (email, password) => {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;
    
    if (!user.emailVerified) {
      return { 
        success: true, 
        user,
        needsVerification: true
      };
    }
    
    return { success: true, user };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

export const logoutUser = async () => {
  try {
    await signOut(auth);
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

export const resetPassword = async (email) => {
  try {
    await sendPasswordResetEmail(auth, email);
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

export const getUserProfile = async (userId) => {
  try {
    const userDoc = await getDoc(doc(db, 'users', userId));
    if (userDoc.exists()) {
      return { success: true, data: userDoc.data() };
    }
    return { success: false, error: 'User profile not found' };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

export const subscribeToAuthState = (callback) => {
  return onAuthStateChanged(auth, callback);
};

export const resendVerificationEmail = async () => {
  try {
    const user = auth.currentUser;
    if (!user) {
      return { success: false, error: 'No user logged in' };
    }
    if (user.emailVerified) {
      return { success: false, error: 'Email already verified' };
    }
    await sendEmailVerification(user);
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

export const checkEmailVerification = async () => {
  try {
    const user = auth.currentUser;
    if (!user) {
      return { success: false, verified: false };
    }
    await reload(user);
    return { success: true, verified: user.emailVerified };
  } catch (error) {
    return { success: false, error: error.message };
  }
};