import { NextResponse } from 'next/server';
import { db } from '@/lib/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

export async function POST() {
  try {
    const adminDoc = {
      email: 'blacksheepwall.xyz@gmail.com',
      isActive: true,
      createdAt: serverTimestamp(),
    };
    
    const docRef = await addDoc(collection(db, 'admins'), adminDoc);
    
    return NextResponse.json({ 
      success: true, 
      message: 'Admin added successfully',
      id: docRef.id 
    });
  } catch (error) {
    console.error('Error adding admin:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to add admin' },
      { status: 500 }
    );
  }
} 