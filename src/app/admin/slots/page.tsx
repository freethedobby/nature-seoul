"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
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
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Calendar, List } from "lucide-react";
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

// 서울시 시군구 데이터
const districts = [
  { value: "gangnam", label: "강남구" },
  { value: "gangdong", label: "강동구" },
  { value: "gangbuk", label: "강북구" },
  { value: "gangseo", label: "강서구" },
  { value: "gwanak", label: "관악구" },
  { value: "gwangjin", label: "광진구" },
  { value: "guro", label: "구로구" },
  { value: "geumcheon", label: "금천구" },
  { value: "nowon", label: "노원구" },
  { value: "dobong", label: "도봉구" },
  { value: "dongdaemun", label: "동대문구" },
  { value: "dongjak", label: "동작구" },
  { value: "mapo", label: "마포구" },
  { value: "seodaemun", label: "서대문구" },
  { value: "seocho", label: "서초구" },
  { value: "seongbuk", label: "성북구" },
  { value: "songpa", label: "송파구" },
  { value: "yangcheon", label: "양천구" },
  { value: "yeongdeungpo", label: "영등포구" },
  { value: "yongsan", label: "용산구" },
  { value: "eunpyeong", label: "은평구" },
  { value: "jongno", label: "종로구" },
  { value: "junggu", label: "중구" },
  { value: "jungnang", label: "중랑구" },
];

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
  status:
    | "pending"
    | "payment_required"
    | "payment_confirmed"
    | "approved"
    | "rejected"
    | "cancelled";
  createdAt: Date;
}

interface UserData {
  id: string;
  userId: string;
  email: string;
  name: string;
  gender?: string;
  birthYear?: string;
  contact: string;
  district?: string;
  detailedAddress?: string;
  skinType?: string;
  photoURLs?: {
    left: string;
    front: string;
    right: string;
  };
  photoURL?: string;
  photoType?: "base64" | "firebase-storage";
  kycStatus: string;
  hasPreviousTreatment?: boolean;
  rejectReason?: string;
  createdAt: Date;
  approvedAt?: Date;
  rejectedAt?: Date;
}

