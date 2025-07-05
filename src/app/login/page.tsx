"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { signInWithGoogle } from "@/lib/firebase";
import { Loader2, AlertCircle, ArrowLeft, User, Sparkles } from "lucide-react";

export default function LoginPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const handleGoogleLogin = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const user = await signInWithGoogle();
      console.log("Login successful:", user.email);

      // Check if user email is admin
      if (user.email === "admin@naturesemi.com") {
        console.log("Redirecting to admin page");
        router.push("/admin");
      } else {
        console.log("Redirecting to user page");
        router.push("/user");
      }
    } catch (error: unknown) {
      console.error("Login failed:", error);

      if (
        error instanceof Error &&
        error.message?.includes("Firebase is not configured")
      ) {
        setError("Firebase 설정이 필요합니다. 환경 변수를 설정해주세요.");
      } else if (
        error instanceof Error &&
        error.message?.includes("auth/unauthorized-domain")
      ) {
        setError(
          "도메인이 승인되지 않았습니다. Firebase Console에서 도메인을 추가해주세요."
        );
      } else if (error instanceof Error) {
        setError(`로그인 오류: ${error.message}`);
      } else {
        setError("로그인에 실패했습니다. 다시 시도해주세요.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleDemoLogin = (isAdmin = false) => {
    setIsLoading(true);

    // Simulate loading
    setTimeout(() => {
      if (isAdmin) {
        console.log("Demo admin login - redirecting to admin");
        router.push("/admin");
      } else {
        console.log("Demo user login - redirecting to user");
        router.push("/user");
      }
      setIsLoading(false);
    }, 1000);
  };

  // Check if Firebase is configured
  const isFirebaseConfigured =
    process.env.NEXT_PUBLIC_FIREBASE_API_KEY &&
    process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;

  return (
    <div className="relative min-h-screen bg-white">
      {/* Subtle background */}
      <div className="bg-gradient-to-br from-gray-50/50 absolute inset-0 to-white"></div>

      {/* Floating elements */}
      <div className="top-32 absolute right-16 opacity-10">
        <Sparkles className="text-gray-400 animate-pulse h-6 w-6" />
      </div>
      <div className="bottom-32 absolute left-16 opacity-10">
        <User
          className="text-gray-400 animate-pulse h-5 w-5"
          style={{ animationDelay: "2s" }}
        />
      </div>

      {/* Header */}
      <header className="relative z-10 px-6 py-8">
        <div className="container mx-auto flex items-center">
          <Button
            variant="ghost"
            onClick={() => router.push("/")}
            className="text-gray-600 hover:text-black hover:bg-gray-50 mr-6 font-light"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            돌아가기
          </Button>
          <div>
            <h1 className="text-black text-xl font-light tracking-wide">
              nature.seoul
            </h1>
            <p className="text-gray-400 text-[10px] tracking-wide">
              premium studio
            </p>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="relative z-10 flex items-center justify-center px-6 py-12">
        <Card className="shadow-xl border-gray-200 mx-auto w-full max-w-lg border bg-white">
          <CardHeader className="space-y-6 pb-8 text-center">
            {/* Login Icon */}
            <div className="bg-gray-100 mx-auto flex h-16 w-16 items-center justify-center rounded-full">
              <svg className="text-gray-600 h-8 w-8" viewBox="0 0 24 24">
                <path
                  fill="currentColor"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="currentColor"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="currentColor"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                />
                <path
                  fill="currentColor"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                />
              </svg>
            </div>

            <CardTitle className="text-black text-2xl font-light tracking-wide">
              로그인
            </CardTitle>
            <CardDescription className="text-gray-600 font-light leading-relaxed">
              프리미엄 서비스 이용을 위해
              <br />
              <span className="text-black">Google 계정으로 로그인하세요</span>
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-6 px-8 pb-8">
            {!isFirebaseConfigured && (
              <div className="bg-amber-50 border-amber-200 rounded-lg border p-4">
                <div className="text-amber-800 flex items-center gap-2">
                  <AlertCircle className="h-4 w-4" />
                  <span className="text-sm font-medium">개발 모드</span>
                </div>
                <p className="text-amber-700 mt-2 text-sm font-light">
                  Firebase 설정이 필요합니다. 데모 버전으로 테스트 가능합니다.
                </p>
              </div>
            )}

            {error && (
              <div className="bg-red-50 border-red-200 rounded-lg border p-4">
                <div className="text-red-800 flex items-center gap-2">
                  <AlertCircle className="h-4 w-4" />
                  <span className="text-sm font-medium">오류</span>
                </div>
                <p className="text-red-700 mt-2 text-sm font-light">{error}</p>
              </div>
            )}

            {isFirebaseConfigured ? (
              <Button
                onClick={handleGoogleLogin}
                disabled={isLoading}
                className="bg-black hover:bg-gray-800 text-base h-12 w-full rounded-lg font-light text-white transition-all duration-300 disabled:opacity-50"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="animate-spin mr-3 h-5 w-5" />
                    <span className="font-light">로그인 중...</span>
                  </>
                ) : (
                  <>
                    <svg className="mr-3 h-5 w-5" viewBox="0 0 24 24">
                      <path
                        fill="currentColor"
                        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                      />
                      <path
                        fill="currentColor"
                        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                      />
                      <path
                        fill="currentColor"
                        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                      />
                      <path
                        fill="currentColor"
                        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                      />
                    </svg>
                    <span>Google로 로그인</span>
                  </>
                )}
              </Button>
            ) : (
              <div className="space-y-3">
                <Button
                  onClick={() => handleDemoLogin(false)}
                  disabled={isLoading}
                  className="bg-gray-100 text-gray-700 hover:bg-gray-200 text-base h-12 w-full rounded-lg font-light transition-all duration-300 disabled:opacity-50"
                >
                  {isLoading ? (
                    <Loader2 className="animate-spin mr-3 h-5 w-5" />
                  ) : (
                    <User className="mr-3 h-5 w-5" />
                  )}
                  데모 로그인 (일반 사용자)
                </Button>
                <Button
                  onClick={() => handleDemoLogin(true)}
                  disabled={isLoading}
                  variant="outline"
                  className="border-gray-300 text-gray-700 hover:bg-gray-50 text-base h-12 w-full rounded-lg font-light disabled:opacity-50"
                >
                  {isLoading ? (
                    <Loader2 className="animate-spin mr-3 h-5 w-5" />
                  ) : (
                    <Sparkles className="mr-3 h-5 w-5" />
                  )}
                  데모 로그인 (관리자)
                </Button>
              </div>
            )}

            <div className="text-gray-500 text-center text-sm font-light">
              로그인 시 개인정보처리방침 및 서비스 약관에 동의하는 것으로
              간주됩니다
            </div>

            {!isFirebaseConfigured && (
              <div className="bg-blue-50 border-blue-200 rounded-lg border p-4">
                <h4 className="text-blue-800 mb-3 font-medium">
                  Firebase 설정 방법
                </h4>
                <ol className="text-blue-700 list-inside list-decimal space-y-1 text-sm font-light">
                  <li>Firebase 프로젝트 생성</li>
                  <li>.env.local 파일에 환경 변수 추가</li>
                  <li>Google OAuth 설정 완료</li>
                </ol>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Footer */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 transform text-center">
        <p className="text-gray-500 text-xs font-light">
          © 2024 nature.seoul • 강남 프리미엄 스튜디오
        </p>
      </div>
    </div>
  );
}
