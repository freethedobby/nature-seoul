"use client";

import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import NotificationCenter from "@/components/NotificationCenter";
import AdminModeToggle from "@/components/AdminModeToggle";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Home, User, Calendar, LogOut, Menu } from "lucide-react";

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
      <div className="mx-auto max-w-7xl px-3 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          <div className="flex items-center space-x-1 sm:space-x-4">
            <Button
              variant="ghost"
              onClick={() => router.push("/")}
              className="flex items-center space-x-1 text-sm font-semibold sm:space-x-2 sm:text-lg"
            >
              <Home className="h-4 w-4 sm:h-5 sm:w-5" />
              <span>nature.seoul</span>
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

                  {user.kycStatus === "approved" && (
                    <Button
                      variant="ghost"
                      onClick={() => router.push("/user/reserve")}
                      className="flex items-center space-x-2"
                    >
                      <Calendar className="h-4 w-4" />
                      <span>예약하기</span>
                    </Button>
                  )}
                </nav>
              </>
            )}
          </div>

          <div className="flex items-center space-x-1 sm:space-x-4">
            {user ? (
              <>
                <NotificationCenter variant="customer" />

                {/* Desktop: Show all buttons */}
                <div className="hidden items-center space-x-4 sm:flex">
                  <AdminModeToggle />
                  <div className="text-gray-600 text-sm">{user.email}</div>
                  <Button
                    variant="ghost"
                    onClick={() => router.push("/login")}
                    className="flex items-center space-x-2"
                  >
                    <LogOut className="h-4 w-4" />
                    <span>로그아웃</span>
                  </Button>
                </div>

                {/* Mobile: Dropdown menu */}
                <div className="sm:hidden">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm">
                        <Menu className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-48">
                      <DropdownMenuItem
                        disabled
                        className="cursor-default opacity-100"
                      >
                        {user.email}
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => router.push("/dashboard")}
                      >
                        <User className="mr-2 h-4 w-4" />
                        대시보드
                      </DropdownMenuItem>
                      {user.kycStatus === "approved" && (
                        <DropdownMenuItem
                          onClick={() => router.push("/user/reserve")}
                        >
                          <Calendar className="mr-2 h-4 w-4" />
                          예약하기
                        </DropdownMenuItem>
                      )}
                      <DropdownMenuItem onClick={() => router.push("/login")}>
                        <LogOut className="mr-2 h-4 w-4" />
                        로그아웃
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
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
