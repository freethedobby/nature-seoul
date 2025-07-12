// COMMENTED OUT FOR DEPLOYMENT - Type conflict between Firebase Admin and Client SDK
// Restore after deployment and refactor for proper server/client separation

/*
import { db } from '@/lib/firebase-admin';
import { ref, set } from 'firebase/database';

export async function addAdmin(email: string) {
  const adminRef = ref(db, `admins/${email.replace(/\./g, ',')}`);
  await set(adminRef, {
    email: email,
    role: 'admin',
    createdAt: new Date().toISOString()
  });
}

// Add the new admin
addAdmin('blacksheepwall.xyz@google.com'); 
*/ 