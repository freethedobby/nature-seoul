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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import {
  ClipboardList,
  CheckCircle,
  XCircle,
  Calendar,
  ArrowLeft,
  Eye,
} from "lucide-react";
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
import Image from "next/image";

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

interface UserData {
  id: string;
  userId: string; // Firebase Auth UID or "guest"
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
  photoURL?: string; // Legacy support
  photoType?: "base64" | "firebase-storage";
  kycStatus: string;
  hasPreviousTreatment?: boolean;
  rejectReason?: string;
  createdAt: Date;
  approvedAt?: Date;
  rejectedAt?: Date;
}

interface ReservationData {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  date: string;
  time: string;
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

export default function KYCDashboard() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [pendingUsers, setPendingUsers] = useState<UserData[]>([]);
  const [approvedUsers, setApprovedUsers] = useState<UserData[]>([]);
  const [rejectedUsers, setRejectedUsers] = useState<UserData[]>([]);
  const [reservations, setReservations] = useState<ReservationData[]>([]);
  const [isRejectDialogOpen, setIsRejectDialogOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [expandedUserId, setExpandedUserId] = useState<string | null>(null);
  const [selectedReservationId, setSelectedReservationId] = useState<
    string | null
  >(null);
  const [reservationRejectReason, setReservationRejectReason] = useState("");
  const [isReservationRejectDialogOpen, setIsReservationRejectDialogOpen] =
    useState(false);

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
              router.push("/login?redirectTo=/admin/kyc");
            }
          } else {
            setIsAuthorized(false);
            router.push("/login?redirectTo=/admin/kyc");
          }
        } catch (error) {
          console.error("Error checking admin status:", error);
          setIsAuthorized(false);
          router.push("/login?redirectTo=/admin/kyc");
        }
      } else if (!loading && !user) {
        router.push("/login?redirectTo=/admin/kyc");
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
      console.log("🔄 Pending users snapshot received, count:", snapshot.size);
      const users: UserData[] = [];
      snapshot.forEach((doc) => {
        const data = doc.data();
        console.log("📄 User document:", doc.id, data);
        users.push({
          id: doc.id,
          ...data,
          createdAt:
            data.createdAt && data.createdAt.toDate
              ? data.createdAt.toDate()
              : null,
          approvedAt:
            data.approvedAt && data.approvedAt.toDate
              ? data.approvedAt.toDate()
              : null,
          rejectedAt:
            data.rejectedAt && data.rejectedAt.toDate
              ? data.rejectedAt.toDate()
              : null,
        } as UserData);
      });
      users.sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
      console.log("✅ Setting pending users:", users.length);
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
        const data = doc.data();
        users.push({
          id: doc.id,
          ...data,
          createdAt:
            data.createdAt && data.createdAt.toDate
              ? data.createdAt.toDate()
              : null,
          approvedAt:
            data.approvedAt && data.approvedAt.toDate
              ? data.approvedAt.toDate()
              : null,
          rejectedAt:
            data.rejectedAt && data.rejectedAt.toDate
              ? data.rejectedAt.toDate()
              : null,
        } as UserData);
      });
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
        const data = doc.data();
        users.push({
          id: doc.id,
          ...data,
          createdAt:
            data.createdAt && data.createdAt.toDate
              ? data.createdAt.toDate()
              : null,
          approvedAt:
            data.approvedAt && data.approvedAt.toDate
              ? data.approvedAt.toDate()
              : null,
          rejectedAt:
            data.rejectedAt && data.rejectedAt.toDate
              ? data.rejectedAt.toDate()
              : null,
        } as UserData);
      });
      users.sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
      setRejectedUsers(users);
    });

    // Subscribe to reservations (excluding cancelled ones)
    const reservationsQuery = query(
      collection(db, "reservations"),
      where("status", "!=", "cancelled")
    );

    const unsubReservations = onSnapshot(reservationsQuery, (snapshot) => {
      const reservs: ReservationData[] = [];
      snapshot.forEach((doc) => {
        const data = doc.data();
        reservs.push({
          id: doc.id,
          ...data,
          createdAt:
            data.createdAt && data.createdAt.toDate
              ? data.createdAt.toDate()
              : new Date(data.createdAt || Date.now()),
        } as ReservationData);
      });
      reservs.sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
      setReservations(reservs);
    });

    return () => {
      unsubPending();
      unsubApproved();
      unsubRejected();
      unsubReservations();
    };
  }, [user, isAuthorized]);

  const handleApprove = async (userId: string) => {
    try {
      // Get user data before updating
      const user = pendingUsers.find((u) => u.id === userId);
      if (!user) {
        console.error("User not found");
        return;
      }

      // Update user status
      await updateDoc(doc(db, "users", userId), {
        kycStatus: "approved",
        approvedAt: Timestamp.now(),
      });

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
            newStatus: "approved",
            subject: "[네이처서울] KYC 승인 안내",
            html: "", // Will be generated by the API
          }),
        });
        console.log("KYC approval email sent to:", user.email);
      } catch (emailError) {
        console.error("Error sending KYC approval email:", emailError);
        // Don't fail the approval if email fails
      }
    } catch (error) {
      console.error("Error approving user:", error);
    }
  };

  const handleReject = async () => {
    if (!selectedUserId || !rejectReason.trim()) return;

    console.log("=== KYC REJECTION START ===");
    console.log("selectedUserId:", selectedUserId);
    console.log("rejectReason:", rejectReason.trim());
    console.log("pendingUsers:", pendingUsers);

    try {
      // Get user data before updating
      const user = pendingUsers.find((u) => u.id === selectedUserId);
      if (!user) {
        console.error("User not found");
        return;
      }

      console.log("Found user:", user);
      console.log("User userId:", user.userId);

      // Update user status
      await updateDoc(doc(db, "users", selectedUserId), {
        kycStatus: "rejected",
        rejectReason: rejectReason.trim(),
        rejectedAt: Timestamp.now(),
      });

      // Create notification for the user
      try {
        console.log("Creating notification...");
        const notification = notificationTemplates.kycRejected(
          user.name,
          rejectReason.trim()
        );
        console.log("Notification template:", notification);

        const notificationUserId = user.userId || selectedUserId;
        console.log("Notification userId:", notificationUserId);

        await createNotification({
          userId: notificationUserId,
          type: "kyc_rejected",
          title: notification.title,
          message: notification.message,
          data: {
            rejectReason: rejectReason.trim(),
            rejectedAt: new Date(),
          },
        });
        console.log(
          "✅ KYC rejection notification created for user:",
          notificationUserId
        );
      } catch (notificationError) {
        console.error(
          "❌ Error creating KYC rejection notification:",
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

  // Reservation approval handler
  const handleReservationApprove = async (reservationId: string) => {
    try {
      const reservation = reservations.find((r) => r.id === reservationId);
      if (!reservation) {
        console.error("Reservation not found");
        return;
      }

      // Update reservation status
      await updateDoc(doc(db, "reservations", reservationId), {
        status: "approved",
        approvedAt: Timestamp.now(),
      });

      // Create notification for the user
      try {
        await createNotification({
          userId: reservation.userId,
          type: "reservation_approved",
          title: "예약 승인 완료",
          message: `${reservation.date} ${reservation.time} 예약이 승인되었습니다.`,
        });
        console.log(
          "Reservation approval notification created for user:",
          reservation.userId
        );
      } catch (notificationError) {
        console.error(
          "Error creating reservation approval notification:",
          notificationError
        );
      }

      // Send email notification
      try {
        await fetch("/api/email/send", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            to: reservation.userEmail,
            userName: reservation.userName,
            statusType: "reservation",
            newStatus: "approved",
            subject: "[네이처서울] 예약 승인 안내",
            html: "", // Will be generated by the API
          }),
        });
        console.log(
          "Reservation approval email sent to:",
          reservation.userEmail
        );
      } catch (emailError) {
        console.error("Error sending reservation approval email:", emailError);
      }
    } catch (error) {
      console.error("Error approving reservation:", error);
    }
  };

  // Reservation rejection handler
  const handleReservationReject = async () => {
    if (!selectedReservationId || !reservationRejectReason.trim()) return;

    try {
      const reservation = reservations.find(
        (r) => r.id === selectedReservationId
      );
      if (!reservation) {
        console.error("Reservation not found");
        return;
      }

      // Update reservation status
      await updateDoc(doc(db, "reservations", selectedReservationId), {
        status: "rejected",
        rejectReason: reservationRejectReason.trim(),
        rejectedAt: Timestamp.now(),
      });

      // Create notification for the user
      try {
        await createNotification({
          userId: reservation.userId,
          type: "reservation_rejected",
          title: "예약 거절 안내",
          message: `${reservation.date} ${
            reservation.time
          } 예약이 거절되었습니다. 사유: ${reservationRejectReason.trim()}`,
          data: {
            rejectReason: reservationRejectReason.trim(),
            rejectedAt: new Date(),
          },
        });
        console.log(
          "Reservation rejection notification created for user:",
          reservation.userId
        );
      } catch (notificationError) {
        console.error(
          "Error creating reservation rejection notification:",
          notificationError
        );
      }

      // Send email notification
      try {
        await fetch("/api/email/send", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            to: reservation.userEmail,
            userName: reservation.userName,
            statusType: "reservation",
            newStatus: "rejected",
            rejectReason: reservationRejectReason.trim(),
            subject: "[네이처서울] 예약 거절 안내",
            html: "", // Will be generated by the API
          }),
        });
        console.log(
          "Reservation rejection email sent to:",
          reservation.userEmail
        );
      } catch (emailError) {
        console.error("Error sending reservation rejection email:", emailError);
      }

      setIsReservationRejectDialogOpen(false);
      setReservationRejectReason("");
      setSelectedReservationId(null);
    } catch (error) {
      console.error("Error rejecting reservation:", error);
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
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                onClick={() => router.push("/admin")}
                className="flex items-center gap-2"
              >
                <ArrowLeft className="h-4 w-4" />
                뒤로
              </Button>
              <h1 className="text-gray-900 font-sans text-3xl font-extrabold tracking-tight">
                KYC 관리
              </h1>
            </div>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => router.push("/admin/email-test")}
              className="flex items-center gap-2"
            >
              이메일 테스트
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                router.push("/dashboard");
              }}
              className="flex items-center gap-2"
            >
              <Eye className="h-4 w-4" />
              사용자 페이지로
            </Button>
          </div>
        </div>

        <Tabs defaultValue="pending" className="space-y-6">
          <TabsList className="bg-gray-100 mb-4 flex w-full gap-x-1 rounded-lg p-1 pl-1 pr-1 sm:grid sm:grid-cols-4 sm:gap-x-0 sm:overflow-visible sm:bg-transparent sm:p-0">
            <TabsTrigger
              value="pending"
              className="data-[state=active]:bg-green-500 data-[state=active]:ring-green-300 data-[state=active]:shadow flex flex-1 flex-col items-center justify-center gap-0 rounded-full px-1 py-1 text-xs font-medium transition-colors data-[state=active]:scale-105 data-[state=active]:text-white data-[state=active]:ring-2 sm:gap-2 sm:text-sm"
            >
              <ClipboardList className="mb-0.5 h-5 w-5 sm:h-6 sm:w-6" />
              <span className="hidden sm:inline">
                KYC ({pendingUsers.length})
              </span>
              <span className="sm:hidden">KYC</span>
            </TabsTrigger>
            <TabsTrigger
              value="approved"
              className="data-[state=active]:bg-green-500 data-[state=active]:ring-green-300 data-[state=active]:shadow flex flex-1 flex-col items-center justify-center gap-0 rounded-full px-1 py-1 text-xs font-medium transition-colors data-[state=active]:scale-105 data-[state=active]:text-white data-[state=active]:ring-2 sm:gap-2 sm:text-sm"
            >
              <CheckCircle className="mb-0.5 h-5 w-5 sm:h-6 sm:w-6" />
              <span className="hidden sm:inline">
                승인 ({approvedUsers.length})
              </span>
              <span className="sm:hidden">승인</span>
            </TabsTrigger>
            <TabsTrigger
              value="rejected"
              className="data-[state=active]:bg-red-500 data-[state=active]:ring-red-300 data-[state=active]:shadow flex flex-1 flex-col items-center justify-center gap-0 rounded-full px-1 py-1 text-xs font-medium transition-colors data-[state=active]:scale-105 data-[state=active]:text-white data-[state=active]:ring-2 sm:gap-2 sm:text-sm"
            >
              <XCircle className="mb-0.5 h-5 w-5 sm:h-6 sm:w-6" />
              <span className="hidden sm:inline">
                반려 ({rejectedUsers.length})
              </span>
              <span className="sm:hidden">반려</span>
            </TabsTrigger>
            <TabsTrigger
              value="reservations"
              className="data-[state=active]:bg-blue-500 data-[state=active]:ring-blue-300 data-[state=active]:shadow flex flex-1 flex-col items-center justify-center gap-0 rounded-full px-1 py-1 text-xs font-medium transition-colors data-[state=active]:scale-105 data-[state=active]:text-white data-[state=active]:ring-2 sm:gap-2 sm:text-sm"
            >
              <Calendar className="mb-0.5 h-5 w-5 sm:h-6 sm:w-6" />
              <span className="hidden sm:inline">
                예약 ({reservations.length})
              </span>
              <span className="sm:hidden">예약</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="pending" className="space-y-4">
            {pendingUsers.length === 0 ? (
              <Card>
                <CardContent className="py-8 text-center">
                  <p className="text-gray-500">
                    대기 중인 KYC 신청이 없습니다.
                  </p>
                </CardContent>
              </Card>
            ) : (
              pendingUsers.map((user) => (
                <Card key={user.id}>
                  <CardHeader
                    className="cursor-pointer pb-4"
                    onClick={() =>
                      setExpandedUserId(
                        expandedUserId === user.id ? null : user.id
                      )
                    }
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle>{user.name}</CardTitle>
                        <CardDescription>{user.contact}</CardDescription>
                        <div className="text-gray-500 text-sm">
                          {user.email}
                        </div>
                        <div className="mt-2 flex gap-2">
                          <span className="bg-gray-100 py-0.5 text-gray-700 inline-flex items-center gap-1 rounded-full px-2 text-xs font-medium">
                            <Calendar className="text-gray-400 h-4 w-4" />
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
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          className="bg-green-600 hover:bg-green-700"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleApprove(user.id);
                          }}
                        >
                          <CheckCircle className="mr-1 h-4 w-4" />
                          승인
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedUserId(user.id);
                            setIsRejectDialogOpen(true);
                          }}
                        >
                          <XCircle className="mr-1 h-4 w-4" />
                          반려
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  {expandedUserId === user.id && (
                    <CardContent className="space-y-6">
                      {/* Basic Information */}
                      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                        <div className="space-y-2">
                          <h4 className="text-gray-900 font-semibold">
                            기본 정보
                          </h4>
                          <div className="space-y-1 text-sm">
                            <div className="flex justify-between">
                              <span className="text-gray-600">이름</span>
                              <span className="font-medium">{user.name}</span>
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
                              <span className="text-gray-600">출생년도</span>
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
                                <span className="text-gray-600">상세주소</span>
                                <span className="font-medium">
                                  {user.detailedAddress}
                                </span>
                              </div>
                            )}
                            <div className="flex justify-between">
                              <span className="text-gray-600">이메일</span>
                              <span className="font-medium">{user.email}</span>
                            </div>
                          </div>
                        </div>

                        <div className="space-y-2">
                          <h4 className="text-gray-900 font-semibold">
                            시술 정보
                          </h4>
                          <div className="space-y-1 text-sm">
                            <div className="flex justify-between">
                              <span className="text-gray-600">피부타입</span>
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
                                {user.hasPreviousTreatment ? "있음" : "없음"}
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
                        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                          {/* Left Photo */}
                          <div className="space-y-2">
                            <h5 className="text-gray-700 text-sm font-medium">
                              좌측
                            </h5>
                            {(user.photoURLs?.left || user.photoURL) && (
                              <div className="relative aspect-square w-full overflow-hidden rounded-lg border bg-white">
                                <Image
                                  src={
                                    user.photoURLs?.left || user.photoURL || ""
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
                                    console.error("Failed to load left image");
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
                                    user.photoURLs?.front || user.photoURL || ""
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
                                    console.error("Failed to load front image");
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
                                    user.photoURLs?.right || user.photoURL || ""
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
                                    console.error("Failed to load right image");
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
                    </CardContent>
                  )}
                </Card>
              ))
            )}
          </TabsContent>

          <TabsContent value="approved" className="space-y-4">
            {approvedUsers.length === 0 ? (
              <Card>
                <CardContent className="py-8 text-center">
                  <p className="text-gray-500">승인된 사용자가 없습니다.</p>
                </CardContent>
              </Card>
            ) : (
              approvedUsers.map((user) => (
                <Card key={user.id}>
                  <CardHeader
                    className="cursor-pointer"
                    onClick={() =>
                      setExpandedUserId(
                        expandedUserId === user.id ? null : user.id
                      )
                    }
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle>{user.name}</CardTitle>
                        <CardDescription>{user.contact}</CardDescription>
                        <div className="text-gray-500 text-sm">
                          {user.email}
                        </div>
                        <div className="mt-2 flex gap-2">
                          <span className="bg-gray-100 py-0.5 text-gray-700 inline-flex items-center gap-1 rounded-full px-2 text-xs font-medium">
                            <Calendar className="text-gray-400 h-4 w-4" />
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
                          {user.approvedAt && (
                            <span className="bg-green-100 py-0.5 text-green-700 inline-flex items-center gap-1 rounded-full px-2 text-xs font-medium">
                              <CheckCircle className="text-green-500 h-4 w-4" />
                              {user.approvedAt.toLocaleString("ko-KR", {
                                year: "numeric",
                                month: "long",
                                day: "numeric",
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </span>
                          )}
                          {user.rejectedAt && (
                            <span className="bg-red-100 py-0.5 text-red-700 inline-flex items-center gap-1 rounded-full px-2 text-xs font-medium">
                              <XCircle className="text-red-500 h-4 w-4" />
                              {user.rejectedAt.toLocaleString("ko-KR", {
                                year: "numeric",
                                month: "long",
                                day: "numeric",
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </span>
                          )}
                        </div>
                      </div>
                      <Badge variant="outline" className="bg-green-50">
                        승인됨
                      </Badge>
                    </div>
                  </CardHeader>
                  {expandedUserId === user.id && (
                    <CardContent className="space-y-6">
                      {/* Basic Information */}
                      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                        <div className="space-y-2">
                          <h4 className="text-gray-900 font-semibold">
                            기본 정보
                          </h4>
                          <div className="space-y-1 text-sm">
                            <div className="flex justify-between">
                              <span className="text-gray-600">이름</span>
                              <span className="font-medium">{user.name}</span>
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
                              <span className="text-gray-600">출생년도</span>
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
                              <span className="text-gray-600">이메일</span>
                              <span className="font-medium">{user.email}</span>
                            </div>
                          </div>
                        </div>

                        <div className="space-y-2">
                          <h4 className="text-gray-900 font-semibold">
                            시술 정보
                          </h4>
                          <div className="space-y-1 text-sm">
                            <div className="flex justify-between">
                              <span className="text-gray-600">피부타입</span>
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
                                {user.hasPreviousTreatment ? "있음" : "없음"}
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
                            {user.approvedAt && (
                              <div className="flex justify-between">
                                <span className="text-gray-600">승인일</span>
                                <span className="font-medium">
                                  {user.approvedAt.toLocaleString("ko-KR", {
                                    year: "numeric",
                                    month: "long",
                                    day: "numeric",
                                    hour: "2-digit",
                                    minute: "2-digit",
                                  })}
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Photos */}
                      <div className="space-y-4">
                        <h4 className="text-gray-900 font-semibold">
                          눈썹 사진
                        </h4>
                        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                          {/* Left Photo */}
                          <div className="space-y-2">
                            <h5 className="text-gray-700 text-sm font-medium">
                              좌측
                            </h5>
                            {(user.photoURLs?.left || user.photoURL) && (
                              <div className="relative aspect-square w-full overflow-hidden rounded-lg border bg-white">
                                <Image
                                  src={
                                    user.photoURLs?.left || user.photoURL || ""
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
                                    console.error("Failed to load left image");
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
                                    user.photoURLs?.front || user.photoURL || ""
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
                                    console.error("Failed to load front image");
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
                                    user.photoURLs?.right || user.photoURL || ""
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
                                    console.error("Failed to load right image");
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
                    </CardContent>
                  )}
                </Card>
              ))
            )}
          </TabsContent>

          <TabsContent value="rejected" className="space-y-4">
            {rejectedUsers.length === 0 ? (
              <Card>
                <CardContent className="py-8 text-center">
                  <p className="text-gray-500">반려된 사용자가 없습니다.</p>
                </CardContent>
              </Card>
            ) : (
              rejectedUsers.map((user) => (
                <Card key={user.id}>
                  <CardHeader
                    className="cursor-pointer"
                    onClick={() =>
                      setExpandedUserId(
                        expandedUserId === user.id ? null : user.id
                      )
                    }
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle>{user.name}</CardTitle>
                        <CardDescription>{user.contact}</CardDescription>
                        <div className="text-gray-500 text-sm">
                          {user.email}
                        </div>
                        <div className="mt-2 flex gap-2">
                          <span className="bg-gray-100 py-0.5 text-gray-700 inline-flex items-center gap-1 rounded-full px-2 text-xs font-medium">
                            <Calendar className="text-gray-400 h-4 w-4" />
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
                          {user.approvedAt && (
                            <span className="bg-green-100 py-0.5 text-green-700 inline-flex items-center gap-1 rounded-full px-2 text-xs font-medium">
                              <CheckCircle className="text-green-500 h-4 w-4" />
                              {user.approvedAt.toLocaleString("ko-KR", {
                                year: "numeric",
                                month: "long",
                                day: "numeric",
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </span>
                          )}
                          {user.rejectedAt && (
                            <span className="bg-red-100 py-0.5 text-red-700 inline-flex items-center gap-1 rounded-full px-2 text-xs font-medium">
                              <XCircle className="text-red-500 h-4 w-4" />
                              {user.rejectedAt.toLocaleString("ko-KR", {
                                year: "numeric",
                                month: "long",
                                day: "numeric",
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </span>
                          )}
                        </div>
                      </div>
                      <Badge
                        variant="outline"
                        className="bg-red-50 text-red-700"
                      >
                        반려됨
                      </Badge>
                    </div>
                  </CardHeader>
                  {expandedUserId === user.id && (
                    <CardContent className="space-y-6">
                      {/* Basic Information */}
                      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                        <div className="space-y-2">
                          <h4 className="text-gray-900 font-semibold">
                            기본 정보
                          </h4>
                          <div className="space-y-1 text-sm">
                            <div className="flex justify-between">
                              <span className="text-gray-600">이름</span>
                              <span className="font-medium">{user.name}</span>
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
                              <span className="text-gray-600">출생년도</span>
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
                              <span className="text-gray-600">이메일</span>
                              <span className="font-medium">{user.email}</span>
                            </div>
                          </div>
                        </div>

                        <div className="space-y-2">
                          <h4 className="text-gray-900 font-semibold">
                            시술 정보
                          </h4>
                          <div className="space-y-1 text-sm">
                            <div className="flex justify-between">
                              <span className="text-gray-600">피부타입</span>
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
                                {user.hasPreviousTreatment ? "있음" : "없음"}
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
                            {user.rejectedAt && (
                              <div className="flex justify-between">
                                <span className="text-gray-600">반려일</span>
                                <span className="font-medium">
                                  {user.rejectedAt.toLocaleString("ko-KR", {
                                    year: "numeric",
                                    month: "long",
                                    day: "numeric",
                                    hour: "2-digit",
                                    minute: "2-digit",
                                  })}
                                </span>
                              </div>
                            )}
                            {user.rejectReason && (
                              <div className="flex justify-between">
                                <span className="text-gray-600">반려 사유</span>
                                <span className="text-red-600 font-medium">
                                  {user.rejectReason}
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Photos */}
                      <div className="space-y-4">
                        <h4 className="text-gray-900 font-semibold">
                          눈썹 사진
                        </h4>
                        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                          {/* Left Photo */}
                          <div className="space-y-2">
                            <h5 className="text-gray-700 text-sm font-medium">
                              좌측
                            </h5>
                            {(user.photoURLs?.left || user.photoURL) && (
                              <div className="relative aspect-square w-full overflow-hidden rounded-lg border bg-white">
                                <Image
                                  src={
                                    user.photoURLs?.left || user.photoURL || ""
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
                                    console.error("Failed to load left image");
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
                                    user.photoURLs?.front || user.photoURL || ""
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
                                    console.error("Failed to load front image");
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
                                    user.photoURLs?.right || user.photoURL || ""
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
                                    console.error("Failed to load right image");
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
                    </CardContent>
                  )}
                </Card>
              ))
            )}
          </TabsContent>

          <TabsContent value="reservations" className="space-y-4">
            {reservations.length === 0 ? (
              <Card>
                <CardContent className="py-8 text-center">
                  <p className="text-gray-500">예약이 없습니다.</p>
                </CardContent>
              </Card>
            ) : (
              reservations.map((reservation) => (
                <Card key={reservation.id}>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle>{reservation.userName}</CardTitle>
                        <CardDescription>
                          <span className="flex items-center gap-4">
                            <span className="flex items-center">
                              예약일: {reservation.date || "미정"}
                            </span>
                            <span className="flex items-center">
                              시간: {reservation.time || "미정"}
                            </span>
                          </span>
                        </CardDescription>
                        <div className="mt-2">
                          <div className="text-gray-500 text-sm">
                            예약 생성일:{" "}
                            {reservation.createdAt &&
                            !isNaN(reservation.createdAt.getTime())
                              ? reservation.createdAt.toLocaleString("ko-KR", {
                                  year: "numeric",
                                  month: "long",
                                  day: "numeric",
                                  hour: "2-digit",
                                  minute: "2-digit",
                                })
                              : "날짜 정보 없음"}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge
                          variant={
                            reservation.status === "approved"
                              ? "default"
                              : reservation.status === "payment_confirmed"
                              ? "secondary"
                              : "outline"
                          }
                        >
                          {reservation.status === "approved"
                            ? "확정"
                            : reservation.status === "payment_confirmed"
                            ? "입금확인"
                            : reservation.status === "payment_required"
                            ? "입금대기"
                            : reservation.status === "rejected"
                            ? "거절"
                            : "대기"}
                        </Badge>

                        {/* 승인/거절 버튼 - 입금확인 상태일 때만 표시 */}
                        {reservation.status === "payment_confirmed" && (
                          <div className="flex gap-1">
                            <Button
                              size="sm"
                              onClick={() =>
                                handleReservationApprove(reservation.id)
                              }
                              className="bg-green-500 hover:bg-green-600 text-white"
                            >
                              승인
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => {
                                setSelectedReservationId(reservation.id);
                                setIsReservationRejectDialogOpen(true);
                              }}
                            >
                              거절
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>
                  </CardHeader>
                </Card>
              ))
            )}
          </TabsContent>
        </Tabs>
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

      {/* 예약 거절 다이얼로그 */}
      <Dialog
        open={isReservationRejectDialogOpen}
        onOpenChange={setIsReservationRejectDialogOpen}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>예약 거절 사유 입력</DialogTitle>
            <DialogDescription>
              예약을 거절하는 사유를 입력해 주세요.
            </DialogDescription>
          </DialogHeader>
          <Textarea
            value={reservationRejectReason}
            onChange={(e) => setReservationRejectReason(e.target.value)}
            placeholder="거절 사유를 입력하세요"
            className="min-h-[100px]"
          />
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsReservationRejectDialogOpen(false);
                setReservationRejectReason("");
                setSelectedReservationId(null);
              }}
            >
              취소
            </Button>
            <Button
              variant="destructive"
              onClick={handleReservationReject}
              disabled={!reservationRejectReason.trim()}
            >
              거절하기
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
