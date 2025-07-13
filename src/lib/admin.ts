import { getDatabase } from 'firebase-admin/database';

export const ADMIN_EMAILS = [
  'blacksheepwall.xyz@gmail.com',
  'blacksheepwall.xyz@google.com',
  // ... existing admins ...
];

export async function isAdmin(email: string): Promise<boolean> {
  if (!email) return false;
  return ADMIN_EMAILS.includes(email);
}

export async function addAdmin(email: string) {
  const db = getDatabase();
  const adminRef = db.ref(`admins/${email.replace(/\./g, ',')}`);
  await adminRef.set({
    email: email,
    role: 'admin',
    createdAt: new Date().toISOString()
  });
  
  // Add to allowed emails if not already present
  if (!ADMIN_EMAILS.includes(email)) {
    ADMIN_EMAILS.push(email);
  }
}

export async function removeAdmin(email: string) {
  const db = getDatabase();
  const adminRef = db.ref(`admins/${email.replace(/\./g, ',')}`);
  await adminRef.remove();
  
  // Remove from allowed emails
  const index = ADMIN_EMAILS.indexOf(email);
  if (index > -1) {
    ADMIN_EMAILS.splice(index, 1);
  }
} 