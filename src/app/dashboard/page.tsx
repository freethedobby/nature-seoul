"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Calendar, Clock, Lock } from "lucide-react";
import Link from "next/link";
import { MembershipBadge } from "@/components/MembershipBadge";

export default function DashboardPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  console.log("user object in DashboardPage:", user);

  console.log(
    "DashboardPage render - user:",
    user?.email,
    "loading:",
    loading,
    "pathname:",
    typeof window !== "undefined" ? window.location.pathname : "Unknown"
  );

  useEffect(() => {
    if (!loading && !user) {
      router.push("/login");
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className="bg-gradient-to-br from-gray-50 flex min-h-screen items-center justify-center to-white">
        <div className="animate-spin border-black h-8 w-8 rounded-full border-b-2"></div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  const isLocked =
    !user.kycStatus ||
    user.kycStatus === "none" ||
    user.kycStatus === "rejected";

  return (
    <div className="bg-gradient-to-br from-gray-50 min-h-screen to-white">
      {/* Header */}
      <header className="border-gray-100 sticky top-0 z-50 border-b bg-white/80 backdrop-blur-md">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <div className="flex items-center">
              <button
                onClick={() => router.push("/")}
                className="hover:bg-gray-100 mr-4 rounded-full p-2 transition-colors"
              >
                <ArrowLeft className="h-6 w-6" />
              </button>
              <h1 className="text-xl font-light">nature.seoul</h1>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl">
          <div className="mb-8 text-center">
            <h2 className="text-gray-900 mb-2 text-2xl font-light">내 정보</h2>
            <p className="text-gray-600">
              예약 현황과 상담 신청 상태를 확인하세요.
            </p>
          </div>

          <div className="space-y-6">
            {/* User Info Card */}
            <div className="border-gray-100 shadow-sm hover:shadow-md rounded-2xl border bg-white p-6 transition-all duration-300">
              <div className="mb-4 flex items-center justify-between">
                <h3 className="text-lg font-semibold">기본 정보</h3>
                <MembershipBadge
                  kycStatus={user.kycStatus || "none"}
                  treatmentDone={user.treatmentDone || false}
                />
              </div>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600">이메일</span>
                  <span className="font-medium">{user.email}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">상태</span>
                  <span className="font-medium">
                    {user.kycStatus === "approved"
                      ? "승인됨"
                      : user.kycStatus === "pending"
                      ? "검토 중"
                      : user.kycStatus === "rejected"
                      ? "거절됨"
                      : "미신청"}
                  </span>
                </div>
              </div>
            </div>

            {/* Action Cards */}
            <div className="grid gap-6 md:grid-cols-2">
              {/* KYC Status Card */}
              <div className="border-gray-100 shadow-sm hover:shadow-md rounded-2xl border bg-white p-6 transition-all duration-300">
                <div className="mb-4 flex items-center">
                  <div className="bg-blue-100 mr-3 rounded-lg p-2">
                    <Calendar className="text-blue-600 h-5 w-5" />
                  </div>
                  <h3 className="text-lg font-semibold">상담 신청</h3>
                </div>
                <p className="text-gray-600 mb-4 text-sm">
                  {isLocked
                    ? "상담 신청을 완료하면 예약이 가능합니다."
                    : "상담 신청이 완료되었습니다."}
                </p>
                <Link href={isLocked ? "/kyc" : "#"}>
                  <Button
                    variant={isLocked ? "default" : "outline"}
                    className="w-full"
                    disabled={
                      user.kycStatus === "pending" ||
                      user.kycStatus === "approved"
                    }
                  >
                    {user.kycStatus === "pending"
                      ? "리뷰중"
                      : isLocked
                      ? "상담 신청하기"
                      : "신청 완료"}
                  </Button>
                </Link>
              </div>

              {/* Reservation Card */}
              <div className="border-gray-100 shadow-sm hover:shadow-md rounded-2xl border bg-white p-6 transition-all duration-300">
                <div className="mb-4 flex items-center">
                  <div className="bg-green-100 mr-3 rounded-lg p-2">
                    <Clock className="text-green-600 h-5 w-5" />
                  </div>
                  <h3 className="text-lg font-semibold">예약</h3>
                </div>
                <p className="text-gray-600 mb-4 text-sm">
                  {isLocked
                    ? "상담 신청 후 예약이 가능합니다."
                    : "상담 승인 후 예약이 가능합니다."}
                </p>
                <Button
                  variant="outline"
                  className="w-full"
                  disabled={isLocked || user.kycStatus !== "approved"}
                >
                  {isLocked
                    ? "상담 신청 필요"
                    : user.kycStatus === "approved"
                    ? "예약하기"
                    : "승인 대기 중"}
                </Button>
              </div>
            </div>

            {/* Treatment Status */}
            {user.treatmentDone && (
              <div className="border-gray-100 shadow-sm hover:shadow-md rounded-2xl border bg-white p-6 transition-all duration-300">
                <div className="mb-4 flex items-center">
                  <div className="bg-purple-100 mr-3 rounded-lg p-2">
                    <Lock className="text-purple-600 h-5 w-5" />
                  </div>
                  <h3 className="text-lg font-semibold">시술 완료</h3>
                </div>
                <p className="text-gray-600 text-sm">
                  시술이 완료되었습니다. 감사합니다!
                </p>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
