"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeft, Eye, EyeOff, Shield } from "lucide-react";
import { signInWithGoogle, signInWithEmailAndPassword } from "@/lib/firebase";
import { useAuth } from "@/contexts/AuthContext";

export default function AdminLoginPage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loginMethod, setLoginMethod] = useState<"google" | "email">("google");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();

  // Redirect to admin dashboard if user is already authenticated and is admin
  useEffect(() => {
    if (!authLoading && user) {
      // Check if user is admin
      const checkAdminAndRedirect = async () => {
        try {
          const response = await fetch("/api/admin/check", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ email: user.email }),
          });

          if (response.ok) {
            const data = await response.json();
            if (data.isAdmin) {
              router.push("/admin");
            } else {
              // User is logged in but not admin, redirect to regular dashboard
              router.push("/dashboard");
            }
          } else {
            // User is logged in but not admin, redirect to regular dashboard
            router.push("/dashboard");
          }
        } catch (error) {
          console.error("Error checking admin status:", error);
          router.push("/dashboard");
        }
      };

      checkAdminAndRedirect();
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
      // The useEffect will handle the redirect after successful login
    } catch (err: unknown) {
      console.error("Google login error:", err);

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
        setError("Google 로그인에 실패했습니다. 다시 시도해주세요.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    if (!email || !password) {
      setError("이메일과 비밀번호를 모두 입력해주세요.");
      setLoading(false);
      return;
    }

    try {
      await signInWithEmailAndPassword(email, password);
      // The useEffect will handle the redirect after successful login
    } catch (err: unknown) {
      console.error("Email login error:", err);
      if (
        (err as { code: string }).code === "auth/user-not-found" ||
        (err as { code: string }).code === "auth/wrong-password"
      ) {
        setError("이메일 또는 비밀번호가 올바르지 않습니다.");
      } else if ((err as { code: string }).code === "auth/too-many-requests") {
        setError(
          "너무 많은 로그인 시도가 있었습니다. 잠시 후 다시 시도해주세요."
        );
      } else {
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
              <div className="mb-4 flex justify-center">
                <div className="bg-gradient-to-br from-blue-500 to-purple-600 shadow-lg flex h-16 w-16 items-center justify-center rounded-xl">
                  <Shield className="h-8 w-8 text-white" />
                </div>
              </div>
              <h1 className="mb-2 text-2xl font-bold">관리자 로그인</h1>
              <p className="text-gray-600">
                nature.seoul 관리자 페이지에 접근하려면 로그인해주세요.
              </p>
            </div>

            <div className="space-y-6">
              {error && (
                <div className="text-red-500 bg-red-50 border-red-100 rounded-xl border p-4 text-center text-sm">
                  {error}
                </div>
              )}

              {/* Login Method Toggle */}
              <div className="border-gray-200 flex rounded-lg border bg-white p-1">
                <button
                  type="button"
                  onClick={() => setLoginMethod("google")}
                  className={`flex-1 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                    loginMethod === "google"
                      ? "bg-blue-50 text-blue-600"
                      : "text-gray-500 hover:text-gray-700"
                  }`}
                >
                  Google 로그인
                </button>
                <button
                  type="button"
                  onClick={() => setLoginMethod("email")}
                  className={`flex-1 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                    loginMethod === "email"
                      ? "bg-blue-50 text-blue-600"
                      : "text-gray-500 hover:text-gray-700"
                  }`}
                >
                  이메일 로그인
                </button>
              </div>

              {loginMethod === "google" ? (
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
                  {loading ? "로그인 중..." : "Google로 관리자 로그인"}
                </Button>
              ) : (
                <form onSubmit={handleEmailLogin} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="email">이메일</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="admin@nature.seoul"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      disabled={loading}
                      className="border-gray-200 focus:border-blue-500 focus:ring-blue-500"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="password">비밀번호</Label>
                    <div className="relative">
                      <Input
                        id="password"
                        type={showPassword ? "text" : "password"}
                        placeholder="비밀번호를 입력하세요"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        disabled={loading}
                        className="border-gray-200 focus:border-blue-500 focus:ring-blue-500 pr-10"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="text-gray-400 hover:text-gray-600 absolute right-3 top-1/2 -translate-y-1/2"
                      >
                        {showPassword ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </button>
                    </div>
                  </div>

                  <Button
                    type="submit"
                    disabled={loading}
                    className="bg-blue-600 hover:bg-blue-700 shadow-sm hover:shadow-md hover:-translate-y-0.5 group relative h-14 w-full transform text-white transition-all duration-300"
                  >
                    {loading ? "로그인 중..." : "관리자 로그인"}
                  </Button>
                </form>
              )}

              <p className="text-gray-400 text-center text-xs">
                💡 팝업이 차단되는 경우 브라우저 설정에서 팝업을 허용해주세요
              </p>

              <div className="text-center">
                <Link
                  href="/login"
                  className="text-blue-600 hover:text-blue-700 text-sm underline"
                >
                  일반 사용자 로그인
                </Link>
              </div>

              <p className="text-gray-500 text-center text-sm">
                관리자 로그인 시 개인정보처리방침 및 서비스 약관에 동의하는
                것으로 간주됩니다
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
