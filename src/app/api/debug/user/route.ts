import { NextRequest, NextResponse } from 'next/server';
import { getFirestore } from 'firebase-admin/firestore';
import { initializeApp, getApps, cert } from 'firebase-admin/app';

// Initialize Firebase Admin if not already initialized
if (getApps().length === 0) {
  initializeApp({
    credential: cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    }),
  });
}

const db = getFirestore();

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const uid = searchParams.get('uid');
    
    if (!uid) {
      return NextResponse.json({ error: 'UID is required' }, { status: 400 });
    }
    
    console.log('Checking Firestore for user:', uid);
    
    // Check the users collection
    const userDoc = await db.collection('users').doc(uid).get();
    
    if (userDoc.exists) {
      const userData = userDoc.data();
      console.log('User document found:', userData);
      return NextResponse.json({
        exists: true,
        data: userData,
        documentId: userDoc.id,
        path: `users/${uid}`
      });
    } else {
      console.log('User document not found at users/' + uid);
      
      // Let's also check if there are any documents with this UID in the userId field
      const query = await db.collection('users').where('userId', '==', uid).get();
      
      if (!query.empty) {
        const docs = query.docs.map(doc => ({
          id: doc.id,
          data: doc.data()
        }));
        console.log('Found documents with matching userId:', docs);
        return NextResponse.json({
          exists: false,
          message: 'Document not found at users/' + uid,
          alternativeMatches: docs
        });
      }
      
      return NextResponse.json({
        exists: false,
        message: 'Document not found at users/' + uid,
        alternativeMatches: []
      });
    }
  } catch (error) {
    console.error('Error checking user document:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 