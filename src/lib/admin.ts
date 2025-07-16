import { getFirestore } from 'firebase-admin/firestore';
import * as admin from 'firebase-admin';

// Initialize Firebase Admin if not already initialized and environment variables are available
if (!admin.apps.length && process.env.FIREBASE_PROJECT_ID && process.env.FIREBASE_CLIENT_EMAIL && process.env.FIREBASE_PRIVATE_KEY) {
  try {
    admin.initializeApp({
      credential: admin.credential.cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n')
      }),
    });
  } catch (error) {
    console.error('Firebase Admin initialization error:', error);
  }
}

const db = getFirestore();

export const ADMIN_EMAILS = [
  'blacksheepwall.xyz@gmail.com',
  'blacksheepwall.xyz@google.com',
  // ... existing admins ...
];

export async function isAdmin(email: string): Promise<boolean> {
  if (!email) return false;
  
  // Check hardcoded admin emails first
  if (ADMIN_EMAILS.includes(email)) {
    return true;
  }
  
  // Check if Firebase Admin is initialized
  if (!admin.apps.length) {
    console.log('Firebase Admin not initialized, using hardcoded admins only');
    return false;
  }
  
  // Check Firestore admins collection
  try {
    const adminDoc = await db.collection('admins').doc(email).get();
    return adminDoc.exists && adminDoc.data()?.isActive !== false;
  } catch (error) {
    console.error('Error checking admin status:', error);
    return false;
  }
}

export async function addAdmin(email: string) {
  // Check if Firebase Admin is initialized
  if (!admin.apps.length) {
    throw new Error('Firebase Admin not initialized. Please set environment variables.');
  }
  
  try {
    await db.collection('admins').doc(email).set({
      email: email,
      isActive: true,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });
    
    // Add to allowed emails if not already present
    if (!ADMIN_EMAILS.includes(email)) {
      ADMIN_EMAILS.push(email);
    }
    
    return true;
  } catch (error) {
    console.error('Error adding admin:', error);
    throw error;
  }
}

export async function removeAdmin(email: string) {
  // Check if Firebase Admin is initialized
  if (!admin.apps.length) {
    throw new Error('Firebase Admin not initialized. Please set environment variables.');
  }
  
  try {
    await db.collection('admins').doc(email).update({
      isActive: false,
    });
    
    // Remove from allowed emails
    const index = ADMIN_EMAILS.indexOf(email);
    if (index > -1) {
      ADMIN_EMAILS.splice(index, 1);
    }
    
    return true;
  } catch (error) {
    console.error('Error removing admin:', error);
    throw error;
  }
} 