"use client";

import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import KYCFormNew from "@/components/KYCFormNew";
import FirebaseDebug from "@/components/FirebaseDebug";
import Logo from "@/components/Logo";
import { db } from "@/lib/firebase";
import { doc, getDoc } from "firebase/firestore";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, Eye } from "lucide-react";
import { isTestMode } from "@/lib/utils";

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

export default function KYCPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [kycData, setKycData] = useState<KYCData | null>(null);
  const [loadingKyc, setLoadingKyc] = useState(true);
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
  const [userKycStatus, setUserKycStatus] = useState<string>("");

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

  // 사용자 KYC 상태 확인
  useEffect(() => {
    const fetchUserKycStatus = async () => {
      if (user?.uid) {
        try {
          const userDoc = await getDoc(doc(db, "users", user.uid));
          if (userDoc.exists()) {
            const userData = userDoc.data();
            setUserKycStatus(userData.kycStatus || "");
          }
        } catch (error) {
          console.error("Error fetching user KYC status:", error);
        }
      }
    };

    fetchUserKycStatus();
  }, [user]);

  useEffect(() => {
    const fetchKycData = async () => {
      if (user?.email) {
        try {
          console.log("KYC 데이터 조회 시작:", user.email);
          const kycDoc = await getDoc(doc(db, "kyc", user.email));
          console.log("KYC 문서 존재 여부:", kycDoc.exists());
          if (kycDoc.exists()) {
            const data = kycDoc.data() as KYCData;
            console.log("KYC 데이터:", data);
            setKycData(data);
          } else {
            console.log("KYC 문서가 존재하지 않음");
          }
        } catch (error) {
          console.error("KYC 데이터 조회 실패:", error);
        } finally {
          setLoadingKyc(false);
        }
      }
    };

    if (user?.email) {
      fetchKycData();
    }
  }, [user?.email]);

  if (loading || loadingKyc) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-white">
        <div className="animate-spin border-gray-900 h-8 w-8 rounded-full border-b-2"></div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  // 디버깅 로그
  console.log("KYC 페이지 상태:", {
    kycData: !!kycData,
    showKycData,
    loading,
    loadingKyc,
    user: !!user,
  });

  // KYC가 이미 제출된 경우
  if (kycData && !showKycData) {
    return (
      <div className="min-h-screen bg-white">
        {/* Header */}
        <header className="border-gray-200 sticky top-0 z-50 border-b bg-white">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="flex h-16 items-center justify-between">
              <div className="flex items-center">
                <button
                  onClick={() => router.back()}
                  className="hover:bg-gray-100 mr-4 rounded-full p-2 transition-colors"
                >
                  <svg
                    className="h-6 w-6"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M15 19l-7-7 7-7"
                    />
                  </svg>
                </button>
                <Logo variant="header" />
              </div>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-2xl">
            {/* <div className="mb-8 text-center">
              <h2 className="text-gray-900 mb-2 text-2xl font-light">
                맞춤 상담 신청
              </h2>
              <p className="text-gray-600">
                고객님의 눈썹 상태를 정확히 파악하여
                <br />
                최적의 시술 방법을 제안해드리겠습니다.
              </p>
            </div> */}

            <Card className="border-green-200 bg-green-50">
              <CardHeader>
                <div className="flex items-center space-x-2">
                  <CheckCircle className="text-green-600 h-5 w-5" />
                  <CardTitle className="text-green-800 text-lg">
                    신청 완료
                  </CardTitle>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-green-700 text-sm">
                  고객등록 신청이 완료되었습니다. 관리자 검토 후 결과를
                  알려드리겠습니다.
                </p>

                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Badge
                      variant="outline"
                      className="text-green-700 border-green-300"
                    >
                      {kycData.status === "approved"
                        ? "승인됨"
                        : kycData.status === "rejected"
                        ? "거절됨"
                        : "검토중"}
                    </Badge>
                    <span className="text-green-600 text-xs">
                      제출일:{" "}
                      {kycData.submittedAt?.toDate?.()?.toLocaleDateString() ||
                        "날짜 정보 없음"}
                    </span>
                  </div>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowKycData(true)}
                    className="text-green-700 border-green-300 hover:bg-green-100"
                  >
                    <Eye className="mr-2 h-4 w-4" />
                    신청 내용 보기
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </main>
        <FirebaseDebug />
      </div>
    );
  }

  // KYC 데이터 보기 모드
  if (kycData && showKycData) {
    return (
      <div className="min-h-screen bg-white">
        {/* Header */}
        <header className="border-gray-200 sticky top-0 z-50 border-b bg-white">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="flex h-16 items-center justify-between">
              <div className="flex items-center">
                <button
                  onClick={() => setShowKycData(false)}
                  className="hover:bg-gray-100 mr-4 rounded-full p-2 transition-colors"
                >
                  <svg
                    className="h-6 w-6"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M15 19l-7-7 7-7"
                    />
                  </svg>
                </button>
                <Logo variant="header" />
              </div>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-2xl">
            <div className="mb-8 text-center">
              <h2 className="text-gray-900 mb-2 text-2xl font-light">
                신청 내용 확인
              </h2>
              <p className="text-gray-600">
                제출하신 고객등록 신청 내용을 확인하실 수 있습니다.
              </p>
            </div>

            <KYCDataViewer kycData={kycData} />
          </div>
        </main>
        <FirebaseDebug />
      </div>
    );
  }

  // KYC 폼 제출 모드
  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="border-gray-200 sticky top-0 z-50 border-b bg-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <div className="flex items-center">
              <button
                onClick={() => router.back()}
                className="hover:bg-gray-100 mr-4 rounded-full p-2 transition-colors"
              >
                <svg
                  className="h-6 w-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 19l-7-7 7-7"
                  />
                </svg>
              </button>
              <Logo variant="header" />
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl">
          {/* KYC 오픈 상태 체크 - 테스트 모드에서는 항상 접근 가능 */}
          {!isKycOpen && userKycStatus !== "approved" && !isTestMode() ? (
            <div className="space-y-6 text-center">
              <Card className="p-8">
                <CardHeader>
                  <CardTitle className="text-gray-900 text-xl">
                    {timeUntilOpen
                      ? "고객등록 신청 오픈 예정"
                      : "고객등록 신청 마감"}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {timeUntilOpen ? (
                    <>
                      <p className="text-gray-600">
                        고객등록 신청이 곧 시작됩니다. 오픈까지 남은 시간:
                      </p>
                      <div className="bg-blue-50 border-blue-200 rounded-lg border p-4">
                        <div className="text-blue-900 text-2xl font-bold">
                          {formatTime(timeUntilOpen)}
                        </div>
                      </div>
                      <p className="text-gray-500 text-sm">
                        오픈 시간: {kycOpenSettings.startDate}{" "}
                        {kycOpenSettings.startTime}
                      </p>
                    </>
                  ) : (
                    <>
                      <p className="text-gray-600">
                        고객등록 신청 기간이 마감되었습니다.
                      </p>
                      <div className="bg-gray-50 border-gray-200 rounded-lg border p-4">
                        <p className="text-gray-700">
                          신청 기간: {kycOpenSettings.startDate}{" "}
                          {kycOpenSettings.startTime} ~{" "}
                          {kycOpenSettings.endDate} {kycOpenSettings.endTime}
                        </p>
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>
            </div>
          ) : (
            (isKycOpen || userKycStatus === "approved" || isTestMode()) && (
              <div className="space-y-6">
                {/* 테스트 모드 표시 */}
                {isTestMode() && (
                  <Card className="bg-yellow-50 border-yellow-200">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-center gap-2">
                        <div className="text-yellow-600">
                          <Eye className="h-5 w-5" />
                        </div>
                        <p className="text-yellow-800 font-medium">
                          개발 모드 - 모든 시간 제한이 비활성화되었습니다
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* 고객등록 신청 마감까지 남은 시간 표시 */}
                {timeUntilClose && !isTestMode() && (
                  <Card className="bg-green-50 border-green-200">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-green-800 font-medium">
                            고객등록 신청 오픈 중
                          </p>
                          <p className="text-green-600 text-sm">
                            마감까지: {formatTime(timeUntilClose)}
                          </p>
                        </div>
                        <div className="text-green-600">
                          <CheckCircle className="h-6 w-6" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}

                <KYCFormNew
                  onSuccess={() => {
                    // 성공 후 내정보로 이동
                    setTimeout(() => {
                      router.push("/dashboard");
                    }, 2000);
                  }}
                />
              </div>
            )
          )}
        </div>
      </main>
      <FirebaseDebug />
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
              <p className="text-gray-900 font-bold">{kycData.name}</p>
            </div>
            <div>
              <label className="text-gray-700 text-sm font-medium">성별</label>
              <p className="text-gray-900 font-bold">
                {getGenderText(kycData.gender)}
              </p>
            </div>
            <div>
              <label className="text-gray-700 text-sm font-medium">
                출생년도
              </label>
              <p className="text-gray-900 font-bold">{kycData.birthYear}년</p>
            </div>
            <div>
              <label className="text-gray-700 text-sm font-medium">
                연락처
              </label>
              <p className="text-gray-900 font-bold">{kycData.contact}</p>
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
              <p className="text-gray-900 font-bold">{kycData.province}</p>
            </div>
            <div>
              <label className="text-gray-700 text-sm font-medium">
                시군구
              </label>
              <p className="text-gray-900 font-bold">{kycData.district}</p>
            </div>
            <div>
              <label className="text-gray-700 text-sm font-medium">
                읍면동
              </label>
              <p className="text-gray-900 font-bold">{kycData.dong}</p>
            </div>
            {kycData.detailedAddress && (
              <div>
                <label className="text-gray-700 text-sm font-medium">
                  상세주소
                </label>
                <p className="text-gray-900 font-bold">
                  {kycData.detailedAddress}
                </p>
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
              <p className="text-gray-900 font-bold">
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
              <p className="text-gray-900 font-bold">
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
              <p className="text-gray-900 font-bold">
                {kycData.submittedAt?.toDate?.()?.toLocaleDateString() ||
                  "날짜 정보 없음"}
              </p>
            </div>
            <div>
              <label className="text-gray-700 text-sm font-medium">상태</label>
              <p className="text-gray-900 font-bold">
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
