"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
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

import { db } from "@/lib/firebase";
import {
  collection,
  query,
  where,
  updateDoc,
  doc,
  onSnapshot,
  Timestamp,
} from "firebase/firestore";
import { createNotification, notificationTemplates } from "@/lib/notifications";

interface UserData {
  id: string;
  userId: string; // Firebase Auth UID or "guest"
  email: string;
  name: string;
  contact: string;
  photoURL: string;
  photoType?: "base64" | "firebase-storage";
  kycStatus: string;
  rejectReason?: string;
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
  const { user, loading } = useAuth();
  const router = useRouter();
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [pendingUsers, setPendingUsers] = useState<UserData[]>([]);
  const [approvedUsers, setApprovedUsers] = useState<UserData[]>([]);
  const [rejectedUsers, setRejectedUsers] = useState<UserData[]>([]);
  const [admins, setAdmins] = useState<AdminUser[]>([]);
  const [isRejectDialogOpen, setIsRejectDialogOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [slots, setSlots] = useState<SlotData[]>([]);

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
      unsubAdmins();
      unsubSlots();
    };
  }, [user, isAuthorized]);

  const handleReject = async () => {
    if (!selectedUserId || !rejectReason.trim()) return;

    try {
      // Get user data before updating
      const user = pendingUsers.find((u) => u.id === selectedUserId);
      if (!user) {
        console.error("User not found");
        return;
      }

      // Update user status
      await updateDoc(doc(db, "users", selectedUserId), {
        kycStatus: "rejected",
        rejectReason: rejectReason.trim(),
        rejectedAt: Timestamp.now(),
      });

      // Create notification for the user
      try {
        const notification = notificationTemplates.kycRejected(
          user.name,
          rejectReason.trim()
        );
        await createNotification({
          userId: user.userId || selectedUserId, // Use the actual userId from user data
          type: "kyc_rejected",
          title: notification.title,
          message: notification.message,
          data: {
            rejectReason: rejectReason.trim(),
            rejectedAt: new Date(),
          },
        });
        console.log(
          "KYC rejection notification created for user:",
          user.userId || selectedUserId
        );
      } catch (notificationError) {
        console.error(
          "Error creating KYC rejection notification:",
          notificationError
        );
        // Don't fail the rejection if notification fails
      }

      // Send email notification
      try {
        await fetch("/api/email/send", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            to: user.email,
            userName: user.name,
            statusType: "kyc",
            newStatus: "rejected",
            rejectReason: rejectReason.trim(),
            subject: "[네이처서울] KYC 거부 안내",
            html: "", // Will be generated by the API
          }),
        });
        console.log("KYC rejection email sent to:", user.email);
      } catch (emailError) {
        console.error("Error sending KYC rejection email:", emailError);
        // Don't fail the rejection if email fails
      }

      setIsRejectDialogOpen(false);
      setRejectReason("");
      setSelectedUserId(null);
    } catch (error) {
      console.error("Error rejecting user:", error);
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

  // Combine Firestore admins and hardcoded admins for accurate count
  const hardcodedAdmins = [
    {
      id: "blacksheepwall-xyz",
      email: "blacksheepwall.xyz@gmail.com",
      isActive: true,
      createdAt: new Date("2024-01-01"),
    },
    {
      id: "blacksheepwall-google",
      email: "blacksheepwall.xyz@google.com",
      isActive: true,
      createdAt: new Date("2024-01-01"),
    },
  ];
  const allAdmins = [...admins];
  hardcodedAdmins.forEach((hardcodedAdmin) => {
    if (!allAdmins.some((admin) => admin.email === hardcodedAdmin.email)) {
      allAdmins.push(hardcodedAdmin);
    }
  });

  return (
    <div className="bg-gradient-to-br from-gray-50 min-h-screen to-white p-4">
      <div className="container mx-auto max-w-7xl">
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            {/* Nature Seoul Logo */}
            <div className="flex items-center gap-3">
              <div className="flex flex-col">
                <h1 className="text-black text-xl font-light tracking-wide">
                  nature.seoul
                </h1>
                <p className="text-gray-400 text-[10px] tracking-wide">
                  premium studio
                </p>
              </div>
            </div>

            {/* Admin Badge */}
            <div className="bg-gradient-to-r from-blue-500 to-purple-600 shadow-md hidden items-center gap-2 rounded-full px-3 py-1 text-sm font-medium text-white sm:flex">
              <svg
                className="h-4 w-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                />
              </svg>
              Admin
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* User Info */}
            <div className="shadow-sm border-gray-200 hidden items-center gap-2 rounded-lg border bg-white px-3 py-2 sm:flex">
              <div className="bg-gradient-to-br from-blue-400 to-purple-500 flex h-8 w-8 items-center justify-center rounded-full">
                <span className="text-sm font-medium text-white">
                  {user?.email?.charAt(0).toUpperCase() || "A"}
                </span>
              </div>
              <div className="flex flex-col">
                <span className="text-gray-900 text-sm font-medium">
                  관리자
                </span>
                <span className="text-gray-500 text-xs">{user?.email}</span>
              </div>
            </div>

            <Button
              variant="outline"
              onClick={() => {
                router.push("/dashboard");
              }}
              className="hover:bg-gray-50 border-gray-200 flex items-center gap-2 bg-white"
            >
              <svg
                className="h-4 w-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                />
              </svg>
              사용자 모드
            </Button>
          </div>
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
                고객관리
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
                예약관리
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
            onClick={() => router.push("/admin/masterboard")}
          >
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <div className="bg-orange-100 rounded-lg p-2">
                  <svg
                    className="text-orange-600 h-6 w-6"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                    />
                  </svg>
                </div>
                마스터보드
              </CardTitle>
              <CardDescription>모든 사용자 정보 관리</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="text-gray-500 text-sm">
                  총{" "}
                  {pendingUsers.length +
                    approvedUsers.length +
                    rejectedUsers.length}
                  명의 사용자
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
                Admin
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
