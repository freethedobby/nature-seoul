"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowRight, User } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

export default function Home() {
  const { user, loading } = useAuth();
  return (
    <div className="min-h-screen bg-white">
      {/* Sticky Header */}
      <header className="border-gray-200 sticky top-0 z-50 border-b bg-white/90 px-4 py-4 backdrop-blur-sm">
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
              <div className="bg-gray-200 animate-pulse h-8 w-16 rounded-lg"></div>
            ) : user ? (
              <Link
                href={
                  user.email === "admin@naturesemi.com" ? "/admin" : "/user"
                }
              >
                <Button className="bg-gradient-to-r from-gray-50 to-gray-50 hover:from-gray-100 hover:via-gray-50 hover:to-gray-100 text-gray-700 hover:text-gray-900 border-gray-200 hover:border-gray-300 shadow-sm hover:shadow-md hover:-translate-y-0.5 group relative transform border via-white px-4 py-2 text-sm font-light transition-all duration-300">
                  <div className="bg-gradient-to-r via-gray-900/3 absolute inset-0 rounded-md from-transparent to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100"></div>
                  <div className="relative flex items-center space-x-2">
                    <div className="bg-gray-100 group-hover:bg-gray-200 rounded p-1 transition-colors duration-300">
                      <User className="h-3.5 w-3.5" />
                    </div>
                    <span>대시보드</span>
                  </div>
                </Button>
              </Link>
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
        <div className="bottom-48 absolute right-0 z-0 h-2/5 w-3/4 md:right-0 md:top-0 md:bottom-0 md:h-full md:w-2/3">
          <img
            src="/eyebrow_example.jpg"
            alt="Beautiful Woman Illustration"
            className="h-full w-full object-cover object-center"
          />
        </div>

        {/* Content Overlay */}
        <div className="relative z-10 mx-auto w-full max-w-6xl px-4 py-2 md:py-8">
          <div className="grid min-h-[90vh] items-start gap-4 pt-2 md:min-h-[70vh] md:grid-cols-2 md:items-center md:gap-8 md:pt-0">
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
                  <div className="w-32 animate-pulse bg-black/20 h-12 rounded-full"></div>
                ) : user ? (
                  <Link
                    href={
                      user.email === "admin@naturesemi.com" ? "/admin" : "/user"
                    }
                  >
                    <Button
                      size="lg"
                      className="hover:bg-gray-800 text-base shadow-lg bg-black w-full rounded-full px-6 py-3 font-medium text-white transition-all duration-300 sm:w-auto md:px-8 md:py-4 md:text-lg"
                    >
                      대시보드로 이동
                      <ArrowRight className="ml-2 h-4 w-4 md:h-5 md:w-5" />
                    </Button>
                  </Link>
                ) : (
                  <Link href="/login">
                    <Button
                      size="lg"
                      className="hover:bg-gray-800 text-base shadow-lg bg-black w-full rounded-full px-6 py-3 font-medium text-white transition-all duration-300 sm:w-auto md:px-8 md:py-4 md:text-lg"
                    >
                      예약하기
                      <ArrowRight className="ml-2 h-4 w-4 md:h-5 md:w-5" />
                    </Button>
                  </Link>
                )}

                <div className="text-black text-sm">
                  <p className="font-bold">용산 스튜디오</p>
                  <p className="text-xs font-semibold">완전 예약제</p>
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
      <footer className="border-gray-200 mt-8 border-t bg-white px-4 py-6 md:mt-16">
        <div className="container mx-auto max-w-6xl space-y-2 text-center">
          <p className="text-gray-500 text-sm font-light">
            © 2024 nature.seoul. 용산구 프리미엄 아이브로우 스튜디오
          </p>
          <p className="text-gray-400 text-xs font-light">
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
      </footer>
    </div>
  );
}
