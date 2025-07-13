"use client";

import Link from "next/link";
import Image from "next/image";
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
import AdminModeToggle from "@/components/AdminModeToggle";

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
        <div className="flex items-center space-x-4">
          <div className="animate-pulse bg-gray-200 w-24 h-10 rounded-xl"></div>
          <div className="animate-pulse bg-gray-200 w-24 h-10 rounded-xl"></div>
        </div>
      );
    }

    if (user) {
      return (
        <div className="flex items-center space-x-3">
          <AdminModeToggle />
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className="flex items-center gap-2"
              >
                <User className="h-4 w-4" />
                <span className="hidden sm:inline">{user.email}</span>
                <Menu className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              {/* Show email as first item, disabled, for mobile */}
              <DropdownMenuItem
                disabled
                className="cursor-default opacity-100 sm:hidden"
              >
                {user.email}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => router.push("/dashboard")}>
                대시보드
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={handleLogout}
                disabled={isLoggingOut}
                className="text-red-600 focus:text-red-600"
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
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      );
    }

    return (
      <div className="flex items-center space-x-3">
        <Button
          variant="outline"
          onClick={() => router.push("/login")}
          className="hidden sm:flex"
        >
          로그인
        </Button>
        <Button onClick={() => router.push("/login")}>시작하기</Button>
      </div>
    );
  };

  return (
    <div className="bg-gradient-to-br from-gray-50 min-h-screen to-white">
      <header className="border-gray-100 sticky top-0 z-50 border-b bg-white/80 px-4 py-4 backdrop-blur-md">
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

      <main className="relative flex min-h-[90vh] items-start justify-center overflow-hidden md:min-h-screen md:items-center">
        <div className="absolute bottom-16 right-0 z-0 h-2/5 w-3/4 md:right-0 md:top-0 md:bottom-0 md:h-full md:w-2/3">
          <div className="relative h-full w-full">
            <Image
              src="/eyebrow_example.jpg"
              alt="Beautiful Woman Illustration"
              fill
              className="rounded-2xl object-cover object-center"
              priority
            />
            <div className="bg-gradient-to-r absolute inset-0 rounded-2xl from-white/20 to-transparent"></div>
          </div>
        </div>

        <div className="relative z-10 mx-auto w-full max-w-6xl px-4 py-1 md:py-8">
          <div className="grid min-h-[40vh] items-start gap-1 pt-12 md:min-h-[70vh] md:grid-cols-2 md:items-center md:gap-8 md:pt-0">
            <div className="text-black space-y-2 md:space-y-8">
              <div className="space-y-2 md:space-y-6">
                <h2 className="text-4xl font-bold leading-tight tracking-tight drop-shadow-2xl md:text-6xl lg:text-7xl">
                  당신의 눈썹을
                  <br />
                  <span className="font-bold">더 아름답게</span>
                </h2>

                <p className="text-gray-600 text-lg font-medium leading-relaxed drop-shadow-xl md:text-xl">
                  개인 맞춤형 디자인으로 당신만의 완벽한 눈썹을 만들어드립니다.
                </p>
              </div>

              <div className="flex flex-col items-start space-y-3 sm:flex-row sm:items-center sm:space-y-0 sm:space-x-4">
                {loading ? (
                  <div className="w-32 animate-pulse bg-black/20 h-12 rounded-xl"></div>
                ) : (
                  <Link href={user ? "/dashboard" : "/login"}>
                    <Button
                      size="lg"
                      className="bg-black shadow-lg hover:shadow-xl hover:-translate-y-0.5 group relative h-14 w-full transform text-white transition-all duration-300 sm:w-auto"
                    >
                      <div className="bg-gradient-to-r absolute inset-0 rounded-xl from-transparent via-white/10 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100"></div>
                      <div className="relative flex items-center justify-center">
                        <ArrowRight className="mr-2 h-5 w-5 transition-transform duration-300 group-hover:translate-x-1" />
                        <span>예약하기</span>
                      </div>
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
