import { NextResponse } from "next/server";
import * as admin from 'firebase-admin';

export async function GET() {
  try {
    // Test 1: Check if Firebase Admin is working
    console.log("Testing Firebase Admin connection...");
    
    // Initialize Firebase Admin if not already done
    if (!admin.apps.length) {
      admin.initializeApp({
        credential: admin.credential.cert({
          projectId: process.env.FIREBASE_PROJECT_ID,
          clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
          privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n')
        }),
        databaseURL: process.env.FIREBASE_DATABASE_URL
      });
    }
    
    const firestore = admin.firestore();
    
    // Test 2: Check users collection
    const usersSnapshot = await firestore.collection('users').get();
    
    const users = usersSnapshot.docs.map(doc => ({
      id: doc.id,
      email: doc.data().email,
      name: doc.data().name,
      kycStatus: doc.data().kycStatus,
      createdAt: doc.data().createdAt,
      ...doc.data()
    }));

    // Test 3: Check for recent KYC submissions
    const recentUsers = users.filter((user: { kycStatus?: string; createdAt?: admin.firestore.Timestamp }) => 
      user.kycStatus === "pending" && 
      user.createdAt && 
      new Date(user.createdAt.toDate()).getTime() > Date.now() - 24 * 60 * 60 * 1000 // Last 24 hours
    );

    return NextResponse.json({
      success: true,
      totalUsers: users.length,
      pendingKYC: users.filter((u: { kycStatus?: string }) => u.kycStatus === "pending").length,
      recentSubmissions: recentUsers.length,
      recentUsers: recentUsers,
      allUsers: users.slice(0, 10), // First 10 users for debugging
      firebaseConfig: {
        projectId: process.env.FIREBASE_PROJECT_ID,
        hasServiceAccount: !!process.env.FIREBASE_PRIVATE_KEY,
      }
    });

  } catch (error) {
    console.error("Debug API error:", error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
      stack: error instanceof Error ? error.stack : undefined
    }, { status: 500 });
  }
} 