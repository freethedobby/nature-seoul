"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";

import { Badge } from "@/components/ui/badge";
import { CheckCircle, XCircle, UserPlus, Trash2, Eye } from "lucide-react";
import { db } from "@/lib/firebase";
import {
  collection,
  query,
  where,
  updateDoc,
  doc,
  onSnapshot,
  addDoc,
  deleteDoc,
  getDocs,
  Timestamp,
} from "firebase/firestore";
import Image from "next/image";

interface UserData {
  id: string;
  email: string;
  name: string;
  contact: string;
  photoURL: string;
  photoType?: "base64" | "firebase-storage";
  kycStatus: string;
  rejectReason?: string;
  createdAt: Date;
}

interface ReservationData {
  id: string;
  userId: string;
  userName: string;
  date: string;
  time: string;
  status: string;
  createdAt: Date;
}

interface AdminUser {
  id: string;
  email: string;
  isActive: boolean;
  createdAt: Date;
}

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

export default function AdminDashboard() {
  const { user, loading, isAdminMode, setIsAdminMode } = useAuth();
  const router = useRouter();
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [pendingUsers, setPendingUsers] = useState<UserData[]>([]);
  const [approvedUsers, setApprovedUsers] = useState<UserData[]>([]);
  const [rejectedUsers, setRejectedUsers] = useState<UserData[]>([]);
  const [reservations, setReservations] = useState<ReservationData[]>([]);
  const [admins, setAdmins] = useState<AdminUser[]>([]);
  const [isRejectDialogOpen, setIsRejectDialogOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [newAdminEmail, setNewAdminEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [slots, setSlots] = useState<SlotData[]>([]);
  const [showSlotDialog, setShowSlotDialog] = useState(false);
  const [slotType, setSlotType] = useState<"recurring" | "custom">("custom");
  const [customSlot, setCustomSlot] = useState({ start: "", end: "" });
  const [recurringSlot, setRecurringSlot] = useState<{
    daysOfWeek: number[];
    startTime: string;
    endTime: string;
    intervalMinutes: number;
  }>({ daysOfWeek: [], startTime: "", endTime: "", intervalMinutes: 120 });
  const [isSlotSubmitting, setIsSlotSubmitting] = useState(false);

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
              router.push("/login?redirectTo=/admin");
            }
          } else {
            setIsAuthorized(false);
            router.push("/login?redirectTo=/admin");
          }
        } catch (error) {
          console.error("Error checking admin status:", error);
          setIsAuthorized(false);
          router.push("/login?redirectTo=/admin");
        }
      } else if (!loading && !user) {
        router.push("/login?redirectTo=/admin");
      }
    };

    checkAdminStatus();
  }, [user, loading, router]);

  useEffect(() => {
    if (!user || !isAuthorized) return;

    // Subscribe to pending users
    const pendingQuery = query(
      collection(db, "users"),
      where("kycStatus", "==", "pending")
    );

    const unsubPending = onSnapshot(pendingQuery, (snapshot) => {
      const users: UserData[] = [];
      snapshot.forEach((doc) => {
        users.push({ id: doc.id, ...doc.data() } as UserData);
      });
      // Sort client-side to avoid composite index requirement
      users.sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
      setPendingUsers(users);
    });

    // Subscribe to approved users
    const approvedQuery = query(
      collection(db, "users"),
      where("kycStatus", "==", "approved")
    );

    const unsubApproved = onSnapshot(approvedQuery, (snapshot) => {
      const users: UserData[] = [];
      snapshot.forEach((doc) => {
        users.push({ id: doc.id, ...doc.data() } as UserData);
      });
      // Sort client-side to avoid composite index requirement
      users.sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
      setApprovedUsers(users);
    });

    // Subscribe to rejected users
    const rejectedQuery = query(
      collection(db, "users"),
      where("kycStatus", "==", "rejected")
    );

    const unsubRejected = onSnapshot(rejectedQuery, (snapshot) => {
      const users: UserData[] = [];
      snapshot.forEach((doc) => {
        users.push({ id: doc.id, ...doc.data() } as UserData);
      });
      // Sort client-side to avoid composite index requirement
      users.sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
      setRejectedUsers(users);
    });

    // Subscribe to reservations
    const reservationsQuery = query(collection(db, "reservations"));

    const unsubReservations = onSnapshot(reservationsQuery, (snapshot) => {
      const reservs: ReservationData[] = [];
      snapshot.forEach((doc) => {
        reservs.push({ id: doc.id, ...doc.data() } as ReservationData);
      });
      // Sort client-side to avoid composite index requirement
      reservs.sort(
        (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
      );
      setReservations(reservs);
    });

    // Subscribe to admins
    const adminsQuery = query(collection(db, "admins"));

    const unsubAdmins = onSnapshot(adminsQuery, (snapshot) => {
      const adminUsers: AdminUser[] = [];
      snapshot.forEach((doc) => {
        adminUsers.push({ id: doc.id, ...doc.data() } as AdminUser);
      });
      // Sort client-side to avoid composite index requirement
      adminUsers.sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
      setAdmins(adminUsers);
    });

    // Fetch slots
    const slotsQuery = query(collection(db, "slots"));
    const unsubSlots = onSnapshot(slotsQuery, (snapshot) => {
      const slotList: SlotData[] = [];
      snapshot.forEach((doc) => {
        const data = doc.data();
        slotList.push({
          id: doc.id,
          start: data.start.toDate(),
          end: data.end.toDate(),
          type: data.type,
          recurrence: data.recurrence,
          status: data.status,
          createdBy: data.createdBy,
          createdAt: data.createdAt.toDate(),
        });
      });
      setSlots(slotList);
    });

    return () => {
      unsubPending();
      unsubApproved();
      unsubRejected();
      unsubReservations();
      unsubAdmins();
      unsubSlots();
    };
  }, [user, isAuthorized]);

  const handleApprove = async (userId: string) => {
    try {
      const userRef = doc(db, "users", userId);
      await updateDoc(userRef, {
        kycStatus: "approved",
        approvedAt: Timestamp.now(),
      });
    } catch (error) {
      console.error("Error approving user:", error);
    }
  };

  const handleReject = async () => {
    if (!selectedUserId || !rejectReason.trim()) return;

    try {
      const userRef = doc(db, "users", selectedUserId);
      await updateDoc(userRef, {
        kycStatus: "rejected",
        rejectReason: rejectReason.trim(),
        rejectedAt: Timestamp.now(),
      });

      setIsRejectDialogOpen(false);
      setRejectReason("");
      setSelectedUserId(null);
    } catch (error) {
      console.error("Error rejecting user:", error);
    }
  };

  const handleAddAdmin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!newAdminEmail.trim()) return;

    setIsSubmitting(true);
    try {
      const response = await fetch("/api/admin/add", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email: newAdminEmail.trim() }),
      });

      if (response.ok) {
        setNewAdminEmail("");
      } else {
        console.error("Failed to add admin");
      }
    } catch (error) {
      console.error("Error adding admin:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRemoveAdmin = async (email: string) => {
    try {
      const response = await fetch("/api/admin/remove", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email }),
      });

      if (!response.ok) {
        console.error("Failed to remove admin");
      }
    } catch (error) {
      console.error("Error removing admin:", error);
    }
  };

  const handleCreateSlot = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSlotSubmitting(true);

    try {
      if (slotType === "custom") {
        const startDate = new Date(customSlot.start);
        const endDate = new Date(customSlot.end);

        await addDoc(collection(db, "slots"), {
          start: Timestamp.fromDate(startDate),
          end: Timestamp.fromDate(endDate),
          type: "custom",
          status: "available",
          createdBy: user?.email,
          createdAt: Timestamp.now(),
        });
      } else {
        // For recurring slots, create multiple slots based on the pattern
        const startTime = recurringSlot.startTime;
        const endTime = recurringSlot.endTime;
        const intervalMinutes = recurringSlot.intervalMinutes;

        // Create slots for the next 4 weeks
        const now = new Date();
        const endDate = new Date(now.getTime() + 4 * 7 * 24 * 60 * 60 * 1000); // 4 weeks from now

        for (
          let date = new Date(now);
          date <= endDate;
          date.setDate(date.getDate() + 1)
        ) {
          if (recurringSlot.daysOfWeek.includes(date.getDay())) {
            const [startHour, startMinute] = startTime.split(":").map(Number);
            const [endHour, endMinute] = endTime.split(":").map(Number);

            let currentTime = new Date(date);
            currentTime.setHours(startHour, startMinute, 0, 0);

            const endTimeOfDay = new Date(date);
            endTimeOfDay.setHours(endHour, endMinute, 0, 0);

            while (currentTime < endTimeOfDay) {
              const slotEnd = new Date(
                currentTime.getTime() + intervalMinutes * 60 * 1000
              );

              if (slotEnd <= endTimeOfDay) {
                await addDoc(collection(db, "slots"), {
                  start: Timestamp.fromDate(currentTime),
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

              currentTime = slotEnd;
            }
          }
        }
      }

      setShowSlotDialog(false);
      setCustomSlot({ start: "", end: "" });
      setRecurringSlot({
        daysOfWeek: [],
        startTime: "",
        endTime: "",
        intervalMinutes: 120,
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
    <div className="bg-gradient-to-br from-gray-50 min-h-screen to-white p-4">
      <div className="container mx-auto max-w-7xl">
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-col gap-1">
            <h1 className="text-gray-900 font-sans text-3xl font-extrabold tracking-tight">
              Admin
            </h1>
            <div className="bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 mt-1 mb-2 h-1 w-16 rounded-full opacity-70"></div>
          </div>
          <Button
            variant="outline"
            onClick={() => {
              setIsAdminMode(false);
              router.push("/dashboard");
            }}
            className="flex items-center gap-2"
          >
            <Eye className="h-4 w-4" />
            사용자 페이지로
          </Button>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          <Card
            className="hover:shadow-lg cursor-pointer transition-shadow"
            onClick={() => router.push("/admin/kyc")}
          >
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <div className="bg-blue-100 rounded-lg p-2">
                  <svg
                    className="text-blue-600 h-6 w-6"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                </div>
                KYC 관리
              </CardTitle>
              <CardDescription>KYC 승인, 반려, 예약 관리</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="text-gray-500 text-sm">
                  대기: {pendingUsers.length} | 승인: {approvedUsers.length} |
                  반려: {rejectedUsers?.length || 0}
                </div>
                <svg
                  className="text-gray-400 h-5 w-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 5l7 7-7 7"
                  />
                </svg>
              </div>
            </CardContent>
          </Card>

          <Card
            className="hover:shadow-lg cursor-pointer transition-shadow"
            onClick={() => router.push("/admin/slots")}
          >
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <div className="bg-green-100 rounded-lg p-2">
                  <svg
                    className="text-green-600 h-6 w-6"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                    />
                  </svg>
                </div>
                예약 슬롯 관리
              </CardTitle>
              <CardDescription>예약 가능한 시간대 관리</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="text-gray-500 text-sm">
                  총 {slots.length}개 슬롯
                </div>
                <svg
                  className="text-gray-400 h-5 w-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 5l7 7-7 7"
                  />
                </svg>
              </div>
            </CardContent>
          </Card>

          <Card
            className="hover:shadow-lg cursor-pointer transition-shadow"
            onClick={() => router.push("/admin/admins")}
          >
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <div className="bg-purple-100 rounded-lg p-2">
                  <svg
                    className="text-purple-600 h-6 w-6"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z"
                    />
                  </svg>
                </div>
                관리자 관리
              </CardTitle>
              <CardDescription>관리자 계정 관리</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="text-gray-500 text-sm">
                  총 {admins.length}명의 관리자
                </div>
                <svg
                  className="text-gray-400 h-5 w-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 5l7 7-7 7"
                  />
                </svg>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <Dialog open={isRejectDialogOpen} onOpenChange={setIsRejectDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>반려 사유 입력</DialogTitle>
            <DialogDescription>
              KYC 신청을 반려하는 사유를 입력해 주세요.
            </DialogDescription>
          </DialogHeader>
          <Textarea
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
            placeholder="반려 사유를 입력하세요"
            className="min-h-[100px]"
          />
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsRejectDialogOpen(false);
                setRejectReason("");
                setSelectedUserId(null);
              }}
            >
              취소
            </Button>
            <Button
              variant="destructive"
              onClick={handleReject}
              disabled={!rejectReason.trim()}
            >
              반려하기
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
