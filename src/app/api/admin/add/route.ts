import { NextRequest, NextResponse } from 'next/server';
import { addAdmin } from '@/lib/admin';

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();
    
    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    await addAdmin(email);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error adding admin:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 