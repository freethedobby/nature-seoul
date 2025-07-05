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
        <div className="animate-pulse bg-gray-200 h-8 w-16 rounded-md"></div>
      );
    }

    if (!user) {
      return (
        <Link href="/login">
          <Button variant="ghost" className="text-gray-600 hover:text-black">
            <ArrowRight className="mr-2 h-4 w-4" />
            로그인
          </Button>
        </Link>
      );
    }

    return (
      <>
        <div className="hidden items-center space-x-6 md:flex">
          <Link href="/dashboard">
            <Button variant="ghost" className="text-gray-600 hover:text-black">
              <User className="mr-2 h-4 w-4" />
              대시보드
            </Button>
          </Link>
          <Button
            onClick={handleLogout}
            disabled={isLoggingOut}
            variant="ghost"
            className="text-gray-600 hover:text-black"
          >
            {isLoggingOut ? (
              <>
                <Loader2 className="animate-spin mr-2 h-4 w-4" />
                로그아웃 중...
              </>
            ) : (
              <>
                <LogOut className="mr-2 h-4 w-4" />
                로그아웃
              </>
            )}
          </Button>
        </div>

        <div className="md:hidden">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                className="text-gray-600 hover:text-black"
              >
                <Menu className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem asChild>
                <Link href="/dashboard" className="flex items-center gap-2">
                  <User className="h-4 w-4" />
                  <span>대시보드</span>
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={handleLogout}
                disabled={isLoggingOut}
                className="text-red-600 focus:text-red-600 flex items-center gap-2"
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
                  <div className="w-32 animate-pulse bg-black/20 h-12 rounded-md"></div>
                ) : (
                  <Link href={user ? "/kyc" : "/login"}>
                    <Button
                      variant="outline"
                      size="lg"
                      className="border-black/10 text-black hover:border-black/20 hover:bg-gray-50 w-full bg-white sm:w-auto"
                    >
                      예약하기
                    </Button>
                  </Link>
                )}
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
