"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowRight, User, LogOut, Loader2, Instagram } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { signOutUser } from "@/lib/firebase";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function Home() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      await signOutUser();
      router.push("/");
    } catch (error) {
      console.error("Logout failed:", error);
    } finally {
      setIsLoggingOut(false);
    }
  };
  return (
    <div className="min-h-screen bg-white">
      {/* Sticky Header */}
      <header className="border-gray-200 sticky top-0 z-50 border-b bg-white/90 px-4 py-3 backdrop-blur-sm md:py-4">
        <div className="container mx-auto max-w-6xl">
          <div className="flex items-center justify-between">
            <Link href="/" className="transition-opacity hover:opacity-80">
              <div>
                <h1 className="text-black text-xl font-light tracking-wide">
                  nature.seoul
                </h1>
                <p className="text-gray-400 text-[10px] tracking-wide">
                  premium studio
                </p>
              </div>
            </Link>

            {loading ? (
              <div className="bg-gray-200 animate-pulse w-24 h-10 rounded-lg"></div>
            ) : user ? (
              <div className="flex items-center space-x-3">
                <Link
                  href={
                    user.email === "admin@naturesemi.com" ? "/admin" : "/user"
                  }
                >
                  <Button className="bg-gradient-to-r from-gray-50 to-gray-50 hover:from-gray-100 hover:via-gray-50 hover:to-gray-100 text-gray-700 hover:text-gray-900 border-gray-200 hover:border-gray-300 shadow-sm hover:shadow-md hover:-translate-y-0.5 group relative transform border via-white px-4 py-2 text-sm font-medium transition-all duration-300">
                    <div className="bg-gradient-to-r via-gray-900/3 absolute inset-0 rounded-md from-transparent to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100"></div>
                    <div className="relative flex items-center space-x-2">
                      <div className="bg-gray-100 group-hover:bg-gray-200 rounded p-1 transition-colors duration-300">
                        <User className="h-3.5 w-3.5" />
                      </div>
                      <span>대시보드</span>
                    </div>
                  </Button>
                </Link>
                <Button
                  onClick={handleLogout}
                  disabled={isLoggingOut}
                  className="bg-gradient-to-r from-red-50 via-red-25 to-red-50 hover:from-red-100 hover:via-red-50 hover:to-red-100 text-red-700 hover:text-red-900 border-red-200 hover:border-red-300 shadow-sm hover:shadow-md hover:-translate-y-0.5 group relative transform border px-4 py-2 text-sm font-medium transition-all duration-300 disabled:transform-none disabled:opacity-50"
                >
                  <div className="bg-gradient-to-r via-red-900/3 absolute inset-0 rounded-md from-transparent to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100"></div>
                  <div className="relative flex items-center space-x-2">
                    {isLoggingOut ? (
                      <>
                        <Loader2 className="animate-spin h-3.5 w-3.5" />
                        <span>로그아웃 중...</span>
                      </>
                    ) : (
                      <>
                        <div className="bg-red-100 group-hover:bg-red-200 rounded p-1 transition-colors duration-300">
                          <LogOut className="h-3.5 w-3.5" />
                        </div>
                        <span>로그아웃</span>
                      </>
                    )}
                  </div>
                </Button>
              </div>
            ) : (
              <Link href="/login">
                <Button className="bg-gradient-to-r from-gray-900 via-black to-gray-900 hover:from-gray-800 hover:via-gray-900 hover:to-gray-800 shadow-lg hover:shadow-xl hover:-translate-y-0.5 py-2.5 group relative transform px-6 text-sm font-medium text-white transition-all duration-300">
                  <div className="bg-gradient-to-r absolute inset-0 rounded-md from-transparent via-white/10 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100"></div>
                  <span className="relative">로그인</span>
                </Button>
              </Link>
            )}
          </div>
        </div>
      </header>

      {/* Hero Section with Background Image */}
      <main className="relative flex min-h-screen items-center justify-center overflow-hidden">
        {/* Background Image - Small on mobile, positioned on desktop */}
        <div className="bottom-32 absolute right-0 z-0 h-2/5 w-3/4 md:right-0 md:top-0 md:bottom-0 md:h-full md:w-2/3">
          <img
            src="/eyebrow_example.jpg"
            alt="Beautiful Woman Illustration"
            className="h-full w-full object-cover object-center"
          />
        </div>

        {/* Content Overlay */}
        <div className="relative z-10 mx-auto w-full max-w-6xl px-4 py-1 md:py-8">
          <div className="grid min-h-[75vh] items-start gap-4 pt-2 md:min-h-[70vh] md:grid-cols-2 md:items-center md:gap-8 md:pt-0">
            {/* Left Content */}
            <div className="text-black space-y-4 md:space-y-8">
              <div className="space-y-4 md:space-y-6">
                <h2 className="text-4xl font-bold leading-tight tracking-tight drop-shadow-2xl md:text-6xl lg:text-7xl">
                  당신의 눈썹을
                  <br />
                  <span className="font-bold">더 아름답게</span>
                </h2>

                <p className="text-lg font-bold leading-relaxed drop-shadow-xl md:text-xl">
                  개인 맞춤형 디자인으로 당신만의 완벽한 눈썹을 만들어드립니다.
                </p>
              </div>

              <div className="flex flex-col items-start space-y-4 sm:flex-row sm:items-center sm:space-y-0 sm:space-x-4">
                {loading ? (
                  <div className="w-40 animate-pulse bg-black/20 h-14 rounded-full"></div>
                ) : user ? (
                  <Link
                    href={
                      user.email === "admin@naturesemi.com" ? "/admin" : "/user"
                    }
                  >
                    <Button
                      size="lg"
                      className="bg-gradient-to-r from-gray-900 via-black to-gray-900 hover:from-gray-800 hover:via-gray-900 hover:to-gray-800 shadow-xl hover:shadow-2xl group relative w-full transform rounded-full px-8 py-4 text-lg font-semibold text-white transition-all duration-500 hover:-translate-y-1 hover:scale-105 sm:w-auto md:px-10 md:py-5 md:text-xl"
                    >
                      <div className="bg-gradient-to-r absolute inset-0 rounded-full from-transparent via-white/20 to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100"></div>
                      <div className="relative flex items-center">
                        <span>대시보드로 이동</span>
                        <div className="p-1.5 ml-3 rounded-full bg-white/10 transition-colors duration-300 group-hover:bg-white/20">
                          <ArrowRight className="group-hover:translate-x-0.5 h-5 w-5 transition-transform duration-300 md:h-6 md:w-6" />
                        </div>
                      </div>
                    </Button>
                  </Link>
                ) : (
                  <Link href="/login">
                    <Button
                      size="lg"
                      className="bg-gradient-to-r from-gray-900 via-black to-gray-900 hover:from-gray-800 hover:via-gray-900 hover:to-gray-800 shadow-xl hover:shadow-2xl group relative w-full transform rounded-full px-8 py-4 text-lg font-semibold text-white transition-all duration-500 hover:-translate-y-1 hover:scale-105 sm:w-auto md:px-10 md:py-5 md:text-xl"
                    >
                      <div className="bg-gradient-to-r absolute inset-0 rounded-full from-transparent via-white/20 to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100"></div>
                      <div className="relative flex items-center">
                        <span>예약하기</span>
                        <div className="p-1.5 ml-3 rounded-full bg-white/10 transition-colors duration-300 group-hover:bg-white/20">
                          <ArrowRight className="group-hover:translate-x-0.5 h-5 w-5 transition-transform duration-300 md:h-6 md:w-6" />
                        </div>
                      </div>
                    </Button>
                  </Link>
                )}

                <div className="text-black space-y-3 text-sm">
                  <div className="space-y-1.5">
                    <p className="text-gray-800 text-sm font-light tracking-wider">
                      yongsan premium studio
                    </p>
                    <div className="flex items-center space-x-2">
                      <div className="bg-gray-400 h-1 w-1 rounded-full"></div>
                      <p className="text-gray-600 text-xs font-light tracking-wide">
                        by appointment only
                      </p>
                      <div className="bg-gray-400 h-1 w-1 rounded-full"></div>
                    </div>
                  </div>

                  {/* Instagram Link */}
                  <a
                    href="https://www.instagram.com/blacksheepwall.xyz/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-gray-600 hover:text-gray-900 group inline-flex items-center transition-colors duration-300"
                  >
                    <div className="bg-gray-100 group-hover:bg-gray-200 rounded-full p-2 transition-colors duration-300">
                      <Instagram className="h-4 w-4" />
                    </div>
                  </a>
                </div>
              </div>
            </div>

            {/* Right Content - Empty space for image on desktop */}
            <div className="hidden md:block">
              {/* This space showcases the background image */}
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-gray-200 mt-2 border-t bg-white px-4 py-4 md:mt-16 md:py-8">
        <div className="container mx-auto max-w-6xl space-y-3 text-center md:space-y-4">
          <div className="flex items-center justify-center space-x-4">
            <div className="h-px bg-gradient-to-r via-gray-300 w-12 from-transparent to-transparent"></div>
            <div className="space-y-1">
              <p className="text-gray-800 text-sm font-light tracking-wider">
                nature.seoul
              </p>
              <p className="text-gray-400 text-[10px] font-light tracking-widest">
                yongsan premium studio
              </p>
            </div>
            <div className="h-px bg-gradient-to-r via-gray-300 w-12 from-transparent to-transparent"></div>
          </div>
          <div className="space-y-2">
            <p className="text-gray-500 text-xs font-light tracking-wide">
              © 2024 Premium Eyebrow Artistry • Yongsan-gu, Seoul
            </p>
            <p className="text-gray-400 text-[10px] font-light">
              designed by{" "}
              <a
                href="https://blacksheepwall.xyz"
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-400 hover:text-gray-600 underline decoration-dotted underline-offset-2 transition-colors duration-300"
              >
                blacksheepwall
              </a>
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
