import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// 개발 환경 체크 함수
export function isDevelopment(): boolean {
  // 로컬 개발 환경 체크 (localhost 또는 127.0.0.1)
  if (typeof window !== 'undefined') {
    const hostname = window.location.hostname;
    return hostname === 'localhost' || hostname === '127.0.0.1' || hostname.startsWith('192.168.');
  }
  
  // 서버 사이드에서는 NODE_ENV 체크
  return process.env.NODE_ENV === 'development';
}

// 테스트 모드 체크 (개발 환경에서 모든 제한 우회)
export function isTestMode(): boolean {
  if (!isDevelopment()) return false;
  
  // 브라우저 환경에서만 추가 체크
  if (typeof window !== 'undefined') {
    const hasTestParam = window.location.search.includes('test=true');
    const hasTestFlag = localStorage.getItem('enableTestMode') === 'true';
    return hasTestParam || hasTestFlag;
  }
  
  return true; // 서버 사이드에서는 개발 환경이면 테스트 모드
}
