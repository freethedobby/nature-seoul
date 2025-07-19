"use client";

import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import {
  createTestNotifications,
  clearAllNotifications,
} from "@/lib/test-notifications";
import { useState } from "react";

export default function NotificationTest() {
  const { user, isAdmin } = useAuth();
  const [isLoading, setIsLoading] = useState(false);

  const handleCreateTestNotifications = async () => {
    if (!user?.uid) return;

    setIsLoading(true);
    try {
      await createTestNotifications(user.uid, isAdmin);
      alert("테스트 알림이 생성되었습니다!");
    } catch (error) {
      console.error("Error creating test notifications:", error);
      alert("알림 생성 중 오류가 발생했습니다.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleClearNotifications = async () => {
    setIsLoading(true);
    try {
      await clearAllNotifications();
      alert("모든 알림이 삭제되었습니다!");
    } catch (error) {
      console.error("Error clearing notifications:", error);
      alert("알림 삭제 중 오류가 발생했습니다.");
    } finally {
      setIsLoading(false);
    }
  };

  if (!user) return null;

  return (
    <div className="bg-gray-50 rounded-lg border p-4">
      <h3 className="mb-4 text-lg font-semibold">알림 테스트</h3>
      <div className="space-y-2">
        <p className="text-gray-600 text-sm">
          현재 계정: {user.email} ({isAdmin ? "관리자" : "사용자"})
        </p>
        <div className="flex space-x-2">
          <Button
            onClick={handleCreateTestNotifications}
            disabled={isLoading}
            size="sm"
            variant="outline"
          >
            {isLoading ? "생성 중..." : "테스트 알림 생성"}
          </Button>
          <Button
            onClick={handleClearNotifications}
            disabled={isLoading}
            size="sm"
            variant="outline"
          >
            {isLoading ? "삭제 중..." : "모든 알림 삭제"}
          </Button>
        </div>
        <p className="text-gray-500 text-xs">
          * 테스트용 알림을 생성하여 알림 기능을 확인할 수 있습니다.
        </p>
      </div>
    </div>
  );
}
