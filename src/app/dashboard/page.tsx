"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  ArrowLeft,
  Clock,
  Lock,
  Menu,
  X,
  LogOut,
  AlertTriangle,
  Check,
  Eye,
  User,
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
  getDoc,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import CountdownTimer from "@/components/CountdownTimer";
import { createNotification } from "@/lib/notifications";
import {
  provinces,
  districts as districtData,
  dongs as dongData,
} from "@/lib/address-data";

// KYC 데이터 타입 정의
interface KYCData {
  name: string;
  gender: string;
  birthYear: string;
  contact: string;
  province: string;
  district: string;
  dong: string;
  detailedAddress?: string;
  skinType: string;
  skinTypeOther?: string;
  hasPreviousTreatment: string;
  designDescription?: string; // 원하는 눈썹 디자인
  additionalNotes?: string; // 기타 사항
  marketingConsent?: boolean; // 마케팅 동의
  eyebrowPhotoLeft?: string;
  eyebrowPhotoFront?: string;
  eyebrowPhotoRight?: string;
  status: string;
  submittedAt?: {
    toDate?: () => Date;
  };
}

// 주소 변환 함수들 (강화된 버전)
const getAddressLabel = (
  type: "province" | "district" | "dong",
  value: string,
  parentValue?: string
): string => {
  if (!value) return "";

  try {
    switch (type) {
      case "province":
        const province = provinces.find((p) => p.value === value);
        return province?.label || value;

      case "district":
        // 새로운 주소 데이터에서 먼저 찾기
        if (parentValue) {
          const districtList = districtData[parentValue];
          if (districtList) {
            const district = districtList.find((d) => d.value === value);
            if (district) return district.label;
          }
        }

        // 일반적인 변환 시도
        if (value.includes("seongdong")) return "성동구";
        if (value.includes("gangnam")) return "강남구";
        if (value.includes("seoul")) return "서울특별시";

        return value;

      case "dong":
        if (parentValue) {
          const dongList = dongData[parentValue];
          if (dongList) {
            const dong = dongList.find((d) => d.value === value);
            if (dong) return dong.label;
          }
        }

        // 일반적인 동 변환 시도
        if (value.includes("seongsu")) return "성수동";
        if (value.includes("hangang")) return "한강로동";

        return value;

      default:
        return value;
    }
  } catch (error) {
    console.error("Address conversion error:", error);
    return value;
  }
};

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
    paymentDeadline?: Date;
  } | null>(null);

  const [kycData, setKycData] = useState<KYCData | null>(null);
  const [showKycData, setShowKycData] = useState(false);
  const [kycOpenSettings, setKycOpenSettings] = useState({
    startDate: "",
    startTime: "",
    endDate: "",
    endTime: "",
  });
  const [isKycOpen, setIsKycOpen] = useState(false);
  const [timeUntilOpen, setTimeUntilOpen] = useState<number | null>(null);
  const [timeUntilClose, setTimeUntilClose] = useState<number | null>(null);

  // 시간 포맷팅 함수
  const formatTime = (milliseconds: number) => {
    const totalSeconds = Math.floor(milliseconds / 1000);
    const days = Math.floor(totalSeconds / (24 * 3600));
    const hours = Math.floor((totalSeconds % (24 * 3600)) / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    if (days > 0) {
      return `${days}일 ${hours}시간 ${minutes}분 ${seconds}초`;
    } else if (hours > 0) {
      return `${hours}시간 ${minutes}분 ${seconds}초`;
    } else if (minutes > 0) {
      return `${minutes}분 ${seconds}초`;
    } else {
      return `${seconds}초`;
    }
  };

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

  // KYC 오픈 기간 로드 및 타이머 관리
  useEffect(() => {
    const loadKycOpenSettings = async () => {
      try {
        const settingsDoc = await getDoc(doc(db, "settings", "kycOpen"));
        if (settingsDoc.exists()) {
          const settings = settingsDoc.data();
          const newSettings = {
            startDate: settings.startDate || "",
            startTime: settings.startTime || "",
            endDate: settings.endDate || "",
            endTime: settings.endTime || "",
          };
          setKycOpenSettings(newSettings);
        }
      } catch (error) {
        console.error("Error loading KYC open settings:", error);
      }
    };

    loadKycOpenSettings();
  }, []);

  // KYC 오픈 상태 체크 및 타이머 업데이트
  useEffect(() => {
    if (!kycOpenSettings.startDate || !kycOpenSettings.endDate) return;

    const checkKycOpenStatus = () => {
      const now = new Date();
      const startDateTime = new Date(
        `${kycOpenSettings.startDate}T${kycOpenSettings.startTime}`
      );
      const endDateTime = new Date(
        `${kycOpenSettings.endDate}T${kycOpenSettings.endTime}`
      );

      const currentTime = now.getTime();
      const startTime = startDateTime.getTime();
      const endTime = endDateTime.getTime();

      if (currentTime < startTime) {
        // 아직 시작 전
        setIsKycOpen(false);
        setTimeUntilOpen(startTime - currentTime);
        setTimeUntilClose(null);
      } else if (currentTime >= startTime && currentTime <= endTime) {
        // 오픈 중
        setIsKycOpen(true);
        setTimeUntilOpen(null);
        setTimeUntilClose(endTime - currentTime);
      } else {
        // 마감됨
        setIsKycOpen(false);
        setTimeUntilOpen(null);
        setTimeUntilClose(null);
      }
    };

    checkKycOpenStatus();
    const interval = setInterval(checkKycOpenStatus, 1000);

    return () => clearInterval(interval);
  }, [kycOpenSettings]);

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
        // 모든 예약을 가져온 후 클라이언트에서 필터링
        const activeReservations = snapshot.docs
          .map((doc) => {
            const data = doc.data();
            return {
              id: doc.id,
              date: data.date,
              time: data.time,
              status: data.status,
              createdAt: data.createdAt?.toDate?.() || new Date(),
              paymentDeadline:
                data.paymentDeadline?.toDate?.() || data.paymentDeadline,
            };
          })
          .filter(
            (reservation) =>
              reservation.status !== "cancelled" &&
              reservation.status !== "rejected"
          )
          .sort(
            (a, b) =>
              new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
          );

        // 가장 최근의 활성 예약을 설정
        setReservation(
          activeReservations.length > 0 ? activeReservations[0] : null
        );
      }
    });

    return () => unsubscribe();
  }, [user?.uid]);

  // Fetch KYC data
  useEffect(() => {
    const fetchKycData = async () => {
      if (user?.uid) {
        try {
          console.log("대시보드 - KYC 데이터 조회 시작:", user.uid);
          const userDoc = await getDoc(doc(db, "users", user.uid));
          console.log("대시보드 - 사용자 문서 존재 여부:", userDoc.exists());
          if (userDoc.exists()) {
            const data = userDoc.data();
            console.log("대시보드 - 사용자 데이터:", data);

            // KYC 데이터 형식에 맞게 변환
            const kycData: KYCData = {
              name: data.name || "",
              gender: data.gender || "",
              birthYear: data.birthYear || "",
              contact: data.contact || "",
              province: data.province || "",
              district: data.district || "",
              dong: data.dong || "",
              detailedAddress: data.detailedAddress || "",
              skinType: data.skinType || "",
              skinTypeOther: data.skinTypeOther || "",
              hasPreviousTreatment: data.hasPreviousTreatment ? "yes" : "no",
              designDescription: data.designDescription || "",
              additionalNotes: data.additionalNotes || "",
              marketingConsent: data.marketingConsent || false,
              eyebrowPhotoLeft: data.photoURLs?.left || "",
              eyebrowPhotoFront: data.photoURLs?.front || "",
              eyebrowPhotoRight: data.photoURLs?.right || "",
              status: data.kycStatus || "",
              submittedAt: data.submittedAt,
            };

            console.log("대시보드 - 변환된 KYC 데이터:", kycData);
            console.log("대시보드 - 새로운 필드들:", {
              designDescription: data.designDescription,
              additionalNotes: data.additionalNotes,
              marketingConsent: data.marketingConsent,
            });
            setKycData(kycData);
            console.log("대시보드 - kycData 상태 설정 완료");
          } else {
            console.log("대시보드 - 사용자 문서가 존재하지 않음");
            setKycData(null);
          }
        } catch (error) {
          console.error("KYC 데이터 조회 실패:", error);
          setKycData(null);
        }
      } else {
        console.log("대시보드 - user.uid가 없음");
      }
    };

    if (user?.uid) {
      fetchKycData();
    }
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
                      ? "인증멤버"
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
                        ? "인증멤버"
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
              고객 등록 상태와 예약 현황을 확인하세요.
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
                  <div className="bg-black mr-3 rounded-lg p-2">
                    <User className="h-5 w-5 text-white" />
                  </div>
                  <h3 className="text-lg font-semibold">고객등록 신청</h3>
                </div>

                {/* KYC 오픈 상태에 따른 다른 UI 표시 */}
                {!isKycOpen && timeUntilOpen ? (
                  <div className="space-y-3">
                    <p className="text-gray-600 text-sm">
                      고객등록 신청이 곧 시작됩니다.
                    </p>
                    <div className="bg-blue-50 border-blue-200 rounded-lg border p-3">
                      <p className="text-blue-900 text-sm font-medium">
                        오픈까지: {formatTime(timeUntilOpen)}
                      </p>
                    </div>
                    <Button variant="default" className="w-full" disabled>
                      고객등록 신청 대기중
                    </Button>
                  </div>
                ) : !isKycOpen &&
                  !timeUntilOpen &&
                  user.kycStatus !== "approved" ? (
                  <div className="space-y-3">
                    <p className="text-gray-600 text-sm">
                      고객등록 신청 기간이 마감되었습니다.
                    </p>
                    <Button variant="default" className="w-full" disabled>
                      고객등록 신청 마감
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {/* KYC 오픈 중 */}
                    {timeUntilClose && (
                      <div className="bg-green-50 border-green-200 rounded-lg border p-3">
                        <p className="text-green-800 text-xs">
                          마감까지: {formatTime(timeUntilClose)}
                        </p>
                      </div>
                    )}

                    <p className="text-gray-600 text-sm">
                      {isLocked
                        ? "고객등록 신청을 완료하면 예약이 가능합니다."
                        : "고객등록 신청이 완료되었습니다."}
                    </p>

                    {isLocked ? (
                      <Link href="/kyc">
                        <Button
                          variant="default"
                          className="w-full"
                          disabled={user.kycStatus === "pending"}
                        >
                          {user.kycStatus === "pending"
                            ? "확인중"
                            : "고객등록 신청하기"}
                        </Button>
                      </Link>
                    ) : (
                      <div className="space-y-3">
                        {/* '신청 완료' 버튼은 kycData가 없을 때만 노출 */}
                        {!kycData && (
                          <Button
                            variant="outline"
                            className="w-full"
                            disabled={true}
                          >
                            신청 완료
                          </Button>
                        )}
                        {(() => {
                          console.log("대시보드 - 상담신청 섹션 렌더링:", {
                            kycData: !!kycData,
                            showKycData: showKycData,
                          });
                          return null;
                        })()}
                        {kycData && (
                          <Button
                            variant="outline"
                            className="w-full"
                            onClick={() => {
                              // 신청내용보기 클릭 시 데이터 강제 새로고침
                              const fetchKycData = async () => {
                                if (user?.email) {
                                  try {
                                    console.log(
                                      "대시보드 - KYC 데이터 새로고침 시작:",
                                      user.email
                                    );
                                    const kycDoc = await getDoc(
                                      doc(db, "kyc", user.email)
                                    );
                                    if (kycDoc.exists()) {
                                      const data = kycDoc.data() as KYCData;
                                      console.log(
                                        "대시보드 - 새로고침된 KYC 데이터:",
                                        data
                                      );
                                      setKycData(data);
                                    }
                                  } catch (error) {
                                    console.error(
                                      "대시보드 - KYC 데이터 새로고침 실패:",
                                      error
                                    );
                                  }
                                }
                              };
                              fetchKycData();
                              setShowKycData(true);
                            }}
                          >
                            <Eye className="mr-2 h-4 w-4" />
                            신청내용보기
                          </Button>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Reservation Card */}
              <div className="border-gray-100 shadow-sm hover:shadow-md rounded-2xl border bg-white p-6 transition-all duration-300">
                <div className="mb-4 flex items-center">
                  <div className="bg-black mr-3 rounded-lg p-2">
                    <Clock className="h-5 w-5 text-white" />
                  </div>
                  <h3 className="text-lg font-semibold">예약</h3>
                </div>
                <p className="text-gray-600 mb-4 text-sm">
                  {isLocked
                    ? "고객등록 신청 후 예약이 가능합니다."
                    : user.kycStatus === "approved" && !user.noticeConfirmed
                    ? "공지사항 확인 후 예약이 가능합니다."
                    : reservation &&
                      reservation.status !== "cancelled" &&
                      reservation.status !== "rejected"
                    ? "예약이 진행 중입니다."
                    : "고객 등록 승인 후 예약이 가능합니다."}
                </p>

                {user.kycStatus === "approved" && !user.noticeConfirmed && (
                  <button
                    onClick={() => setShowNoticeModal(true)}
                    className="bg-orange-50 hover:bg-orange-100 border-orange-200 group mb-4 w-full rounded-lg border p-3 text-left transition-colors duration-200"
                  >
                    <div className="flex items-start space-x-2">
                      <AlertTriangle className="text-orange-600 mt-0.5 h-5 w-5 flex-shrink-0 transition-transform duration-200 group-hover:scale-110" />
                      <div className="flex-1">
                        <p className="text-orange-800 group-hover:text-orange-900 text-sm font-medium transition-colors">
                          공지사항 확인 필수
                        </p>
                        <p className="text-orange-700 group-hover:text-orange-800 mt-1 text-xs transition-colors">
                          예약하기 전에 반드시 공지사항을 확인해주세요.
                        </p>
                      </div>
                      <div className="text-orange-400 group-hover:text-orange-600 transition-colors">
                        <svg
                          className="h-4 w-4"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M9 5l7 7-7 7"
                          />
                        </svg>
                      </div>
                    </div>
                  </button>
                )}

                {user.kycStatus === "approved" && user.noticeConfirmed && (
                  <button
                    onClick={() => setShowNoticeModal(true)}
                    className="bg-green-50 hover:bg-green-100 border-green-200 group mb-4 w-full rounded-lg border p-3 text-left transition-colors duration-200"
                  >
                    <div className="flex items-start space-x-2">
                      <Check className="text-green-600 mt-0.5 h-5 w-5 flex-shrink-0 transition-transform duration-200 group-hover:scale-110" />
                      <div className="flex-1">
                        <p className="text-green-800 group-hover:text-green-900 text-sm font-medium transition-colors">
                          공지사항 확인 완료
                        </p>
                        <p className="text-green-700 group-hover:text-green-800 mt-1 text-xs transition-colors">
                          예약이 가능합니다.
                        </p>
                      </div>
                      <div className="text-green-400 group-hover:text-green-600 transition-colors">
                        <svg
                          className="h-4 w-4"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M9 5l7 7-7 7"
                          />
                        </svg>
                      </div>
                    </div>
                  </button>
                )}

                {reservation &&
                reservation.status !== "cancelled" &&
                reservation.status !== "rejected" ? (
                  <div className="space-y-3">
                    <button
                      onClick={() => router.push("/user/reserve")}
                      className="bg-gray-50 hover:bg-gray-100 border-gray-200 group w-full rounded-lg border p-3 text-left transition-colors duration-200"
                    >
                      <div className="mb-2 flex items-center justify-between">
                        <span className="text-gray-800 group-hover:text-gray-900 text-sm font-medium transition-colors">
                          예약 정보
                        </span>
                        <div className="flex items-center space-x-2">
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
                              ? "입금확인중"
                              : reservation.status === "payment_required"
                              ? "입금대기"
                              : reservation.status === "rejected"
                              ? "거절"
                              : "대기"}
                          </Badge>
                          <div className="text-gray-400 group-hover:text-gray-600 transition-colors">
                            <svg
                              className="h-4 w-4"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M9 5l7 7-7 7"
                              />
                            </svg>
                          </div>
                        </div>
                      </div>
                      <div className="text-gray-700 text-sm">
                        <div>
                          {reservation.date} {reservation.time}
                        </div>
                        {reservation.status === "payment_required" && (
                          <div className="text-gray-600 mt-1 text-xs">
                            💰 예약금 20만원 입금 필요
                          </div>
                        )}
                        {reservation.status === "payment_required" &&
                          reservation.paymentDeadline && (
                            <div className="mt-2">
                              <CountdownTimer
                                deadline={reservation.paymentDeadline}
                                onExpired={async () => {
                                  // 타이머 만료 시 예약 취소 처리
                                  console.log("예약 타이머 만료");

                                  if (!reservation) return;

                                  try {
                                    await updateDoc(
                                      doc(db, "reservations", reservation.id),
                                      {
                                        status: "cancelled",
                                      }
                                    );

                                    // Create admin notification
                                    await createNotification({
                                      userId: "admin",
                                      type: "admin_reservation_cancelled",
                                      title: "입금 시간 만료",
                                      message: `${
                                        user?.displayName || user?.email
                                      }님의 예약이 입금 시간 만료로 자동 취소되었습니다.`,
                                    });
                                  } catch (error) {
                                    console.error("자동 취소 실패:", error);
                                  }
                                }}
                                compact={true}
                                testMode={
                                  process.env.NODE_ENV === "development"
                                }
                              />
                            </div>
                          )}
                        {reservation.status === "payment_confirmed" && (
                          <div className="text-gray-600 mt-1 text-xs">
                            확인 요청 되었습니다.
                          </div>
                        )}
                        {reservation.status === "rejected" && (
                          <div className="text-gray-600 mt-1 text-xs">
                            ❌ 예약이 거절되었습니다
                          </div>
                        )}
                      </div>
                    </button>
                  </div>
                ) : (
                  <Button
                    variant="outline"
                    className="w-full"
                    disabled={isLocked || user.kycStatus !== "approved"}
                    onClick={handleReservationClick}
                  >
                    {isLocked
                      ? "고객등록 신청 필요"
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

      {/* KYC Data Modal */}
      <Dialog open={showKycData} onOpenChange={setShowKycData}>
        <DialogContent className="max-h-[90vh] max-w-4xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle>신청 내용 확인</DialogTitle>
          </DialogHeader>
          {kycData && <KYCDataViewer kycData={kycData} />}
        </DialogContent>
      </Dialog>
    </div>
  );
}

// KYC 데이터 뷰어 컴포넌트
function KYCDataViewer({ kycData }: { kycData: KYCData }) {
  const getGenderText = (gender: string) => {
    switch (gender) {
      case "male":
        return "남성";
      case "female":
        return "여성";
      case "other":
        return "기타";
      default:
        return gender;
    }
  };

  const getSkinTypeText = (skinType: string) => {
    switch (skinType) {
      case "oily":
        return "지성";
      case "dry":
        return "건성";
      case "normal":
        return "중성";
      case "combination":
        return "복합성";
      case "unknown":
        return "모르겠음";
      case "other":
        return "기타";
      default:
        return skinType;
    }
  };

  const getPreviousTreatmentText = (hasPrevious: string) => {
    return hasPrevious === "yes" ? "있음" : "없음";
  };

  return (
    <div className="space-y-6">
      {/* 기본 정보 */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">기본 정보</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <label className="text-gray-700 text-sm font-medium">이름</label>
              <p className="text-gray-900">{kycData.name}</p>
            </div>
            <div>
              <label className="text-gray-700 text-sm font-medium">성별</label>
              <p className="text-gray-900">{getGenderText(kycData.gender)}</p>
            </div>
            <div>
              <label className="text-gray-700 text-sm font-medium">
                출생년도
              </label>
              <p className="text-gray-900">{kycData.birthYear}년</p>
            </div>
            <div>
              <label className="text-gray-700 text-sm font-medium">
                연락처
              </label>
              <p className="text-gray-900">{kycData.contact}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 주소 정보 */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">주소 정보</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="text-gray-700 text-sm font-medium">주소</label>
            <p className="text-gray-900">
              {[
                kycData.province
                  ? getAddressLabel("province", kycData.province)
                  : "",
                kycData.district
                  ? getAddressLabel(
                      "district",
                      kycData.district,
                      kycData.province
                    )
                  : "",
                kycData.dong
                  ? getAddressLabel("dong", kycData.dong, kycData.district)
                  : "",
              ]
                .filter(Boolean)
                .join(" ") || "-"}
            </p>
          </div>
          {kycData.detailedAddress && (
            <div>
              <label className="text-gray-700 text-sm font-medium">
                상세주소
              </label>
              <p className="text-gray-900">{kycData.detailedAddress}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* 시술 정보 */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">시술 정보</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <label className="text-gray-700 text-sm font-medium">
                피부타입
              </label>
              <p className="text-gray-900">
                {getSkinTypeText(kycData.skinType)}
                {kycData.skinType === "other" && kycData.skinTypeOther && (
                  <span className="text-gray-600 ml-2">
                    ({kycData.skinTypeOther})
                  </span>
                )}
              </p>
            </div>
            <div>
              <label className="text-gray-700 text-sm font-medium">
                반영구 이력
              </label>
              <p className="text-gray-900">
                {getPreviousTreatmentText(kycData.hasPreviousTreatment)}
              </p>
            </div>
          </div>

          {/* 원하는 눈썹 디자인 */}
          {kycData.designDescription && kycData.designDescription.trim() && (
            <div>
              <label className="text-gray-800 mb-2 block text-sm font-semibold">
                원하는 눈썹 디자인
              </label>
              <div className="bg-gray-100 border-gray-400 text-gray-900 rounded-r-md border-l-4 p-3 text-sm">
                {kycData.designDescription}
              </div>
            </div>
          )}

          {/* 기타 사항 */}
          {kycData.additionalNotes && kycData.additionalNotes.trim() && (
            <div>
              <label className="text-gray-800 mb-2 block text-sm font-semibold">
                기타 사항
              </label>
              <div className="bg-gray-100 border-gray-400 text-gray-900 rounded-r-md border-l-4 p-3 text-sm">
                {kycData.additionalNotes}
              </div>
            </div>
          )}

          {/* 마케팅 동의 */}
          <div>
            <label className="text-gray-700 text-sm font-medium">
              마케팅 동의
            </label>
            <p className="text-gray-900">
              {kycData.marketingConsent ? (
                <span className="text-green-600 font-medium">
                  동의 (5만원 할인)
                </span>
              ) : (
                <span className="text-gray-500">미동의</span>
              )}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* 눈썹 사진 */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">눈썹 사진</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            {kycData.eyebrowPhotoLeft && (
              <div>
                <label className="text-gray-700 mb-2 block text-sm font-medium">
                  좌측
                </label>
                <div className="border-gray-200 rounded-lg border p-2">
                  <img
                    src={kycData.eyebrowPhotoLeft}
                    alt="좌측 눈썹"
                    className="h-32 w-full rounded object-cover"
                  />
                </div>
              </div>
            )}
            {kycData.eyebrowPhotoFront && (
              <div>
                <label className="text-gray-700 mb-2 block text-sm font-medium">
                  정면
                </label>
                <div className="border-gray-200 rounded-lg border p-2">
                  <img
                    src={kycData.eyebrowPhotoFront}
                    alt="정면 눈썹"
                    className="h-32 w-full rounded object-cover"
                  />
                </div>
              </div>
            )}
            {kycData.eyebrowPhotoRight && (
              <div>
                <label className="text-gray-700 mb-2 block text-sm font-medium">
                  우측
                </label>
                <div className="border-gray-200 rounded-lg border p-2">
                  <img
                    src={kycData.eyebrowPhotoRight}
                    alt="우측 눈썹"
                    className="h-32 w-full rounded object-cover"
                  />
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* 제출 정보 */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">제출 정보</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <label className="text-gray-700 text-sm font-medium">
                제출일
              </label>
              <p className="text-gray-900">
                {kycData.submittedAt?.toDate?.()?.toLocaleDateString() ||
                  "날짜 정보 없음"}
              </p>
            </div>
            <div>
              <label className="text-gray-700 text-sm font-medium">상태</label>
              <p className="text-gray-900">
                {kycData.status === "approved"
                  ? "승인됨"
                  : kycData.status === "rejected"
                  ? "거절됨"
                  : "검토중"}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
