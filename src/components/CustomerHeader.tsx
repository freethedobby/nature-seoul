"use client";

import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import NotificationCenter from "@/components/NotificationCenter";
import { Button } from "@/components/ui/button";
import { Home, User, Calendar, LogOut } from "lucide-react";

export default function CustomerHeader() {
  const router = useRouter();
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <header className="shadow-sm border-b bg-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <div className="animate-pulse bg-gray-200 w-32 h-8 rounded"></div>
            <div className="animate-pulse bg-gray-200 h-8 w-8 rounded"></div>
          </div>
        </div>
      </header>
    );
  }

  return (
    <header className="shadow-sm border-b bg-white">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          <div className="flex items-center space-x-2 sm:space-x-4">
            <Button
              variant="ghost"
              onClick={() => router.push("/")}
              className="text-base flex items-center space-x-1 font-semibold sm:space-x-2 sm:text-lg"
            >
              <Home className="h-4 w-4 sm:h-5 sm:w-5" />
              <span className="hidden sm:inline">nature.seoul</span>
              <span className="sm:hidden">nature</span>
            </Button>

            {user && (
              <>
                <div className="w-px bg-gray-300 hidden h-6 sm:block" />

                <nav className="hidden items-center space-x-4 sm:flex">
                  <Button
                    variant="ghost"
                    onClick={() => router.push("/dashboard")}
                    className="flex items-center space-x-2"
                  >
                    <User className="h-4 w-4" />
                    <span>대시보드</span>
                  </Button>

                  <Button
                    variant="ghost"
                    onClick={() => router.push("/user/reserve")}
                    className="flex items-center space-x-2"
                  >
                    <Calendar className="h-4 w-4" />
                    <span>예약하기</span>
                  </Button>
                </nav>
              </>
            )}
          </div>

          <div className="flex items-center space-x-2 sm:space-x-4">
            {user ? (
              <>
                <NotificationCenter variant="customer" />
                <div className="text-gray-600 hidden text-sm sm:block">
                  {user.email}
                </div>
                <Button
                  variant="ghost"
                  onClick={() => router.push("/login")}
                  className="flex items-center space-x-1 sm:space-x-2"
                >
                  <LogOut className="h-4 w-4" />
                  <span className="hidden sm:inline">로그아웃</span>
                </Button>
              </>
            ) : (
              <Button
                onClick={() => router.push("/login")}
                className="bg-black hover:bg-gray-800 sm:text-base text-sm text-white"
              >
                로그인
              </Button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
