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
import {
  Users,
  Calendar,
  TrendingUp,
  LogOut,
  Settings,
  BarChart3,
  Star,
  Heart,
  Loader2,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import Link from "next/link";

export default function AdminPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  useEffect(() => {
    if (!loading && (!user || user.email !== "admin@naturesemi.com")) {
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

  if (!user || user.email !== "admin@naturesemi.com") {
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
                {user.displayName || "Admin"}
              </p>
              <p className="text-gray-500 text-xs">관리자</p>
            </div>
            <Button
              onClick={handleLogout}
              disabled={isLoggingOut}
              className="bg-gradient-to-r from-gray-50 to-gray-50 hover:from-gray-100 hover:via-gray-50 hover:to-gray-100 text-gray-700 hover:text-gray-900 border-gray-200 hover:border-gray-300 shadow-sm hover:shadow-md hover:-translate-y-0.5 group relative transform border via-white font-light transition-all duration-300 disabled:opacity-50"
            >
              <div className="bg-gradient-to-r via-gray-900/5 absolute inset-0 from-transparent to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100"></div>
              <div className="relative flex items-center">
                {isLoggingOut ? (
                  <>
                    <Loader2 className="animate-spin mr-2 h-4 w-4" />
                    <span>로그아웃 중...</span>
                  </>
                ) : (
                  <>
                    <div className="bg-gray-100 group-hover:bg-gray-200 mr-2 rounded p-1 transition-colors duration-300">
                      <LogOut className="h-3.5 w-3.5" />
                    </div>
                    <span>로그아웃</span>
                  </>
                )}
              </div>
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container relative z-10 mx-auto px-6 py-12">
        {/* Welcome Section */}
        <div className="mb-12 text-center">
          <h2 className="text-black mb-4 text-4xl font-thin tracking-wide">
            관리자 대시보드
          </h2>
          <p className="text-gray-600 text-lg font-light">
            NATURE PREMIUM의 모든 운영을 관리하세요
          </p>
        </div>

        {/* Stats Grid */}
        <div className="mb-12 grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          <Card className="shadow-lg border-gray-200 border bg-white">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-gray-700 text-sm font-light">
                총 예약
              </CardTitle>
              <Calendar className="text-gray-600 h-4 w-4" />
            </CardHeader>
            <CardContent>
              <div className="text-black text-2xl font-light">1,234</div>
              <p className="text-gray-500 text-xs">+20.1% from last month</p>
            </CardContent>
          </Card>

          <Card className="shadow-lg border-gray-200 border bg-white">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-gray-700 text-sm font-light">
                활성 고객
              </CardTitle>
              <Users className="text-gray-600 h-4 w-4" />
            </CardHeader>
            <CardContent>
              <div className="text-black text-2xl font-light">573</div>
              <p className="text-gray-500 text-xs">+15.3% from last month</p>
            </CardContent>
          </Card>

          <Card className="shadow-lg border-gray-200 border bg-white">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-gray-700 text-sm font-light">
                월 매출
              </CardTitle>
              <TrendingUp className="text-gray-600 h-4 w-4" />
            </CardHeader>
            <CardContent>
              <div className="text-black text-2xl font-light">₩12.4M</div>
              <p className="text-gray-500 text-xs">+25.7% from last month</p>
            </CardContent>
          </Card>

          <Card className="shadow-lg border-gray-200 border bg-white">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-gray-700 text-sm font-light">
                만족도
              </CardTitle>
              <BarChart3 className="text-gray-600 h-4 w-4" />
            </CardHeader>
            <CardContent>
              <div className="text-black text-2xl font-light">98.2%</div>
              <p className="text-gray-500 text-xs">+2.1% from last month</p>
            </CardContent>
          </Card>
        </div>

        {/* Management Cards */}
        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
          <Card className="shadow-lg border-gray-200 hover:shadow-xl border bg-white transition-shadow">
            <CardHeader>
              <div className="bg-gray-100 flex h-12 w-12 items-center justify-center rounded-lg">
                <Calendar className="text-gray-600 h-6 w-6" />
              </div>
              <CardTitle className="text-black">예약 관리</CardTitle>
              <CardDescription className="text-gray-600 font-light">
                고객 예약을 관리하고 스케줄을 조정하세요
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button className="bg-gradient-to-r from-gray-900 via-black to-gray-900 hover:from-gray-800 hover:via-gray-900 hover:to-gray-800 shadow-lg hover:shadow-xl hover:-translate-y-0.5 group relative h-12 w-full transform rounded-lg font-medium text-white transition-all duration-300">
                <div className="bg-gradient-to-r absolute inset-0 from-transparent via-white/10 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100"></div>
                <span className="relative">예약 관리하기</span>
              </Button>
            </CardContent>
          </Card>

          <Card className="shadow-lg border-gray-200 hover:shadow-xl border bg-white transition-shadow">
            <CardHeader>
              <div className="bg-gray-100 flex h-12 w-12 items-center justify-center rounded-lg">
                <Users className="text-gray-600 h-6 w-6" />
              </div>
              <CardTitle className="text-black">고객 관리</CardTitle>
              <CardDescription className="text-gray-600 font-light">
                고객 정보와 히스토리를 관리하세요
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button className="bg-gradient-to-r from-gray-900 via-black to-gray-900 hover:from-gray-800 hover:via-gray-900 hover:to-gray-800 shadow-lg hover:shadow-xl hover:-translate-y-0.5 group relative h-12 w-full transform rounded-lg font-medium text-white transition-all duration-300">
                <div className="bg-gradient-to-r absolute inset-0 from-transparent via-white/10 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100"></div>
                <span className="relative">고객 관리하기</span>
              </Button>
            </CardContent>
          </Card>

          <Card className="shadow-lg border-gray-200 hover:shadow-xl border bg-white transition-shadow">
            <CardHeader>
              <div className="bg-gray-100 flex h-12 w-12 items-center justify-center rounded-lg">
                <Settings className="text-gray-600 h-6 w-6" />
              </div>
              <CardTitle className="text-black">시스템 설정</CardTitle>
              <CardDescription className="text-gray-600 font-light">
                시스템 환경설정과 권한을 관리하세요
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button className="bg-gradient-to-r from-gray-900 via-black to-gray-900 hover:from-gray-800 hover:via-gray-900 hover:to-gray-800 shadow-lg hover:shadow-xl hover:-translate-y-0.5 group relative h-12 w-full transform rounded-lg font-medium text-white transition-all duration-300">
                <div className="bg-gradient-to-r absolute inset-0 from-transparent via-white/10 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100"></div>
                <span className="relative">설정 관리하기</span>
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Recent Activity */}
        <div className="mt-16">
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
                      <p className="text-black font-medium">새 예약 접수</p>
                      <p className="text-gray-500 text-sm">
                        김지현님 - 2024년 1월 15일 오후 2:00
                      </p>
                    </div>
                  </div>
                  <span className="bg-green-100 text-green-700 border-green-200 rounded-full border px-3 py-1 text-xs font-light">
                    신규
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
                      <p className="text-black font-medium">고객 리뷰 등록</p>
                      <p className="text-gray-500 text-sm">
                        박소영님 - &quot;정말 만족스러운 결과입니다&quot;
                      </p>
                    </div>
                  </div>
                  <span className="bg-blue-100 text-blue-700 border-blue-200 rounded-full border px-3 py-1 text-xs font-light">
                    리뷰
                  </span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Summary Section */}
        <div className="mt-16 text-center">
          <div className="bg-gray-50 border-gray-200 mx-auto max-w-2xl rounded-xl border p-8">
            <h3 className="text-black mb-4 text-2xl font-light tracking-wide">
              ✨ 프리미엄 관리 시스템
            </h3>
            <p className="text-gray-600 mb-6 font-light leading-relaxed">
              NATURE PREMIUM의 모든 서비스를 체계적으로 관리하여
              <br />
              최고 수준의 고객 경험을 제공합니다.
            </p>
            <div className="flex items-center justify-center space-x-4">
              <Star className="text-gray-600 h-5 w-5" />
              <span className="text-gray-700 text-sm font-light tracking-wide">
                EXCLUSIVE ADMIN ACCESS
              </span>
              <Star className="text-gray-600 h-5 w-5" />
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
