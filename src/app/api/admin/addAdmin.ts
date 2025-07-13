// NOTE: For deployment, this uses the Firestore client SDK. For server-side admin actions, refactor to use the Firebase Admin SDK in the future.
import { db } from '@/lib/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

export async function addAdmin(email: string) {
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
}

// For manual admin addition, call addAdmin('email@example.com') as needed. 