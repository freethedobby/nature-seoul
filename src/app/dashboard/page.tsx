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
  Calendar,
  Clock,
  Lock,
  Menu,
  X,
  LogOut,
  AlertTriangle,
  Check,
  Eye,
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
  eyebrowPhotoLeft?: string;
  eyebrowPhotoFront?: string;
  eyebrowPhotoRight?: string;
  status: string;
  submittedAt?: {
    toDate?: () => Date;
  };
}

// 주소 변환 함수들
const getProvinceLabel = (value: string): string => {
  const provinces = [
    { value: "seoul", label: "서울특별시" },
    { value: "busan", label: "부산광역시" },
    { value: "daegu", label: "대구광역시" },
    { value: "incheon", label: "인천광역시" },
    { value: "gwangju", label: "광주광역시" },
    { value: "daejeon", label: "대전광역시" },
    { value: "ulsan", label: "울산광역시" },
    { value: "sejong", label: "세종특별자치시" },
    { value: "gyeonggi", label: "경기도" },
    { value: "gangwon", label: "강원도" },
    { value: "chungbuk", label: "충청북도" },
    { value: "chungnam", label: "충청남도" },
    { value: "jeonbuk", label: "전라북도" },
    { value: "jeonnam", label: "전라남도" },
    { value: "gyeongbuk", label: "경상북도" },
    { value: "gyeongnam", label: "경상남도" },
    { value: "jeju", label: "제주특별자치도" },
  ];
  return provinces.find((p) => p.value === value)?.label || value;
};

const getDistrictLabel = (
  provinceValue: string,
  districtValue: string
): string => {
  const districts: { [key: string]: { value: string; label: string }[] } = {
    seoul: [
      { value: "gangnam", label: "강남구" },
      { value: "gangdong", label: "강동구" },
      { value: "gangbuk", label: "강북구" },
      { value: "gangseo", label: "강서구" },
      { value: "gwanak", label: "관악구" },
      { value: "gwangjin", label: "광진구" },
      { value: "guro", label: "구로구" },
      { value: "geumcheon", label: "금천구" },
      { value: "nowon", label: "노원구" },
      { value: "dobong", label: "도봉구" },
      { value: "dongdaemun", label: "동대문구" },
      { value: "dongjak", label: "동작구" },
      { value: "mapo", label: "마포구" },
      { value: "seodaemun", label: "서대문구" },
      { value: "seocho", label: "서초구" },
      { value: "seongbuk", label: "성북구" },
      { value: "songpa", label: "송파구" },
      { value: "yangcheon", label: "양천구" },
      { value: "yeongdeungpo", label: "영등포구" },
      { value: "yongsan", label: "용산구" },
      { value: "eunpyeong", label: "은평구" },
      { value: "jongno", label: "종로구" },
      { value: "junggu", label: "중구" },
      { value: "jungnang", label: "중랑구" },
    ],
    gyeonggi: [
      { value: "suwon", label: "수원시" },
      { value: "seongnam", label: "성남시" },
      { value: "bucheon", label: "부천시" },
      { value: "anyang", label: "안양시" },
      { value: "ansan", label: "안산시" },
      { value: "pyeongtaek", label: "평택시" },
      { value: "siheung", label: "시흥시" },
      { value: "gwangmyeong", label: "광명시" },
      { value: "gwangju_gyeonggi", label: "광주시" },
      { value: "yongin", label: "용인시" },
      { value: "paju", label: "파주시" },
      { value: "icheon", label: "이천시" },
      { value: "anseong", label: "안성시" },
      { value: "gimpo", label: "김포시" },
      { value: "hwaseong", label: "화성시" },
      { value: "yeoju", label: "여주시" },
      { value: "pocheon", label: "포천시" },
      { value: "dongducheon", label: "동두천시" },
      { value: "goyang", label: "고양시" },
      { value: "namyangju", label: "남양주시" },
      { value: "osan", label: "오산시" },
      { value: "hanam", label: "하남시" },
      { value: "uijeongbu", label: "의정부시" },
      { value: "yangju", label: "양주시" },
      { value: "gunpo", label: "군포시" },
      { value: "uiwang", label: "의왕시" },
      { value: "gwachon", label: "과천시" },
      { value: "guri", label: "구리시" },
      { value: "yeoncheon", label: "연천군" },
      { value: "gapyeong", label: "가평군" },
      { value: "yangpyeong", label: "양평군" },
    ],
    incheon: [
      { value: "junggu_incheon", label: "중구" },
      { value: "donggu", label: "동구" },
      { value: "michuhol", label: "미추홀구" },
      { value: "yeonsu", label: "연수구" },
      { value: "namdong", label: "남동구" },
      { value: "bupyeong", label: "부평구" },
      { value: "gyeyang", label: "계양구" },
      { value: "seo_incheon", label: "서구" },
      { value: "ganghwa", label: "강화군" },
      { value: "ongjin", label: "옹진군" },
    ],
  };

  const provinceDistricts = districts[provinceValue];
  if (!provinceDistricts) return districtValue;

  return (
    provinceDistricts.find((d) => d.value === districtValue)?.label ||
    districtValue
  );
};

