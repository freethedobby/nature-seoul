import { initializeApp, getApp, getApps } from "firebase/app";
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut, signInWithEmailAndPassword as firebaseSignInWithEmailAndPassword } from "firebase/auth";
import { getFirestore, collection, query, where, getDocs, addDoc, updateDoc, doc, serverTimestamp } from "firebase/firestore";
import { getStorage } from "firebase/storage";

// Check if we're in test mode (exported for test-env)
export function isLocalTestMode(): boolean {
  if (typeof window === 'undefined') return false;
  const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
  const hasTestParam = window.location.search.includes('test=true');
  const hasTestFlag = localStorage.getItem('enableTestMode') === 'true';
  return isLocalhost && (hasTestParam || hasTestFlag);
}

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || 'demo-key',
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || 'demo-project.firebaseapp.com',
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || 'demo-project',
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || 'demo-project.appspot.com',
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || '123456789',
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || '1:123456789:web:abcdef',
  databaseURL: process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL
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
    // Add timeout to prevent hanging
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error("Login timeout")), 30000); // 30 second timeout
    });

    const signInPromise = signInWithPopup(auth, googleProvider);
    
    const result = await Promise.race([signInPromise, timeoutPromise]) as any; // eslint-disable-line @typescript-eslint/no-explicit-any
    console.log("Google sign in successful:", result.user.email);
    return result.user;
  } catch (error: unknown) {
    console.error("Google sign in error:", error);
    
    // Handle specific Firebase auth errors
    const firebaseError = error as { code?: string; message?: string };
    if (firebaseError?.code) {
      switch (firebaseError.code) {
        case 'auth/popup-closed-by-user':
          // User closed the popup - this is not really an error, just a cancellation
          throw new Error('POPUP_CLOSED');
        case 'auth/popup-blocked':
          throw new Error('팝업이 차단되었습니다. 브라우저 팝업 차단을 해제하고 다시 시도해주세요.');
        case 'auth/cancelled-popup-request':
          throw new Error('POPUP_CANCELLED');
        case 'auth/network-request-failed':
          throw new Error('네트워크 연결을 확인하고 다시 시도해주세요.');
        case 'auth/too-many-requests':
          throw new Error('너무 많은 로그인 시도가 있었습니다. 잠시 후 다시 시도해주세요.');
        case 'auth/user-disabled':
          throw new Error('비활성화된 계정입니다. 관리자에게 문의하세요.');
        default:
          throw error;
      }
    }
    
    // Handle timeout error
    if (firebaseError?.message === "Login timeout") {
      throw new Error('로그인 시간이 초과되었습니다. 다시 시도해주세요.');
    }
    
    throw error;
  }
};

// Sign in with email and password
export const signInWithEmailAndPassword = async (email: string, password: string) => {
  try {
    // Add timeout to prevent hanging
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error("Login timeout")), 30000); // 30 second timeout
    });

    const signInPromise = firebaseSignInWithEmailAndPassword(auth, email, password);
    
    const result = await Promise.race([signInPromise, timeoutPromise]) as any; // eslint-disable-line @typescript-eslint/no-explicit-any
    console.log("Email sign in successful:", result.user.email);
    return result.user;
  } catch (error) {
    console.error("Email sign in error:", error);
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
  console.log("isAdmin called with email:", email);
  if (!email) {
    console.log("No email provided, returning false");
    return false;
  }
  
  // Temporary: Allow any blacksheepwall email for testing
  if (email && email.includes("blacksheepwall")) {
    console.log("blacksheepwall email detected:", email, "returning true");
    return true;
  }
  
  try {
    const adminQuery = query(
      collection(db, "admins"),
      where("email", "==", email),
      where("isActive", "==", true)
    );
    
    const snapshot = await getDocs(adminQuery);
    console.log("Firestore admin check result:", !snapshot.empty);
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

export { auth, db, storage, app }; 