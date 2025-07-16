import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const hasProjectId = !!process.env.FIREBASE_PROJECT_ID;
    const hasClientEmail = !!process.env.FIREBASE_CLIENT_EMAIL;
    const hasPrivateKey = !!process.env.FIREBASE_PRIVATE_KEY;
    
    const isConfigured = hasProjectId && hasClientEmail && hasPrivateKey;
    
    // Test Firebase Admin initialization if all variables are present
    let adminTest = false;
    let adminError = null;
    
    if (isConfigured) {
      try {
        // Dynamic import to prevent build-time errors
        const admin = await import('firebase-admin');
        
        if (!admin.apps.length) {
          admin.initializeApp({
            credential: admin.credential.cert({
              projectId: process.env.FIREBASE_PROJECT_ID,
              clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
              privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n')
            }),
          });
        }
        
        // Test connection by trying to access Firestore
        const { getFirestore } = await import('firebase-admin/firestore');
        const db = getFirestore();
        await db.collection('admins').limit(1).get();
        
        adminTest = true;
      } catch (error) {
        adminError = error instanceof Error ? error.message : 'Unknown error';
      }
    }
    
    return NextResponse.json({
      isConfigured,
      hasProjectId,
      hasClientEmail,
      hasPrivateKey,
      adminTest,
      adminError,
      environment: process.env.NODE_ENV
    });
  } catch (error) {
    console.error('Error checking admin config:', error);
    return NextResponse.json({ 
      error: 'Failed to check configuration',
      details: process.env.NODE_ENV === 'development' ? (error instanceof Error ? error.message : 'Unknown error') : undefined
    }, { status: 500 });
  }
} 