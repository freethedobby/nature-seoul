"use client";

import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { LogOut, Menu, User, Calendar, ChevronDown } from "lucide-react";
import Link from "next/link";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { signOutUser } from "@/lib/firebase";

export default function UserDashboard() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  useEffect(() => {
    if (!loading && !user) {
      router.push("/login");
    }
  }, [user, loading, router]);

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

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-32 w-32 animate-spin border-gray-900 rounded-full border-b-2"></div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

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

            {/* Desktop view */}
            <div className="hidden items-center space-x-3 md:flex">
              <Button className="bg-gradient-to-r from-black to-black hover:from-neutral-800 hover:to-neutral-900 shadow-sm hover:shadow-md hover:-translate-y-0.5 group relative transform px-4 py-2 text-sm font-medium text-white transition-all duration-300">
                <div className="bg-gradient-to-r absolute inset-0 rounded-md from-transparent via-white/5 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100"></div>
                <div className="relative flex items-center space-x-2">
                  <div className="rounded bg-white/10 p-1 transition-colors duration-300 group-hover:bg-white/20">
                    <Calendar className="h-3.5 w-3.5" />
                  </div>
                  <span>예약하기</span>
                </div>
              </Button>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button className="bg-gradient-to-r from-black to-black hover:from-neutral-800 hover:to-neutral-900 shadow-sm hover:shadow-md hover:-translate-y-0.5 group relative transform px-4 py-2 text-sm font-medium text-white transition-all duration-300">
                    <div className="bg-gradient-to-r absolute inset-0 rounded-md from-transparent via-white/5 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100"></div>
                    <div className="relative flex items-center space-x-2">
                      <div className="rounded bg-white/10 p-1 transition-colors duration-300 group-hover:bg-white/20">
                        <User className="h-3.5 w-3.5" />
                      </div>
                      <span>프로필</span>
                      <ChevronDown className="h-3.5 w-3.5" />
                    </div>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel>내 계정</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem className="flex items-center space-x-2">
                    <User className="h-4 w-4" />
                    <span>{user.email}</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/kyc" className="flex items-center space-x-2">
                      <Calendar className="h-4 w-4" />
                      <span>예약 내역</span>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    className="text-red-600 focus:text-red-600 flex items-center space-x-2"
                    onClick={handleLogout}
                    disabled={isLoggingOut}
                  >
                    {isLoggingOut ? (
                      <>
                        <LogOut className="animate-spin h-4 w-4" />
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

            {/* Mobile view */}
            <div className="md:hidden">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button className="bg-gradient-to-r from-black to-black hover:from-neutral-800 hover:to-neutral-900 shadow-sm hover:shadow-md hover:-translate-y-0.5 group relative transform px-3 py-2 text-sm font-medium text-white transition-all duration-300">
                    <Menu className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel>내 계정</DropdownMenuLabel>
                  <DropdownMenuItem className="flex items-center space-x-2">
                    <User className="h-4 w-4" />
                    <span>{user.email}</span>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link href="/kyc" className="flex items-center space-x-2">
                      <Calendar className="h-4 w-4" />
                      <span>예약하기</span>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/kyc" className="flex items-center space-x-2">
                      <Calendar className="h-4 w-4" />
                      <span>예약 내역</span>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    className="text-red-600 focus:text-red-600 flex items-center space-x-2"
                    onClick={handleLogout}
                    disabled={isLoggingOut}
                  >
                    {isLoggingOut ? (
                      <>
                        <LogOut className="animate-spin h-4 w-4" />
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
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto max-w-6xl px-4 py-8">
        <h2 className="text-2xl font-medium">안녕하세요, {user.email}님</h2>
        <p className="text-gray-600 mt-2">
          예약 및 프로필 관리는 상단 메뉴에서 가능합니다.
        </p>
      </main>
    </div>
  );
}
