import { NextResponse } from 'next/server';
import { isAdmin, addAdmin } from '@/lib/admin';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const email = searchParams.get('email');

  if (!email) {
    return NextResponse.json({ isAdmin: false });
  }

  const adminStatus = await isAdmin(email);
  return NextResponse.json({ isAdmin: adminStatus });
}

export async function POST(request: Request) {
  const { email } = await request.json();
  
  if (!email) {
    return NextResponse.json({ error: 'Email is required' }, { status: 400 });
  }

  try {
    await addAdmin(email);
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to add admin' }, { status: 500 });
  }
} 