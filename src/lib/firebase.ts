import { initializeApp, getApp, getApps } from "firebase/app";
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut } from "firebase/auth";
import { getFirestore, collection, query, where, getDocs, addDoc, updateDoc, doc, serverTimestamp } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

// Initialize Firebase
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);

// Google Auth Provider
const googleProvider = new GoogleAuthProvider();

// Sign in with Google
export const signInWithGoogle = async () => {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    console.log("Google sign in successful:", result.user.email);
    return result.user;
  } catch (error) {
    console.error("Google sign in error:", error);
    throw error;
  }
};

// Sign out
export const signOutUser = async () => {
  try {
    await signOut(auth);
    console.log("Sign out successful");
  } catch (error) {
    console.error("Sign out error:", error);
    throw error;
  }
};

// Admin role management
export const isAdmin = async (email: string) => {
  if (!email) return false;
  
  try {
    const adminQuery = query(
      collection(db, "admins"),
      where("email", "==", email),
      where("isActive", "==", true)
    );
    
    const snapshot = await getDocs(adminQuery);
    return !snapshot.empty;
  } catch (error) {
    console.error("Error checking admin status:", error);
    return false;
  }
};

export const addAdmin = async (email: string) => {
  try {
    const adminDoc = {
      email,
      isActive: true,
      createdAt: serverTimestamp(),
    };
    
    await addDoc(collection(db, "admins"), adminDoc);
    return true;
  } catch (error) {
    console.error("Error adding admin:", error);
    return false;
  }
};

export const removeAdmin = async (email: string) => {
  try {
    const adminQuery = query(
      collection(db, "admins"),
      where("email", "==", email)
    );
    
    const snapshot = await getDocs(adminQuery);
    if (!snapshot.empty) {
      const adminDoc = snapshot.docs[0];
      await updateDoc(doc(db, "admins", adminDoc.id), {
        isActive: false,
        updatedAt: serverTimestamp(),
      });
    }
    return true;
  } catch (error) {
    console.error("Error removing admin:", error);
    return false;
  }
};

export { auth, db, storage }; 