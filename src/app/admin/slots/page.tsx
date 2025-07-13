"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ArrowLeft } from "lucide-react";
import { db } from "@/lib/firebase";
import {
  collection,
  addDoc,
  deleteDoc,
  doc,
  onSnapshot,
  Timestamp,
  query,
  where,
  getDocs,
  getDoc,
} from "firebase/firestore";
import { ko } from "date-fns/locale";
import { DayPicker, DateRange } from "react-day-picker";
import "react-day-picker/dist/style.css";
import { format } from "date-fns";

interface SlotData {
  id: string;
  start: Date;
  end: Date;
  type: "recurring" | "custom";
  recurrence?: {
    daysOfWeek: number[];
    startTime: string;
    endTime: string;
    intervalMinutes: number;
  };
  status: "available" | "booked";
  createdBy: string;
  createdAt: Date;
}

interface ReservationData {
  id: string;
  slotId: string;
  userId: string;
  userEmail: string;
  userName?: string;
  createdAt: Date;
}

// Custom Day component for DayPicker
function CustomDay(
  props: React.HTMLAttributes<HTMLTableCellElement> & { date?: Date }
) {
  const { date, ...rest } = props;
  if (!date) {
    return <td {...rest}></td>;
  }
  return (
    <td data-day={date.toISOString().slice(0, 10)} {...rest}>
      {date.getDate()}
    </td>
  );
}

