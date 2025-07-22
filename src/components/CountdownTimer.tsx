"use client";

import { useState, useEffect } from "react";
import { Clock, AlertTriangle } from "lucide-react";

interface CountdownTimerProps {
  deadline: Date | { toDate: () => Date } | number; // Firestore Timestamp or Date or number
  onExpired: () => void;
  compact?: boolean; // For integration into payment guide box
}

export default function CountdownTimer({
  deadline,
  onExpired,
  compact = false,
}: CountdownTimerProps) {
  const [timeLeft, setTimeLeft] = useState<{
    hours: number;
    minutes: number;
    seconds: number;
  }>({ hours: 0, minutes: 0, seconds: 0 });

  const [isExpired, setIsExpired] = useState(false);

  useEffect(() => {
    const calculateTimeLeft = () => {
      const now = new Date().getTime();

      // Convert deadline to Date object if it's a Firestore Timestamp
      let deadlineTime: number;
      if (deadline && typeof deadline === "object" && "toDate" in deadline) {
        // Firestore Timestamp
        deadlineTime = deadline.toDate().getTime();
      } else if (
        deadline &&
        typeof deadline === "object" &&
        "getTime" in deadline
      ) {
        // Date object
        deadlineTime = (deadline as Date).getTime();
      } else if (deadline && typeof deadline === "number") {
        // Timestamp number
        deadlineTime = deadline;
      } else {
        // Invalid deadline
        console.error("Invalid deadline format:", deadline);
        setIsExpired(true);
        onExpired();
        return { hours: 0, minutes: 0, seconds: 0 };
      }

      const difference = deadlineTime - now;

      if (difference <= 0) {
        setIsExpired(true);
        onExpired();
        return { hours: 0, minutes: 0, seconds: 0 };
      }

      const hours = Math.floor(difference / (1000 * 60 * 60));
      const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((difference % (1000 * 60)) / 1000);

      return { hours, minutes, seconds };
    };

    // 초기 계산
    setTimeLeft(calculateTimeLeft());

    // 1초마다 업데이트
    const timer = setInterval(() => {
      const newTimeLeft = calculateTimeLeft();
      setTimeLeft(newTimeLeft);
    }, 1000);

    return () => clearInterval(timer);
  }, [deadline, onExpired]);

  const isWarning = timeLeft.hours === 0 && timeLeft.minutes < 30;
  const isCritical = timeLeft.hours === 0 && timeLeft.minutes < 10;

  if (isExpired) {
    return (
      <div className="bg-red-50 border-red-200 rounded-lg border p-4">
        <div className="flex items-center space-x-2">
          <AlertTriangle className="text-red-500 h-5 w-5" />
          <span className="text-red-700 font-semibold">
            입금 시간이 만료되었습니다
          </span>
        </div>
        <p className="text-red-600 mt-1 text-sm">
          예약이 자동으로 취소되었습니다.
        </p>
      </div>
    );
  }

  if (compact) {
    return (
      <div className="border-gray-200 shadow-sm rounded-lg border bg-white p-4">
        <div className="mb-3 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Clock
              className={`h-4 w-4 ${
                isCritical
                  ? "text-red-500"
                  : isWarning
                  ? "text-yellow-500"
                  : "text-gray-600"
              }`}
            />
            <span
              className={`text-sm font-medium ${
                isCritical
                  ? "text-red-700"
                  : isWarning
                  ? "text-yellow-700"
                  : "text-gray-700"
              }`}
            >
              입금 마감 시간
            </span>
          </div>
          {isWarning && (
            <span
              className={`rounded-full px-2 py-1 text-xs ${
                isCritical
                  ? "bg-red-100 text-red-700"
                  : "bg-yellow-100 text-yellow-700"
              }`}
            >
              {isCritical ? "긴급" : "주의"}
            </span>
          )}
        </div>

        <div className="flex items-center space-x-3">
          <div className="text-center">
            <div
              className={`text-2xl font-bold ${
                isCritical
                  ? "text-red-600"
                  : isWarning
                  ? "text-yellow-600"
                  : "text-gray-900"
              }`}
            >
              {String(timeLeft.hours).padStart(2, "0")}
            </div>
            <div className="text-gray-500 text-xs">시간</div>
          </div>
          <div className="text-gray-400 text-lg">:</div>
          <div className="text-center">
            <div
              className={`text-2xl font-bold ${
                isCritical
                  ? "text-red-600"
                  : isWarning
                  ? "text-yellow-600"
                  : "text-gray-900"
              }`}
            >
              {String(timeLeft.minutes).padStart(2, "0")}
            </div>
            <div className="text-gray-500 text-xs">분</div>
          </div>
          <div className="text-gray-400 text-lg">:</div>
          <div className="text-center">
            <div
              className={`text-2xl font-bold ${
                isCritical
                  ? "text-red-600"
                  : isWarning
                  ? "text-yellow-600"
                  : "text-gray-900"
              }`}
            >
              {String(timeLeft.seconds).padStart(2, "0")}
            </div>
            <div className="text-gray-500 text-xs">초</div>
          </div>
        </div>

        {isWarning && (
          <p
            className={`mt-2 text-xs ${
              isCritical ? "text-red-600" : "text-yellow-600"
            }`}
          >
            {isCritical
              ? "⚠️ 긴급: 입금 시간이 곧 만료됩니다!"
              : "⏰ 입금 시간이 얼마 남지 않았습니다."}
          </p>
        )}
      </div>
    );
  }

  return (
    <div
      className={`rounded-lg border p-4 ${
        isCritical
          ? "bg-red-50 border-red-200"
          : isWarning
          ? "bg-yellow-50 border-yellow-200"
          : "bg-gray-50 border-gray-200"
      }`}
    >
      <div className="mb-2 flex items-center space-x-2">
        <Clock
          className={`h-5 w-5 ${
            isCritical
              ? "text-red-500"
              : isWarning
              ? "text-yellow-500"
              : "text-gray-600"
          }`}
        />
        <span
          className={`font-semibold ${
            isCritical
              ? "text-red-700"
              : isWarning
              ? "text-yellow-700"
              : "text-gray-700"
          }`}
        >
          입금 마감 시간
        </span>
      </div>

      <div className="flex items-center space-x-4">
        <div className="text-center">
          <div
            className={`text-2xl font-bold ${
              isCritical
                ? "text-red-600"
                : isWarning
                ? "text-yellow-600"
                : "text-gray-900"
            }`}
          >
            {String(timeLeft.hours).padStart(2, "0")}
          </div>
          <div className="text-gray-500 text-xs">시간</div>
        </div>
        <div className="text-gray-400 text-xl">:</div>
        <div className="text-center">
          <div
            className={`text-2xl font-bold ${
              isCritical
                ? "text-red-600"
                : isWarning
                ? "text-yellow-600"
                : "text-gray-900"
            }`}
          >
            {String(timeLeft.minutes).padStart(2, "0")}
          </div>
          <div className="text-gray-500 text-xs">분</div>
        </div>
        <div className="text-gray-400 text-xl">:</div>
        <div className="text-center">
          <div
            className={`text-2xl font-bold ${
              isCritical
                ? "text-red-600"
                : isWarning
                ? "text-yellow-600"
                : "text-gray-900"
            }`}
          >
            {String(timeLeft.seconds).padStart(2, "0")}
          </div>
          <div className="text-gray-500 text-xs">초</div>
        </div>
      </div>

      {isWarning && (
        <p
          className={`mt-2 text-sm ${
            isCritical ? "text-red-600" : "text-yellow-600"
          }`}
        >
          {isCritical
            ? "⚠️ 긴급: 입금 시간이 곧 만료됩니다!"
            : "⏰ 입금 시간이 얼마 남지 않았습니다."}
        </p>
      )}
    </div>
  );
}
