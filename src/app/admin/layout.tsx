"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import NotificationCenter from "@/components/NotificationCenter";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Users, Calendar, Menu, X, LogOut } from "lucide-react";
import { auth } from "@/lib/firebase";
import { signOut as firebaseSignOut } from "firebase/auth";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const { user } = useAuth();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  useEffect(() => {
    // Let the page component handle admin authorization
    // This layout just provides the container
  }, [user, router]);

  const handleLogout = async () => {
    try {
      await firebaseSignOut(auth);
      router.push("/");
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  if (!user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-white">
        <div className="text-center">
          <div className="animate-spin border-black mb-4 h-8 w-8 rounded-full border-b-2"></div>
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-100 min-h-screen">
      {/* Admin Header */}
      <header className="shadow-sm border-b bg-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            {/* Desktop Navigation */}
            <div className="hidden items-center space-x-4 md:flex">
              <Button
                variant="ghost"
                onClick={() => router.push("/dashboard")}
                className="flex items-center space-x-2"
              >
                <ArrowLeft className="h-4 w-4" />
                <span>사용자 페이지</span>
              </Button>

              <div className="w-px bg-gray-300 h-6" />

              <nav className="flex items-center space-x-4">
                <Button
                  variant="ghost"
                  onClick={() => router.push("/admin/kyc")}
                  className="flex items-center space-x-2"
                >
                  <Users className="h-4 w-4" />
                  <span>고객관리</span>
                </Button>

                <Button
                  variant="ghost"
                  onClick={() => router.push("/admin/slots")}
                  className="flex items-center space-x-2"
                >
                  <Calendar className="h-4 w-4" />
                  <span>예약관리</span>
                </Button>
              </nav>
            </div>

            {/* Mobile Navigation */}
            <div className="flex items-center space-x-2 md:hidden">
              <Button
                variant="ghost"
                onClick={() => router.push("/dashboard")}
                className="flex items-center space-x-1"
              >
                <ArrowLeft className="h-4 w-4" />
                <span className="text-sm">사용자</span>
              </Button>

              <Button
                variant="ghost"
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="flex items-center space-x-1"
              >
                {isMenuOpen ? (
                  <X className="h-4 w-4" />
                ) : (
                  <Menu className="h-4 w-4" />
                )}
                <span className="text-sm">메뉴</span>
              </Button>
            </div>

            <div className="flex items-center space-x-4">
              <NotificationCenter variant="admin" />
              <div className="text-gray-600 hidden text-sm sm:block">
                {user.email}
              </div>
            </div>
          </div>

          {/* Mobile Menu */}
          {isMenuOpen && (
            <div className="border-t bg-white py-4 md:hidden">
              <nav className="flex flex-col space-y-2">
                <Button
                  variant="ghost"
                  onClick={() => {
                    router.push("/admin/kyc");
                    setIsMenuOpen(false);
                  }}
                  className="flex items-center justify-start space-x-2"
                >
                  <Users className="h-4 w-4" />
                  <span>고객관리</span>
                </Button>

                <Button
                  variant="ghost"
                  onClick={() => {
                    router.push("/admin/slots");
                    setIsMenuOpen(false);
                  }}
                  className="flex items-center justify-start space-x-2"
                >
                  <Calendar className="h-4 w-4" />
                  <span>예약ㅇ관리</span>
                </Button>

                <div className="mt-2 border-t pt-2">
                  <Button
                    variant="ghost"
                    onClick={handleLogout}
                    className="text-red-600 hover:text-red-700 hover:bg-red-50 flex items-center justify-start space-x-2"
                  >
                    <LogOut className="h-4 w-4" />
                    <span>로그아웃</span>
                  </Button>
                </div>
              </nav>
            </div>
          )}
        </div>
      </header>

      {/* Main Content */}
      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        {children}
      </main>
    </div>
  );
}
