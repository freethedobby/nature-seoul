"use client";

import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  MapPin,
  Calendar,
  Clock,
  ChevronRight,
  Maximize2,
  X,
} from "lucide-react";
import Image from "next/image";

interface LocationDisplayProps {
  reservation: {
    id: string;
    date?: string;
    time?: string;
    status?: string;
    slotId?: string;
    createdAt: Date;
  };
}

export default function LocationDisplay({ reservation }: LocationDisplayProps) {
  const [shouldShowLocation, setShouldShowLocation] = useState(false);
  const [timeUntilProcedure, setTimeUntilProcedure] = useState<string>("");
  const [isLocationDialogOpen, setIsLocationDialogOpen] = useState(false);
  const [isMapFullscreenOpen, setIsMapFullscreenOpen] = useState(false);

  useEffect(() => {
    const checkLocationVisibility = () => {
      if (
        reservation.status !== "approved" ||
        !reservation.date ||
        !reservation.time
      ) {
        setShouldShowLocation(false);
        return;
      }

      try {
        // Parse the Korean date format (e.g., "2025. 10. 28.")
        const dateMatch = reservation.date.match(
          /(\d{4})\.\s*(\d{1,2})\.\s*(\d{1,2})\./
        );
        if (!dateMatch) {
          console.warn("Could not parse reservation date:", reservation.date);
          return;
        }

        const [, year, month, day] = dateMatch;
        const procedureDate = new Date(
          parseInt(year),
          parseInt(month) - 1,
          parseInt(day)
        );

        // Parse time (e.g., "14:00")
        const timeMatch = reservation.time.match(/(\d{1,2}):(\d{2})/);
        if (timeMatch) {
          const [, hours, minutes] = timeMatch;
          procedureDate.setHours(parseInt(hours), parseInt(minutes), 0, 0);
        }

        const now = new Date();
        const oneDayBefore = new Date(procedureDate);
        oneDayBefore.setDate(oneDayBefore.getDate() - 1);

        const oneDayAfter = new Date(procedureDate);
        oneDayAfter.setDate(oneDayAfter.getDate() + 1);

        // Show location 1 day before procedure until 1 day after
        const shouldShow = now >= oneDayBefore && now <= oneDayAfter;
        setShouldShowLocation(shouldShow);

        // Calculate time until procedure
        if (now < procedureDate) {
          const timeDiff = procedureDate.getTime() - now.getTime();
          const days = Math.floor(timeDiff / (1000 * 60 * 60 * 24));
          const hours = Math.floor(
            (timeDiff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)
          );
          const minutes = Math.floor(
            (timeDiff % (1000 * 60 * 60)) / (1000 * 60)
          );

          if (days > 0) {
            setTimeUntilProcedure(`${days}일 ${hours}시간 후`);
          } else if (hours > 0) {
            setTimeUntilProcedure(`${hours}시간 ${minutes}분 후`);
          } else {
            setTimeUntilProcedure(`${minutes}분 후`);
          }
        } else {
          setTimeUntilProcedure("시술 진행 중 또는 완료");
        }
      } catch (error) {
        console.error("Error parsing reservation date/time:", error);
      }
    };

    checkLocationVisibility();
    const interval = setInterval(checkLocationVisibility, 60000); // Check every minute

    return () => clearInterval(interval);
  }, [reservation]);

  if (!shouldShowLocation) {
    return null;
  }

  return (
    <>
      {/* Collapsed Location Card */}
      <Card className="border-green-200 bg-green-50">
        <CardContent className="p-4">
          <Button
            variant="ghost"
            className="h-auto w-full justify-between p-0"
            onClick={() => setIsLocationDialogOpen(true)}
          >
            <div className="text-green-800 flex items-center gap-2">
              <MapPin className="h-5 w-5" />
              <span className="font-medium">시술 위치 안내</span>
            </div>
            <ChevronRight className="text-green-600 h-4 w-4" />
          </Button>

          {/* Small preview info */}
          <div className="text-green-700 mt-2 text-sm">
            <div className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              <span>{timeUntilProcedure}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Location Details Dialog */}
      <Dialog
        open={isLocationDialogOpen}
        onOpenChange={setIsLocationDialogOpen}
      >
        <DialogContent className="max-h-[80vh] max-w-md overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-green-800 flex items-center gap-2">
              <MapPin className="h-5 w-5" />
              시술 위치 안내
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            {/* Time until procedure */}
            <div className="text-green-700 flex items-center gap-2 text-sm">
              <Clock className="h-4 w-4" />
              <span className="font-medium">{timeUntilProcedure}</span>
            </div>

            {/* Procedure date and time */}
            <div className="text-green-700 flex items-center gap-2 text-sm">
              <Calendar className="h-4 w-4" />
              <span>
                {reservation.date || ""} {reservation.time || ""}
              </span>
            </div>

            {/* Address */}
            <div className="border-green-200 rounded-lg border bg-white p-4">
              <h4 className="text-green-800 mb-2 font-semibold">주소</h4>
              <p className="text-gray-700 font-medium">
                서울 용산구 새창로 217 토투밸리 1203호
              </p>
              <p className="text-gray-600 mt-1 text-sm">
                * 신용산역 5번 출구 바로 앞 오늘약국 건물입니다 :)
              </p>
            </div>

            {/* Map Image */}
            <div className="border-green-200 rounded-lg border bg-white p-4">
              <div className="mb-3 flex items-center justify-between">
                <h4 className="text-green-800 font-semibold">약도</h4>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsMapFullscreenOpen(true)}
                  className="flex items-center gap-1"
                >
                  <Maximize2 className="h-3 w-3" />
                  확대
                </Button>
              </div>
              <div className="relative mx-auto w-full">
                <Image
                  src="/nature_seoul_map.jpeg"
                  alt="Nature Seoul 위치 약도"
                  width={300}
                  height={300}
                  className="shadow-sm h-auto w-full cursor-pointer rounded-lg"
                  onClick={() => setIsMapFullscreenOpen(true)}
                  priority
                />
              </div>
              <p className="text-gray-500 mt-2 text-center text-xs">
                지도를 클릭하여 확대해서 보세요
              </p>
            </div>

            {/* Additional Info */}
            <div className="border-blue-200 bg-blue-50 rounded-lg border p-3">
              <p className="text-blue-800 text-sm font-medium">💡 방문 안내</p>
              <ul className="text-blue-700 mt-1 space-y-1 text-sm">
                <li>• 신용산역 5번 출구에서 도보 1분</li>
                <li>• 토투밸리 오피스텔 1203호</li>
                <li>• 궁금한 점이 있으시면 언제든 연락 주세요</li>
              </ul>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Fullscreen Map Dialog */}
      <Dialog open={isMapFullscreenOpen} onOpenChange={setIsMapFullscreenOpen}>
        <DialogContent className="bg-black/90 h-screen max-h-screen w-screen max-w-none p-0">
          <div className="relative flex h-full w-full items-center justify-center">
            <Button
              variant="ghost"
              size="sm"
              className="absolute top-4 right-4 z-10 bg-white/80 hover:bg-white"
              onClick={() => setIsMapFullscreenOpen(false)}
            >
              <X className="h-4 w-4" />
            </Button>

            <div className="relative flex h-full max-h-[90vh] w-full max-w-4xl items-center justify-center p-4">
              <Image
                src="/nature_seoul_map.jpeg"
                alt="Nature Seoul 위치 약도 (확대)"
                width={800}
                height={800}
                className="shadow-lg max-h-full max-w-full rounded-lg object-contain"
                priority
              />
            </div>

            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 transform rounded-lg bg-white/90 px-4 py-2">
              <p className="text-gray-800 text-sm font-medium">
                서울 용산구 새창로 217 토투밸리 1203호
              </p>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
