"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { signOutUser } from "@/lib/firebase";
import { Calendar, LogOut, Star, Heart, Camera, Sparkles } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import Link from "next/link";

export default function UserPage() {
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
      router.push("/login");
    } catch (error) {
      console.error("Logout failed:", error);
    } finally {
      setIsLoggingOut(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-white">
        <div className="text-center">
          <div className="mx-auto mb-4">
            <h1 className="text-black animate-pulse text-2xl font-light tracking-wide">
              nature.seoul
            </h1>
            <p className="text-gray-400 text-xs tracking-wide">
              premium studio
            </p>
          </div>
          <p className="text-gray-600 text-lg font-light">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="relative min-h-screen bg-white">
      {/* Subtle background */}
      <div className="bg-gradient-to-br from-gray-50/50 absolute inset-0 to-white"></div>

      {/* Sticky Header */}
      <header className="border-gray-200 sticky top-0 z-50 border-b bg-white/80 px-6 py-6 backdrop-blur-sm">
        <div className="container mx-auto flex items-center justify-between">
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

          <div className="flex items-center space-x-4">
            <div className="text-right">
              <p className="text-black text-sm font-medium">
                {user.displayName || user.email}
              </p>
              <p className="text-gray-500 text-xs">프리미엄 고객</p>
            </div>
            <Button
              onClick={handleLogout}
              disabled={isLoggingOut}
              variant="outline"
              className="border-gray-300 text-gray-700 hover:bg-gray-50 border font-light"
            >
              <LogOut className="mr-2 h-4 w-4" />
              {isLoggingOut ? "로그아웃 중..." : "로그아웃"}
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container relative z-10 mx-auto px-6 py-12">
        {/* Welcome Section */}
        <div className="mb-12 text-center">
          <h2 className="text-black mb-4 text-4xl font-thin tracking-wide">
            환영합니다
          </h2>
          <p className="text-gray-600 text-lg font-light">
            당신만을 위한 프리미엄 뷰티 여정이 시작됩니다
          </p>
        </div>

        {/* Quick Actions */}
        <div className="mb-12 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          <Card className="shadow-lg border-gray-200 hover:shadow-xl border bg-white transition-shadow">
            <CardHeader>
              <div className="bg-gray-100 flex h-12 w-12 items-center justify-center rounded-lg">
                <Calendar className="text-gray-600 h-6 w-6" />
              </div>
              <CardTitle className="text-black">예약 관리</CardTitle>
              <CardDescription className="text-gray-600 font-light">
                새로운 예약을 잡거나 기존 예약을 관리하세요
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button className="bg-black hover:bg-gray-800 w-full font-light text-white">
                예약하기
              </Button>
            </CardContent>
          </Card>

          <Card className="shadow-lg border-gray-200 hover:shadow-xl border bg-white transition-shadow">
            <CardHeader>
              <div className="bg-gray-100 flex h-12 w-12 items-center justify-center rounded-lg">
                <Camera className="text-gray-600 h-6 w-6" />
              </div>
              <CardTitle className="text-black">시술 기록</CardTitle>
              <CardDescription className="text-gray-600 font-light">
                나의 뷰티 변화 과정을 확인하세요
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button className="bg-black hover:bg-gray-800 w-full font-light text-white">
                기록 보기
              </Button>
            </CardContent>
          </Card>

          <Card className="shadow-lg border-gray-200 hover:shadow-xl border bg-white transition-shadow">
            <CardHeader>
              <div className="bg-gray-100 flex h-12 w-12 items-center justify-center rounded-lg">
                <Star className="text-gray-600 h-6 w-6" />
              </div>
              <CardTitle className="text-black">프리미엄 혜택</CardTitle>
              <CardDescription className="text-gray-600 font-light">
                특별한 혜택과 이벤트를 확인하세요
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button className="bg-black hover:bg-gray-800 w-full font-light text-white">
                혜택 확인
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Recent Activity */}
        <div className="mb-12">
          <h3 className="text-black mb-6 text-2xl font-light tracking-wide">
            최근 활동
          </h3>
          <div className="space-y-4">
            <Card className="shadow-lg border-gray-200 border bg-white">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="bg-green-100 flex h-10 w-10 items-center justify-center rounded-full">
                      <Calendar className="text-green-600 h-5 w-5" />
                    </div>
                    <div>
                      <p className="text-black font-medium">예약 확정</p>
                      <p className="text-gray-500 text-sm">
                        2024년 1월 15일 오후 2:00
                      </p>
                    </div>
                  </div>
                  <span className="bg-green-100 text-green-700 border-green-200 rounded-full border px-3 py-1 text-xs font-light">
                    확정
                  </span>
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-lg border-gray-200 border bg-white">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="bg-blue-100 flex h-10 w-10 items-center justify-center rounded-full">
                      <Heart className="text-blue-600 h-5 w-5" />
                    </div>
                    <div>
                      <p className="text-black font-medium">상담 완료</p>
                      <p className="text-gray-500 text-sm">
                        맞춤형 디자인 제안서 전달
                      </p>
                    </div>
                  </div>
                  <span className="bg-blue-100 text-blue-700 border-blue-200 rounded-full border px-3 py-1 text-xs font-light">
                    완료
                  </span>
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-lg border-gray-200 border bg-white">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="bg-purple-100 flex h-10 w-10 items-center justify-center rounded-full">
                      <Sparkles className="text-purple-600 h-5 w-5" />
                    </div>
                    <div>
                      <p className="text-black font-medium">특별 혜택 도착</p>
                      <p className="text-gray-500 text-sm">
                        VIP 고객 전용 이벤트 초대
                      </p>
                    </div>
                  </div>
                  <span className="bg-purple-100 text-purple-700 border-purple-200 rounded-full border px-3 py-1 text-xs font-light">
                    신규
                  </span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Premium Experience */}
        <div className="text-center">
          <div className="bg-gray-50 border-gray-200 mx-auto max-w-2xl rounded-xl border p-8">
            <h3 className="text-black mb-4 text-2xl font-light tracking-wide">
              ✨ 당신만의 프리미엄 여정
            </h3>
            <p className="text-gray-600 mb-6 font-light leading-relaxed">
              NATURE PREMIUM에서만 경험할 수 있는
              <br />
              완전히 개인화된 뷰티 아트워크를 만나보세요
            </p>
            <div className="mb-6 grid grid-cols-2 gap-4">
              <div className="text-center">
                <div className="text-black mb-2 text-2xl font-light">100%</div>
                <div className="text-gray-500 text-sm font-light">
                  맞춤 디자인
                </div>
              </div>
              <div className="text-center">
                <div className="text-black mb-2 text-2xl font-light">1:1</div>
                <div className="text-gray-500 text-sm font-light">
                  전담 아티스트
                </div>
              </div>
            </div>
            <div className="flex items-center justify-center space-x-4">
              <Star className="text-gray-600 h-5 w-5" />
              <span className="text-gray-700 text-sm font-light tracking-wide">
                EXCLUSIVE CLIENT
              </span>
              <Star className="text-gray-600 h-5 w-5" />
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
