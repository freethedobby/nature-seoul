"use client";

import { useEffect, useState, useRef } from "react";
import { DayPicker } from "react-day-picker";
import "react-day-picker/dist/style.css";
import { ko } from "date-fns/locale";
import { db } from "@/lib/firebase";
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
import React from "react";
import { useAuth } from "@/contexts/AuthContext";

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
  createdAt: Date;
}

export default function UserReservePage() {
  const { user, loading: authLoading } = useAuth();
  const [slots, setSlots] = useState<SlotData[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [loading, setLoading] = useState(true);
  const [reservation, setReservation] = useState<ReservationData | null>(null);
  const [showReserveBtn, setShowReserveBtn] = useState<string | null>(null);
  const [reserving, setReserving] = useState(false);
  const [canceling, setCanceling] = useState(false);
  const popupRef = useRef<HTMLDivElement | null>(null);

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
      await addDoc(collection(db, "reservations"), {
        slotId: slot.id,
        userId: user.uid,
        userEmail: user.email,
        userName: user.displayName || "",
        createdAt: new Date(),
      });
      setShowReserveBtn(null);
    } catch {
      alert("예약에 실패했습니다. 다시 시도해주세요.");
    } finally {
      setReserving(false);
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
    } catch {
      alert("예약 취소에 실패했습니다. 다시 시도해주세요.");
    } finally {
      setCanceling(false);
    }
  };

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
