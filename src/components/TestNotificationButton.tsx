"use client";

import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";

export default function TestNotificationButton() {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);

  const createTestNotification = async () => {
    if (!user?.uid) {
      alert("로그인이 필요합니다.");
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch("/api/test-notification", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId: user.uid,
          userName: user.displayName || user.email,
        }),
      });

      const result = await response.json();

      if (result.success) {
        alert("테스트 알림이 생성되었습니다!");
        console.log("Test notification result:", result);
      } else {
        alert("테스트 알림 생성 실패: " + result.error);
        console.error("Test notification failed:", result);
      }
    } catch (error) {
      console.error("Test notification error:", error);
      alert("테스트 알림 생성 중 오류가 발생했습니다.");
    } finally {
      setIsLoading(false);
    }
  };

  // Only show in development environment
  if (!user || process.env.NODE_ENV !== "development") {
    return null;
  }

  return (
    <div className="bg-yellow-50 rounded-lg border p-4">
      <h3 className="text-yellow-800 mb-2 text-sm font-medium">
        🧪 테스트 도구 (개발용)
      </h3>
      <p className="text-yellow-700 mb-3 text-xs">
        KYC 반려 알림 테스트를 위한 버튼입니다.
      </p>
      <Button
        onClick={createTestNotification}
        disabled={isLoading}
        variant="outline"
        size="sm"
        className="text-yellow-700 border-yellow-300 hover:bg-yellow-100"
      >
        {isLoading ? "생성 중..." : "KYC 반려 알림 테스트"}
      </Button>
    </div>
  );
}
