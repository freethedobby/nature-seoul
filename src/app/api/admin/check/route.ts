import { NextRequest, NextResponse } from 'next/server';
import { isAdmin } from '@/lib/admin';

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();
    
    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }
    
    const adminStatus = await isAdmin(email);
    
    return NextResponse.json({ isAdmin: adminStatus });
  } catch (error) {
    console.error('Error checking admin status:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 