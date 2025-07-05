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

  useEffect(() => {
    if (!loading && !user) {
      router.push("/login");
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-white">
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
    <div className="min-h-screen bg-white">
      <div className="container mx-auto max-w-6xl px-4 py-8">
        <div className="mb-8 flex items-center justify-between">
          <Link
            href="/"
            className="text-gray-500 hover:text-gray-900 inline-flex items-center text-sm"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            홈으로 돌아가기
          </Link>
          <div className="text-right">
            <h2 className="text-gray-900 text-sm font-medium">{user.email}</h2>
            <p className="text-gray-500 text-sm">회원</p>
          </div>
        </div>

        <div className="mb-6">
          <h1 className="mb-2 text-2xl font-bold">대시보드</h1>
          <p className="text-gray-600 mb-4">
            예약 및 상담 내역을 확인하실 수 있습니다.
          </p>
          <MembershipBadge
            kycStatus={user.kycStatus || "none"}
            treatmentDone={user.treatmentDone || false}
          />
        </div>

        <div className="relative">
          {isLocked && (
            <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-white/60 backdrop-blur-[2px]">
              <div className="shadow-lg rounded-lg bg-white/80 p-6 text-center">
                <Lock className="text-gray-400 mx-auto mb-4 h-12 w-12" />
                <h3 className="text-gray-900 mb-2 text-lg font-medium">
                  인증이 필요한 기능입니다
                </h3>
                <p className="text-gray-600 mb-4 text-sm">
                  예약 및 상담을 위해 인증을 완료해 주세요
                </p>
                <Link href="/kyc">
                  <Button className="bg-black hover:bg-neutral-800 text-white">
                    인증하기
                  </Button>
                </Link>
              </div>
            </div>
          )}

          <div
            className={`grid gap-6 md:grid-cols-2 ${
              isLocked ? "pointer-events-none" : ""
            }`}
          >
            <div className="bg-gray-50 rounded-lg p-6">
              <div className="mb-4 flex items-center">
                <Calendar className="text-gray-700 mr-2 h-5 w-5" />
                <h3 className="text-lg font-medium">예약 현황</h3>
              </div>
              <div className="space-y-4">
                <p className="text-gray-600">아직 예약 내역이 없습니다.</p>
                <Link href="/reservation">
                  <Button className="bg-black hover:bg-neutral-800 w-full text-white">
                    예약하기
                  </Button>
                </Link>
              </div>
            </div>

            <div className="bg-gray-50 rounded-lg p-6">
              <div className="mb-4 flex items-center">
                <Clock className="text-gray-700 mr-2 h-5 w-5" />
                <h3 className="text-lg font-medium">상담 내역</h3>
              </div>
              <div className="space-y-4">
                <p className="text-gray-600">아직 상담 내역이 없습니다.</p>
                <Link href="/kyc">
                  <Button className="bg-black hover:bg-neutral-800 w-full text-white">
                    상담 신청
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
