"use client";

import { useState, useEffect } from "react";
import { testUtils } from "@/lib/test-env";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Settings,
  Database,
  TestTube,
  RefreshCw,
  Trash2,
  Sprout,
} from "lucide-react";

export default function TestModeToggle() {
  const [isTestMode, setIsTestMode] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [lastAction, setLastAction] = useState<string | null>(null);

  useEffect(() => {
    setIsTestMode(testUtils.isLocalTestMode());
  }, []);

  const handleToggleTestMode = () => {
    setIsLoading(true);
    if (isTestMode) {
      testUtils.disableTestMode();
    } else {
      testUtils.enableTestMode();
    }
  };

  const handleSeedData = async () => {
    setIsLoading(true);
    setLastAction("seeding");
    try {
      await testUtils.seedTestData();
      setLastAction("seeded");
    } catch (error) {
      console.error("Error seeding data:", error);
      setLastAction("seed-error");
    } finally {
      setIsLoading(false);
    }
  };

  const handleClearData = async () => {
    if (
      !confirm("이 작업은 모든 테스트 데이터를 삭제합니다. 계속하시겠습니까?")
    ) {
      return;
    }

    setIsLoading(true);
    setLastAction("clearing");
    try {
      await testUtils.clearTestData();
      setLastAction("cleared");
    } catch (error) {
      console.error("Error clearing data:", error);
      setLastAction("clear-error");
    } finally {
      setIsLoading(false);
    }
  };

  // Don't show in production
  if (
    typeof window !== "undefined" &&
    !window.location.hostname.includes("localhost")
  ) {
    return null;
  }

  return (
    <Card className="w-80 shadow-lg fixed bottom-4 right-4 z-50 border-2">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-sm">
          <Settings className="h-4 w-4" />
          개발자 도구
          <Badge
            variant={isTestMode ? "destructive" : "default"}
            className="ml-auto"
          >
            {isTestMode ? "테스트 모드" : "프로덕션 모드"}
          </Badge>
        </CardTitle>
        <CardDescription className="text-xs">
          {isTestMode
            ? "🧪 테스트 환경 - 실제 데이터에 영향 없음"
            : "🔴 프로덕션 환경 - 실제 데이터 사용 중"}
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-3">
        {/* Environment Toggle */}
        <div className="space-y-2">
          <Button
            onClick={handleToggleTestMode}
            disabled={isLoading}
            variant={isTestMode ? "outline" : "default"}
            size="sm"
            className="w-full"
          >
            {isLoading ? (
              <RefreshCw className="animate-spin mr-2 h-3 w-3" />
            ) : (
              <Database className="mr-2 h-3 w-3" />
            )}
            {isTestMode ? "프로덕션 모드로 전환" : "테스트 모드로 전환"}
          </Button>
        </div>

        {/* Test Mode Actions */}
        {isTestMode && (
          <div className="space-y-2 border-t pt-2">
            <div className="text-gray-600 text-xs font-medium">
              테스트 데이터 관리
            </div>

            <div className="grid grid-cols-2 gap-2">
              <Button
                onClick={handleSeedData}
                disabled={isLoading}
                variant="outline"
                size="sm"
                className="text-green-600 border-green-200 hover:bg-green-50"
              >
                {isLoading && lastAction === "seeding" ? (
                  <RefreshCw className="animate-spin h-3 w-3" />
                ) : (
                  <Sprout className="h-3 w-3" />
                )}
                <span className="ml-1 text-xs">시드 데이터</span>
              </Button>

              <Button
                onClick={handleClearData}
                disabled={isLoading}
                variant="outline"
                size="sm"
                className="text-red-600 border-red-200 hover:bg-red-50"
              >
                {isLoading && lastAction === "clearing" ? (
                  <RefreshCw className="animate-spin h-3 w-3" />
                ) : (
                  <Trash2 className="h-3 w-3" />
                )}
                <span className="ml-1 text-xs">데이터 삭제</span>
              </Button>
            </div>

            {/* Status Messages */}
            {lastAction && (
              <div className="py-1 text-center text-xs">
                {lastAction === "seeded" && (
                  <span className="text-green-600">
                    ✅ 테스트 데이터가 생성되었습니다
                  </span>
                )}
                {lastAction === "cleared" && (
                  <span className="text-blue-600">
                    🧹 테스트 데이터가 삭제되었습니다
                  </span>
                )}
                {lastAction === "seed-error" && (
                  <span className="text-red-600">❌ 데이터 생성 실패</span>
                )}
                {lastAction === "clear-error" && (
                  <span className="text-red-600">❌ 데이터 삭제 실패</span>
                )}
              </div>
            )}
          </div>
        )}

        {/* Test Mode Features */}
        {isTestMode && (
          <div className="space-y-1 border-t pt-2">
            <div className="text-gray-600 text-xs font-medium">
              활성화된 테스트 기능
            </div>
            <div className="flex flex-wrap gap-1">
              <Badge variant="secondary" className="text-xs">
                <TestTube className="mr-1 h-2 w-2" />
                더블 부킹 테스트
              </Badge>
              <Badge variant="secondary" className="text-xs">
                <Settings className="mr-1 h-2 w-2" />
                모든 제한 우회
              </Badge>
              <Badge variant="secondary" className="text-xs">
                <Database className="mr-1 h-2 w-2" />
                독립 DB
              </Badge>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