export default function SlotManagement() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [slots, setSlots] = useState<SlotData[]>([]);
  const [showSlotDialog, setShowSlotDialog] = useState(false);
  const [slotType, setSlotType] = useState<"recurring" | "custom">("custom");
  const [customSlot, setCustomSlot] = useState({
    start: "",
    duration: 120,
    numberOfSlots: 1,
  });
  const [recurringSlot, setRecurringSlot] = useState<{
    daysOfWeek: number[];
    startTime: string;
    endTime: string;
    intervalMinutes: number;
    startDate: string;
    endDate: string;
    numberOfSlots: number;
  }>({
    daysOfWeek: [],
    startTime: "",
    endTime: "",
    intervalMinutes: 120,
    startDate: "",
    endDate: "",
    numberOfSlots: 1,
  });
  const [isSlotSubmitting, setIsSlotSubmitting] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(
    new Date()
  );
  const [customSlotDate, setCustomSlotDate] = useState<Date | undefined>(
    undefined
  );
  const [customSlotHour, setCustomSlotHour] = useState<number>(0);
  const [customSlotMinute, setCustomSlotMinute] = useState<number>(0);
  // Remove unused date picker state since we're not using it anymore
  // const [openDatePicker, setOpenDatePicker] = useState<"start" | "end" | null>(
  //   null
  // );
  // Remove range state since we're changing to single mode
  // const [range, setRange] = useState<DateRange | undefined>(undefined);

  // Add state to handle click vs double-click
  const [clickTimeout, setClickTimeout] = useState<NodeJS.Timeout | null>(null);
  const [lastClickedSlotId, setLastClickedSlotId] = useState<string | null>(
    null
  );
  const clickCountRef = useRef<number>(0);

  // Add state for touch events
  const slotTouchRef = useRef<{ [key: string]: number }>({});
  const calendarTouchRef = useRef<{ [key: string]: number }>({});

  // Add new state for range selection:
  const [selectedRange, setSelectedRange] = useState<DateRange | undefined>(
    undefined
  );

  // Add state for range mode:
  const [isRangeMode, setIsRangeMode] = useState(false);

  // Add state for popover
  const [popoverOpenSlotId, setPopoverOpenSlotId] = useState<string | null>(
    null
  );
  const popoverRef = useRef<HTMLDivElement | null>(null);

  // Click-away handler for popover
  useEffect(() => {
    if (!popoverOpenSlotId) return;
    function handleClickAway(e: MouseEvent | TouchEvent) {
      if (
        popoverRef.current &&
        !popoverRef.current.contains(e.target as Node)
      ) {
        setPopoverOpenSlotId(null);
      }
    }
    document.addEventListener("mousedown", handleClickAway);
    document.addEventListener("touchstart", handleClickAway);
    return () => {
      document.removeEventListener("mousedown", handleClickAway);
      document.removeEventListener("touchstart", handleClickAway);
    };
  }, [popoverOpenSlotId]);

  // Function to handle calendar double-tap
  const handleCalendarDoubleTap = (dateAttr: string) => {
    const date = new Date(dateAttr);
    setSlotType("custom");
    setCustomSlotDate(date);
    setCustomSlot({
      start: format(date, "yyyy-MM-dd'T'HH:mm"),
      duration: 120,
      numberOfSlots: 1,
    });
    setShowSlotDialog(true);
  };

  useEffect(() => {
    const checkAdminStatus = async () => {
      if (!loading && user?.email) {
        try {
          const response = await fetch("/api/admin/check", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ email: user.email }),
          });

          if (response.ok) {
            const data = await response.json();
            setIsAuthorized(data.isAdmin);
            if (!data.isAdmin) {
              router.push("/admin/login");
            }
          } else {
            setIsAuthorized(false);
            router.push("/admin/login");
          }
        } catch (error) {
          console.error("Error checking admin status:", error);
          setIsAuthorized(false);
          router.push("/admin/login");
        }
      } else if (!loading && !user) {
        router.push("/admin/login");
      }
    };

    checkAdminStatus();
  }, [user, loading, router]);

  useEffect(() => {
    if (!user || !isAuthorized) return;

    // Subscribe to slots
    const slotsQuery = query(collection(db, "slots"));

    const unsubSlots = onSnapshot(slotsQuery, (snapshot) => {
      const slotData: SlotData[] = [];
      snapshot.forEach((doc) => {
        const data = doc.data();
        const slot = {
          id: doc.id,
          start: data.start.toDate(), // Convert Firestore Timestamp to Date
          end: data.end.toDate(), // Convert Firestore Timestamp to Date
          type: data.type,
          recurrence: data.recurrence,
          status: data.status,
          createdBy: data.createdBy,
          createdAt: data.createdAt.toDate(), // Convert Firestore Timestamp to Date
        } as SlotData;
        slotData.push(slot);
      });
      slotData.sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
      setSlots(slotData);
    });

    return () => {
      unsubSlots();
    };
  }, [user, isAuthorized]);

  // Filter slots for the selected day
  const slotsForSelectedDay = slots.filter((slot) => {
    if (!selectedDate) return false;
    const slotDate = new Date(slot.start);
    const matches =
      slotDate.getFullYear() === selectedDate.getFullYear() &&
      slotDate.getMonth() === selectedDate.getMonth() &&
      slotDate.getDate() === selectedDate.getDate();
    return matches;
  });
  // Sort by start time
  slotsForSelectedDay.sort(
    (a, b) => new Date(a.start).getTime() - new Date(b.start).getTime()
  );

  const [reservations, setReservations] = useState<ReservationData[]>([]);
  const [kycNames, setKycNames] = useState<Record<string, string>>({}); // userId -> KYC name

  // Fetch reservations for slots of the selected day
  useEffect(() => {
    // Calculate slots for the selected day inside the effect
    const slotsForSelectedDayLocal = slots.filter((slot) => {
      if (!selectedDate) return false;
      const slotDate = new Date(slot.start);
      return (
        slotDate.getFullYear() === selectedDate.getFullYear() &&
        slotDate.getMonth() === selectedDate.getMonth() &&
        slotDate.getDate() === selectedDate.getDate()
      );
    });

    if (!selectedDate || slotsForSelectedDayLocal.length === 0) {
      setReservations([]);
      setKycNames({});
      return;
    }
    const slotIds = slotsForSelectedDayLocal.map((slot) => slot.id);
    if (slotIds.length === 0) {
      setReservations([]);
      setKycNames({});
      return;
    }
    const q = query(
      collection(db, "reservations"),
      where("slotId", "in", slotIds)
    );
    getDocs(q).then(async (snap) => {
      const resList: ReservationData[] = [];
      const userIds = new Set<string>();
      snap.forEach((docData) => {
        const data = docData.data();
        resList.push({
          id: docData.id,
          slotId: data.slotId,
          userId: data.userId,
          userEmail: data.userEmail,
          userName: data.userName,
          createdAt: data.createdAt?.toDate?.() || new Date(),
        });
        if (data.userId) userIds.add(data.userId);
      });
      setReservations(resList);
      // Fetch KYC names for all userIds
      const kycNameMap: Record<string, string> = {};
      await Promise.all(
        Array.from(userIds).map(async (uid) => {
          try {
            const userDoc = await getDoc(doc(db, "users", uid));
            if (userDoc.exists()) {
              const userData = userDoc.data();
              if (userData && userData.name) {
                kycNameMap[uid] = userData.name;
              }
            }
          } catch (e) {
            // ignore
          }
        })
      );
      setKycNames(kycNameMap);
    });
  }, [selectedDate, slots]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (clickTimeout) {
        clearTimeout(clickTimeout);
      }
      // Reset click counters
      clickCountRef.current = 0;
      setLastClickedSlotId(null);
    };
  }, [clickTimeout]);

  useEffect(() => {
    if (customSlotDate) {
      const date = new Date(customSlotDate);
      date.setHours(customSlotHour, customSlotMinute, 0, 0);
      setCustomSlot((prev) => ({
        ...prev,
        start: format(date, "yyyy-MM-dd'T'HH:mm"),
      }));
    }
  }, [customSlotDate, customSlotHour, customSlotMinute]);

  const handleCreateSlot = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSlotSubmitting(true);

    try {
      if (slotType === "custom") {
        if (!customSlot.start) {
          alert("시작 시간을 입력해주세요.");
          return;
        }

        const startDate = new Date(customSlot.start);

        // Create multiple slots if numberOfSlots > 1
        for (let i = 0; i < customSlot.numberOfSlots; i++) {
          const slotStart = new Date(
            startDate.getTime() + i * customSlot.duration * 60 * 1000
          );
          const slotEnd = new Date(
            slotStart.getTime() + customSlot.duration * 60 * 1000
          );

          await addDoc(collection(db, "slots"), {
            start: Timestamp.fromDate(slotStart),
            end: Timestamp.fromDate(slotEnd),
            type: "custom",
            status: "available",
            createdBy: user?.email,
            createdAt: Timestamp.now(),
          });
        }
      } else {
        if (
          !recurringSlot.startTime ||
          !recurringSlot.endTime ||
          recurringSlot.daysOfWeek.length === 0
        ) {
          alert("모든 필드를 입력해주세요.");
          return;
        }

        await addDoc(collection(db, "slots"), {
          start: Timestamp.now(), // Placeholder for recurring slots
          end: Timestamp.now(), // Placeholder for recurring slots
          type: "recurring",
          recurrence: {
            daysOfWeek: recurringSlot.daysOfWeek,
            startTime: recurringSlot.startTime,
            endTime: recurringSlot.endTime,
            intervalMinutes: recurringSlot.intervalMinutes,
          },
          status: "available",
          createdBy: user?.email,
          createdAt: Timestamp.now(),
        });
      }

      setShowSlotDialog(false);
      setCustomSlot({ start: "", duration: 120, numberOfSlots: 1 });
      setRecurringSlot({
        daysOfWeek: [],
        startTime: "",
        endTime: "",
        intervalMinutes: 120,
        startDate: "",
        endDate: "",
        numberOfSlots: 1,
      });
    } catch (error) {
      console.error("Error creating slot:", error);
    } finally {
      setIsSlotSubmitting(false);
    }
  };

  const handleDeleteSlot = async (slotId: string) => {
    try {
      await deleteDoc(doc(db, "slots", slotId));
    } catch (error) {
      console.error("Error deleting slot:", error);
    }
  };

  // Calendar event handlers
  const handleSingleClickSlot = (slot: SlotData, event: React.MouseEvent) => {
    event.stopPropagation(); // Prevent event from bubbling up to calendar

    console.log("Slot clicked:", slot.id, "Last clicked:", lastClickedSlotId);

    // Check if this is the same slot as last click
    if (lastClickedSlotId === slot.id) {
      clickCountRef.current += 1;
      console.log("Same slot clicked, count:", clickCountRef.current);
    } else {
      clickCountRef.current = 1;
      setLastClickedSlotId(slot.id);
      console.log("New slot clicked, count:", clickCountRef.current);
    }

    // Clear any existing timeout
    if (clickTimeout) {
      clearTimeout(clickTimeout);
    }

    // Set a timeout to handle the click
    const timeout = setTimeout(() => {
      const currentClickCount = clickCountRef.current;
      console.log("Timeout triggered, click count:", currentClickCount);

      if (currentClickCount === 1) {
        // Single click - just select the slot (do nothing for now, could add visual feedback later)
        console.log("Single click detected for slot:", slot.id);
      } else if (currentClickCount >= 2) {
        // Double click - delete the slot
        console.log("Double click detected for slot:", slot.id);
        if (window.confirm("이 슬롯을 삭제하시겠습니까?")) {
          handleDeleteSlot(slot.id);
        }
      }

      // Reset counters
      clickCountRef.current = 0;
      setLastClickedSlotId(null);
    }, 300);

    setClickTimeout(timeout);
  };

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

  if (loading || !isAuthorized) {
    return (
      <div className="bg-gradient-to-br from-gray-50 min-h-screen to-white p-4">
        <div className="container mx-auto max-w-7xl">
          <div className="text-center">
            <div className="animate-spin border-black mb-4 h-8 w-8 rounded-full border-b-2"></div>
            <p>Redirecting to dashboard...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-br from-gray-50 min-h-screen to-white p-2 sm:p-4">
      <div className="container mx-auto max-w-7xl">
        <div className="mb-4 flex flex-col gap-2 sm:mb-8 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-2 sm:gap-4">
              <Button
                variant="ghost"
                onClick={() => router.push("/admin")}
                className="flex items-center gap-2"
              >
                <ArrowLeft className="h-4 w-4" />
                뒤로
              </Button>
              <h1 className="text-gray-900 font-sans text-2xl font-extrabold tracking-tight sm:text-3xl">
                예약 슬롯 관리
              </h1>
            </div>
          </div>
        </div>
        {/* Center calendar on desktop */}
        <div className="flex w-full flex-col items-center sm:flex-row sm:justify-center">
          {/* Sleek Mobile Calendar UI */}
          <div className="shadow flex flex-col items-center rounded-xl bg-white p-4">
            <div className="mb-2 flex w-full justify-end gap-2">
              <button
                className={`rounded-full border px-4 py-1 text-sm font-semibold transition ${
                  isRangeMode
                    ? "bg-black border-black text-white"
                    : "bg-gray-100 text-gray-700 border-gray-300 hover:bg-gray-200"
                }`}
                onClick={() => {
                  setIsRangeMode((prev) => {
                    if (prev) setSelectedRange(undefined); // Clear range when turning off
                    return !prev;
                  });
                }}
                type="button"
              >
                범위 선택
              </button>
              <button
                className="bg-green-100 text-green-700 hover:bg-green-200 rounded-full px-4 py-1 text-sm font-semibold transition"
                onClick={() => setSelectedDate(new Date())}
                type="button"
              >
                오늘
              </button>
            </div>
            {/* Main calendar (DayPicker): */}
            <div
              onDoubleClick={(event) => {
                const target = event.target as HTMLElement;
                const dateElement = target.closest("[data-day]");
                if (dateElement) {
                  const dateAttr = dateElement.getAttribute("data-day");
                  if (dateAttr) {
                    const date = new Date(dateAttr);
                    setSlotType("custom");
                    setCustomSlotDate(date);
                    setCustomSlot({
                      start: date.toISOString().slice(0, 16),
                      duration: 120,
                      numberOfSlots: 1,
                    });
                    setShowSlotDialog(true);
                  }
                }
              }}
              onTouchStart={(event) => {
                // Handle touch events for mobile calendar
                const target = event.target as HTMLElement;
                const dateElement = target.closest("[data-day]");
                if (dateElement) {
                  const dateAttr = dateElement.getAttribute("data-day");
                  if (dateAttr) {
                    const now = Date.now();
                    const lastTouch = calendarTouchRef.current[dateAttr];

                    if (lastTouch && now - lastTouch < 300) {
                      // Double tap detected
                      event.preventDefault();
                      event.stopPropagation();
                      console.log(
                        "Calendar double tap detected for date:",
                        dateAttr
                      );
                      handleCalendarDoubleTap(dateAttr);
                      calendarTouchRef.current[dateAttr] = 0; // Reset
                    } else {
                      calendarTouchRef.current[dateAttr] = now;
                    }
                  }
                }
              }}
            >
              <div>
                {isRangeMode ? (
                  <DayPicker
                    mode="range"
                    selected={selectedRange}
                    onSelect={setSelectedRange}
                    locale={ko}
                    weekStartsOn={0}
                    modifiers={{
                      hasSlots: Object.keys(slotCountByDate).map(
                        (d) => new Date(d)
                      ),
                    }}
                    modifiersClassNames={{
                      selected: "bg-black text-white",
                      today: "text-green-600 font-bold",
                      range_start: "bg-black text-white",
                      range_end: "bg-black text-white",
                      range_middle: "bg-black text-white opacity-80",
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
                    components={{
                      Day: CustomDay,
                    }}
                  />
                ) : (
                  <DayPicker
                    mode="single"
                    selected={selectedDate}
                    onSelect={(date: Date | undefined) => setSelectedDate(date)}
                    locale={ko}
                    weekStartsOn={0}
                    modifiers={{
                      hasSlots: Object.keys(slotCountByDate).map(
                        (d) => new Date(d)
                      ),
                    }}
                    modifiersClassNames={{
                      selected: "bg-green-500 text-white rounded-lg",
                      today: "text-green-600 font-bold",
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
                    components={{
                      Day: CustomDay,
                    }}
                  />
                )}
              </div>
            </div>
            {/* Time slots for selected day */}
            <div className="mt-6 w-full">
              <div className="text-gray-700 mb-2 text-sm font-semibold">
                예약 슬롯
              </div>
              <div className="text-gray-500 mb-3 text-xs">
                슬롯을 더블클릭하면 삭제할 수 있습니다.
              </div>
              {slotsForSelectedDay.length === 0 ? (
                <div className="text-gray-400 py-4 text-center">
                  이 날에는 예약 슬롯이 없습니다.
                </div>
              ) : (
                <div className="flex flex-wrap justify-center gap-2">
                  {slotsForSelectedDay.map((slot) => {
                    const reservation = reservations.find(
                      (r) => r.slotId === slot.id
                    );
                    return (
                      <div
                        key={slot.id}
                        className="relative flex min-w-[110px] flex-col items-center"
                      >
                        <button
                          className="border-gray-300 shadow-sm hover:bg-green-50 focus:ring-green-400 rounded-full border bg-white px-4 py-2 text-sm font-medium focus:outline-none focus:ring-2"
                          onClick={(event) => {
                            handleSingleClickSlot(slot, event);
                          }}
                          onDoubleClick={(event) => {
                            event.preventDefault();
                            event.stopPropagation();
                            if (window.confirm("이 슬롯을 삭제하시겠습니까?")) {
                              handleDeleteSlot(slot.id);
                            }
                          }}
                          onTouchStart={(event) => {
                            const now = Date.now();
                            const lastTouch = slotTouchRef.current[slot.id];
                            if (lastTouch && now - lastTouch < 300) {
                              event.preventDefault();
                              event.stopPropagation();
                              if (
                                window.confirm("이 슬롯을 삭제하시겠습니까?")
                              ) {
                                handleDeleteSlot(slot.id);
                              }
                              slotTouchRef.current[slot.id] = 0;
                            } else {
                              slotTouchRef.current[slot.id] = now;
                            }
                          }}
                          title="더블클릭/더블탭하여 삭제"
                        >
                          {new Date(slot.start).toLocaleTimeString("ko-KR", {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </button>
                        {/* 예약자 이름 badge below the button */}
                        {slot.status === "booked" && reservation && (
                          <>
                            <span
                              className="bg-green-50 text-green-700 border-green-200 hover:bg-green-100 mt-1 mb-1 inline-block cursor-pointer select-none rounded-full border px-3 py-1 text-center text-xs font-semibold transition"
                              onClick={() => setPopoverOpenSlotId(slot.id)}
                              tabIndex={0}
                              role="button"
                              onKeyDown={(e) => {
                                if (e.key === "Enter" || e.key === " ")
                                  setPopoverOpenSlotId(slot.id);
                              }}
                            >
                              {kycNames[reservation.userId] ||
                                reservation.userName ||
                                "-"}
                            </span>
                            {popoverOpenSlotId === slot.id && (
                              <div
                                ref={popoverRef}
                                className="w-72 border-green-200 shadow-xl absolute left-1/2 z-20 mt-2 flex -translate-x-1/2 flex-col items-center rounded-xl border bg-white p-4"
                                style={{ minWidth: 260 }}
                              >
                                <div className="text-green-700 mb-1 text-lg font-bold">
                                  {kycNames[reservation.userId] ||
                                    reservation.userName ||
                                    "-"}
                                </div>
                                <div className="text-green-600 mb-1 break-all text-sm">
                                  {reservation.userEmail}
                                </div>
                                <div className="text-gray-500 mb-1 text-xs">
                                  KYC 제출일:{" "}
                                  {(() => {
                                    const kycUser =
                                      reservation.userId &&
                                      kycNames[reservation.userId]
                                        ? reservation.userId
                                        : null;
                                    // We don't have KYC submit date in kycNames, so fallback to '-'
                                    return "-";
                                  })()}
                                </div>
                                <div className="text-gray-500 mb-1 text-xs">
                                  예약일:{" "}
                                  {reservation.createdAt
                                    ? new Date(
                                        reservation.createdAt
                                      ).toLocaleString("ko-KR", {
                                        year: "numeric",
                                        month: "2-digit",
                                        day: "2-digit",
                                        hour: "2-digit",
                                        minute: "2-digit",
                                      })
                                    : "-"}
                                </div>
                                {/* Eyebrow photo */}
                                {reservation.userId && (
                                  <KycPhoto userId={reservation.userId} />
                                )}
                              </div>
                            )}
                          </>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Slot Dialog (existing code) */}
          <Dialog open={showSlotDialog} onOpenChange={setShowSlotDialog}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>새 슬롯 추가</DialogTitle>
              </DialogHeader>
              <form
                onSubmit={handleCreateSlot}
                className="w-full max-w-full space-y-4"
              >
                <div className="flex gap-4">
                  {/* Custom Toggle Switch for Slot Type */}
                  <div className="bg-gray-100 flex items-center rounded-full p-1">
                    <button
                      type="button"
                      className={`focus:ring-green-400 text-base rounded-full px-5 py-2 font-semibold transition focus:outline-none focus:ring-2 ${
                        slotType === "custom"
                          ? "bg-green-500 shadow text-white"
                          : "text-gray-700 hover:bg-gray-200"
                      }`}
                      onClick={() => setSlotType("custom")}
                      aria-pressed={slotType === "custom"}
                    >
                      맞춤 슬롯
                    </button>
                    <button
                      type="button"
                      className={`focus:ring-green-400 text-base rounded-full px-5 py-2 font-semibold transition focus:outline-none focus:ring-2 ${
                        slotType === "recurring"
                          ? "bg-green-500 shadow text-white"
                          : "text-gray-700 hover:bg-gray-200"
                      }`}
                      onClick={() => setSlotType("recurring")}
                      aria-pressed={slotType === "recurring"}
                    >
                      반복 슬롯
                    </button>
                  </div>
                </div>
                {slotType === "custom" ? (
                  <div className="flex flex-col gap-4">
                    <label className="mb-1 font-medium">시작 시간</label>
                    <div className="flex flex-col gap-2">
                      <div className="mb-2 flex items-center justify-center gap-2">
                        <input
                          type="date"
                          value={
                            customSlotDate
                              ? format(customSlotDate, "yyyy-MM-dd")
                              : ""
                          }
                          onChange={(e) => {
                            const d = new Date(e.target.value);
                            setCustomSlotDate(d);
                          }}
                          className="text-base rounded border px-2 py-1"
                        />
                        <select
                          value={customSlotHour}
                          onChange={(e) =>
                            setCustomSlotHour(Number(e.target.value))
                          }
                          className="text-base rounded border px-2 py-1"
                        >
                          {[...Array(24).keys()].map((h) => (
                            <option key={h} value={h}>
                              {h.toString().padStart(2, "0")}
                            </option>
                          ))}
                        </select>
                        <span className="text-lg font-bold">:</span>
                        <select
                          value={customSlotMinute}
                          onChange={(e) =>
                            setCustomSlotMinute(Number(e.target.value))
                          }
                          className="text-base rounded border px-2 py-1"
                        >
                          {[0, 30].map((m) => (
                            <option key={m} value={m}>
                              {m.toString().padStart(2, "0")}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                    <label className="font-medium">간격</label>
                    <div className="mb-2 flex w-full max-w-full flex-wrap justify-center gap-2">
                      {[
                        { label: "30분", value: 30 },
                        { label: "1시간", value: 60 },
                        { label: "1.5시간", value: 90 },
                        { label: "2시간", value: 120 },
                        { label: "2.5시간", value: 150 },
                        { label: "3시간", value: 180 },
                        { label: "3.5시간", value: 210 },
                        { label: "4시간", value: 240 },
                      ].map((option) => (
                        <Button
                          key={option.value}
                          type="button"
                          variant={
                            customSlot.duration === option.value
                              ? "default"
                              : "outline"
                          }
                          className={
                            customSlot.duration === option.value
                              ? "bg-green-500 text-white"
                              : ""
                          }
                          onClick={() =>
                            setCustomSlot({
                              ...customSlot,
                              duration: option.value,
                            })
                          }
                        >
                          {option.label}
                        </Button>
                      ))}
                    </div>
                    <label className="font-medium">슬롯 개수</label>
                    <div className="mb-2 flex w-full max-w-full flex-wrap justify-center gap-2">
                      {[1, 2, 3, 4, 5].map((num) => (
                        <Button
                          key={num}
                          type="button"
                          variant={
                            customSlot.numberOfSlots === num
                              ? "default"
                              : "outline"
                          }
                          className={
                            customSlot.numberOfSlots === num
                              ? "bg-green-500 text-white"
                              : ""
                          }
                          onClick={() =>
                            setCustomSlot({
                              ...customSlot,
                              numberOfSlots: num,
                            })
                          }
                        >
                          {num}개
                        </Button>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col gap-2">
                    {/* 날짜 범위 표시 (읽기 전용) */}
                    {recurringSlot.startDate && recurringSlot.endDate && (
                      <div className="mb-2 flex items-end gap-2">
                        <div className="flex flex-col text-xs font-medium">
                          <span>시작일</span>
                          <div className="bg-gray-100 rounded border px-2 py-1 text-sm">
                            {recurringSlot.startDate
                              ? recurringSlot.startDate
                              : ""}
                          </div>
                        </div>
                        <div className="flex flex-col text-xs font-medium">
                          <span>종료일</span>
                          <div className="bg-gray-100 rounded border px-2 py-1 text-sm">
                            {recurringSlot.endDate ? recurringSlot.endDate : ""}
                          </div>
                        </div>
                      </div>
                    )}
                    {/* 요일 선택 */}
                    <label className="font-medium">요일 선택</label>
                    <div className="mb-2 flex w-full max-w-full flex-wrap justify-center gap-2">
                      {["일", "월", "화", "수", "목", "금", "토"].map(
                        (day, idx) => (
                          <Button
                            key={day}
                            type="button"
                            variant={
                              recurringSlot.daysOfWeek.includes(idx)
                                ? "default"
                                : "outline"
                            }
                            className={
                              recurringSlot.daysOfWeek.includes(idx)
                                ? "bg-green-500 text-white"
                                : ""
                            }
                            onClick={() => {
                              setRecurringSlot((prev) => ({
                                ...prev,
                                daysOfWeek: prev.daysOfWeek.includes(idx)
                                  ? prev.daysOfWeek.filter((d) => d !== idx)
                                  : [...prev.daysOfWeek, idx],
                              }));
                            }}
                          >
                            {day}
                          </Button>
                        )
                      )}
                    </div>
                    {/* 시작/종료 시간 */}
                    <label>
                      시작 시간 (HH:MM)
                      <Input
                        type="time"
                        value={recurringSlot.startTime}
                        onChange={(e) =>
                          setRecurringSlot({
                            ...recurringSlot,
                            startTime: e.target.value,
                          })
                        }
                        required
                        className="w-full max-w-full"
                      />
                    </label>
                    <label>
                      종료 시간 (HH:MM)
                      <Input
                        type="time"
                        value={recurringSlot.endTime}
                        onChange={(e) =>
                          setRecurringSlot({
                            ...recurringSlot,
                            endTime: e.target.value,
                          })
                        }
                        required
                        className="w-full max-w-full"
                      />
                    </label>
                    {/* 간격 선택 */}
                    <label className="font-medium">간격</label>
                    <div className="mb-2 flex w-full max-w-full flex-wrap flex-wrap justify-center gap-2">
                      {[
                        { label: "30분", value: 30 },
                        { label: "1시간", value: 60 },
                        { label: "1.5시간", value: 90 },
                        { label: "2시간", value: 120 },
                        { label: "2.5시간", value: 150 },
                        { label: "3시간", value: 180 },
                        { label: "3.5시간", value: 210 },
                        { label: "4시간", value: 240 },
                      ].map((option) => (
                        <Button
                          key={option.value}
                          type="button"
                          variant={
                            recurringSlot.intervalMinutes === option.value
                              ? "default"
                              : "outline"
                          }
                          className={
                            recurringSlot.intervalMinutes === option.value
                              ? "bg-green-500 text-white"
                              : ""
                          }
                          onClick={() =>
                            setRecurringSlot({
                              ...recurringSlot,
                              intervalMinutes: option.value,
                            })
                          }
                        >
                          {option.label}
                        </Button>
                      ))}
                    </div>
                    {/* 슬롯 개수 section ... */}
                    <label className="font-medium">슬롯 개수</label>
                    <div className="mb-2 flex w-full max-w-full flex-wrap justify-center gap-2">
                      {[1, 2, 3, 4, 5].map((num) => (
                        <Button
                          key={num}
                          type="button"
                          variant={
                            recurringSlot.numberOfSlots === num
                              ? "default"
                              : "outline"
                          }
                          className={
                            recurringSlot.numberOfSlots === num
                              ? "bg-green-500 text-white"
                              : ""
                          }
                          onClick={() =>
                            setRecurringSlot({
                              ...recurringSlot,
                              numberOfSlots: num,
                            })
                          }
                        >
                          {num}개
                        </Button>
                      ))}
                    </div>
                  </div>
                )}
                <DialogFooter>
                  <Button type="submit" disabled={isSlotSubmitting}>
                    추가
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>
        {isRangeMode && selectedRange?.from && selectedRange?.to && (
          <>
            {/* Slot count selection UI */}
            {/* Remove the slot count selection UI from the main page (the block with [1,2,3,4,5].map(...)) */}
            {/* Ensure the slot count selection is only rendered inside the 반복 슬롯 dialog (slotType === 'recurring'). */}
            {/* Floating button */}
            {recurringSlot.numberOfSlots > 0 && (
              <button
                className="bg-black shadow-lg hover:bg-gray-900 fixed bottom-6 left-1/2 z-50 -translate-x-1/2 rounded-full px-8 py-3 text-lg font-bold text-white transition"
                onClick={() => {
                  setSlotType("recurring");
                  setRecurringSlot((prev) => ({
                    ...prev,
                    startDate: selectedRange.from
                      ? format(selectedRange.from, "yyyy-MM-dd")
                      : "",
                    endDate: selectedRange.to
                      ? format(selectedRange.to, "yyyy-MM-dd")
                      : "",
                  }));
                  setShowSlotDialog(true);
                }}
                type="button"
              >
                슬롯 추가
              </button>
            )}
          </>
        )}
      </div>
    </div>
  );
}

function KycPhoto({ userId }: { userId: string }) {
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  useEffect(() => {
    let ignore = false;
    (async () => {
      try {
        const userDoc = await getDoc(doc(db, "users", userId));
        if (userDoc.exists()) {
          const userData = userDoc.data();
          if (userData && userData.photoURL) {
            if (!ignore) setPhotoUrl(userData.photoURL);
          }
        }
      } catch {}
    })();
    return () => {
      ignore = true;
    };
  }, [userId]);
  if (!photoUrl) return null;
  return (
    <img
      src={photoUrl}
      alt="KYC Eyebrow"
      className="max-h-32 bg-gray-50 mt-2 w-full rounded-lg border object-contain"
      style={{ maxWidth: 200 }}
    />
  );
}
