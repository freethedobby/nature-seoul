"use client";

import { useEffect, useState, useRef } from "react";
import { DayPicker } from "react-day-picker";
import "react-day-picker/dist/style.css";
import { ko } from "date-fns/locale";
import { db } from "@/lib/firebase";
import { createNotification } from "@/lib/notifications";
import {
  collection,
  doc,
  updateDoc,
  addDoc,
  onSnapshot,
  query,
  where,
  deleteDoc,
} from "firebase/firestore";
import Link from "next/link";
import { useRouter } from "next/navigation";
import React from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";

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
}

export default function UserReservePage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [slots, setSlots] = useState<SlotData[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [loading, setLoading] = useState(true);
  const [reservation, setReservation] = useState<ReservationData | null>(null);
  const [showReserveBtn, setShowReserveBtn] = useState<string | null>(null);
  const [reserving, setReserving] = useState(false);
  const [canceling, setCanceling] = useState(false);
  const [confirmingPayment, setConfirmingPayment] = useState(false);
  const popupRef = useRef<HTMLDivElement | null>(null);

  // Check KYC authorization
  useEffect(() => {
    if (!authLoading && user) {
      if (user.kycStatus !== "approved") {
        router.push("/dashboard?message=kyc_required");
        return;
      }
    }
  }, [user, authLoading, router]);

  // Map: yyyy-mm-dd string -> count of available slots (use local date)
  const slotCountByDate: Record<string, number> = {};
  slots.forEach((slot) => {
    if (slot.status !== "available") return;
    const d = slot.start;
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

  // Real-time reservation updates for this user
  useEffect(() => {
    if (!user) return;
    const q = query(
      collection(db, "reservations"),
      where("userId", "==", user.uid)
    );
    const unsub = onSnapshot(q, (snap) => {
      if (snap.empty) {
        setReservation(null);
      } else {
        const docData = snap.docs[0];
        setReservation({
          ...(docData.data() as ReservationData),
          id: docData.id,
          createdAt: docData.data().createdAt?.toDate?.() || new Date(),
        });
      }
    });
    return () => unsub();
  }, [user]);

  // Click-away handler for popup
  useEffect(() => {
    if (!showReserveBtn) return;
    function handleClickAway(e: MouseEvent | TouchEvent) {
      if (popupRef.current && !popupRef.current.contains(e.target as Node)) {
        setShowReserveBtn(null);
      }
    }
    document.addEventListener("mousedown", handleClickAway);
    document.addEventListener("touchstart", handleClickAway);
    return () => {
      document.removeEventListener("mousedown", handleClickAway);
      document.removeEventListener("touchstart", handleClickAway);
    };
  }, [showReserveBtn]);

  // Get slots for selected day
  const slotsForSelectedDay = slots.filter((slot) => {
    if (!selectedDate) return false;
    const slotDate = new Date(slot.start);
    return (
      slotDate.getFullYear() === selectedDate.getFullYear() &&
      slotDate.getMonth() === selectedDate.getMonth() &&
      slotDate.getDate() === selectedDate.getDate() &&
      slot.status === "available"
    );
  });

  // Find the reserved slot (if any)
  const reservedSlot = reservation
    ? slots.find((s) => s.id === reservation.slotId)
    : null;

  // Reservation handler
  const handleReserve = async (slot: SlotData) => {
    if (!user || reserving) return;
    setReserving(true);
    try {
      // Double-check: only allow if user has no reservation
      if (reservation) {
        alert("이미 예약이 있습니다. 취소 후 다시 시도하세요.");
        return;
      }
      // Mark slot as booked and create reservation
      await updateDoc(doc(db, "slots", slot.id), { status: "booked" });

      const reservationData = {
        slotId: slot.id,
        userId: user.uid,
        userEmail: user.email,
        userName: user.displayName || "",
        date: slot.start.toLocaleDateString("ko-KR", {
          year: "numeric",
          month: "long",
          day: "numeric",
        }),
        time: slot.start.toLocaleTimeString("ko-KR", {
          hour: "2-digit",
          minute: "2-digit",
        }),
        status: "payment_required",
        paymentConfirmed: false,
        createdAt: new Date(),
      };

      await addDoc(collection(db, "reservations"), reservationData);

      // Create notifications for user and admin
      const reservationDate = slot.start.toLocaleDateString("ko-KR", {
        year: "numeric",
        month: "long",
        day: "numeric",
      });
      const reservationTime = slot.start.toLocaleTimeString("ko-KR", {
        hour: "2-digit",
        minute: "2-digit",
      });

      // User notification - 입금 안내
      await createNotification({
        userId: user.uid,
        type: "payment_required",
        title: "예약금 입금 안내",
        message: `${reservationDate} ${reservationTime} 예약을 위해 예약금 30만원을 입금해주세요. 입금 후 '입금확인요청' 버튼을 눌러주세요.`,
      });

      // Admin notification
      await createNotification({
        userId: "admin",
        type: "admin_reservation_new",
        title: "새로운 예약 신청",
        message: `${
          user.displayName || user.email
        }님이 ${reservationDate} ${reservationTime}에 예약을 신청했습니다. 입금 확인 후 승인해주세요.`,
      });
      setShowReserveBtn(null);
    } catch {
      alert("예약에 실패했습니다. 다시 시도해주세요.");
    } finally {
      setReserving(false);
    }
  };

  // Confirm payment handler
  const handleConfirmPayment = async () => {
    if (!user || !reservation || confirmingPayment) return;
    setConfirmingPayment(true);
    try {
      // Update reservation status
      await updateDoc(doc(db, "reservations", reservation.id), {
        status: "payment_confirmed",
        paymentConfirmed: true,
        paymentConfirmedAt: new Date(),
      });

      // Create payment confirmation notifications
      const reservationDate = reservation.date || "미정";
      const reservationTime = reservation.time || "미정";

      // User notification
      await createNotification({
        userId: user.uid,
        type: "payment_confirmed",
        title: "입금 확인 요청 완료",
        message: `${reservationDate} ${reservationTime} 예약의 입금 확인을 요청했습니다. 관리자 확인 후 예약이 확정됩니다.`,
      });

      // Admin notification
      await createNotification({
        userId: "admin",
        type: "admin_reservation_new",
        title: "입금 확인 요청",
        message: `${
          user.displayName || user.email
        }님이 ${reservationDate} ${reservationTime} 예약의 입금 확인을 요청했습니다.`,
      });
    } catch {
      alert("입금 확인 요청에 실패했습니다. 다시 시도해주세요.");
    } finally {
      setConfirmingPayment(false);
    }
  };

  // Cancel reservation handler
  const handleCancel = async () => {
    if (!user || !reservation || canceling) return;
    setCanceling(true);
    try {
      // Mark slot as available
      await updateDoc(doc(db, "slots", reservation.slotId), {
        status: "available",
      });
      // Delete reservation
      await deleteDoc(doc(db, "reservations", reservation.id));

      // Create cancellation notifications
      const reservationDate = reservation.date || "미정";
      const reservationTime = reservation.time || "미정";

      // User notification
      await createNotification({
        userId: user.uid,
        type: "reservation_cancelled",
        title: "예약 취소",
        message: `${reservationDate} ${reservationTime} 예약이 취소되었습니다.`,
      });

      // Admin notification
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

  // Show loading while checking authorization
  if (authLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-white">
        <div className="animate-spin border-gray-900 h-8 w-8 rounded-full border-b-2"></div>
      </div>
    );
  }

  // Show unauthorized message
  if (!user || user.kycStatus !== "approved") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-white">
        <div className="text-center">
          <h2 className="text-gray-900 mb-2 text-xl font-semibold">
            접근 권한이 없습니다
          </h2>
          <p className="text-gray-600 mb-4">
            예약을 하려면 KYC 승인이 필요합니다.
          </p>
          <Link href="/dashboard">
            <Button variant="outline">대시보드로 돌아가기</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-br from-gray-50 min-h-screen to-white p-2 sm:p-4">
      <div className="container mx-auto max-w-7xl">
        <div className="mb-4 flex items-center gap-2">
          <Link href="/dashboard">
            <button className="bg-gray-100 hover:bg-gray-200 text-gray-700 shadow rounded-full px-4 py-2 text-sm font-semibold transition">
              대시보드로
            </button>
          </Link>
          <h1 className="text-gray-900 mb-0 font-sans text-2xl font-extrabold tracking-tight sm:text-3xl">
            예약하기
          </h1>
          <button
            className="bg-green-50 hover:bg-green-100 text-green-700 border-green-200 ml-auto rounded-full border px-4 py-2 text-sm font-semibold transition"
            onClick={() => setSelectedDate(new Date())}
            type="button"
          >
            오늘
          </button>
        </div>
        {/* Show user's reservation if exists */}
        {reservation && reservedSlot && (
          <div className="border-green-200 bg-green-50 text-green-800 mb-6 flex flex-col items-center gap-2 rounded-xl border p-4">
            <div className="font-semibold">내 예약</div>
            <div>
              {reservedSlot.start.toLocaleDateString("ko-KR", {
                year: "numeric",
                month: "long",
                day: "numeric",
              })}{" "}
              {reservedSlot.start.toLocaleTimeString("ko-KR", {
                hour: "2-digit",
                minute: "2-digit",
              })}
            </div>

            {/* 예약 상태에 따른 버튼 */}
            {reservation.status === "payment_required" && (
              <div className="text-center">
                <div className="bg-orange-100 border-orange-300 text-orange-800 mb-3 rounded-lg border p-3">
                  <div className="mb-2 font-semibold">💰 예약금 입금 안내</div>
                  <div className="mb-2 text-sm">
                    예약금 20만원을 입금해주세요
                  </div>
                  <div className="text-orange-600 text-xs">
                    입금 후 아래 버튼을 눌러주세요
                  </div>
                </div>
                <button
                  className="border-orange-400 bg-orange-500 hover:bg-orange-600 rounded-full border px-4 py-2 text-sm font-semibold text-white transition"
                  onClick={handleConfirmPayment}
                  disabled={confirmingPayment}
                >
                  {confirmingPayment ? "처리중..." : "입금확인요청"}
                </button>
              </div>
            )}

            {reservation.status === "payment_confirmed" && (
              <div className="text-center">
                <div className="bg-blue-100 border-blue-300 text-blue-800 mb-3 rounded-lg border p-3">
                  <div className="mb-2 font-semibold">⏳ 관리자 확인 대기</div>
                  <div className="text-sm">입금 확인 요청이 완료되었습니다</div>
                  <div className="text-blue-600 mt-1 text-xs">
                    관리자 확인 후 예약이 확정됩니다
                  </div>
                </div>
              </div>
            )}

            {reservation.status === "approved" && (
              <div className="text-center">
                <div className="bg-green-100 border-green-300 text-green-800 mb-3 rounded-lg border p-3">
                  <div className="mb-2 font-semibold">✅ 예약 확정</div>
                  <div className="text-sm">예약이 확정되었습니다</div>
                </div>
              </div>
            )}

            {reservation.status === "rejected" && (
              <div className="text-center">
                <div className="bg-red-100 border-red-300 text-red-800 mb-3 rounded-lg border p-3">
                  <div className="mb-2 font-semibold">❌ 예약 거절</div>
                  <div className="text-sm">예약이 거절되었습니다</div>
                </div>
              </div>
            )}

            <button
              className="border-green-400 text-green-700 hover:bg-green-100 mt-2 rounded-full border bg-white px-4 py-1 text-sm font-semibold"
              onClick={handleCancel}
              disabled={canceling}
            >
              예약 취소
            </button>
          </div>
        )}
        <div className="shadow flex flex-col items-center rounded-xl bg-white p-4">
          {loading || authLoading ? (
            <div className="py-8 text-center">로딩 중...</div>
          ) : (
            <DayPicker
              mode="single"
              selected={selectedDate}
              onSelect={setSelectedDate}
              locale={ko}
              weekStartsOn={0}
              disabled={{ before: new Date(new Date().setHours(0, 0, 0, 0)) }}
              modifiers={{
                hasSlots: Object.keys(slotCountByDate).map((d) => new Date(d)),
              }}
              modifiersClassNames={{
                selected: "",
                today: "",
                hasSlots: "has-slots",
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
              }}
              showOutsideDays={false}
              required={false}
            />
          )}
        </div>
        {/* Show available slots for selected day */}
        <div className="mt-6 w-full">
          <div className="text-gray-700 mb-2 text-sm font-semibold">
            예약 가능 슬롯
          </div>
          {selectedDate && slotsForSelectedDay.length === 0 && (
            <div className="text-gray-400 py-4 text-center">
              이 날에는 예약 가능한 슬롯이 없습니다.
            </div>
          )}
          {slotsForSelectedDay.length > 0 && (
            <div className="flex flex-wrap justify-center gap-2">
              {slotsForSelectedDay.map((slot) => {
                const isReserved = !!reservation;
                return (
                  <div key={slot.id} className="relative">
                    <button
                      className={`border-gray-300 shadow-sm focus:ring-green-400 rounded-full border bg-white px-4 py-2 text-sm font-medium focus:outline-none focus:ring-2 ${
                        isReserved
                          ? "cursor-not-allowed opacity-50"
                          : "hover:bg-green-50"
                      }`}
                      disabled={isReserved}
                      onClick={() => setShowReserveBtn(slot.id)}
                      title={isReserved ? "이미 예약이 있습니다." : "예약하기"}
                    >
                      {slot.start.toLocaleTimeString("ko-KR", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </button>
                    {/* 예약 버튼 */}
                    {showReserveBtn === slot.id && !isReserved && (
                      <div
                        ref={popupRef}
                        className="border-green-200 p-1.5 shadow-lg absolute left-1/2 z-10 mt-2 min-w-[140px] -translate-x-1/2 rounded-lg border bg-white"
                      >
                        <div className="flex w-full flex-row flex-nowrap justify-center gap-2">
                          <button
                            className="border-green-400 bg-green-500 hover:bg-green-600 min-w-[56px] rounded-md border px-3 py-1 text-[11px] font-semibold text-white transition-all"
                            onClick={() => handleReserve(slot)}
                            disabled={reserving}
                          >
                            예약
                          </button>
                          <button
                            className="border-gray-300 text-gray-700 hover:bg-gray-100 min-w-[56px] rounded-md border bg-white px-3 py-1 text-[11px] font-semibold transition-all"
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
      </div>
    </div>
  );
}
