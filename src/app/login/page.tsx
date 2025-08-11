"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { signInWithGoogle } from "@/lib/firebase";
import { useAuth } from "@/contexts/AuthContext";

export default function LoginPage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();

  console.log(
    "LoginPage render - user:",
    user?.email,
    "authLoading:",
    authLoading,
    "pathname:",
    typeof window !== "undefined" ? window.location.pathname : "Unknown"
  );

  // Get the original destination from URL parameters or default to dashboard
  const getRedirectPath = () => {
    if (typeof window !== "undefined") {
      const urlParams = new URLSearchParams(window.location.search);
      const redirectTo = urlParams.get("redirectTo");
      console.log("Login page - redirectTo from URL:", redirectTo);
      return redirectTo || "/dashboard";
    }
    return "/dashboard";
  };

  // Redirect to original destination if user is already authenticated
  useEffect(() => {
    if (!authLoading && user) {
      const redirectPath = getRedirectPath();
      router.push(redirectPath);
    }
  }, [user, authLoading, router]);

  // Show loading while checking authentication
  if (authLoading) {
    return (
      <div className="bg-gradient-to-br from-gray-50 flex min-h-screen items-center justify-center to-white">
        <div className="animate-spin border-black h-8 w-8 rounded-full border-b-2"></div>
      </div>
    );
  }

  // Don't render login form if user is already authenticated
  if (user) {
    return null;
  }

  const handleGoogleLogin = async () => {
    setLoading(true);
    setError("");

    try {
      await signInWithGoogle();
      const redirectPath = getRedirectPath();
      console.log("Redirecting to", redirectPath, "after successful login");
      router.push(redirectPath);
    } catch (err: unknown) {
      console.error("Login error:", err);

      // Handle specific error cases
      const error = err as { message?: string; code?: string };
      if (error?.message === "POPUP_CLOSED") {
        // User closed popup - don't show error, just reset loading state
        console.log("User closed login popup");
        return;
      } else if (error?.message === "POPUP_CANCELLED") {
        // Popup was cancelled - don't show error
        console.log("Login popup was cancelled");
        return;
      } else if (error?.message && error.message !== error?.code) {
        // Use the custom error message we set in firebase.ts
        setError(error.message);
      } else {
        // Fallback for unknown errors
        setError("로그인에 실패했습니다. 다시 시도해주세요.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-gradient-to-br from-gray-50 flex min-h-screen flex-col to-white">
      <div className="flex-grow">
        <div className="container mx-auto max-w-6xl px-4 py-8">
          <Link
            href="/"
            className="text-gray-500 hover:text-gray-900 mb-8 inline-flex items-center text-sm transition-colors"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            홈으로 돌아가기
          </Link>

          <div className="mx-auto max-w-md">
            <div className="mb-8 text-center">
              <h1 className="mb-2 text-2xl font-bold">로그인</h1>
              <p className="text-gray-600">
                nature.seoul의 서비스를 이용하시려면 로그인해주세요.
              </p>
            </div>

            <div className="space-y-6">
              {error && (
                <div className="text-red-500 bg-red-50 border-red-100 rounded-xl border p-4 text-center text-sm">
                  {error}
                </div>
              )}

              <Button
                onClick={handleGoogleLogin}
                disabled={loading}
                className="text-gray-900 border-gray-200 shadow-sm hover:shadow-md hover:-translate-y-0.5 group relative h-14 w-full transform border bg-white transition-all duration-300"
              >
                <div className="absolute left-4 flex items-center justify-center">
                  <svg className="h-5 w-5" viewBox="0 0 24 24">
                    <path
                      fill="#4285F4"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                    />
                    <path
                      fill="#EA4335"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                    />
                  </svg>
                </div>
                {loading ? "로그인 중..." : "Google로 로그인"}
              </Button>

              <p className="text-gray-400 text-center text-xs">
                💡 팝업이 차단되는 경우 브라우저 설정에서 팝업을 허용해주세요
              </p>

              <p className="text-gray-500 text-center text-sm">
                로그인 시 개인정보처리방침 및 서비스 약관에 동의하는 것으로
                간주됩니다
              </p>
            </div>
          </div>
        </div>
      </div>

      <footer className="border-gray-100 border-t py-8">
        <div className="container mx-auto max-w-6xl px-4">
          <div className="flex flex-col items-center justify-between space-y-4 md:flex-row md:space-y-0">
            <div className="text-center md:text-left">
              <p className="text-black text-sm font-light">nature.seoul</p>
              <p className="text-gray-400 text-xs">
                designed by{" "}
                <a
                  href="https://blacksheepwall.xyz"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-gray-600 underline transition-colors"
                >
                  blacksheepwall
                </a>
              </p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
