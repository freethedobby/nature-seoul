"use client";

import { useEffect, useState, useRef } from "react";
import { DayPicker } from "react-day-picker";
import "react-day-picker/dist/style.css";
import { ko } from "date-fns/locale";
import { db } from "@/lib/firebase";
import { createNotification } from "@/lib/notifications";
import { event } from "@/lib/gtag";
import { isTestMode } from "@/lib/utils";
import {
  collection,
  doc,
  updateDoc,
  onSnapshot,
  query,
  where,
  getDoc,
  runTransaction,
} from "firebase/firestore";
import Link from "next/link";
import { useRouter } from "next/navigation";
import React from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import CountdownTimer from "@/components/CountdownTimer";
import {
  Calendar,
  Clock,
  CreditCard,
  AlertCircle,
  Check,
  Eye,
} from "lucide-react";

interface SlotData {
  id: string;
  start: Date;
  end: Date;
  status: "available" | "booked";
}

interface ReservationData {
  id: string;
  slotId: string;
  userId: string;
  userEmail: string;
  userName?: string;
  date?: string;
  time?: string;
  status:
    | "pending"
    | "payment_required"
    | "payment_confirmed"
    | "approved"
    | "rejected"
    | "cancelled";
  paymentConfirmed?: boolean;
  paymentConfirmedAt?: Date;
  createdAt: Date;
  paymentDeadline?: Date;
}

