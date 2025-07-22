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

  useEffect(() => {
    if (!loading && !user) {
      router.push("/login");
    }
  }, [user, loading, router]);

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
          {/* <div className="mb-8 text-center">
            <h2 className="text-gray-900 mb-2 text-2xl font-light">
              맞춤 상담 신청
            </h2>
            <p className="text-gray-6">
              고객님의 눈썹 상태를 정확히 파악하여
              <br />
              최적의 시술 방법을 제안해드리겠습니다.
            </p>
          </div> */}

          <KYCFormNew
            onSuccess={() => {
              // 성공 후 대시보드로 이동
              setTimeout(() => {
                router.push("/dashboard");
              }, 2000);
            }}
          />
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
              <p className="text-gray-900">{kycData.province}</p>
            </div>
            <div>
              <label className="text-gray-700 text-sm font-medium">
                시군구
              </label>
              <p className="text-gray-900">{kycData.district}</p>
            </div>
            <div>
              <label className="text-gray-700 text-sm font-medium">
                읍면동
              </label>
              <p className="text-gray-900">{kycData.dong}</p>
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
