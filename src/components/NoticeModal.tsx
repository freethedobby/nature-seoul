"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  MapPin,
  Car,
  AlertTriangle,
  Info,
  DollarSign,
  Clock,
  X,
  Check,
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
  const [currentTab, setCurrentTab] = useState("important");
  const [viewedTabs, setViewedTabs] = useState<Set<string>>(
    new Set(["important"])
  );
  const [isFirstTimeUser, setIsFirstTimeUser] = useState(false);

  const tabs = ["important", "pricing", "location", "restrictions", "faq"];

  useEffect(() => {
    if (isOpen) {
      // showViewAgain이 false면 첫 승인 상태
      setIsFirstTimeUser(!showViewAgain);
      setCurrentTab("important");
      setViewedTabs(new Set(["important"]));
    }
  }, [isOpen, showViewAgain]);

  const handleTabChange = (tabValue: string) => {
    // 첫 승인 사용자는 탭 클릭으로 이동할 수 없음 (확인 버튼으로만 이동)
    // 기존 사용자만 자유롭게 탭 이동 가능
    if (!isFirstTimeUser) {
      setCurrentTab(tabValue);
    }
    // 첫 승인 사용자의 경우 tabValue는 무시됨 (disabled 탭들이므로)
  };

  const goToNextTab = () => {
    const currentIndex = tabs.indexOf(currentTab);
    if (currentIndex < tabs.length - 1) {
      const nextTab = tabs[currentIndex + 1];
      setCurrentTab(nextTab);
      setViewedTabs((prev) => new Set([...prev, nextTab]));
    }
  };

  const isTabAccessible = (tabValue: string) => {
    if (!isFirstTimeUser) return true;

    // 첫 승인 사용자는 모든 탭 클릭 비활성화
    console.log("Checking tab:", tabValue);
    return false;
  };

  const allTabsViewed = viewedTabs.size === tabs.length;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-h-[90vh] max-w-4xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-gray-900 text-xl font-semibold">
            예약 전 공지사항
          </DialogTitle>
        </DialogHeader>

        <Tabs
          value={currentTab}
          onValueChange={handleTabChange}
          className="w-full"
        >
          <TabsList className="bg-gray-50 grid w-full grid-cols-5">
            <TabsTrigger
              value="important"
              className={`relative text-xs font-medium ${
                !isTabAccessible("important")
                  ? "cursor-not-allowed opacity-50"
                  : ""
              } ${
                currentTab === "important" && isFirstTimeUser
                  ? "bg-blue-100"
                  : ""
              }`}
              disabled={!isTabAccessible("important")}
            >
              <div className="flex items-center gap-1">
                {viewedTabs.has("important") &&
                  isFirstTimeUser &&
                  currentTab !== "important" && (
                    <Check className="text-green-600 h-3 w-3" />
                  )}
                {currentTab === "important" && isFirstTimeUser && (
                  <span className="bg-blue-600 flex h-4 w-4 items-center justify-center rounded-full text-xs text-white">
                    1
                  </span>
                )}
                중요안내
              </div>
            </TabsTrigger>
            <TabsTrigger
              value="pricing"
              className={`relative text-xs font-medium ${
                !isTabAccessible("pricing")
                  ? "cursor-not-allowed opacity-50"
                  : ""
              } ${
                currentTab === "pricing" && isFirstTimeUser ? "bg-blue-100" : ""
              }`}
              disabled={!isTabAccessible("pricing")}
            >
              <div className="flex items-center gap-1">
                {viewedTabs.has("pricing") &&
                  isFirstTimeUser &&
                  currentTab !== "pricing" && (
                    <Check className="text-green-600 h-3 w-3" />
                  )}
                {currentTab === "pricing" && isFirstTimeUser && (
                  <span className="bg-blue-600 flex h-4 w-4 items-center justify-center rounded-full text-xs text-white">
                    2
                  </span>
                )}
                가격안내
              </div>
            </TabsTrigger>
            <TabsTrigger
              value="location"
              className={`relative text-xs font-medium ${
                !isTabAccessible("location")
                  ? "cursor-not-allowed opacity-50"
                  : ""
              } ${
                currentTab === "location" && isFirstTimeUser
                  ? "bg-blue-100"
                  : ""
              }`}
              disabled={!isTabAccessible("location")}
            >
              <div className="flex items-center gap-1">
                {viewedTabs.has("location") &&
                  isFirstTimeUser &&
                  currentTab !== "location" && (
                    <Check className="text-green-600 h-3 w-3" />
                  )}
                {currentTab === "location" && isFirstTimeUser && (
                  <span className="bg-blue-600 flex h-4 w-4 items-center justify-center rounded-full text-xs text-white">
                    3
                  </span>
                )}
                위치/주차
              </div>
            </TabsTrigger>
            <TabsTrigger
              value="restrictions"
              className={`relative text-xs font-medium ${
                !isTabAccessible("restrictions")
                  ? "cursor-not-allowed opacity-50"
                  : ""
              } ${
                currentTab === "restrictions" && isFirstTimeUser
                  ? "bg-blue-100"
                  : ""
              }`}
              disabled={!isTabAccessible("restrictions")}
            >
              <div className="flex items-center gap-1">
                {viewedTabs.has("restrictions") &&
                  isFirstTimeUser &&
                  currentTab !== "restrictions" && (
                    <Check className="text-green-600 h-3 w-3" />
                  )}
                {currentTab === "restrictions" && isFirstTimeUser && (
                  <span className="bg-blue-600 flex h-4 w-4 items-center justify-center rounded-full text-xs text-white">
                    4
                  </span>
                )}
                예약제한
              </div>
            </TabsTrigger>
            <TabsTrigger
              value="faq"
              className={`relative text-xs font-medium ${
                !isTabAccessible("faq") ? "cursor-not-allowed opacity-50" : ""
              } ${
                currentTab === "faq" && isFirstTimeUser ? "bg-blue-100" : ""
              }`}
              disabled={!isTabAccessible("faq")}
            >
              <div className="flex items-center gap-1">
                {viewedTabs.has("faq") &&
                  isFirstTimeUser &&
                  currentTab !== "faq" && (
                    <Check className="text-green-600 h-3 w-3" />
                  )}
                {currentTab === "faq" && isFirstTimeUser && (
                  <span className="bg-blue-600 flex h-4 w-4 items-center justify-center rounded-full text-xs text-white">
                    5
                  </span>
                )}
                FAQ
              </div>
            </TabsTrigger>
          </TabsList>

          {/* 중요 안내 탭 */}
          <TabsContent value="important" className="space-y-4">
            <div className="bg-white p-6">
              <div className="flex items-start space-x-3">
                <AlertTriangle className="text-amber-500 mt-0.5 h-5 w-5 flex-shrink-0" />
                <div>
                  <h3 className="text-gray-900 mb-4 text-lg font-semibold">
                    중요 안내
                  </h3>
                  <div className="text-gray-700 space-y-4">
                    <p className="text-base">
                      <span className="font-semibold">
                        시간은 넉넉히 2시간 잡고 방문해주세요.
                      </span>
                      <br />
                      <span className="text-gray-600 text-sm">
                        (리터치는 30분~1시간)
                      </span>
                    </p>
                    <div className="bg-amber-50 border-amber-200 rounded-lg border p-4">
                      <p className="text-amber-800 text-center text-sm font-medium">
                        잔흔 있는 경우 예약일 기준 최소 2개월 전부터 깨끗하게
                        제거 필수
                      </p>
                    </div>

                    {/* 환불 및 노쇼 정책 */}
                    <div className="bg-red-50 border-red-200 space-y-2 rounded-lg border p-4">
                      <div className="mb-2 flex items-center space-x-2">
                        <AlertTriangle className="text-red-500 h-4 w-4" />
                        <p className="text-red-800 text-sm font-semibold">
                          환불 및 노쇼 정책
                        </p>
                      </div>
                      <p className="text-red-700 text-sm font-medium">
                        • 작업을 받은 이후 환불 불가
                      </p>
                      <p className="text-red-700 text-sm font-medium">
                        • 당일 노쇼 시 예약금 전액 소멸
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* 첫 승인 사용자를 위한 네비게이션 */}
              {isFirstTimeUser && (
                <div className="mt-4 flex justify-center border-t pt-4">
                  <Button
                    onClick={goToNextTab}
                    className="bg-blue-600 hover:bg-blue-700 text-base px-8 py-3 font-medium text-white"
                  >
                    확인
                  </Button>
                </div>
              )}
            </div>
          </TabsContent>

          {/* 가격 안내 탭 */}
          <TabsContent value="pricing" className="space-y-4">
            <div className="bg-white p-6">
              <div className="mb-6 text-center">
                <h3 className="text-gray-900 mb-1 text-lg font-semibold">
                  가격 안내
                </h3>
              </div>

              <div className="space-y-6">
                <div className="border-gray-200 rounded-lg border p-5">
                  <div className="mb-3 flex items-center space-x-2">
                    <DollarSign className="text-gray-500 h-4 w-4" />
                    <h4 className="text-gray-900 font-semibold">
                      원모복원결눈썹 (=헤어스트록)
                    </h4>
                  </div>
                  <p className="text-gray-900 mb-2 text-2xl font-bold">
                    99만원
                  </p>
                  <p className="text-gray-600 text-sm">
                    모량 20% 이하, 또는 잔흔이 있는 경우 추가비용 20만원
                  </p>
                </div>

                <div className="border-gray-200 rounded-lg border p-5">
                  <div className="mb-4 flex items-center space-x-2">
                    <Clock className="text-gray-500 h-4 w-4" />
                    <h4 className="text-gray-900 font-semibold">
                      리터치 1회 비용 (마지막 작업일 기준)
                    </h4>
                  </div>
                  <div className="space-y-2">
                    <div className="border-gray-100 flex items-center justify-between border-b py-2">
                      <span className="text-gray-700 text-sm">60일 이내</span>
                      <span className="text-gray-900 font-semibold">
                        10만원
                      </span>
                    </div>
                    <div className="border-gray-100 flex items-center justify-between border-b py-2">
                      <span className="text-gray-700 text-sm">90일 이내</span>
                      <span className="text-gray-900 font-semibold">
                        20만원
                      </span>
                    </div>
                    <div className="border-gray-100 flex items-center justify-between border-b py-2">
                      <span className="text-gray-700 text-sm">120일 이내</span>
                      <span className="text-gray-900 font-semibold">
                        30만원
                      </span>
                    </div>
                    <div className="border-gray-100 flex items-center justify-between border-b py-2">
                      <span className="text-gray-700 text-sm">180일 이내</span>
                      <span className="text-gray-900 font-semibold">
                        50만원
                      </span>
                    </div>
                    <div className="flex items-center justify-between py-2">
                      <span className="text-gray-500 text-sm">6개월 이후</span>
                      <span className="text-gray-500 text-sm">정상가</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* 첫 승인 사용자를 위한 네비게이션 */}
              {isFirstTimeUser && (
                <div className="mt-4 flex justify-center border-t pt-4">
                  <Button
                    onClick={goToNextTab}
                    className="bg-blue-600 hover:bg-blue-700 text-base px-8 py-3 font-medium text-white"
                  >
                    확인
                  </Button>
                </div>
              )}
            </div>
          </TabsContent>

          {/* 위치/주차 탭 */}
          <TabsContent value="location" className="space-y-4">
            <div className="bg-white p-6">
              <div className="grid gap-6 md:grid-cols-2">
                <div className="border-gray-200 rounded-lg border p-5">
                  <div className="mb-3 flex items-center space-x-2">
                    <MapPin className="text-gray-500 h-5 w-5" />
                    <h4 className="text-gray-900 font-semibold">위치</h4>
                  </div>
                  <div className="text-gray-700 space-y-2">
                    <p className="text-sm">
                      <span className="font-medium">신용산역 5번 출구</span>{" "}
                      도보 1분
                    </p>
                    <p className="text-sm">
                      <span className="font-medium">용산역 1번 출구</span> 도보
                      5분
                    </p>
                    <p className="text-gray-500 mt-3 text-xs">
                      (상세 주소는 하루 전날 전송됩니다)
                    </p>
                  </div>
                </div>

                <div className="border-gray-200 rounded-lg border p-5">
                  <div className="mb-3 flex items-center space-x-2">
                    <Car className="text-gray-500 h-5 w-5" />
                    <h4 className="text-gray-900 font-semibold">주차</h4>
                  </div>
                  <div className="text-gray-700 space-y-2">
                    <p className="text-sm">건물 내 지하 유료 주차 가능</p>
                    <p className="text-sm">
                      <span className="font-medium">시간당 4천원</span>
                    </p>
                    <p className="text-sm">나가실 때 정산</p>
                  </div>
                </div>
              </div>

              {/* 첫 승인 사용자를 위한 네비게이션 */}
              {isFirstTimeUser && (
                <div className="mt-4 flex justify-center border-t pt-4">
                  <Button
                    onClick={goToNextTab}
                    className="bg-blue-600 hover:bg-blue-700 text-base px-8 py-3 font-medium text-white"
                  >
                    확인
                  </Button>
                </div>
              )}
            </div>
          </TabsContent>

          {/* 예약 제한 탭 */}
          <TabsContent value="restrictions" className="space-y-4">
            <div className="bg-white p-6">
              <div className="mb-5 flex items-center space-x-2">
                <X className="text-red-500 h-5 w-5" />
                <h3 className="text-gray-900 font-semibold">
                  예약/재예약 불가
                </h3>
              </div>

              <div className="space-y-4">
                <p className="text-gray-600 text-sm font-medium"></p>
                <ol className="text-gray-700 list-inside list-decimal space-y-3 text-sm">
                  <li>취소, 노쇼, 10분 이상 지각 고객님</li>
                  <li>
                    상대방을 존중하지 않는 언행을 하시는 고객님
                    <div className="text-gray-500 ml-4 mt-1 text-xs">
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

              {/* 첫 승인 사용자를 위한 네비게이션 */}
              {isFirstTimeUser && (
                <div className="mt-4 flex justify-center border-t pt-4">
                  <Button
                    onClick={goToNextTab}
                    className="bg-blue-600 hover:bg-blue-700 text-base px-8 py-3 font-medium text-white"
                  >
                    확인
                  </Button>
                </div>
              )}
            </div>
          </TabsContent>

          {/* FAQ 탭 */}
          <TabsContent value="faq" className="space-y-4">
            <div className="bg-white p-6">
              <div className="mb-5 flex items-center space-x-2">
                <Info className="text-gray-500 h-5 w-5" />
                <h3 className="text-gray-900 font-semibold">
                  자주 물으시는 질문
                </h3>
              </div>

              <div className="space-y-5">
                <div className="border-gray-200 border-b pb-4">
                  <h4 className="text-gray-900 mb-2 text-sm font-semibold">
                    1. 유지력이 어떻게 되나요?
                  </h4>
                  <p className="text-gray-700 text-sm">
                    사후 관리, 피부 타입에 따라 다르며 리터치까지 받으시면{" "}
                    <span className="font-medium">1년 ~ 3년 사이</span> 입니다.
                    오래가길 원하시면 처음부터 진하게 작업 가능하나 권장드리지
                    않습니다.
                  </p>
                </div>

                <div className="border-gray-200 border-b pb-4">
                  <h4 className="text-gray-900 mb-2 text-sm font-semibold">
                    2. 변색되거나 퍼지지 않나요?
                  </h4>
                  <p className="text-gray-700 text-sm">
                    시간이 지날수록 옅어질 뿐 붉은색, 푸른색, 녹색 등의 잔흔이
                    남지 않는 시술을 합니다. 자연스러운 회색, 회갈색의 음영으로
                    남아 소실됩니다. 다만, 발색 과정을 거친 이후에는 작업 첫날의
                    모습과는 다소 다를 수 있으며 자연스러운 소실이 아닌 억지로
                    제거하는 경우 다른 색으로 빠질 수 있습니다.
                  </p>
                </div>

                <div className="border-gray-200 border-b pb-4">
                  <h4 className="text-gray-900 mb-2 text-sm font-semibold">
                    3. 수강하시나요?
                  </h4>
                  <p className="text-gray-700 text-sm">
                    네. 수강합니다.{" "}
                    <span className="font-medium">3개월 ~ 6개월</span>에 한번씩
                    합니다.
                  </p>
                </div>

                <div className="pb-4">
                  <h4 className="text-gray-900 mb-2 text-sm font-semibold">
                    4. 왜 가격이 비싼가요?
                  </h4>
                  <p className="text-gray-700 text-sm">
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

              {/* 첫 승인 사용자를 위한 네비게이션 */}
              {isFirstTimeUser && (
                <div className="mt-4 flex justify-center border-t pt-4"></div>
              )}
            </div>
          </TabsContent>
        </Tabs>

        {/* 버튼 영역 */}
        <div className="flex flex-col items-center pt-6">
          {isFirstTimeUser && !allTabsViewed && (
            <p className="text-gray-600 mb-4 text-center text-sm">
              모든 공지사항을 확인한 후 예약을 진행할 수 있습니다. (
              {viewedTabs.size}/{tabs.length} 완료)
            </p>
          )}

          {showViewAgain ? (
            <Button
              onClick={onClose}
              className="bg-gray-800 hover:bg-gray-900 rounded-lg px-6 py-2 font-medium text-white"
            >
              닫기
            </Button>
          ) : (
            <Button
              onClick={onConfirm}
              disabled={isFirstTimeUser && !allTabsViewed}
              className={`rounded-lg px-6 py-2 font-medium text-white ${
                isFirstTimeUser && !allTabsViewed
                  ? "bg-gray-400 cursor-not-allowed"
                  : "bg-gray-900 hover:bg-black"
              }`}
            >
              {isFirstTimeUser && !allTabsViewed
                ? `공지사항 확인 중... (${viewedTabs.size}/${tabs.length})`
                : "공지사항을 확인했습니다"}
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
