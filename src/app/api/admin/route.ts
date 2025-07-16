import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const email = searchParams.get('email');

  if (!email) {
    return NextResponse.json({ isAdmin: false });
  }

  // Check if Firebase Admin environment variables are set
  if (!process.env.FIREBASE_PROJECT_ID || !process.env.FIREBASE_CLIENT_EMAIL || !process.env.FIREBASE_PRIVATE_KEY) {
    console.error('Firebase Admin environment variables not set');
    // Fallback to hardcoded admin check
    const hardcodedAdmins = ['blacksheepwall.xyz@gmail.com', 'blacksheepwall.xyz@google.com'];
    return NextResponse.json({ isAdmin: hardcodedAdmins.includes(email) });
  }

  try {
    // Dynamic import to prevent build-time errors
    const { isAdmin } = await import('@/lib/admin');
    const adminStatus = await isAdmin(email);
    return NextResponse.json({ isAdmin: adminStatus });
  } catch (error) {
    console.error('Error checking admin status:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      details: process.env.NODE_ENV === 'development' ? (error instanceof Error ? error.message : 'Unknown error') : undefined
    }, { status: 500 });
  }
}

export async function POST(request: Request) {
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

  try {
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