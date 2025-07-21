"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Check,
  MapPin,
  Car,
  AlertTriangle,
  Info,
  DollarSign,
  Clock,
  X,
} from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface NoticeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  showViewAgain?: boolean;
}

export default function NoticeModal({
  isOpen,
  onClose,
  onConfirm,
  showViewAgain = false,
}: NoticeModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-h-[90vh] max-w-5xl overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="text-black text-2xl font-bold">
              📋 예약 전 필수 공지사항
            </DialogTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="text-gray-500 hover:text-black"
            >
              <X className="h-5 w-5" />
            </Button>
          </div>
        </DialogHeader>

        <Tabs defaultValue="important" className="w-full">
          <TabsList className="bg-gray-100 grid w-full grid-cols-5">
            <TabsTrigger value="important" className="text-sm font-medium">
              ⚠️ 중요안내
            </TabsTrigger>
            <TabsTrigger value="pricing" className="text-sm font-medium">
              💰 가격안내
            </TabsTrigger>
            <TabsTrigger value="location" className="text-sm font-medium">
              📍 위치/주차
            </TabsTrigger>
            <TabsTrigger value="restrictions" className="text-sm font-medium">
              🚫 예약제한
            </TabsTrigger>
            <TabsTrigger value="faq" className="text-sm font-medium">
              ❓ FAQ
            </TabsTrigger>
          </TabsList>

          {/* 중요 안내 탭 */}
          <TabsContent value="important" className="space-y-4">
            <div className="border-gray-200 rounded-lg border bg-white p-6">
              <div className="flex items-start space-x-4">
                <AlertTriangle className="text-red-600 mt-1 h-6 w-6 flex-shrink-0" />
                <div>
                  <h3 className="text-black mb-3 text-xl font-bold">
                    ⚠️ 중요 안내
                  </h3>
                  <div className="text-gray-700 space-y-3">
                    <p className="text-lg">
                      <strong>시간은 넉넉히 2시간 잡고 방문해주세요.</strong>
                      <br />
                      <span className="text-gray-600">
                        (리터치는 30분~1시간)
                      </span>
                    </p>
                    <div className="bg-red-50 border-red-200 rounded-lg border p-4">
                      <p className="text-red-700 text-center font-semibold">
                        ✖️ 잔흔 있는 경우 예약일 기준 최소 2개월 전부터 깨끗하게
                        제거 필수 ✖️
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>

          {/* 가격 안내 탭 */}
          <TabsContent value="pricing" className="space-y-4">
            <div className="border-gray-200 rounded-lg border bg-white p-6">
              <div className="mb-6 text-center">
                <h3 className="text-black mb-2 text-2xl font-bold">
                  ⭐️ 가격 안내 ⭐️
                </h3>
                <p className="text-gray-600">(VAT 10% 별도)</p>
              </div>

              <div className="space-y-6">
                <div className="border-gray-200 rounded-lg border p-6">
                  <div className="mb-3 flex items-center space-x-3">
                    <DollarSign className="text-gray-600 h-5 w-5" />
                    <h4 className="text-black text-lg font-bold">
                      원모복원결눈썹 (=헤어스트록)
                    </h4>
                  </div>
                  <p className="text-black mb-2 text-3xl font-bold">90만원</p>
                  <p className="text-gray-600">
                    모량 20% 이하, 또는 잔흔이 있는 경우 추가비용 20만원
                  </p>
                </div>

                <div className="border-gray-200 rounded-lg border p-6">
                  <div className="mb-4 flex items-center space-x-3">
                    <Clock className="text-gray-600 h-5 w-5" />
                    <h4 className="text-black text-lg font-bold">
                      리터치 1회 비용 (마지막 작업일 기준)
                    </h4>
                  </div>
                  <div className="space-y-3">
                    <div className="border-gray-100 flex items-center justify-between border-b py-2">
                      <span className="text-gray-700">60일 이내</span>
                      <span className="text-black font-bold">10만원</span>
                    </div>
                    <div className="border-gray-100 flex items-center justify-between border-b py-2">
                      <span className="text-gray-700">90일 이내</span>
                      <span className="text-black font-bold">20만원</span>
                    </div>
                    <div className="border-gray-100 flex items-center justify-between border-b py-2">
                      <span className="text-gray-700">120일 이내</span>
                      <span className="text-black font-bold">30만원</span>
                    </div>
                    <div className="border-gray-100 flex items-center justify-between border-b py-2">
                      <span className="text-gray-700">180일 이내</span>
                      <span className="text-black font-bold">50만원</span>
                    </div>
                    <div className="flex items-center justify-between py-2">
                      <span className="text-gray-500">6개월 이후</span>
                      <span className="text-gray-500">정상가</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>

          {/* 위치/주차 탭 */}
          <TabsContent value="location" className="space-y-4">
            <div className="border-gray-200 rounded-lg border bg-white p-6">
              <div className="grid gap-6 md:grid-cols-2">
                <div className="border-gray-200 rounded-lg border p-6">
                  <div className="mb-4 flex items-center space-x-3">
                    <MapPin className="text-gray-600 h-6 w-6" />
                    <h4 className="text-black text-lg font-bold">위치</h4>
                  </div>
                  <div className="text-gray-700 space-y-2">
                    <p>
                      <strong>신용산역 5번 출구</strong> 도보 1분
                    </p>
                    <p>
                      <strong>용산역 1번 출구</strong> 도보 5분
                    </p>
                    <p className="text-gray-500 mt-3 text-sm">
                      (상세 주소는 하루 전날 전송됩니다)
                    </p>
                  </div>
                </div>

                <div className="border-gray-200 rounded-lg border p-6">
                  <div className="mb-4 flex items-center space-x-3">
                    <Car className="text-gray-600 h-6 w-6" />
                    <h4 className="text-black text-lg font-bold">주차</h4>
                  </div>
                  <div className="text-gray-700 space-y-2">
                    <p>건물 내 지하 유료 주차 가능</p>
                    <p>
                      <strong>시간당 4천원</strong>
                    </p>
                    <p>나가실 때 정산</p>
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>

          {/* 예약 제한 탭 */}
          <TabsContent value="restrictions" className="space-y-4">
            <div className="border-gray-200 rounded-lg border bg-white p-6">
              <div className="mb-6 flex items-center space-x-3">
                <X className="text-red-600 h-6 w-6" />
                <h3 className="text-black text-xl font-bold">
                  예약/재예약 불가
                </h3>
              </div>

              <div className="space-y-4">
                <p className="text-gray-600 font-medium">
                  아래와 같은 경우 답변X:
                </p>
                <ol className="text-gray-700 list-inside list-decimal space-y-3">
                  <li>취소, 노쇼, 10분 이상 지각 고객님</li>
                  <li>
                    상대방을 존중하지 않는 언행을 하시는 고객님
                    <div className="text-gray-500 ml-6 mt-1">
                      ex) 비하 발언, 타샵 비교, 가격 할인 요구, 인사 없이 반말,
                      협박 등
                    </div>
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
            </div>
          </TabsContent>

          {/* FAQ 탭 */}
          <TabsContent value="faq" className="space-y-4">
            <div className="border-gray-200 rounded-lg border bg-white p-6">
              <div className="mb-6 flex items-center space-x-3">
                <Info className="text-gray-600 h-6 w-6" />
                <h3 className="text-black text-xl font-bold">
                  자주 물으시는 질문
                </h3>
              </div>

              <div className="space-y-6">
                <div className="border-gray-200 border-b pb-4">
                  <h4 className="text-black mb-2 font-bold">
                    1. 유지력이 어떻게 되나요?
                  </h4>
                  <p className="text-gray-700">
                    사후 관리, 피부 타입에 따라 다르며 리터치까지 받으시면{" "}
                    <strong>1년 ~ 3년 사이</strong> 입니다. 오래가길 원하시면
                    처음부터 진하게 작업 가능하나 권장드리지 않습니다.
                  </p>
                </div>

                <div className="border-gray-200 border-b pb-4">
                  <h4 className="text-black mb-2 font-bold">
                    2. 변색되거나 퍼지지 않나요?
                  </h4>
                  <p className="text-gray-700">
                    시간이 지날수록 옅어질 뿐 붉은색, 푸른색, 녹색 등의 잔흔이
                    남지 않는 시술을 합니다. 자연스러운 회색, 회갈색의 음영으로
                    남아 소실됩니다. 다만, 발색 과정을 거친 이후에는 작업 첫날의
                    모습과는 다소 다를 수 있으며 자연스러운 소실이 아닌 억지로
                    제거하는 경우 다른 색으로 빠질 수 있습니다.
                  </p>
                </div>

                <div className="border-gray-200 border-b pb-4">
                  <h4 className="text-black mb-2 font-bold">
                    3. 수강하시나요?
                  </h4>
                  <p className="text-gray-700">
                    네. 수강합니다. <strong>3개월 ~ 6개월</strong>에 한번씩
                    합니다.
                  </p>
                </div>

                <div className="pb-4">
                  <h4 className="text-black mb-2 font-bold">
                    4. 왜 가격이 비싼가요?
                  </h4>
                  <p className="text-gray-700">
                    10만원~25만원 정도의 가격이 형성되어있는
                    엠보기법(=자연눈썹)과 비교하면 비싸게 느껴질 수 있지만
                    페더링, 헤어스트록 기법의 기본 가격은 30만원대부터 시작해
                    100만원대까지 있는 하이퀄리티 시술 기법 입니다. 기법이
                    다르기 때문에 가격도 다르고 그 이하의 가격은 이유가 있다고
                    생각합니다. 현존하는 눈썹 반영구 중 부작용, 피부 손상이 거의
                    없는 가장 최신의 기술로 시술해드리고 있으며 모든 재료는
                    국내에서 단 한 곳도 동일하게 사용하지 않는 최고급 재료를
                    직접 선별하고 골라 사용하여 어디에서도 볼 수 없는 눈썹 질감
                    표현과 털 표현을 선사합니다.
                  </p>
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>

        {/* 책임 면책 */}
        <div className="bg-gray-50 border-gray-200 mt-6 rounded-lg border p-4">
          <div className="flex items-start space-x-3">
            <Check className="text-gray-600 mt-1 h-5 w-5 flex-shrink-0" />
            <div>
              <p className="text-gray-700 font-medium">
                ✔️ 공지를 숙지하지 않아 생기는 문제에 대해서는 전혀 책임지지
                않습니다.
              </p>
            </div>
          </div>
        </div>

        {/* 버튼 영역 */}
        <div className="flex justify-center space-x-4 pt-6">
          {showViewAgain ? (
            <Button
              onClick={onClose}
              className="bg-gray-800 hover:bg-black rounded-lg px-8 py-3 font-semibold text-white"
            >
              닫기
            </Button>
          ) : (
            <Button
              onClick={onConfirm}
              className="bg-black hover:bg-gray-800 rounded-lg px-8 py-3 font-semibold text-white"
            >
              공지사항을 확인했습니다
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
