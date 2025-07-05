"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowRight, User, LogOut, Loader2, Menu } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { signOutUser } from "@/lib/firebase";
import { useRouter } from "next/navigation";
import { useState } from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

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

  const AuthButtons = () => {
    if (loading) {
      return (
        <div className="bg-gray-200 animate-pulse h-8 w-16 rounded-lg"></div>
      );
    }

    if (!user) {
      return (
        <Link href="/login">
          <Button className="bg-gradient-to-r from-black to-black hover:from-neutral-800 hover:to-neutral-900 shadow-sm hover:shadow-md hover:-translate-y-0.5 group relative transform px-4 py-2 text-sm font-medium text-white transition-all duration-300">
            <div className="bg-gradient-to-r absolute inset-0 rounded-md from-transparent via-white/5 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100"></div>
            <div className="relative flex items-center space-x-2">
              <div className="rounded bg-white/10 p-1 transition-colors duration-300 group-hover:bg-white/20">
                <ArrowRight className="h-3.5 w-3.5" />
              </div>
              <span>로그인</span>
            </div>
          </Button>
        </Link>
      );
    }

    return (
      <>
        <div className="hidden items-center space-x-3 md:flex">
          <Link
            href={user.email === "admin@naturesemi.com" ? "/admin" : "/user"}
          >
            <Button className="bg-gradient-to-r from-black to-black hover:from-neutral-800 hover:to-neutral-900 shadow-sm hover:shadow-md hover:-translate-y-0.5 group relative transform px-4 py-2 text-sm font-medium text-white transition-all duration-300">
              <div className="bg-gradient-to-r absolute inset-0 rounded-md from-transparent via-white/5 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100"></div>
              <div className="relative flex items-center space-x-2">
                <div className="rounded bg-white/10 p-1 transition-colors duration-300 group-hover:bg-white/20">
                  <User className="h-3.5 w-3.5" />
                </div>
                <span>대시보드</span>
              </div>
            </Button>
          </Link>
          <Button
            onClick={handleLogout}
            disabled={isLoggingOut}
            className="bg-gradient-to-r from-black to-black hover:from-neutral-800 hover:to-neutral-900 shadow-sm hover:shadow-md hover:-translate-y-0.5 group relative transform px-4 py-2 text-sm font-medium text-white transition-all duration-300 disabled:transform-none disabled:opacity-50"
          >
            <div className="bg-gradient-to-r absolute inset-0 rounded-md from-transparent via-white/5 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100"></div>
            <div className="relative flex items-center space-x-2">
              {isLoggingOut ? (
                <>
                  <Loader2 className="animate-spin h-3.5 w-3.5" />
                  <span>로그아웃 중...</span>
                </>
              ) : (
                <>
                  <div className="rounded bg-white/10 p-1 transition-colors duration-300 group-hover:bg-white/20">
                    <LogOut className="h-3.5 w-3.5" />
                  </div>
                  <span>로그아웃</span>
                </>
              )}
            </div>
          </Button>
        </div>

        <div className="md:hidden">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button className="bg-gradient-to-r from-black to-black hover:from-neutral-800 hover:to-neutral-900 shadow-sm hover:shadow-md hover:-translate-y-0.5 group relative transform px-3 py-2 text-sm font-medium text-white transition-all duration-300">
                <Menu className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem asChild>
                <Link
                  href={
                    user.email === "admin@naturesemi.com" ? "/admin" : "/user"
                  }
                  className="flex items-center space-x-2"
                >
                  <User className="h-4 w-4" />
                  <span>대시보드</span>
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={handleLogout}
                disabled={isLoggingOut}
                className="text-red-600 focus:text-red-600 flex items-center space-x-2"
              >
                {isLoggingOut ? (
                  <>
                    <Loader2 className="animate-spin h-4 w-4" />
                    <span>로그아웃 중...</span>
                  </>
                ) : (
                  <>
                    <LogOut className="h-4 w-4" />
                    <span>로그아웃</span>
                  </>
                )}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </>
    );
  };

  return (
    <div className="min-h-screen bg-white">
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

            <AuthButtons />
          </div>
        </div>
      </header>

      <main className="relative flex min-h-screen items-center justify-center overflow-hidden">
        <div className="bottom-48 absolute right-0 z-0 h-2/5 w-3/4 md:right-0 md:top-0 md:bottom-0 md:h-full md:w-2/3">
          <img
            src="/eyebrow_example.jpg"
            alt="Beautiful Woman Illustration"
            className="h-full w-full object-cover object-center"
          />
        </div>

        <div className="relative z-10 mx-auto w-full max-w-6xl px-4 py-2 md:py-8">
          <div className="grid min-h-[90vh] items-start gap-4 pt-2 md:min-h-[70vh] md:grid-cols-2 md:items-center md:gap-8 md:pt-0">
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
                  <Link href="/kyc">
                    <Button className="bg-gradient-to-r from-black to-black hover:from-neutral-800 hover:to-neutral-900 shadow-lg hover:shadow-xl hover:-translate-y-0.5 text-base group relative transform px-8 py-3 font-medium text-white transition-all duration-300">
                      <div className="bg-gradient-to-r absolute inset-0 rounded-md from-transparent via-white/5 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100"></div>
                      <span>예약하기</span>
                    </Button>
                  </Link>
                ) : (
                  <Link href="/login">
                    <Button className="bg-gradient-to-r from-black to-black hover:from-neutral-800 hover:to-neutral-900 shadow-lg hover:shadow-xl hover:-translate-y-0.5 text-base group relative transform px-8 py-3 font-medium text-white transition-all duration-300">
                      <div className="bg-gradient-to-r absolute inset-0 rounded-md from-transparent via-white/5 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100"></div>
                      <span>로그인</span>
                    </Button>
                  </Link>
                )}
                <Link href="/kyc">
                  <Button className="bg-gradient-to-r hover:from-gray-50 hover:to-gray-50 text-black border-black/10 hover:border-black/20 shadow-lg hover:shadow-xl hover:-translate-y-0.5 text-base group relative transform border from-white to-white px-8 py-3 font-medium transition-all duration-300">
                    <div className="bg-gradient-to-r via-black/5 absolute inset-0 rounded-md from-transparent to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100"></div>
                    <span>상담 신청</span>
                  </Button>
                </Link>
              </div>

              <div className="text-black text-sm">
                <p className="font-light">용산 스튜디오</p>
                <p className="text-gray-500 text-xs">예약제</p>
              </div>
            </div>
          </div>
        </div>
      </main>

      <footer className="border-gray-200 border-t py-8">
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
                  className="hover:text-gray-600 underline"
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
