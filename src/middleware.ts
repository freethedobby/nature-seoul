import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function middleware(_request: NextRequest) {
  // For admin routes, let the client-side handle authentication
  // Firebase auth uses JWT tokens in localStorage, not session cookies
  return NextResponse.next();
}

export const config = {
  matcher: ['/admin/:path*']
}; 