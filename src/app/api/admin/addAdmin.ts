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

// Add the new admin
addAdmin('blacksheepwall.xyz@google.com'); 