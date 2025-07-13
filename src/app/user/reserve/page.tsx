"use client";

import { useEffect, useState } from "react";
import { DayPicker } from "react-day-picker";
import "react-day-picker/dist/style.css";
import { ko } from "date-fns/locale";
import { db } from "@/lib/firebase";
import { collection, getDocs } from "firebase/firestore";
import Link from "next/link";
import React from "react";

interface SlotData {
  id: string;
  start: Date;
  end: Date;
  status: "available" | "booked";
}

export default function UserReservePage() {
  const [slots, setSlots] = useState<SlotData[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [loading, setLoading] = useState(true);

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

  useEffect(() => {
    async function fetchSlots() {
      setLoading(true);
      try {
        const snap = await getDocs(collection(db, "slots"));
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
      } catch (error) {
        console.error("Error fetching slots:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchSlots();
  }, []);

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
        <div className="shadow flex flex-col items-center rounded-xl bg-white p-4">
          {loading ? (
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
              {slotsForSelectedDay.map((slot) => (
                <button
                  key={slot.id}
                  className="border-gray-300 shadow-sm hover:bg-green-50 focus:ring-green-400 rounded-full border bg-white px-4 py-2 text-sm font-medium focus:outline-none focus:ring-2"
                  // onClick={() => { /* 예약 로직 추가 예정 */ }}
                  title="예약하기"
                >
                  {new Date(slot.start).toLocaleTimeString("ko-KR", {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
