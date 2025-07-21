"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  ArrowLeft,
  Calendar,
  Clock,
  Lock,
  Menu,
  X,
  LogOut,
  AlertTriangle,
  Check,
} from "lucide-react";
import Link from "next/link";
import { MembershipBadge } from "@/components/MembershipBadge";
import Logo from "@/components/Logo";
import NotificationCenter from "@/components/NotificationCenter";
import TestNotificationButton from "@/components/TestNotificationButton";
import NoticeModal from "@/components/NoticeModal";
import { auth } from "@/lib/firebase";
import { signOut as firebaseSignOut } from "firebase/auth";
import {
  doc,
  updateDoc,
  collection,
  query,
  where,
  onSnapshot,
} from "firebase/firestore";
import { db } from "@/lib/firebase";

export default function DashboardPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [showNoticeModal, setShowNoticeModal] = useState(false);
  const [reservation, setReservation] = useState<{
    id: string;
    date?: string;
    time?: string;
    status?: string;
    createdAt: Date;
  } | null>(null);

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

  // Fetch user's reservation
  useEffect(() => {
    if (!user?.uid) return;

    const q = query(
      collection(db, "reservations"),
      where("userId", "==", user.uid)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      if (snapshot.empty) {
        setReservation(null);
      } else {
        const docData = snapshot.docs[0];
        const data = docData.data();
        setReservation({
          id: docData.id,
          date: data.date,
          time: data.time,
          status: data.status,
          createdAt: data.createdAt?.toDate?.() || new Date(),
        });
      }
    });

    return () => unsubscribe();
  }, [user?.uid]);

  const handleLogout = async () => {
    try {
      await firebaseSignOut(auth);
      router.push("/");
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  const handleNoticeConfirm = async () => {
    if (!user?.uid) return;

    try {
      await updateDoc(doc(db, "users", user.uid), {
        noticeConfirmed: true,
        noticeConfirmedAt: new Date(),
      });
      setShowNoticeModal(false);
      // 페이지 새로고침으로 상태 업데이트
      window.location.reload();
    } catch (error) {
      console.error("Error updating notice confirmation:", error);
    }
  };

  const handleReservationClick = () => {
    if (user?.kycStatus === "approved" && !user?.noticeConfirmed) {
      setShowNoticeModal(true);
    } else {
      router.push("/user/reserve");
    }
  };

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
              <Logo variant="header" />
            </div>

            {/* Desktop User Info */}
            <div className="hidden items-center space-x-4 md:flex">
              <NotificationCenter variant="customer" />

              <div className="shadow-sm border-gray-200 flex items-center gap-2 rounded-lg border bg-white px-3 py-2">
                <div className="bg-gradient-to-br from-blue-400 to-purple-500 flex h-8 w-8 items-center justify-center rounded-full">
                  <span className="text-sm font-medium text-white">
                    {user?.email?.charAt(0).toUpperCase() || "U"}
                  </span>
                </div>
                <div className="flex flex-col">
                  <span className="text-gray-900 text-sm font-medium">
                    {user?.email}
                  </span>
                  <span className="text-gray-500 text-xs">
                    {user?.kycStatus === "approved"
                      ? "승인된 사용자"
                      : user?.kycStatus === "pending"
                      ? "확인중"
                      : user?.kycStatus === "rejected"
                      ? "거절됨"
                      : "미신청"}
                  </span>
                </div>
              </div>

              <Button
                variant="outline"
                onClick={handleLogout}
                className="hover:bg-red-50 border-red-200 text-red-600 hover:text-red-700 flex items-center gap-2"
              >
                <LogOut className="h-4 w-4" />
                <span>로그아웃</span>
              </Button>
            </div>

            {/* Mobile Menu Button */}
            <div className="flex items-center space-x-2 md:hidden">
              <NotificationCenter variant="customer" />

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
          </div>

          {/* Mobile Menu */}
          {isMenuOpen && (
            <div className="border-t bg-white py-4 md:hidden">
              {/* User Profile Section */}
              <div className="mb-4 px-2">
                <div className="bg-gray-50 flex items-center space-x-3 rounded-lg p-3">
                  <div className="bg-gradient-to-br from-blue-400 to-purple-500 flex h-10 w-10 items-center justify-center rounded-full">
                    <span className="text-sm font-medium text-white">
                      {user?.email?.charAt(0).toUpperCase() || "U"}
                    </span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-gray-900 text-sm font-medium">
                      {user?.email}
                    </span>
                    <span className="text-gray-500 text-xs">
                      {user?.kycStatus === "approved"
                        ? "승인된 사용자"
                        : user?.kycStatus === "pending"
                        ? "검토 중"
                        : user?.kycStatus === "rejected"
                        ? "거절됨"
                        : "미신청"}
                    </span>
                  </div>
                </div>
              </div>

              <nav className="flex flex-col space-y-2">
                <Button
                  variant="ghost"
                  onClick={handleLogout}
                  className="text-red-600 hover:text-red-700 hover:bg-red-50 flex items-center justify-start space-x-2"
                >
                  <LogOut className="h-4 w-4" />
                  <span>로그아웃</span>
                </Button>
              </nav>
            </div>
          )}
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
                {user.kycStatus === "rejected" && user.rejectReason && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">반려 사유</span>
                    <span className="text-red-600 font-medium">
                      {user.rejectReason}
                    </span>
                  </div>
                )}
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
                      ? "확인중"
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
                    : user.kycStatus === "approved" && !user.noticeConfirmed
                    ? "공지사항 확인 후 예약이 가능합니다."
                    : reservation
                    ? "예약이 진행 중입니다."
                    : "상담 승인 후 예약이 가능합니다."}
                </p>

                {user.kycStatus === "approved" && !user.noticeConfirmed && (
                  <div className="bg-orange-50 border-orange-200 mb-4 rounded-lg border p-3">
                    <div className="flex items-start space-x-2">
                      <AlertTriangle className="text-orange-600 mt-0.5 h-5 w-5 flex-shrink-0" />
                      <div>
                        <p className="text-orange-800 text-sm font-medium">
                          공지사항 확인 필수
                        </p>
                        <p className="text-orange-700 mt-1 text-xs">
                          예약하기 전에 반드시 공지사항을 확인해주세요.
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {user.kycStatus === "approved" && user.noticeConfirmed && (
                  <div className="bg-green-50 border-green-200 mb-4 rounded-lg border p-3">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start space-x-2">
                        <Check className="text-green-600 mt-0.5 h-5 w-5 flex-shrink-0" />
                        <div>
                          <p className="text-green-800 text-sm font-medium">
                            공지사항 확인 완료
                          </p>
                          <p className="text-green-700 mt-1 text-xs">
                            예약이 가능합니다.
                          </p>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setShowNoticeModal(true)}
                        className="text-green-600 hover:text-green-700 text-xs"
                      >
                        다시 보기
                      </Button>
                    </div>
                  </div>
                )}

                {reservation ? (
                  <div className="space-y-3">
                    <div className="bg-blue-50 border-blue-200 rounded-lg border p-3">
                      <div className="mb-2 flex items-center justify-between">
                        <span className="text-blue-800 text-sm font-medium">
                          예약 정보
                        </span>
                        <Badge
                          variant={
                            reservation.status === "approved"
                              ? "default"
                              : reservation.status === "payment_confirmed"
                              ? "secondary"
                              : "outline"
                          }
                        >
                          {reservation.status === "approved"
                            ? "확정"
                            : reservation.status === "payment_confirmed"
                            ? "입금확인"
                            : reservation.status === "payment_required"
                            ? "입금대기"
                            : reservation.status === "rejected"
                            ? "거절"
                            : "대기"}
                        </Badge>
                      </div>
                      <div className="text-blue-700 text-sm">
                        <div>
                          {reservation.date} {reservation.time}
                        </div>
                        {reservation.status === "payment_required" && (
                          <div className="text-orange-600 mt-1 text-xs">
                            💰 예약금 30만원 입금 필요
                          </div>
                        )}
                        {reservation.status === "payment_confirmed" && (
                          <div className="text-blue-600 mt-1 text-xs">
                            ⏳ 관리자 확인 대기 중
                          </div>
                        )}
                        {reservation.status === "rejected" && (
                          <div className="text-red-600 mt-1 text-xs">
                            ❌ 예약이 거절되었습니다
                          </div>
                        )}
                      </div>
                    </div>
                    <Button
                      variant="outline"
                      className="w-full"
                      onClick={() => router.push("/user/reserve")}
                    >
                      예약 상세보기
                    </Button>
                  </div>
                ) : (
                  <Button
                    variant="outline"
                    className="w-full"
                    disabled={isLocked || user.kycStatus !== "approved"}
                    onClick={handleReservationClick}
                  >
                    {isLocked
                      ? "상담 신청 필요"
                      : user.kycStatus === "approved" && !user.noticeConfirmed
                      ? "공지사항 확인하기"
                      : user.kycStatus === "approved"
                      ? "예약하기"
                      : "승인 대기 중"}
                  </Button>
                )}
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

            {/* Test Notification Button (Development Only) */}
            <TestNotificationButton />
          </div>
        </div>
      </main>

      {/* Notice Modal */}
      <NoticeModal
        isOpen={showNoticeModal}
        onClose={() => setShowNoticeModal(false)}
        onConfirm={handleNoticeConfirm}
        showViewAgain={user?.noticeConfirmed || false}
      />
    </div>
  );
}