// Custom Day component for DayPicker
function CustomDay(
  props: React.HTMLAttributes<HTMLTableCellElement> & {
    date?: Date;
    reservations?: ReservationData[];
    kycNames?: Record<string, string>;
  }
) {
  const { date, reservations = [], kycNames = {}, ...rest } = props;
  if (!date) {
    return <td {...rest}></td>;
  }

  // Get reservations for this date
  const dateReservations = reservations.filter(() => {
    // This will be populated by the parent component
    return true; // Placeholder - will be filtered by parent
  });

  return (
    <td
      data-day={date.toISOString().slice(0, 10)}
      className="relative min-h-[80px] p-1 align-top"
      {...rest}
    >
      <div className="mb-1 text-sm font-medium">{date.getDate()}</div>
      {dateReservations.length > 0 && (
        <div className="space-y-1">
          {dateReservations.slice(0, 3).map((reservation) => (
            <div
              key={reservation.id}
              className="bg-blue-100 text-blue-800 py-0.5 truncate rounded px-1 text-xs"
              title={`${kycNames[reservation.userId] || "Unknown"} - ${format(
                new Date(reservation.createdAt),
                "HH:mm"
              )}`}
            >
              {kycNames[reservation.userId] || "Unknown"}
            </div>
          ))}
          {dateReservations.length > 3 && (
            <div className="text-gray-500 text-xs">
              +{dateReservations.length - 3} more
            </div>
          )}
        </div>
      )}
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

  // Add view mode state
  const [viewMode, setViewMode] = useState<"list" | "calendar">("list");
  const [reservations, setReservations] = useState<ReservationData[]>([]);
  const [kycNames, setKycNames] = useState<Record<string, string>>({});
  const [kycContacts, setKycContacts] = useState<Record<string, string>>({});

  // Add calendar view mode state
  const [calendarViewMode, setCalendarViewMode] = useState<"week" | "month">(
    "month"
  );
  const [selectedCalendarDate, setSelectedCalendarDate] = useState<Date>(
    new Date()
  );

  // Add selected day for week view and month view
  const [selectedWeekDay, setSelectedWeekDay] = useState<Date | null>(
    new Date()
  );
  const [selectedMonthDay, setSelectedMonthDay] = useState<Date | null>(
    new Date()
  );

  // Add state for reservation detail dialog
  const [selectedReservationDetail, setSelectedReservationDetail] =
    useState<ReservationData | null>(null);
  const [isReservationDetailDialogOpen, setIsReservationDetailDialogOpen] =
    useState(false);

  // Add state for user data (for KYC information display)
  const [userDataMap, setUserDataMap] = useState<Record<string, UserData>>({});

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
      setKycContacts({});
      return;
    }
    const slotIds = slotsForSelectedDayLocal.map((slot) => slot.id);
    if (slotIds.length === 0) {
      setReservations([]);
      setKycNames({});
      setKycContacts({});
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
        // Only include approved reservations
        if (data.status === "approved") {
          resList.push({
            id: docData.id,
            slotId: data.slotId,
            userId: data.userId,
            userEmail: data.userEmail,
            userName: data.userName,
            status: data.status,
            createdAt: data.createdAt?.toDate?.() || new Date(),
          });
          if (data.userId) userIds.add(data.userId);
        }
      });
      setReservations(resList);
      // Fetch full user data for all userIds
      const kycNameMap: Record<string, string> = {};
      const kycContactMap: Record<string, string> = {};
      const userDataMapTemp: Record<string, UserData> = {};
      await Promise.all(
        Array.from(userIds).map(async (uid) => {
          try {
            const userDoc = await getDoc(doc(db, "users", uid));
            if (userDoc.exists()) {
              const data = userDoc.data();
              if (data && data.name) {
                kycNameMap[uid] = data.name;
              }
              if (data && data.contact) {
                kycContactMap[uid] = data.contact;
              }
              // Store full user data for KYC information display
              userDataMapTemp[uid] = {
                id: userDoc.id,
                userId: data.userId || uid,
                email: data.email || "",
                name: data.name || "",
                gender: data.gender,
                birthYear: data.birthYear,
                contact: data.contact || "",
                district: data.district,
                detailedAddress: data.detailedAddress,
                skinType: data.skinType,
                photoURLs: data.photoURLs,
                photoURL: data.photoURL,
                photoType: data.photoType,
                kycStatus: data.kycStatus || "pending",
                hasPreviousTreatment: data.hasPreviousTreatment,
                rejectReason: data.rejectReason,
                createdAt: data.createdAt?.toDate?.() || new Date(),
                approvedAt: data.approvedAt?.toDate?.() || undefined,
                rejectedAt: data.rejectedAt?.toDate?.() || undefined,
              };
            }
          } catch {
            // ignore
          }
        })
      );
      setKycNames(kycNameMap);
      setKycContacts(kycContactMap);
      setUserDataMap(userDataMapTemp);
    });
  }, [selectedDate, slots]);

  // Fetch all reservations for calendar view
  useEffect(() => {
    if (!user || !isAuthorized || viewMode !== "calendar") return;

    const q = query(collection(db, "reservations"));
    const unsubscribe = onSnapshot(q, async (snapshot) => {
      const resList: ReservationData[] = [];
      const userIds = new Set<string>();

      snapshot.forEach((docData) => {
        const data = docData.data();
        // Only include approved reservations
        if (data.status === "approved") {
          resList.push({
            id: docData.id,
            slotId: data.slotId,
            userId: data.userId,
            userEmail: data.userEmail,
            userName: data.userName,
            status: data.status,
            createdAt: data.createdAt?.toDate?.() || new Date(),
          });
          if (data.userId) userIds.add(data.userId);
        }
      });

      // Fetch full user data for all userIds
      const kycNameMap: Record<string, string> = {};
      const kycContactMap: Record<string, string> = {};
      const userDataMapTemp: Record<string, UserData> = {};
      await Promise.all(
        Array.from(userIds).map(async (uid) => {
          try {
            const userDoc = await getDoc(doc(db, "users", uid));
            if (userDoc.exists()) {
              const data = userDoc.data();
              if (data && data.name) {
                kycNameMap[uid] = data.name;
              }
              if (data && data.contact) {
                kycContactMap[uid] = data.contact;
              }
              // Store full user data for KYC information display
              userDataMapTemp[uid] = {
                id: userDoc.id,
                userId: data.userId || uid,
                email: data.email || "",
                name: data.name || "",
                gender: data.gender,
                birthYear: data.birthYear,
                contact: data.contact || "",
                district: data.district,
                detailedAddress: data.detailedAddress,
                skinType: data.skinType,
                photoURLs: data.photoURLs,
                photoURL: data.photoURL,
                photoType: data.photoType,
                kycStatus: data.kycStatus || "pending",
                hasPreviousTreatment: data.hasPreviousTreatment,
                rejectReason: data.rejectReason,
                createdAt: data.createdAt?.toDate?.() || new Date(),
                approvedAt: data.approvedAt?.toDate?.() || undefined,
                rejectedAt: data.rejectedAt?.toDate?.() || undefined,
              };
            }
          } catch {
            // ignore
          }
        })
      );

      setReservations(resList);
      setKycNames((prev) => ({ ...prev, ...kycNameMap }));
      setKycContacts((prev) => ({ ...prev, ...kycContactMap }));
      setUserDataMap((prev) => ({ ...prev, ...userDataMapTemp }));
    });

    return () => unsubscribe();
  }, [user, isAuthorized, viewMode]);

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

        // Parse start and end times
        const [startHour, startMinute] = recurringSlot.startTime
          .split(":")
          .map(Number);
        const [endHour, endMinute] = recurringSlot.endTime
          .split(":")
          .map(Number);

        // Calculate total duration in minutes
        const totalDurationMinutes =
          endHour * 60 + endMinute - (startHour * 60 + startMinute);

        // Calculate number of slots that can fit in the time range
        const slotsInRange = Math.floor(
          totalDurationMinutes / recurringSlot.intervalMinutes
        );

        // Use the minimum of calculated slots and user-selected numberOfSlots
        const actualNumberOfSlots = Math.min(
          slotsInRange,
          recurringSlot.numberOfSlots
        );

        // Get current date for generating slots
        const currentDate = new Date();

        // Generate slots for the next 4 weeks (28 days)
        for (let dayOffset = 0; dayOffset < 28; dayOffset++) {
          const targetDate = new Date(currentDate);
          targetDate.setDate(targetDate.getDate() + dayOffset);

          // Check if this day of week is selected
          if (recurringSlot.daysOfWeek.includes(targetDate.getDay())) {
            // Create slots for this day
            for (
              let slotIndex = 0;
              slotIndex < actualNumberOfSlots;
              slotIndex++
            ) {
              const slotStart = new Date(targetDate);
              slotStart.setHours(
                startHour,
                startMinute + slotIndex * recurringSlot.intervalMinutes,
                0,
                0
              );

              const slotEnd = new Date(slotStart);
              slotEnd.setMinutes(
                slotEnd.getMinutes() + recurringSlot.intervalMinutes
              );

              // Only create slots that are in the future
              if (slotStart > new Date()) {
                await addDoc(collection(db, "slots"), {
                  start: Timestamp.fromDate(slotStart),
                  end: Timestamp.fromDate(slotEnd),
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
            }
          }
        }
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
    // 모든 슬롯을 포함 (available + booked)
    const d = slot.start;
    const key =
      d.getFullYear() +
      "-" +
      String(d.getMonth() + 1).padStart(2, "0") +
      "-" +
      String(d.getDate()).padStart(2, "0");
    slotCountByDate[key] = (slotCountByDate[key] || 0) + 1;
  });

  // 과거 날짜 식별 (오늘 이전 날짜들)
  const today = new Date();
  today.setHours(0, 0, 0, 0); // 오늘의 시작
  const pastDates: Date[] = [];

  // 현재 월의 과거 날짜들 생성
  if (selectedDate) {
    const year = selectedDate.getFullYear();
    const month = selectedDate.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month, day);
      if (date < today) {
        pastDates.push(date);
      }
    }
  }

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
          <div className="flex gap-2">
            <Button
              variant={viewMode === "list" ? "default" : "outline"}
              size="sm"
              onClick={() => setViewMode("list")}
              className="flex items-center gap-2"
            >
              <List className="h-4 w-4" />
              리스트 뷰
            </Button>
            <Button
              variant={viewMode === "calendar" ? "default" : "outline"}
              size="sm"
              onClick={() => setViewMode("calendar")}
              className="flex items-center gap-2"
            >
              <Calendar className="h-4 w-4" />
              캘린더 뷰
            </Button>
          </div>
        </div>
        {/* View Mode Content */}
        {viewMode === "list" ? (
          /* List View */
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
                        pastDates: pastDates,
                      }}
                      modifiersClassNames={{
                        selected: "bg-black text-white",
                        today: "text-green-600 font-bold",
                        range_start: "bg-black text-white",
                        range_end: "bg-black text-white",
                        range_middle: "bg-black text-white opacity-80",
                        hasSlots: "has-slots",
                        pastDates: "past-dates",
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
                      onSelect={(date: Date | undefined) =>
                        setSelectedDate(date)
                      }
                      locale={ko}
                      weekStartsOn={0}
                      modifiers={{
                        hasSlots: Object.keys(slotCountByDate).map(
                          (d) => new Date(d)
                        ),
                        pastDates: pastDates,
                      }}
                      modifiersClassNames={{
                        selected: "bg-green-500 text-white rounded-lg",
                        today: "text-green-600 font-bold",
                        hasSlots: "has-slots",
                        pastDates: "past-dates",
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
                              if (
                                window.confirm("이 슬롯을 삭제하시겠습니까?")
                              ) {
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
                            <span
                              className="bg-green-50 text-green-700 border-green-200 hover:bg-green-100 mt-1 mb-1 inline-block cursor-pointer select-none rounded-full border px-3 py-1 text-center text-xs font-semibold transition"
                              onClick={() => {
                                setSelectedReservationDetail(reservation);
                                setIsReservationDetailDialogOpen(true);
                              }}
                              tabIndex={0}
                              role="button"
                              onKeyDown={(event) => {
                                if (
                                  event.key === "Enter" ||
                                  event.key === " "
                                ) {
                                  setSelectedReservationDetail(reservation);
                                  setIsReservationDetailDialogOpen(true);
                                }
                              }}
                            >
                              {kycNames[reservation.userId] ||
                                reservation.userName ||
                                "-"}
                            </span>
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
              <DialogContent
                className={`
                h-full max-h-[90vh] w-full
                max-w-4xl overflow-y-auto rounded-lg
                !bg-white p-0
                sm:max-h-[85vh]
                sm:max-w-2xl
                sm:p-6
              `}
                style={{
                  // 모바일에서 적당한 크기로 조정
                  ...(typeof window !== "undefined" && window.innerWidth < 640
                    ? {
                        width: "95vw",
                        height: "90vh",
                        maxWidth: "95vw",
                        maxHeight: "90vh",
                        borderRadius: "8px",
                      }
                    : {}),
                }}
              >
                <DialogHeader>
                  <DialogTitle className="text-xl font-bold">
                    새 슬롯 추가
                  </DialogTitle>
                </DialogHeader>
                <form
                  onSubmit={handleCreateSlot}
                  className="w-full max-w-full space-y-4 pb-4"
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
                      <div className="mb-2 flex w-full max-w-full flex-wrap justify-center gap-1 sm:gap-2">
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
                            className={`text-xs sm:text-sm ${
                              customSlot.duration === option.value
                                ? "bg-green-500 text-white"
                                : ""
                            }`}
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
                            className={`text-xs sm:text-sm ${
                              customSlot.numberOfSlots === num
                                ? "bg-green-500 text-white"
                                : ""
                            }`}
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
                              {recurringSlot.endDate
                                ? recurringSlot.endDate
                                : ""}
                            </div>
                          </div>
                        </div>
                      )}
                      {/* 요일 선택 */}
                      <label className="font-medium">요일 선택</label>
                      <div className="mb-2 flex w-full max-w-full flex-wrap justify-center gap-1 sm:gap-2">
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
                              className={`text-xs sm:text-sm ${
                                recurringSlot.daysOfWeek.includes(idx)
                                  ? "bg-green-500 text-white"
                                  : ""
                              }`}
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
                      <div className="mb-2 flex w-full max-w-full flex-wrap justify-center gap-1 sm:gap-2">
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
                            className={`text-xs sm:text-sm ${
                              recurringSlot.intervalMinutes === option.value
                                ? "bg-green-500 text-white"
                                : ""
                            }`}
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
                      <div className="mb-2 flex w-full max-w-full flex-wrap justify-center gap-1 sm:gap-2">
                        {[1, 2, 3, 4, 5].map((num) => (
                          <Button
                            key={num}
                            type="button"
                            variant={
                              recurringSlot.numberOfSlots === num
                                ? "default"
                                : "outline"
                            }
                            className={`text-xs sm:text-sm ${
                              recurringSlot.numberOfSlots === num
                                ? "bg-green-500 text-white"
                                : ""
                            }`}
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
        ) : (
          /* Calendar View */
          <div className="mx-auto w-full max-w-6xl px-4 sm:px-6">
            <div className="shadow-lg rounded-xl bg-white p-4 sm:p-6">
              <div className="mb-4 sm:mb-6">
                <h2 className="text-gray-900 mb-2 text-lg font-semibold sm:text-xl">
                  예약 캘린더
                </h2>
                <p className="text-gray-600 text-xs sm:text-sm">
                  각 날짜에 예약자 정보가 표시됩니다.
                </p>
              </div>

              {/* Calendar Controls */}
              <div className="mb-6 space-y-4">
                {/* View Mode Toggle */}
                <div className="flex justify-center">
                  <div className="bg-gray-100 inline-flex rounded-lg border p-1">
                    <Button
                      variant={
                        calendarViewMode === "week" ? "default" : "ghost"
                      }
                      size="sm"
                      onClick={() => setCalendarViewMode("week")}
                      className="rounded-md text-xs sm:text-sm"
                    >
                      주간
                    </Button>
                    <Button
                      variant={
                        calendarViewMode === "month" ? "default" : "ghost"
                      }
                      size="sm"
                      onClick={() => setCalendarViewMode("month")}
                      className="rounded-md text-xs sm:text-sm"
                    >
                      월간
                    </Button>
                  </div>
                </div>

                {/* Navigation and Title */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        const newDate = new Date(selectedCalendarDate);
                        if (calendarViewMode === "week") {
                          newDate.setDate(newDate.getDate() - 7);
                        } else {
                          newDate.setMonth(newDate.getMonth() - 1);
                        }
                        setSelectedCalendarDate(newDate);
                      }}
                      className="h-8 w-8 p-0"
                    >
                      ←
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setSelectedCalendarDate(new Date())}
                      className="bg-green-50 text-green-700 hover:bg-green-100 text-xs"
                    >
                      오늘
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        const newDate = new Date(selectedCalendarDate);
                        if (calendarViewMode === "week") {
                          newDate.setDate(newDate.getDate() + 7);
                        } else {
                          newDate.setMonth(newDate.getMonth() + 1);
                        }
                        setSelectedCalendarDate(newDate);
                      }}
                      className="h-8 w-8 p-0"
                    >
                      →
                    </Button>
                  </div>
                  <div className="text-center text-lg font-semibold">
                    {calendarViewMode === "week" &&
                      `${format(selectedCalendarDate, "yyyy년 M월", {
                        locale: ko,
                      })} ${Math.ceil(selectedCalendarDate.getDate() / 7)}주차`}
                    {calendarViewMode === "month" &&
                      format(selectedCalendarDate, "yyyy년 M월", {
                        locale: ko,
                      })}
                  </div>
                </div>
              </div>

              {/* Calendar Content */}
              {calendarViewMode === "week" && (
                <div className="space-y-4">
                  {/* Week Calendar Grid */}
                  <div className="grid grid-cols-7 gap-1">
                    {/* Day headers */}
                    {["일", "월", "화", "수", "목", "금", "토"].map((day) => (
                      <div
                        key={day}
                        className="text-gray-700 bg-gray-50 rounded p-1 text-center text-xs font-semibold sm:p-2 sm:text-sm"
                      >
                        {day}
                      </div>
                    ))}

                    {/* Week days */}
                    {(() => {
                      const weekStart = new Date(selectedCalendarDate);
                      weekStart.setDate(
                        weekStart.getDate() - weekStart.getDay()
                      );

                      const days = [];
                      for (let i = 0; i < 7; i++) {
                        const currentDate = new Date(weekStart);
                        currentDate.setDate(weekStart.getDate() + i);

                        const dayReservations = reservations.filter(
                          (reservation) => {
                            const slot = slots.find(
                              (s) => s.id === reservation.slotId
                            );
                            if (!slot) return false;
                            const slotDate = new Date(slot.start);
                            return (
                              slotDate.toDateString() ===
                              currentDate.toDateString()
                            );
                          }
                        );

                        const isToday =
                          currentDate.toDateString() ===
                          new Date().toDateString();
                        const isSelected =
                          selectedWeekDay &&
                          selectedWeekDay.toDateString() ===
                            currentDate.toDateString();

                        days.push(
                          <div
                            key={i}
                            className={`min-h-[60px] cursor-pointer rounded-lg border p-2 transition-colors sm:min-h-[80px] ${
                              isToday ? "ring-blue-500 ring-2" : ""
                            } ${
                              isSelected
                                ? "bg-blue-50 border-blue-300"
                                : "hover:bg-gray-50"
                            }`}
                            onClick={() => {
                              setSelectedWeekDay(new Date(currentDate));
                            }}
                          >
                            <div
                              className={`text-center text-xs font-medium sm:text-sm ${
                                isToday ? "text-blue-600" : ""
                              } ${
                                isSelected ? "text-blue-700 font-semibold" : ""
                              }`}
                            >
                              {format(currentDate, "M/d", { locale: ko })}
                            </div>
                            {dayReservations.length > 0 && (
                              <div className="mt-1 text-center">
                                <div className="bg-blue-500 inline-flex h-5 w-5 items-center justify-center rounded-full text-xs text-white">
                                  {dayReservations.length}
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      }

                      return days;
                    })()}
                  </div>

                  {/* Selected Day Schedule */}
                  {selectedWeekDay &&
                    (() => {
                      const dayReservations = reservations.filter(
                        (reservation) => {
                          const slot = slots.find(
                            (s) => s.id === reservation.slotId
                          );
                          if (!slot) return false;
                          const slotDate = new Date(slot.start);
                          return (
                            slotDate.toDateString() ===
                            selectedWeekDay.toDateString()
                          );
                        }
                      );

                      if (dayReservations.length === 0) {
                        return (
                          <div className="bg-gray-50 rounded-lg p-4 text-center">
                            <div className="text-gray-700 mb-2 text-lg font-semibold">
                              {format(selectedWeekDay, "M월 d일", {
                                locale: ko,
                              })}
                            </div>
                            <div className="text-gray-500 text-sm">
                              이 날에는 예약이 없습니다.
                            </div>
                          </div>
                        );
                      }

                      return (
                        <div className="rounded-lg border bg-white p-4">
                          <div className="text-gray-900 mb-4 text-lg font-semibold">
                            {format(selectedWeekDay, "M월 d일", {
                              locale: ko,
                            })}{" "}
                            예약
                          </div>
                          <div className="space-y-3">
                            {dayReservations.map((reservation) => {
                              const slot = slots.find(
                                (s) => s.id === reservation.slotId
                              );
                              return (
                                <div
                                  key={reservation.id}
                                  className="bg-blue-50 border-blue-200 hover:bg-blue-100 flex cursor-pointer items-center justify-between rounded-lg border p-3 transition-colors"
                                  onClick={() => {
                                    setSelectedReservationDetail(reservation);
                                    setIsReservationDetailDialogOpen(true);
                                  }}
                                >
                                  <div className="min-w-0 flex-1">
                                    <div className="text-blue-900 font-semibold">
                                      {kycNames[reservation.userId] ||
                                        "Unknown"}
                                    </div>
                                    <div className="text-blue-700 break-all text-sm">
                                      {reservation.userEmail}
                                    </div>
                                    <div className="text-blue-600 text-xs">
                                      연락처:{" "}
                                      {kycContacts[reservation.userId] || "-"}
                                    </div>
                                  </div>
                                  <div className="ml-2 flex-shrink-0 text-right">
                                    <div className="text-blue-600 text-lg font-bold">
                                      {slot
                                        ? format(new Date(slot.start), "HH:mm")
                                        : "시간 미정"}
                                    </div>
                                    <div className="text-blue-500 text-sm">
                                      {format(
                                        new Date(reservation.createdAt),
                                        "MM/dd"
                                      )}
                                    </div>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })()}
                </div>
              )}

              {/* Calendar Content */}
              {calendarViewMode === "month" && (
                <div className="space-y-4">
                  {/* Month Calendar Grid */}
                  <div className="grid grid-cols-7 gap-1">
                    {/* Day headers */}
                    {["일", "월", "화", "수", "목", "금", "토"].map((day) => (
                      <div
                        key={day}
                        className="text-gray-700 bg-gray-50 rounded p-1 text-center text-xs font-semibold sm:p-2 sm:text-sm"
                      >
                        {day}
                      </div>
                    ))}

                    {/* Calendar days */}
                    {(() => {
                      const year = selectedCalendarDate.getFullYear();
                      const month = selectedCalendarDate.getMonth();
                      const firstDay = new Date(year, month, 1);
                      const lastDay = new Date(year, month + 1, 0);
                      const startDate = new Date(firstDay);
                      startDate.setDate(
                        startDate.getDate() - firstDay.getDay()
                      );

                      const days = [];
                      const currentDate = new Date(startDate);

                      while (
                        currentDate <= lastDay ||
                        currentDate.getDay() !== 0
                      ) {
                        const dateStr = currentDate.toISOString().slice(0, 10);
                        const currentDateCopy = new Date(currentDate);
                        const dayReservations = reservations.filter(
                          (reservation) => {
                            const slot = slots.find(
                              (s) => s.id === reservation.slotId
                            );
                            if (!slot) return false;
                            const slotDate = new Date(slot.start);
                            return (
                              slotDate.toDateString() ===
                              currentDateCopy.toDateString()
                            );
                          }
                        );

                        const isCurrentMonth =
                          currentDateCopy.getMonth() === month;
                        const isToday =
                          currentDateCopy.toDateString() ===
                          new Date().toDateString();
                        const isSelected =
                          selectedMonthDay &&
                          selectedMonthDay.toDateString() ===
                            currentDateCopy.toDateString();

                        // 현재 월부터 +6개월까지만 표시
                        const currentDateForCheck = new Date();
                        const maxDate = new Date();
                        maxDate.setMonth(maxDate.getMonth() + 6);

                        const isWithinAllowedRange =
                          currentDateCopy >= currentDateForCheck &&
                          currentDateCopy <= maxDate;

                        // 이전 달이거나 허용 범위를 벗어난 경우 숨김
                        if (!isCurrentMonth && !isWithinAllowedRange) {
                          days.push(
                            <div
                              key={dateStr}
                              className="min-h-[60px] p-1 sm:min-h-[80px] sm:p-2"
                            ></div>
                          );
                        } else {
                          days.push(
                            <div
                              key={dateStr}
                              className={`min-h-[60px] cursor-pointer rounded-lg border p-1 transition-colors sm:min-h-[80px] sm:p-2 ${
                                isCurrentMonth
                                  ? "bg-white"
                                  : "bg-gray-50 text-gray-400"
                              } ${isToday ? "ring-blue-500 ring-2" : ""} ${
                                isSelected
                                  ? "bg-blue-50 border-blue-300"
                                  : "hover:bg-gray-50"
                              }`}
                              onClick={() => {
                                setSelectedMonthDay(currentDateCopy);
                              }}
                            >
                              <div
                                className={`text-center text-xs font-medium sm:text-sm ${
                                  isToday ? "text-blue-600" : ""
                                } ${
                                  isSelected
                                    ? "text-blue-700 font-semibold"
                                    : ""
                                }`}
                              >
                                {currentDateCopy.getDate()}
                              </div>
                              {isCurrentMonth && dayReservations.length > 0 && (
                                <div className="mt-1 text-center">
                                  <div className="bg-blue-500 inline-flex h-5 w-5 items-center justify-center rounded-full text-xs text-white">
                                    {dayReservations.length}
                                  </div>
                                </div>
                              )}
                            </div>
                          );
                        }

                        currentDate.setDate(currentDate.getDate() + 1);
                      }

                      return days;
                    })()}
                  </div>

                  {/* Selected Day Schedule */}
                  {selectedMonthDay &&
                    (() => {
                      const dayReservations = reservations.filter(
                        (reservation) => {
                          const slot = slots.find(
                            (s) => s.id === reservation.slotId
                          );
                          if (!slot) return false;
                          const slotDate = new Date(slot.start);
                          return (
                            slotDate.toDateString() ===
                            selectedMonthDay.toDateString()
                          );
                        }
                      );

                      if (dayReservations.length === 0) {
                        return (
                          <div className="bg-gray-50 rounded-lg p-4 text-center">
                            <div className="text-gray-700 mb-2 text-lg font-semibold">
                              {format(selectedMonthDay, "M월 d일", {
                                locale: ko,
                              })}
                            </div>
                            <div className="text-gray-500 text-sm">
                              이 날에는 예약이 없습니다.
                            </div>
                          </div>
                        );
                      }

                      return (
                        <div className="rounded-lg border bg-white p-4">
                          <div className="text-gray-900 mb-4 text-lg font-semibold">
                            {format(selectedMonthDay, "M월 d일", {
                              locale: ko,
                            })}{" "}
                            예약
                          </div>
                          <div className="space-y-3">
                            {dayReservations.map((reservation) => {
                              const slot = slots.find(
                                (s) => s.id === reservation.slotId
                              );
                              return (
                                <div
                                  key={reservation.id}
                                  className="bg-blue-50 border-blue-200 hover:bg-blue-100 flex cursor-pointer items-center justify-between rounded-lg border p-3 transition-colors"
                                  onClick={() => {
                                    setSelectedReservationDetail(reservation);
                                    setIsReservationDetailDialogOpen(true);
                                  }}
                                >
                                  <div className="min-w-0 flex-1">
                                    <div className="text-blue-900 font-semibold">
                                      {kycNames[reservation.userId] ||
                                        "Unknown"}
                                    </div>
                                    <div className="text-blue-700 break-all text-sm">
                                      {reservation.userEmail}
                                    </div>
                                    <div className="text-blue-600 text-xs">
                                      연락처:{" "}
                                      {kycContacts[reservation.userId] || "-"}
                                    </div>
                                  </div>
                                  <div className="ml-2 flex-shrink-0 text-right">
                                    <div className="text-blue-600 text-lg font-bold">
                                      {slot
                                        ? format(new Date(slot.start), "HH:mm")
                                        : "시간 미정"}
                                    </div>
                                    <div className="text-blue-500 text-sm">
                                      {format(
                                        new Date(reservation.createdAt),
                                        "MM/dd"
                                      )}
                                    </div>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })()}
                </div>
              )}
            </div>
          </div>
        )}

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

      {/* Reservation Detail Dialog */}
      <Dialog
        open={isReservationDetailDialogOpen}
        onOpenChange={setIsReservationDetailDialogOpen}
      >
        <DialogContent
          className={`
            h-full max-h-[90vh] w-full
            max-w-4xl overflow-y-auto rounded-lg
            !bg-white p-0
            sm:max-h-[85vh]
            sm:max-w-2xl
            sm:p-6
          `}
          style={{
            // 모바일에서 적당한 크기로 조정
            ...(typeof window !== "undefined" && window.innerWidth < 640
              ? {
                  width: "95vw",
                  height: "90vh",
                  maxWidth: "95vw",
                  maxHeight: "90vh",
                  borderRadius: "8px",
                }
              : {}),
          }}
        >
          <DialogHeader>
            <DialogTitle className="text-xl font-bold">
              예약 상세 정보
            </DialogTitle>
          </DialogHeader>
          {selectedReservationDetail && (
            <div className="space-y-6 p-4 sm:p-6">
              {/* KYC 정보 섹션 */}
              {userDataMap[selectedReservationDetail.userId] && (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <h3 className="text-gray-900 text-base font-semibold sm:text-lg">
                      KYC 정보
                    </h3>
                    {(() => {
                      const user =
                        userDataMap[selectedReservationDetail.userId];
                      return (
                        <div className="space-y-6">
                          {/* Basic Information */}
                          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                            <div className="space-y-2">
                              <h4 className="text-gray-900 font-semibold">
                                기본 정보
                              </h4>
                              <div className="space-y-1 text-sm">
                                <div className="flex justify-between">
                                  <span className="text-gray-600">이름</span>
                                  <span className="font-medium">
                                    {user.name}
                                  </span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-gray-600">성별</span>
                                  <span className="font-medium">
                                    {user.gender === "male"
                                      ? "남성"
                                      : user.gender === "female"
                                      ? "여성"
                                      : user.gender === "other"
                                      ? "기타"
                                      : "-"}
                                  </span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-gray-600">
                                    출생년도
                                  </span>
                                  <span className="font-medium">
                                    {user.birthYear || "-"}
                                  </span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-gray-600">연락처</span>
                                  <span className="font-medium">
                                    {user.contact}
                                  </span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-gray-600">시군구</span>
                                  <span className="font-medium">
                                    {user.district
                                      ? districts.find(
                                          (d) => d.value === user.district
                                        )?.label || user.district
                                      : "-"}
                                  </span>
                                </div>
                                {user.detailedAddress && (
                                  <div className="flex justify-between">
                                    <span className="text-gray-600">
                                      상세주소
                                    </span>
                                    <span className="font-medium">
                                      {user.detailedAddress}
                                    </span>
                                  </div>
                                )}
                                <div className="flex justify-between">
                                  <span className="text-gray-600">이메일</span>
                                  <span className="font-medium">
                                    {user.email}
                                  </span>
                                </div>
                              </div>
                            </div>

                            <div className="space-y-2">
                              <h4 className="text-gray-900 font-semibold">
                                시술 정보
                              </h4>
                              <div className="space-y-1 text-sm">
                                <div className="flex justify-between">
                                  <span className="text-gray-600">
                                    피부타입
                                  </span>
                                  <span className="font-medium">
                                    {user.skinType === "oily"
                                      ? "지성"
                                      : user.skinType === "dry"
                                      ? "건성"
                                      : user.skinType === "normal"
                                      ? "중성"
                                      : user.skinType === "combination"
                                      ? "복합성"
                                      : user.skinType === "unknown"
                                      ? "모르겠음"
                                      : user.skinType === "other"
                                      ? "기타"
                                      : "-"}
                                  </span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-gray-600">
                                    기존 시술 경험
                                  </span>
                                  <span className="font-medium">
                                    {user.hasPreviousTreatment
                                      ? "있음"
                                      : "없음"}
                                  </span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-gray-600">신청일</span>
                                  <span className="font-medium">
                                    {user.createdAt
                                      ? user.createdAt.toLocaleString("ko-KR", {
                                          year: "numeric",
                                          month: "long",
                                          day: "numeric",
                                          hour: "2-digit",
                                          minute: "2-digit",
                                        })
                                      : "-"}
                                  </span>
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* Photos */}
                          <div className="space-y-4">
                            <h4 className="text-gray-900 font-semibold">
                              눈썹 사진
                            </h4>
                            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                              {/* Left Photo */}
                              <div className="space-y-2">
                                <h5 className="text-gray-700 text-sm font-medium">
                                  좌측
                                </h5>
                                {(user.photoURLs?.left || user.photoURL) && (
                                  <div className="relative aspect-square w-full overflow-hidden rounded-lg border bg-white">
                                    <Image
                                      src={
                                        user.photoURLs?.left ||
                                        user.photoURL ||
                                        ""
                                      }
                                      alt="좌측 눈썹"
                                      fill
                                      className="object-contain"
                                      unoptimized={(
                                        user.photoURLs?.left ||
                                        user.photoURL ||
                                        ""
                                      ).startsWith("data:")}
                                      onError={(e) => {
                                        console.error(
                                          "Failed to load left image"
                                        );
                                        e.currentTarget.style.display = "none";
                                      }}
                                    />
                                    {user.photoType === "base64" && (
                                      <div className="bg-blue-100 text-blue-800 absolute top-2 right-2 rounded px-2 py-1 text-xs">
                                        Base64
                                      </div>
                                    )}
                                  </div>
                                )}
                              </div>

                              {/* Front Photo */}
                              <div className="space-y-2">
                                <h5 className="text-gray-700 text-sm font-medium">
                                  정면
                                </h5>
                                {(user.photoURLs?.front || user.photoURL) && (
                                  <div className="relative aspect-square w-full overflow-hidden rounded-lg border bg-white">
                                    <Image
                                      src={
                                        user.photoURLs?.front ||
                                        user.photoURL ||
                                        ""
                                      }
                                      alt="정면 눈썹"
                                      fill
                                      className="object-contain"
                                      unoptimized={(
                                        user.photoURLs?.front ||
                                        user.photoURL ||
                                        ""
                                      ).startsWith("data:")}
                                      onError={(e) => {
                                        console.error(
                                          "Failed to load front image"
                                        );
                                        e.currentTarget.style.display = "none";
                                      }}
                                    />
                                    {user.photoType === "base64" && (
                                      <div className="bg-blue-100 text-blue-800 absolute top-2 right-2 rounded px-2 py-1 text-xs">
                                        Base64
                                      </div>
                                    )}
                                  </div>
                                )}
                              </div>

                              {/* Right Photo */}
                              <div className="space-y-2">
                                <h5 className="text-gray-700 text-sm font-medium">
                                  우측
                                </h5>
                                {(user.photoURLs?.right || user.photoURL) && (
                                  <div className="relative aspect-square w-full overflow-hidden rounded-lg border bg-white">
                                    <Image
                                      src={
                                        user.photoURLs?.right ||
                                        user.photoURL ||
                                        ""
                                      }
                                      alt="우측 눈썹"
                                      fill
                                      className="object-contain"
                                      unoptimized={(
                                        user.photoURLs?.right ||
                                        user.photoURL ||
                                        ""
                                      ).startsWith("data:")}
                                      onError={(e) => {
                                        console.error(
                                          "Failed to load right image"
                                        );
                                        e.currentTarget.style.display = "none";
                                      }}
                                    />
                                    {user.photoType === "base64" && (
                                      <div className="bg-blue-100 text-blue-800 absolute top-2 right-2 rounded px-2 py-1 text-xs">
                                        Base64
                                      </div>
                                    )}
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>

                          {/* 거절 사유 (있는 경우) */}
                          {user.rejectReason && (
                            <div className="space-y-2">
                              <h4 className="text-gray-900 font-semibold">
                                거절 사유
                              </h4>
                              <div className="text-red-600 bg-red-50 border-red-200 rounded-lg border p-3 text-sm">
                                {user.rejectReason}
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })()}
                  </div>
                </div>
              )}

              {/* 예약 정보 섹션 */}
              <div className="space-y-4">
                <div className="space-y-2">
                  <h3 className="text-gray-900 text-base font-semibold sm:text-lg">
                    예약 정보
                  </h3>
                  <div className="grid grid-cols-1 gap-2 text-xs sm:grid-cols-2 sm:gap-4 sm:text-sm">
                    <div>
                      <span className="font-medium">예약 시간:</span>{" "}
                      {(() => {
                        const slot = slots.find(
                          (s) => s.id === selectedReservationDetail.slotId
                        );
                        return slot
                          ? format(new Date(slot.start), "yyyy년 M월 d일 HH:mm")
                          : "시간 미정";
                      })()}
                    </div>
                    <div>
                      <span className="font-medium">예약 ID:</span>{" "}
                      <span className="break-all">
                        {selectedReservationDetail.id}
                      </span>
                    </div>
                    <div>
                      <span className="font-medium">사용자 ID:</span>{" "}
                      <span className="break-all">
                        {selectedReservationDetail.userId}
                      </span>
                    </div>
                    <div>
                      <span className="font-medium">슬롯 ID:</span>{" "}
                      <span className="break-all">
                        {selectedReservationDetail.slotId}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <h3 className="text-gray-900 text-base font-semibold sm:text-lg">
                    예약 상태
                  </h3>
                  <div className="space-y-1 text-xs sm:text-sm">
                    <div>
                      <span className="font-medium">상태:</span>{" "}
                      <Badge
                        variant={
                          selectedReservationDetail.status === "approved"
                            ? "default"
                            : selectedReservationDetail.status ===
                              "payment_confirmed"
                            ? "secondary"
                            : selectedReservationDetail.status ===
                              "payment_required"
                            ? "outline"
                            : selectedReservationDetail.status === "cancelled"
                            ? "destructive"
                            : selectedReservationDetail.status === "rejected"
                            ? "destructive"
                            : "outline"
                        }
                      >
                        {selectedReservationDetail.status === "approved"
                          ? "확정"
                          : selectedReservationDetail.status ===
                            "payment_confirmed"
                          ? "입금확인중"
                          : selectedReservationDetail.status ===
                            "payment_required"
                          ? "입금대기"
                          : selectedReservationDetail.status === "cancelled"
                          ? "취소됨"
                          : selectedReservationDetail.status === "rejected"
                          ? "거절"
                          : "대기"}
                      </Badge>
                    </div>
                  </div>
                </div>
              </div>

              {/* 시간 정보 */}
              <div className="space-y-2">
                <h3 className="text-gray-900 text-base font-semibold sm:text-lg">
                  시간 정보
                </h3>
                <div className="grid grid-cols-1 gap-4 text-xs sm:text-sm">
                  <div>
                    <span className="font-medium">예약 생성일:</span>
                    <div className="text-gray-600 break-words">
                      {selectedReservationDetail.createdAt &&
                      !isNaN(selectedReservationDetail.createdAt.getTime())
                        ? selectedReservationDetail.createdAt.toLocaleString(
                            "ko-KR",
                            {
                              year: "numeric",
                              month: "long",
                              day: "numeric",
                              hour: "2-digit",
                              minute: "2-digit",
                              second: "2-digit",
                            }
                          )
                        : "날짜 정보 없음"}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsReservationDetailDialogOpen(false);
                setSelectedReservationDetail(null);
              }}
            >
              닫기
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
