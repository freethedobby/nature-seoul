"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Calendar, Clock, User } from "lucide-react";
import Link from "next/link";

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

        <div className="mb-12">
          <h1 className="mb-2 text-2xl font-bold">마이페이지</h1>
          <p className="text-gray-600">
            예약 및 상담 내역을 확인하실 수 있습니다.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <div className="bg-gray-50 rounded-lg p-6">
            <div className="mb-4 flex items-center">
              <Calendar className="text-gray-700 mr-2 h-5 w-5" />
              <h3 className="text-lg font-medium">예약 현황</h3>
            </div>
            <div className="space-y-4">
              <p className="text-gray-600">아직 예약 내역이 없습니다.</p>
              <Link href="/kyc">
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
  );
}
