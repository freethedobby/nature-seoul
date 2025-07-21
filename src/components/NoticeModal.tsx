"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Check,
  ChevronDown,
  ChevronUp,
  MapPin,
  Car,
  AlertTriangle,
  Info,
} from "lucide-react";

interface NoticeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

export default function NoticeModal({
  isOpen,
  onClose,
  onConfirm,
}: NoticeModalProps) {
  const [expandedSections, setExpandedSections] = useState<{
    faq: boolean;
    pricing: boolean;
    restrictions: boolean;
  }>({
    faq: false,
    pricing: false,
    restrictions: false,
  });

  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-h-[90vh] max-w-4xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-gray-800 mb-4 text-center text-2xl font-bold">
            📋 예약 전 필수 공지사항
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* 중요 안내 */}
          <div className="bg-red-50 border-red-200 rounded-lg border p-4">
            <div className="flex items-start space-x-3">
              <AlertTriangle className="text-red-600 mt-1 h-6 w-6 flex-shrink-0" />
              <div>
                <h3 className="text-red-800 mb-2 font-semibold">
                  ⚠️ 중요 안내
                </h3>
                <p className="text-red-700 text-sm">
                  시간은 넉넉히 2시간 잡고 방문해주세요. (리터치는 30분~1시간)
                </p>
              </div>
            </div>
          </div>

          {/* 가격 안내 */}
          <div className="bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200 rounded-lg border p-6">
            <div className="mb-4 flex items-center justify-center">
              <h3 className="text-blue-800 flex items-center text-xl font-bold">
                ⭐️ 가격 안내 ⭐️
                <span className="text-blue-600 ml-2 text-sm font-normal">
                  (VAT 10% 별도)
                </span>
              </h3>
            </div>

            <div className="space-y-4">
              <div className="border-blue-100 rounded-lg border bg-white p-4">
                <h4 className="text-gray-800 mb-2 font-semibold">
                  원모복원결눈썹 (=헤어스트록)
                </h4>
                <p className="text-blue-600 text-lg font-bold">90만원</p>
                <p className="text-gray-600 mt-1 text-sm">
                  모량 20% 이하, 또는 잔흔이 있는 경우 추가비용 20만원
                </p>
              </div>

              <div className="border-blue-100 rounded-lg border bg-white p-4">
                <h4 className="text-gray-800 mb-3 font-semibold">
                  리터치 1회 비용 (마지막 작업일 기준)
                </h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>60일 이내</span>
                    <span className="text-blue-600 font-semibold">10만원</span>
                  </div>
                  <div className="flex justify-between">
                    <span>90일 이내</span>
                    <span className="text-blue-600 font-semibold">20만원</span>
                  </div>
                  <div className="flex justify-between">
                    <span>120일 이내</span>
                    <span className="text-blue-600 font-semibold">30만원</span>
                  </div>
                  <div className="flex justify-between">
                    <span>180일 이내</span>
                    <span className="text-blue-600 font-semibold">50만원</span>
                  </div>
                  <div className="text-gray-500 flex justify-between">
                    <span>6개월 이후</span>
                    <span>정상가</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-red-50 border-red-200 mt-4 rounded-lg border p-3">
              <p className="text-red-700 text-center font-semibold">
                ✖️ 잔흔 있는 경우 예약일 기준 최소 2개월 전부터 깨끗하게 제거
                필수 ✖️
              </p>
            </div>
          </div>

          {/* 위치 및 주차 정보 */}
          <div className="bg-green-50 border-green-200 rounded-lg border p-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="flex items-start space-x-3">
                <MapPin className="text-green-600 mt-1 h-5 w-5 flex-shrink-0" />
                <div>
                  <h4 className="text-green-800 mb-1 font-semibold">위치</h4>
                  <p className="text-green-700 text-sm">
                    신용산역 5번 출구 도보 1분
                    <br />
                    용산역 1번 출구 도보 5분
                    <br />
                    <span className="text-green-600">
                      (상세 주소는 하루 전날 전송됩니다)
                    </span>
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-3">
                <Car className="text-green-600 mt-1 h-5 w-5 flex-shrink-0" />
                <div>
                  <h4 className="text-green-800 mb-1 font-semibold">주차</h4>
                  <p className="text-green-700 text-sm">
                    건물 내 지하 유료 주차 가능
                    <br />
                    시간당 4천원, 나가실 때 정산
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* 예약/재예약 불가 */}
          <div className="bg-orange-50 border-orange-200 rounded-lg border p-4">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-orange-800 flex items-center font-semibold">
                <AlertTriangle className="mr-2 h-5 w-5" />
                예약/재예약 불가
              </h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => toggleSection("restrictions")}
                className="text-orange-600 hover:text-orange-700"
              >
                {expandedSections.restrictions ? (
                  <ChevronUp className="h-4 w-4" />
                ) : (
                  <ChevronDown className="h-4 w-4" />
                )}
              </Button>
            </div>

            {expandedSections.restrictions && (
              <div className="text-orange-700 space-y-2 text-sm">
                <p className="mb-2 font-medium">아래와 같은 경우 답변X:</p>
                <ol className="ml-2 list-inside list-decimal space-y-1">
                  <li>취소, 노쇼, 10분 이상 지각 고객님</li>
                  <li>
                    상대방을 존중하지 않는 언행을 하시는 고객님
                    <br />
                    <span className="text-orange-600 ml-4">
                      ex) 비하 발언, 타샵 비교, 가격 할인 요구, 인사 없이 반말,
                      협박 등
                    </span>
                  </li>
                  <li>리터치 취소, 변경, 노쇼, 지각 고객님</li>
                  <li>
                    예약으로 이어지지 않고 반복적으로 문의 후 잠수하시는 고객님
                  </li>
                  <li>
                    상담, 날짜 선택, 계좌 안내까지 한 후에 예약금 미입금 후
                    잠수하시는 고객님
                  </li>
                  <li>동종업계 종사자</li>
                  <li>임산부 또는 모유 수유 고객님</li>
                  <li>완벽주의자 또는 심하게 예민하신 고객님</li>
                </ol>
              </div>
            )}
          </div>

          {/* FAQ */}
          <div className="bg-blue-50 border-blue-200 rounded-lg border p-4">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-blue-800 flex items-center font-semibold">
                <Info className="mr-2 h-5 w-5" />
                자주 물으시는 질문
              </h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => toggleSection("faq")}
                className="text-blue-600 hover:text-blue-700"
              >
                {expandedSections.faq ? (
                  <ChevronUp className="h-4 w-4" />
                ) : (
                  <ChevronDown className="h-4 w-4" />
                )}
              </Button>
            </div>

            {expandedSections.faq && (
              <div className="text-blue-700 space-y-3 text-sm">
                <div>
                  <p className="font-medium">1. 유지력이 어떻게 되나요?</p>
                  <p className="text-blue-600 ml-4">
                    사후 관리, 피부 타입에 따라 다르며 리터치까지 받으시면
                    됩니다.
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* 책임 면책 */}
          <div className="bg-gray-50 border-gray-200 rounded-lg border p-4">
            <div className="flex items-start space-x-3">
              <Check className="text-gray-600 mt-1 h-5 w-5 flex-shrink-0" />
              <div>
                <p className="text-gray-700 text-sm font-medium">
                  ✔️ 공지를 숙지하지 않아 생기는 문제에 대해서는 전혀 책임지지
                  않습니다.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* 확인 버튼 */}
        <div className="flex justify-center pt-6">
          <Button
            onClick={onConfirm}
            className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 rounded-lg px-8 py-3 font-semibold text-white"
          >
            공지사항을 확인했습니다
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
