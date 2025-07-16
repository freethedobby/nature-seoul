import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();
    
    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    // Check if Firebase Admin environment variables are set
    if (!process.env.FIREBASE_PROJECT_ID || !process.env.FIREBASE_CLIENT_EMAIL || !process.env.FIREBASE_PRIVATE_KEY) {
      console.error('Firebase Admin environment variables not set');
      return NextResponse.json({ 
        error: 'Admin functionality not configured. Please set Firebase Admin environment variables.' 
      }, { status: 500 });
    }

    // Dynamic import to prevent build-time errors
    const { addAdmin } = await import('@/lib/admin');
    await addAdmin(email);
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error adding admin:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      details: process.env.NODE_ENV === 'development' ? (error instanceof Error ? error.message : 'Unknown error') : undefined
    }, { status: 500 });
  }
} 