export default function UserReservePage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [slots, setSlots] = useState<SlotData[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [currentMonth, setCurrentMonth] = useState<Date>(new Date());
  const [loading, setLoading] = useState(true);
  const [reservation, setReservation] = useState<ReservationData | null>(null);
  const [allReservations, setAllReservations] = useState<ReservationData[]>([]); // 모든 예약 데이터
  const [showReserveBtn, setShowReserveBtn] = useState<string | null>(null);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [confirmPosition, setConfirmPosition] = useState({ x: 0, y: 0 });
  const [pendingSlot, setPendingSlot] = useState<SlotData | null>(null);
  const [reserving, setReserving] = useState(false);
  const [canceling, setCanceling] = useState(false);
  const [confirmingPayment, setConfirmingPayment] = useState(false);
  const [monthRangeSettings, setMonthRangeSettings] = useState({
    startYear: new Date().getFullYear(),
    startMonth: new Date().getMonth() + 1,
    endYear: new Date().getFullYear(),
    endMonth: new Date().getMonth() + 1,
  });
  const [showMonthRangeMessage, setShowMonthRangeMessage] = useState(false);
  const [monthRangeMessage, setMonthRangeMessage] = useState("");

  // 예약 오픈 기간 설정
  const [reservationOpenSettings, setReservationOpenSettings] = useState({
    startDate: "",
    startTime: "",
    endDate: "",
    endTime: "",
  });
  const [isReservationOpen, setIsReservationOpen] = useState(false);
  const [timeUntilReservationOpen, setTimeUntilReservationOpen] = useState<
    number | null
  >(null);
  const [timeUntilReservationClose, setTimeUntilReservationClose] = useState<
    number | null
  >(null);

  const popupRef = useRef<HTMLDivElement | null>(null);
  const confirmRef = useRef<HTMLDivElement | null>(null);

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

  // Check KYC authorization
  useEffect(() => {
    if (!authLoading && user) {
      if (user.kycStatus !== "approved") {
        router.push("/dashboard?message=kyc_required");
        return;
      }
    }
  }, [user, authLoading, router]);

  // Load month range settings
  useEffect(() => {
    const loadMonthRangeSettings = async () => {
      try {
        const settingsDoc = await getDoc(doc(db, "settings", "monthRange"));
        if (settingsDoc.exists()) {
          const settings = settingsDoc.data();
          const currentDate = new Date();
          const defaultYear = currentDate.getFullYear();
          const defaultMonth = currentDate.getMonth() + 1;

          const newSettings = {
            startYear: settings.startYear || defaultYear,
            startMonth: settings.startMonth || defaultMonth,
            endYear: settings.endYear || defaultYear,
            endMonth: settings.endMonth || defaultMonth,
          };
          setMonthRangeSettings(newSettings);

          // 현재 월이 허용 범위 밖이면 허용 범위의 첫 번째 월로 이동
          const today = new Date();
          const minMonth = new Date(
            newSettings.startYear,
            newSettings.startMonth - 1,
            1
          );

          // 현재 월이 허용 범위에 없으면 허용 범위의 시작월로 이동
          const currentYearMonth =
            today.getFullYear() * 100 + (today.getMonth() + 1);
          const minYearMonth =
            newSettings.startYear * 100 + newSettings.startMonth;
          const maxYearMonth = newSettings.endYear * 100 + newSettings.endMonth;

          if (
            currentYearMonth < minYearMonth ||
            currentYearMonth > maxYearMonth
          ) {
            setCurrentMonth(minMonth);
          }
        }
      } catch (error) {
        console.error("Error loading month range settings:", error);
        // 기본값 유지
      }
    };

    loadMonthRangeSettings();
  }, []);

  // 예약 오픈 기간 로드 및 타이머 관리
  useEffect(() => {
    const loadReservationOpenSettings = async () => {
      try {
        const settingsDoc = await getDoc(
          doc(db, "settings", "reservationOpen")
        );
        if (settingsDoc.exists()) {
          const settings = settingsDoc.data();
          const newSettings = {
            startDate: settings.startDate || "",
            startTime: settings.startTime || "",
            endDate: settings.endDate || "",
            endTime: settings.endTime || "",
          };
          setReservationOpenSettings(newSettings);
        }
      } catch (error) {
        console.error("Error loading reservation open settings:", error);
      }
    };

    loadReservationOpenSettings();
  }, []);

  // 예약 오픈 상태 체크 및 타이머 업데이트
  useEffect(() => {
    if (
      !reservationOpenSettings.startDate ||
      !reservationOpenSettings.endDate
    ) {
      // 설정이 없으면 항상 오픈 상태로 설정
      setIsReservationOpen(true);
      setTimeUntilReservationOpen(null);
      setTimeUntilReservationClose(null);
      return;
    }

    const checkReservationOpenStatus = () => {
      const now = new Date();
      const startDateTime = new Date(
        `${reservationOpenSettings.startDate}T${reservationOpenSettings.startTime}`
      );
      const endDateTime = new Date(
        `${reservationOpenSettings.endDate}T${reservationOpenSettings.endTime}`
      );

      const currentTime = now.getTime();
      const startTime = startDateTime.getTime();
      const endTime = endDateTime.getTime();

      if (currentTime < startTime) {
        // 아직 시작 전
        setIsReservationOpen(false);
        setTimeUntilReservationOpen(startTime - currentTime);
        setTimeUntilReservationClose(null);
      } else if (currentTime >= startTime && currentTime <= endTime) {
        // 오픈 중
        setIsReservationOpen(true);
        setTimeUntilReservationOpen(null);
        setTimeUntilReservationClose(endTime - currentTime);
      } else {
        // 마감됨
        setIsReservationOpen(false);
        setTimeUntilReservationOpen(null);
        setTimeUntilReservationClose(null);
      }
    };

    checkReservationOpenStatus();
    const interval = setInterval(checkReservationOpenStatus, 1000);

    return () => clearInterval(interval);
  }, [reservationOpenSettings]);

  // Map: yyyy-mm-dd string -> count of available slots only
  // Only show future dates for users (current date and later)
  const slotCountByDate: Record<string, number> = {};
  const today = new Date();
  today.setHours(0, 0, 0, 0); // Start of today

  slots.forEach((slot) => {
    // 사용 가능한 슬롯만 카운팅 (예약된 슬롯은 사용자에게 숨김)
    if (slot.status !== "available") return;

    const d = slot.start;

    // Only include slots from today onwards for users
    if (d < today) return;

    const key =
      d.getFullYear() +
      "-" +
      String(d.getMonth() + 1).padStart(2, "0") +
      "-" +
      String(d.getDate()).padStart(2, "0");
    slotCountByDate[key] = (slotCountByDate[key] || 0) + 1;
  });

  // Real-time slot updates
  useEffect(() => {
    setLoading(true);
    const unsub = onSnapshot(collection(db, "slots"), (snap) => {
      const slotList: SlotData[] = [];
      snap.forEach((doc) => {
        const data = doc.data();
        slotList.push({
          id: doc.id,
          start: data.start.toDate(),
          end: data.end.toDate(),
          status: data.status,
        });
      });
      setSlots(slotList);
      setLoading(false);
    });

    return () => unsub();
  }, []);

  // Real-time reservation updates
  useEffect(() => {
    if (!user) return;

    const unsub = onSnapshot(
      query(collection(db, "reservations"), where("userId", "==", user.uid)),
      (snap) => {
        if (snap.empty) {
          setReservation(null);
          return;
        }

        // 모든 예약을 가져온 후 클라이언트에서 필터링
        const activeReservations = snap.docs
          .map((doc) => {
            const data = doc.data();
            return {
              id: doc.id,
              data: data,
              createdAt:
                data.createdAt?.toDate?.() ||
                new Date(data.createdAt || Date.now()),
            };
          })
          .filter(
            (reservation) =>
              reservation.data.status !== "cancelled" &&
              reservation.data.status !== "rejected"
          )
          .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

        console.log("활성 예약 목록:", activeReservations);

        if (activeReservations.length === 0) {
          setReservation(null);
          return;
        }

        // 가장 최근 예약 선택
        const latestReservation = activeReservations[0];
        const data = latestReservation.data;

        console.log("선택된 최근 예약:", latestReservation);
        console.log("Firestore에서 가져온 원본 데이터:", data);

        // paymentDeadline 처리 로직 개선
        let paymentDeadline: Date | null = null;

        if (data.paymentDeadline) {
          if (data.paymentDeadline.toDate) {
            paymentDeadline = data.paymentDeadline.toDate();
          } else if (data.paymentDeadline instanceof Date) {
            paymentDeadline = data.paymentDeadline;
          } else if (typeof data.paymentDeadline === "number") {
            paymentDeadline = new Date(data.paymentDeadline);
          }
        }

        // paymentDeadline이 없으면 createdAt + 30분으로 생성
        if (!paymentDeadline && data.createdAt) {
          const createdAt = data.createdAt.toDate
            ? data.createdAt.toDate()
            : new Date(data.createdAt);
          paymentDeadline = new Date(createdAt.getTime() + 30 * 60 * 1000);
          console.log("paymentDeadline이 없어서 생성:", paymentDeadline);
        }

        const reservationData: ReservationData = {
          id: latestReservation.id,
          slotId: data.slotId,
          userId: data.userId,
          userEmail: data.userEmail,
          userName: data.userName,
          date: data.date,
          time: data.time,
          status: data.status,
          paymentConfirmed: data.paymentConfirmed,
          paymentConfirmedAt:
            data.paymentConfirmedAt?.toDate?.() || data.paymentConfirmedAt,
          createdAt: data.createdAt?.toDate?.() || new Date(),
          paymentDeadline: paymentDeadline || undefined,
        };

        // 취소된 예약인 경우 reservation을 null로 설정하여 예약하기 버튼 표시
        if (reservationData.status === "cancelled") {
          setReservation(null);
        } else {
          console.log("예약 데이터 설정:", {
            id: reservationData.id,
            status: reservationData.status,
            paymentDeadline: reservationData.paymentDeadline,
            createdAt: reservationData.createdAt,
          });
          setReservation(reservationData);
        }
      }
    );

    return () => unsub();
  }, [user]);

  // 모든 예약 데이터 가져오기 (선택된 날짜의 슬롯 예약 상태 확인용)
  useEffect(() => {
    if (!selectedDate) {
      setAllReservations([]);
      return;
    }

    const unsub = onSnapshot(
      query(
        collection(db, "reservations"),
        where("status", "in", [
          "pending",
          "payment_required",
          "payment_confirmed",
          "approved",
        ]) // 활성 예약만 가져오기 (cancelled 제외)
      ),
      (snap) => {
        const reservationList: ReservationData[] = [];
        snap.forEach((doc) => {
          const data = doc.data();
          reservationList.push({
            id: doc.id,
            slotId: data.slotId,
            userId: data.userId,
            userEmail: data.userEmail,
            userName: data.userName,
            date: data.date,
            time: data.time,
            status: data.status,
            paymentConfirmed: data.paymentConfirmed,
            paymentConfirmedAt:
              data.paymentConfirmedAt?.toDate?.() || data.paymentConfirmedAt,
            createdAt: data.createdAt?.toDate?.() || new Date(),
            paymentDeadline:
              data.paymentDeadline?.toDate?.() || data.paymentDeadline,
          });
        });
        setAllReservations(reservationList);
      }
    );

    return () => unsub();
  }, [selectedDate]);

  // Click away handler for popup
  useEffect(() => {
    function handleClickAway(e: MouseEvent | TouchEvent) {
      if (popupRef.current && !popupRef.current.contains(e.target as Node)) {
        setShowReserveBtn(null);
      }
      // 확정 다이얼로그도 외부 클릭 시 닫기
      if (
        confirmRef.current &&
        !confirmRef.current.contains(e.target as Node)
      ) {
        setShowConfirmDialog(false);
        setPendingSlot(null);
      }
    }

    document.addEventListener("mousedown", handleClickAway);
    document.addEventListener("touchstart", handleClickAway);

    return () => {
      document.removeEventListener("mousedown", handleClickAway);
      document.removeEventListener("touchstart", handleClickAway);
    };
  }, []);

  const handleReserve = async (slot: SlotData) => {
    if (!user) return;

    // 이미 활성 예약이 있는지 확인
    if (reservation && reservation.status !== "cancelled") {
      alert(
        "이미 활성 예약이 있습니다. 기존 예약을 취소한 후 새로운 예약을 진행해주세요."
      );
      return;
    }

    setReserving(true);
    try {
      // Create payment deadline (30 minutes from now)
      const paymentDeadline = new Date();
      paymentDeadline.setMinutes(paymentDeadline.getMinutes() + 30);

      const reservationData = {
        slotId: slot.id,
        userId: user.uid,
        userEmail: user.email || "",
        userName: user.displayName || "",
        date: slot.start.toLocaleDateString("ko-KR"),
        time: slot.start.toLocaleTimeString("ko-KR", {
          hour: "2-digit",
          minute: "2-digit",
        }),
        status: "payment_required" as const,
        createdAt: new Date(),
        paymentDeadline: paymentDeadline,
      };

      // Use transaction to prevent race conditions
      const result = await runTransaction(db, async (transaction) => {
        // First, check if slot is still available
        const slotRef = doc(db, "slots", slot.id);
        const slotDoc = await transaction.get(slotRef);

        if (!slotDoc.exists()) {
          throw new Error("슬롯을 찾을 수 없습니다.");
        }

        const slotData = slotDoc.data();
        if (slotData.status !== "available") {
          throw new Error("이미 예약된 슬롯입니다.");
        }

        // Note: We rely on the slot status check above as the primary prevention
        // since transactions can't use queries for additional validation

        // Create reservation document
        const reservationRef = doc(collection(db, "reservations"));
        transaction.set(reservationRef, reservationData);

        // Update slot status atomically
        transaction.update(slotRef, {
          status: "booked",
        });

        return { reservationId: reservationRef.id };
      });

      // Create admin notification (outside transaction for performance)
      await createNotification({
        userId: "admin",
        type: "admin_reservation_new",
        title: "새로운 예약 요청",
        message: `${user.displayName || user.email}님이 ${
          reservationData.date
        } ${reservationData.time}에 예약을 요청했습니다.`,
      });

      // Immediately update the reservation state with the new reservation
      const newReservation: ReservationData = {
        id: result.reservationId,
        ...reservationData,
      };
      setReservation(newReservation);

      // Google Analytics 이벤트 트래킹
      event({
        action: "reservation_submit",
        category: "engagement",
        label: "Reservation Complete",
        value: 1,
      });

      setShowReserveBtn(null);
    } catch (error) {
      console.error("Reservation error:", error);
      if (error instanceof Error) {
        if (error.message === "이미 예약된 슬롯입니다.") {
          alert(
            "죄송합니다. 다른 사용자가 이미 이 시간을 예약했습니다. 다른 시간을 선택해 주세요."
          );
        } else {
          alert(`예약 중 오류가 발생했습니다: ${error.message}`);
        }
      } else {
        alert("예약 중 오류가 발생했습니다. 다시 시도해 주세요.");
      }
    } finally {
      setReserving(false);
    }
  };

  const handleConfirmPayment = async () => {
    if (!reservation) return;

    setConfirmingPayment(true);
    try {
      await updateDoc(doc(db, "reservations", reservation.id), {
        status: "payment_confirmed",
        paymentConfirmed: true,
        paymentConfirmedAt: new Date(),
      });

      // Create admin notification
      await createNotification({
        userId: "admin",
        type: "admin_reservation_new",
        title: "입금 확인 요청",
        message: `${
          user?.displayName || user?.email
        }님이 입금 확인을 요청했습니다.`,
      });

      alert("입금 확인 요청이 완료되었습니다.");
    } catch (error) {
      console.error("입금 확인 요청 실패:", error);
      alert("입금 확인 요청에 실패했습니다. 다시 시도해주세요.");
    } finally {
      setConfirmingPayment(false);
    }
  };

  const handleCancel = async () => {
    if (!reservation || !user) return;

    if (!confirm("정말로 예약을 취소하시겠습니까?")) return;

    setCanceling(true);
    try {
      await updateDoc(doc(db, "reservations", reservation.id), {
        status: "cancelled",
      });

      // Free up the slot
      await updateDoc(doc(db, "slots", reservation.slotId), {
        status: "available",
      });

      const reservationDate = reservation.date;
      const reservationTime = reservation.time;

      // Create admin notification
      await createNotification({
        userId: "admin",
        type: "admin_reservation_cancelled",
        title: "예약 취소",
        message: `${
          user.displayName || user.email
        }님이 ${reservationDate} ${reservationTime} 예약을 취소했습니다.`,
      });
    } catch {
      alert("예약 취소에 실패했습니다. 다시 시도해주세요.");
    } finally {
      setCanceling(false);
    }
  };

  // Handle countdown expiration
  const handleCountdownExpired = async () => {
    if (!reservation) return;

    try {
      await updateDoc(doc(db, "reservations", reservation.id), {
        status: "cancelled",
      });

      // Free up the slot
      await updateDoc(doc(db, "slots", reservation.slotId), {
        status: "available",
      });

      // Create admin notification
      await createNotification({
        userId: "admin",
        type: "admin_reservation_cancelled",
        title: "입금 시간 만료",
        message: `${
          user?.displayName || user?.email
        }님의 예약이 입금 시간 만료로 자동 취소되었습니다.`,
      });
    } catch (error) {
      console.error("자동 취소 실패:", error);
    }
  };

  // 랜덤 위치 계산 함수 (화면 내에서)
  const generateRandomPosition = () => {
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    const buttonWidth = 120; // 확정 버튼의 대략적인 너비
    const buttonHeight = 40; // 확정 버튼의 대략적인 높이

    // 화면 경계에서 버튼이 벗어나지 않도록 여백 확보
    const margin = 20;
    const maxX = viewportWidth - buttonWidth - margin;
    const maxY = viewportHeight - buttonHeight - margin;

    const x = Math.max(margin, Math.min(maxX, Math.random() * maxX));
    const y = Math.max(margin, Math.min(maxY, Math.random() * maxY));

    return { x, y };
  };

  // 1단계: 예약 확인 다이얼로그
  const handleReserveClick = (slot: SlotData) => {
    // 이미 활성 예약이 있는지 확인
    if (reservation && reservation.status !== "cancelled") {
      alert(
        "이미 활성 예약이 있습니다. 기존 예약을 취소한 후 새로운 예약을 진행해주세요."
      );
      return;
    }

    setPendingSlot(slot);
    setShowReserveBtn(null); // 1단계 다이얼로그 닫기
    setShowConfirmDialog(true);
    setConfirmPosition(generateRandomPosition());
  };

  // 2단계: 확정 버튼 클릭
  const handleConfirmReserve = async () => {
    if (!pendingSlot) return;
    setShowConfirmDialog(false);
    setPendingSlot(null);
    await handleReserve(pendingSlot);
  };

  // Show loading while checking authorization
  if (authLoading) {
    return (
      <div className="bg-gradient-to-br from-gray-50 flex min-h-screen items-center justify-center to-white">
        <div className="animate-spin border-gray-900 h-8 w-8 rounded-full border-b-2"></div>
      </div>
    );
  }

  // Show unauthorized message - 테스트 모드에서는 우회
  if (!user || (user.kycStatus !== "approved" && !isTestMode())) {
    return (
      <div className="bg-gradient-to-br from-gray-50 flex min-h-screen items-center justify-center to-white">
        <div className="text-center">
          <h2 className="text-gray-900 mb-2 text-xl font-semibold">
            접근 권한이 없습니다
          </h2>
          <p className="text-gray-600 mb-4">
            예약을 하려면 KYC 승인이 필요합니다.
          </p>
          <Link href="/dashboard">
            <Button variant="outline">내정보로 돌아가기</Button>
          </Link>
        </div>
      </div>
    );
  }

  const reservedSlot = reservation
    ? slots.find((s) => s.id === reservation.slotId)
    : null;
  const slotsForSelectedDay = selectedDate
    ? slots
        .filter(
          (slot) =>
            // 사용 가능한 슬롯만 표시 (예약된 슬롯은 사용자에게 숨김)
            slot.status === "available" &&
            slot.start.getDate() === selectedDate.getDate() &&
            slot.start.getMonth() === selectedDate.getMonth() &&
            slot.start.getFullYear() === selectedDate.getFullYear()
        )
        .sort((a, b) => a.start.getTime() - b.start.getTime()) // 시간순 정렬
    : [];

  // 예약 오픈 상태 체크 - 마감된 경우 (테스트 모드에서는 우회)
  if (!isReservationOpen && !timeUntilReservationOpen && !isTestMode()) {
    return (
      <div className="bg-gradient-to-br from-gray-50 min-h-screen to-white p-2 sm:p-4">
        <div className="container mx-auto max-w-7xl">
          {/* Header */}
          <div className="mb-6 flex items-center gap-2">
            <Link href="/dashboard">
              <button className="hover:bg-gray-50 text-gray-700 shadow-sm border-gray-200 rounded-full border bg-white px-4 py-2 text-sm font-semibold transition-all duration-200">
                내정보
              </button>
            </Link>
            <h1 className="text-gray-900 mb-0 font-sans text-2xl font-extrabold tracking-tight sm:text-3xl">
              예약하기
            </h1>
          </div>

          {/* 예약 마감 메시지 */}
          <div className="flex min-h-[60vh] items-center justify-center">
            <div className="border-gray-200 shadow-sm max-w-md rounded-2xl border bg-white p-8 text-center">
              <div className="mb-4">
                <AlertCircle className="text-gray-400 mx-auto h-16 w-16" />
              </div>
              <h2 className="text-gray-900 mb-3 text-xl font-semibold">
                예약 신청 마감
              </h2>
              <p className="text-gray-600 mb-4">
                예약 신청 기간이 마감되었습니다.
              </p>
              {reservationOpenSettings.startDate &&
                reservationOpenSettings.endDate && (
                  <div className="bg-gray-50 border-gray-200 text-gray-700 rounded-lg border p-3 text-sm">
                    신청 기간: {reservationOpenSettings.startDate}{" "}
                    {reservationOpenSettings.startTime} ~{" "}
                    {reservationOpenSettings.endDate}{" "}
                    {reservationOpenSettings.endTime}
                  </div>
                )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // 예약 오픈 대기 상태 (테스트 모드에서는 우회)
  if (!isReservationOpen && timeUntilReservationOpen && !isTestMode()) {
    return (
      <div className="bg-gradient-to-br from-gray-50 min-h-screen to-white p-2 sm:p-4">
        <div className="container mx-auto max-w-7xl">
          {/* Header */}
          <div className="mb-6 flex items-center gap-2">
            <Link href="/dashboard">
              <button className="hover:bg-gray-50 text-gray-700 shadow-sm border-gray-200 rounded-full border bg-white px-4 py-2 text-sm font-semibold transition-all duration-200">
                내정보
              </button>
            </Link>
            <h1 className="text-gray-900 mb-0 font-sans text-2xl font-extrabold tracking-tight sm:text-3xl">
              예약하기
            </h1>
          </div>

          {/* 예약 오픈 대기 메시지 */}
          <div className="flex min-h-[60vh] items-center justify-center">
            <div className="border-gray-200 shadow-sm max-w-md rounded-2xl border bg-white p-8 text-center">
              <div className="mb-4">
                <Clock className="text-blue-500 mx-auto h-16 w-16" />
              </div>
              <h2 className="text-gray-900 mb-3 text-xl font-semibold">
                예약 신청 오픈 예정
              </h2>
              <p className="text-gray-600 mb-4">예약 신청이 곧 시작됩니다.</p>
              <div className="bg-blue-50 border-blue-200 mb-4 rounded-lg border p-4">
                <p className="text-blue-900 text-lg font-bold">
                  {formatTime(timeUntilReservationOpen)}
                </p>
                <p className="text-blue-700 mt-1 text-sm">남은 시간</p>
              </div>
              {reservationOpenSettings.startDate &&
                reservationOpenSettings.startTime && (
                  <div className="bg-gray-50 border-gray-200 text-gray-700 rounded-lg border p-3 text-sm">
                    오픈 시간: {reservationOpenSettings.startDate}{" "}
                    {reservationOpenSettings.startTime}
                  </div>
                )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-br from-gray-50 min-h-screen to-white p-2 sm:p-4">
      <div className="container mx-auto max-w-7xl">
        {/* 테스트 모드 표시 */}
        {isTestMode() && (
          <div className="bg-yellow-50 border-yellow-200 mb-4 rounded-lg border p-3">
            <div className="flex items-center justify-center text-center">
              <Eye className="text-yellow-600 mr-2 h-4 w-4" />
              <span className="text-yellow-800 text-sm font-medium">
                🔧 개발 모드 - 모든 제한이 비활성화되었습니다
              </span>
            </div>
          </div>
        )}

        {/* 예약 오픈 중 - 마감 시간 표시 */}
        {timeUntilReservationClose && !isTestMode() && (
          <div className="bg-green-50 border-green-200 mb-4 rounded-lg border p-3">
            <div className="flex items-center justify-center text-center">
              <Check className="text-green-600 mr-2 h-4 w-4" />
              <span className="text-green-800 text-sm font-medium">
                예약 신청 오픈 중 - 마감까지:{" "}
                {formatTime(timeUntilReservationClose)}
              </span>
            </div>
          </div>
        )}

        {/* Header */}
        <div className="mb-6 flex items-center gap-2">
          <Link href="/dashboard">
            <button className="hover:bg-gray-50 text-gray-700 shadow-sm border-gray-200 rounded-full border bg-white px-4 py-2 text-sm font-semibold transition-all duration-200">
              내정보
            </button>
          </Link>
          <h1 className="text-gray-900 mb-0 font-sans text-2xl font-extrabold tracking-tight sm:text-3xl">
            예약하기
          </h1>
          <button
            className="bg-green-50 hover:bg-green-100 text-green-700 border-green-200 ml-auto rounded-full border px-4 py-2 text-sm font-semibold transition-all duration-200"
            onClick={() => {
              const today = new Date();
              setSelectedDate(today);
              setCurrentMonth(today);
            }}
            type="button"
          >
            오늘
          </button>
        </div>

        {/* Show user's reservation if exists */}
        {reservation &&
          (() => {
            console.log("예약 정보 표시 조건 확인:", {
              reservation: reservation,
              reservedSlot: reservedSlot,
              slots: slots,
            });
            return reservedSlot ? (
              <div className="mb-8">
                <div className="bg-gradient-to-r from-green-50 to-emerald-50 border-green-200 shadow-sm rounded-2xl border p-6">
                  <div className="mb-4 flex items-center space-x-3">
                    <div className="bg-green-100 rounded-full p-2">
                      <Calendar className="text-green-600 h-5 w-5" />
                    </div>
                    <div>
                      <h2 className="text-green-800 text-lg font-bold">
                        내 예약
                      </h2>
                      <p className="text-green-600 text-sm">
                        {reservedSlot.start.toLocaleDateString("ko-KR", {
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                        })}{" "}
                        {reservedSlot.start.toLocaleTimeString("ko-KR", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </p>
                    </div>
                  </div>

                  {/* 예약 상태에 따른 컨텐츠 */}
                  {(() => {
                    const shouldShow =
                      reservation.status === "payment_required" &&
                      reservation.paymentDeadline;
                    console.log("타이머 표시 조건 확인:", {
                      status: reservation.status,
                      paymentDeadline: reservation.paymentDeadline,
                      shouldShow: shouldShow,
                      reservation: reservation,
                    });
                    return shouldShow;
                  })() && (
                    <div className="space-y-4">
                      <div className="bg-gradient-to-r from-gray-50 to-slate-50 border-gray-200 shadow-sm rounded-xl border p-6">
                        <div className="mb-4 flex items-center space-x-3">
                          <div className="bg-black rounded-full p-2">
                            <CreditCard className="h-5 w-5 text-white" />
                          </div>
                          <div>
                            <h3 className="text-gray-900 text-lg font-semibold">
                              예약금 입금 안내
                            </h3>
                            <p className="text-gray-600 text-sm">
                              입금 후 확인 요청을 해주세요
                            </p>
                          </div>
                        </div>

                        {/* 카운트다운 타이머 통합 */}
                        <div className="mb-5">
                          <CountdownTimer
                            deadline={reservation.paymentDeadline!}
                            onExpired={handleCountdownExpired}
                            compact={true}
                            testMode={process.env.NODE_ENV === "development"}
                          />
                        </div>

                        <div className="border-gray-100 shadow-sm mb-5 rounded-lg border bg-white p-5">
                          <div className="mb-3 flex items-center justify-between">
                            <span className="text-gray-700 text-sm font-medium">
                              예약금
                            </span>
                            <span className="text-gray-900 text-xl font-bold">
                              200,000원
                            </span>
                          </div>
                          <div className="bg-gray-50 rounded-md p-3">
                            <div className="text-gray-600 mb-1 text-xs font-medium">
                              입금 계좌 정보
                            </div>
                            <div className="text-gray-800 font-mono text-sm">
                              100107985905
                            </div>
                            <div className="text-gray-500 text-xs">
                              예금주: 윤자연 (케이뱅크)
                            </div>
                          </div>
                          <div className="bg-blue-50 border-blue-200 mt-3 rounded-md border p-3">
                            <div className="flex items-start space-x-2">
                              <div className="bg-blue-100 rounded-full p-1">
                                <svg
                                  className="text-blue-600 h-3 w-3"
                                  fill="currentColor"
                                  viewBox="0 0 20 20"
                                >
                                  <path
                                    fillRule="evenodd"
                                    d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                                    clipRule="evenodd"
                                  />
                                </svg>
                              </div>
                              <div className="flex-1">
                                <p className="text-blue-800 text-xs font-medium">
                                  중요 안내
                                </p>
                                <p className="text-blue-700 mt-1 text-xs">
                                  신청자명과 입금자명이 같아야 입금처리
                                  확정됩니다
                                </p>
                              </div>
                            </div>
                          </div>
                        </div>

                        <button
                          className="bg-black hover:bg-gray-800 shadow-lg hover:shadow-xl w-full transform rounded-lg px-6 py-4 font-semibold text-white transition-all duration-200 hover:scale-[1.02] disabled:cursor-not-allowed disabled:opacity-50"
                          onClick={handleConfirmPayment}
                          disabled={confirmingPayment}
                        >
                          {confirmingPayment ? (
                            <div className="flex items-center justify-center space-x-2">
                              <div className="animate-spin h-4 w-4 rounded-full border-b-2 border-white"></div>
                              <span>처리중...</span>
                            </div>
                          ) : (
                            "입금확인요청"
                          )}
                        </button>
                      </div>
                    </div>
                  )}

                  {reservation.status === "payment_confirmed" && (
                    <div className="bg-gradient-to-r from-gray-50 to-slate-50 border-gray-200 rounded-xl border p-5">
                      <div className="mb-3 flex items-center space-x-3">
                        <div className="bg-black rounded-full p-2">
                          <Clock className="h-5 w-5 text-white" />
                        </div>
                        <div>
                          <h3 className="text-gray-800 text-lg font-semibold">
                            관리자 확인 대기
                          </h3>
                          <p className="text-gray-600 text-sm">
                            입금 확인 요청이 완료되었습니다
                          </p>
                        </div>
                      </div>
                      <p className="text-gray-600 text-sm">
                        관리자 확인 후 예약이 확정됩니다
                      </p>
                    </div>
                  )}

                  {reservation.status === "approved" && (
                    <div className="bg-gradient-to-r from-green-50 to-emerald-50 border-green-200 rounded-xl border p-5">
                      <div className="mb-3 flex items-center space-x-3">
                        <div className="bg-green-100 rounded-full p-2">
                          <Check className="text-green-600 h-5 w-5" />
                        </div>
                        <div>
                          <h3 className="text-green-800 text-lg font-semibold">
                            예약 확정
                          </h3>
                          <p className="text-green-600 text-sm">
                            예약이 확정되었습니다
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* 취소 버튼 */}
                  <div className="mt-4">
                    <button
                      className="bg-red-50 hover:bg-red-100 text-red-600 border-red-200 rounded-lg border px-4 py-2 text-sm font-semibold transition-all duration-200"
                      onClick={handleCancel}
                      disabled={canceling}
                    >
                      {canceling ? "취소 중..." : "예약 취소"}
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="mb-8">
                <div className="bg-yellow-50 border-yellow-200 rounded-xl border p-4">
                  <p className="text-yellow-800 text-sm">
                    예약된 슬롯을 찾을 수 없습니다. 관리자에게 문의해주세요.
                  </p>
                </div>
              </div>
            );
          })()}

        {/* Calendar Section */}
        <div className="shadow-lg mb-6 rounded-2xl bg-white p-6">
          <div className="mb-4 flex items-center justify-center">
            <h2 className="text-gray-800 text-xl font-bold">날짜 선택</h2>
          </div>

          {/* Month Range Message */}
          {showMonthRangeMessage && (
            <div className="bg-amber-50 border-amber-200 mb-4 rounded-lg border p-3 text-center">
              <div className="flex items-center justify-center gap-2">
                <AlertCircle className="text-amber-600 h-4 w-4" />
                <p className="text-amber-800 text-sm font-medium">
                  {monthRangeMessage}
                </p>
              </div>
            </div>
          )}

          {loading || authLoading ? (
            <div className="py-8 text-center">
              <div className="animate-spin border-gray-900 mx-auto mb-4 h-8 w-8 rounded-full border-b-2"></div>
              <p className="text-gray-600">로딩 중...</p>
            </div>
          ) : (
            <DayPicker
              mode="single"
              selected={selectedDate}
              onSelect={setSelectedDate}
              month={currentMonth}
              onMonthChange={(newMonth) => {
                if (newMonth) {
                  const today = new Date();
                  today.setDate(1); // 월의 첫날로 설정
                  today.setHours(0, 0, 0, 0);

                  const minMonth = new Date(
                    monthRangeSettings.startYear,
                    monthRangeSettings.startMonth - 1, // JavaScript month is 0-indexed
                    1
                  );
                  minMonth.setHours(0, 0, 0, 0);

                  const maxMonth = new Date(
                    monthRangeSettings.endYear,
                    monthRangeSettings.endMonth - 1, // JavaScript month is 0-indexed
                    1
                  );
                  maxMonth.setHours(0, 0, 0, 0);

                  // 설정된 월 범위 내에서만 이동 가능
                  if (newMonth >= minMonth && newMonth <= maxMonth) {
                    setCurrentMonth(newMonth);
                  } else {
                    // 허용되지 않은 달로 이동하려고 할 때 메시지 표시
                    let message = "";
                    if (newMonth < minMonth) {
                      message = "이전 달 예약은 마감입니다.";
                    } else if (newMonth > maxMonth) {
                      message = "다음 달 예약은 아직 오픈되지 않았습니다.";
                    }
                    setMonthRangeMessage(message);
                    setShowMonthRangeMessage(true);

                    // 3초 후 메시지 자동 숨김
                    setTimeout(() => {
                      setShowMonthRangeMessage(false);
                    }, 3000);
                  }
                }
              }}
              locale={ko}
              weekStartsOn={0}
              disabled={{ before: new Date(new Date().setHours(0, 0, 0, 0)) }}
              modifiers={{
                hasSlots: Object.keys(slotCountByDate)
                  .filter((d) => slotCountByDate[d] > 0)
                  .map((d) => new Date(d)),
                fullyBooked: (() => {
                  // 전체 슬롯이 있지만 예약 가능한 슬롯이 0개인 날짜들
                  const allSlotDates: Record<string, number> = {};
                  slots.forEach((slot) => {
                    const d = slot.start;
                    if (d < today) return;
                    const key =
                      d.getFullYear() +
                      "-" +
                      String(d.getMonth() + 1).padStart(2, "0") +
                      "-" +
                      String(d.getDate()).padStart(2, "0");
                    allSlotDates[key] = (allSlotDates[key] || 0) + 1;
                  });

                  return Object.keys(allSlotDates)
                    .filter(
                      (d) => !slotCountByDate[d] || slotCountByDate[d] === 0
                    )
                    .map((d) => new Date(d));
                })(),
              }}
              modifiersClassNames={{
                selected: "bg-blue-500 text-white rounded-lg",
                today: "bg-blue-100 text-blue-700 rounded-lg",
                hasSlots: "has-slots",
                fullyBooked: "fullyBooked",
              }}
              className="mx-auto w-full max-w-xs sm:max-w-md"
              styles={{
                caption: {
                  textAlign: "center",
                  fontSize: "1.5rem",
                  fontWeight: 700,
                  marginBottom: "1rem",
                },
                head_row: { fontWeight: 500, color: "#888" },
                cell: { padding: "0.5rem" },
                nav_button: {
                  color: "#666",
                },
                nav_button_previous: {
                  color: (() => {
                    const today = new Date();
                    today.setDate(1);
                    today.setHours(0, 0, 0, 0);
                    const prevMonth = new Date(currentMonth);
                    prevMonth.setMonth(prevMonth.getMonth() - 1);
                    prevMonth.setDate(1);
                    prevMonth.setHours(0, 0, 0, 0);
                    return prevMonth < today ? "#ccc" : "#666";
                  })(),
                },
                nav_button_next: {
                  color: (() => {
                    const maxMonth = new Date();
                    maxMonth.setMonth(maxMonth.getMonth() + 6);
                    maxMonth.setDate(1);
                    maxMonth.setHours(0, 0, 0, 0);
                    const nextMonth = new Date(currentMonth);
                    nextMonth.setMonth(nextMonth.getMonth() + 1);
                    nextMonth.setDate(1);
                    nextMonth.setHours(0, 0, 0, 0);
                    return nextMonth > maxMonth ? "#ccc" : "#666";
                  })(),
                },
              }}
              showOutsideDays={false}
              required={false}
            />
          )}
        </div>

        {/* Available Slots Section */}
        <div className="shadow-lg rounded-2xl bg-white p-6">
          <div className="mb-4 flex items-center space-x-2">
            <Clock className="text-gray-600 h-5 w-5" />
            <h2 className="text-gray-800 text-xl font-bold">예약 가능 슬롯</h2>
          </div>

          {selectedDate && slotsForSelectedDay.length === 0 && (
            <div className="py-8 text-center">
              <AlertCircle className="text-gray-400 mx-auto mb-4 h-12 w-12" />
              <p className="text-gray-500 text-lg">
                {(() => {
                  const selectedDateKey =
                    selectedDate.getFullYear() +
                    "-" +
                    String(selectedDate.getMonth() + 1).padStart(2, "0") +
                    "-" +
                    String(selectedDate.getDate()).padStart(2, "0");

                  // 전체 슬롯이 있는지 확인
                  const hasAnySlots = slots.some((slot) => {
                    const slotDateKey =
                      slot.start.getFullYear() +
                      "-" +
                      String(slot.start.getMonth() + 1).padStart(2, "0") +
                      "-" +
                      String(slot.start.getDate()).padStart(2, "0");
                    return slotDateKey === selectedDateKey;
                  });

                  if (hasAnySlots) {
                    return "해당 날짜는 예약이 마감되었습니다.";
                  } else {
                    return "이 날에는 예약 가능한 슬롯이 없습니다.";
                  }
                })()}
              </p>
            </div>
          )}

          {slotsForSelectedDay.length > 0 && (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
              {slotsForSelectedDay.map((slot) => {
                // 현재 사용자가 어떤 슬롯이든 활성 예약을 가지고 있는지 확인
                const hasAnyActiveReservation =
                  reservation && reservation.status !== "cancelled";

                // 현재 사용자가 이 슬롯을 예약했는지 확인
                const isBookedByCurrentUser =
                  reservation &&
                  reservation.slotId === slot.id &&
                  reservation.status !== "cancelled";

                // 이 슬롯에 대한 활성 예약이 있는지 확인 (다른 사용자 포함)
                const slotReservation = allReservations.find(
                  (r) => r.slotId === slot.id
                );

                // 확정된 예약이 있는지 확인
                const hasApprovedReservation =
                  slotReservation && slotReservation.status === "approved";

                // 시간이 지났는지 확인 (확정된 예약의 경우 시간이 지나면 재예약 가능)
                const isTimePassed = slot.start < new Date();

                // 다른 사용자가 예약했는지 확인 (확정된 예약이 아니거나 시간이 지난 경우)
                const isBookedByOthers =
                  slotReservation &&
                  slotReservation.userId !== user?.uid &&
                  (!hasApprovedReservation || !isTimePassed);

                // 예약 불가능한 경우: 현재 사용자가 활성 예약을 가지고 있거나, 다른 사용자가 예약했거나
                const isDisabled = hasAnyActiveReservation || isBookedByOthers;

                return (
                  <div key={slot.id} className="relative">
                    <button
                      className={`focus:ring-green-400 w-full rounded-xl border-2 px-4 py-3 text-sm font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 ${
                        hasAnyActiveReservation
                          ? "border-gray-200 bg-gray-50 text-gray-400 cursor-not-allowed"
                          : isBookedByCurrentUser
                          ? "border-blue-200 bg-blue-50 text-blue-600 cursor-not-allowed"
                          : isBookedByOthers
                          ? "border-red-200 bg-red-50 text-red-400 cursor-not-allowed"
                          : "border-green-200 text-green-700 hover:border-green-300 hover:bg-green-50 hover:shadow-md bg-white"
                      }`}
                      disabled={isDisabled}
                      onClick={() => !isDisabled && setShowReserveBtn(slot.id)}
                      title={
                        hasAnyActiveReservation
                          ? "이미 다른 예약이 있습니다."
                          : isBookedByCurrentUser
                          ? "이미 예약한 시간입니다."
                          : isBookedByOthers
                          ? hasApprovedReservation && !isTimePassed
                            ? "확정된 예약이 있습니다."
                            : "다른 사용자가 예약했습니다."
                          : "예약하기"
                      }
                    >
                      {slot.start.toLocaleTimeString("ko-KR", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </button>

                    {/* 예약 버튼 */}
                    {showReserveBtn === slot.id && !isDisabled && (
                      <div
                        ref={popupRef}
                        className="border-gray-200 shadow-xl absolute left-1/2 z-10 mt-2 min-w-[200px] -translate-x-1/2 rounded-xl border bg-white p-3"
                      >
                        <div className="mb-3 text-center">
                          <p className="text-gray-700 text-sm font-medium">
                            이 시간에 예약하시겠습니까?
                          </p>
                          <p className="text-gray-500 mt-1 text-xs">
                            {slot.start.toLocaleTimeString("ko-KR", {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </p>
                        </div>
                        <div className="flex space-x-2">
                          <button
                            className="bg-green-500 hover:bg-green-600 flex-1 rounded-lg px-3 py-2 text-sm font-semibold text-white transition-all duration-200"
                            onClick={() => handleReserveClick(slot)}
                            disabled={reserving}
                          >
                            예약
                          </button>
                          <button
                            className="bg-gray-100 hover:bg-gray-200 text-gray-700 flex-1 rounded-lg px-3 py-2 text-sm font-semibold transition-all duration-200"
                            onClick={() => setShowReserveBtn(null)}
                          >
                            취소
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* 2단계 확정 다이얼로그 */}
        {showConfirmDialog && (
          <div
            ref={confirmRef}
            className="shadow-2xl border-gray-200 fixed z-50 rounded-lg border bg-white p-4"
            style={{
              left: `${confirmPosition.x}px`,
              top: `${confirmPosition.y}px`,
              minWidth: "120px",
            }}
          >
            <div className="text-center">
              <p className="text-gray-700 mb-3 text-sm font-medium">
                확정하시겠습니까?
              </p>
              <button
                className="bg-red-500 hover:bg-red-600 rounded-lg px-4 py-2 text-sm font-semibold text-white transition-all duration-200"
                onClick={handleConfirmReserve}
                disabled={reserving}
              >
                {reserving ? "예약중..." : "확정"}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