const getDongLabel = (districtValue: string, dongValue: string): string => {
  const dongs: { [key: string]: { value: string; label: string }[] } = {
    gangnam: [
      { value: "apgujeong", label: "압구정동" },
      { value: "cheongdam", label: "청담동" },
      { value: "daechi", label: "대치동" },
      { value: "dogok", label: "도곡동" },
      { value: "gaepo", label: "개포동" },
      { value: "irwon", label: "일원동" },
      { value: "jamsil", label: "잠실동" },
      { value: "jamwon", label: "잠원동" },
      { value: "nonhyeon", label: "논현동" },
      { value: "samseong", label: "삼성동" },
      { value: "seocho", label: "서초동" },
      { value: "sinsa", label: "신사동" },
      { value: "songpa", label: "송파동" },
      { value: "yangjae", label: "양재동" },
    ],
    seocho: [
      { value: "banpo", label: "반포동" },
      { value: "bangbae", label: "방배동" },
      { value: "seocho", label: "서초동" },
      { value: "yangjae", label: "양재동" },
      { value: "yeouido", label: "여의도동" },
    ],
    suwon: [
      { value: "gwonseon", label: "권선구" },
      { value: "yeongtong", label: "영통구" },
      { value: "jangan", label: "장안구" },
      { value: "paldal", label: "팔달구" },
    ],
    seongnam: [
      { value: "bundang", label: "분당구" },
      { value: "jungwon", label: "중원구" },
      { value: "sujeong", label: "수정구" },
    ],
  };

  const districtDongs = dongs[districtValue];
  if (!districtDongs) return dongValue;

  return districtDongs.find((d) => d.value === dongValue)?.label || dongValue;
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
          paymentDeadline:
            data.paymentDeadline?.toDate?.() || data.paymentDeadline,
        });
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
              eyebrowPhotoLeft: data.photoURLs?.left || "",
              eyebrowPhotoFront: data.photoURLs?.front || "",
              eyebrowPhotoRight: data.photoURLs?.right || "",
              status: data.kycStatus || "",
              submittedAt: data.submittedAt,
            };

            console.log("대시보드 - 변환된 KYC 데이터:", kycData);
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
              예약 현황과 고객 등록 상태를 확인하세요.
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
                        : "상담 신청하기"}
                    </Button>
                  </Link>
                ) : (
                  <div className="space-y-3">
                    <Button
                      variant="outline"
                      className="w-full"
                      disabled={true}
                    >
                      신청 완료
                    </Button>
                    {(() => {
                      console.log("대시보드 - 상담신청 섹션 렌더링:", {
                        kycData: !!kycData,
                        kycDataValue: kycData,
                        isLocked,
                        userKycStatus: user.kycStatus,
                      });
                      return (
                        kycData && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setShowKycData(true)}
                            className="text-gray-700 border-gray-300 hover:bg-gray-50 w-full"
                          >
                            <Eye className="mr-2 h-4 w-4" />
                            신청 내용 보기
                          </Button>
                        )
                      );
                    })()}
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
                    ? "고객등록 후 예약이 가능합니다."
                    : user.kycStatus === "approved" && !user.noticeConfirmed
                    ? "공지사항 확인 후 예약이 가능합니다."
                    : reservation
                    ? "예약이 진행 중입니다."
                    : "상담 승인 후 예약이 가능합니다."}
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

                {reservation ? (
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
                              ? "입금확인"
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
                                onExpired={() => {
                                  // 타이머 만료 시 예약 취소 처리
                                  console.log("예약 타이머 만료");
                                }}
                                compact={true}
                              />
                            </div>
                          )}
                        {reservation.status === "payment_confirmed" && (
                          <div className="text-gray-600 mt-1 text-xs">
                            ⏳ 관리자 확인 대기 중
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
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <label className="text-gray-700 text-sm font-medium">시도</label>
              <p className="text-gray-900">
                {getProvinceLabel(kycData.province)}
              </p>
            </div>
            <div>
              <label className="text-gray-700 text-sm font-medium">
                시군구
              </label>
              <p className="text-gray-900">
                {getDistrictLabel(kycData.province, kycData.district)}
              </p>
            </div>
            <div>
              <label className="text-gray-700 text-sm font-medium">
                읍면동
              </label>
              <p className="text-gray-900">
                {getDongLabel(kycData.district, kycData.dong)}
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
          </div>
        </CardContent>
      </Card>

      {/* 피부 정보 */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">피부 정보</CardTitle>
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
                기존 시술경험
              </label>
              <p className="text-gray-900">
                {getPreviousTreatmentText(kycData.hasPreviousTreatment)}
              </p>
            </div>
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
