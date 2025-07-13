import { NextRequest, NextResponse } from 'next/server';
import { removeAdmin } from '@/lib/admin';

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();
    
    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    await removeAdmin(email);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error removing admin:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 