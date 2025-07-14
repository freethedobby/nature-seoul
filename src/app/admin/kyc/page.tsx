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
  approvedAt?: Date;
  rejectedAt?: Date;
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

    // Subscribe to reservations
    const reservationsQuery = query(collection(db, "reservations"));

    const unsubReservations = onSnapshot(reservationsQuery, (snapshot) => {
      const reservs: ReservationData[] = [];
      snapshot.forEach((doc) => {
        reservs.push({ id: doc.id, ...doc.data() } as ReservationData);
      });
      reservs.sort(
        (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
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
      await updateDoc(doc(db, "users", userId), {
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
      await updateDoc(doc(db, "users", selectedUserId), {
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
                        <div className="mt-2">
                          <div className="text-gray-500 text-sm">
                            신청일:{" "}
                            {new Date(user.createdAt).toLocaleDateString(
                              "ko-KR",
                              {
                                year: "numeric",
                                month: "long",
                                day: "numeric",
                                hour: "2-digit",
                                minute: "2-digit",
                              }
                            )}
                          </div>
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
                    <CardContent>
                      {user.photoURL && (
                        <div className="relative aspect-video w-full overflow-hidden rounded-lg border bg-white">
                          <Image
                            src={user.photoURL}
                            alt="시술 부위 사진"
                            fill
                            className="object-contain"
                            unoptimized={user.photoURL.startsWith("data:")}
                            onError={(e) => {
                              console.error(
                                "Failed to load image:",
                                user.photoURL
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
                        <div className="mt-2 space-y-1">
                          <div className="text-gray-500 text-sm">
                            신청일:{" "}
                            {new Date(user.createdAt).toLocaleDateString(
                              "ko-KR",
                              {
                                year: "numeric",
                                month: "long",
                                day: "numeric",
                                hour: "2-digit",
                                minute: "2-digit",
                              }
                            )}
                          </div>
                          {user.approvedAt && (
                            <div className="text-green-600 text-sm">
                              승인일:{" "}
                              {new Date(user.approvedAt).toLocaleDateString(
                                "ko-KR",
                                {
                                  year: "numeric",
                                  month: "long",
                                  day: "numeric",
                                  hour: "2-digit",
                                  minute: "2-digit",
                                }
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                      <Badge variant="outline" className="bg-green-50">
                        승인됨
                      </Badge>
                    </div>
                  </CardHeader>
                  {expandedUserId === user.id && (
                    <CardContent>
                      {user.photoURL && (
                        <div className="relative aspect-video w-full overflow-hidden rounded-lg border bg-white">
                          <Image
                            src={user.photoURL}
                            alt="시술 부위 사진"
                            fill
                            className="object-contain"
                            unoptimized={user.photoURL.startsWith("data:")}
                            onError={(e) => {
                              console.error(
                                "Failed to load image:",
                                user.photoURL
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
                        <div className="mt-2 space-y-1">
                          <div className="text-gray-500 text-sm">
                            신청일:{" "}
                            {new Date(user.createdAt).toLocaleDateString(
                              "ko-KR",
                              {
                                year: "numeric",
                                month: "long",
                                day: "numeric",
                                hour: "2-digit",
                                minute: "2-digit",
                              }
                            )}
                          </div>
                          {user.rejectedAt && (
                            <div className="text-red-600 text-sm">
                              반려일:{" "}
                              {new Date(user.rejectedAt).toLocaleDateString(
                                "ko-KR",
                                {
                                  year: "numeric",
                                  month: "long",
                                  day: "numeric",
                                  hour: "2-digit",
                                  minute: "2-digit",
                                }
                              )}
                            </div>
                          )}
                          {user.rejectReason && (
                            <div className="text-red-600 text-sm">
                              반려 사유: {user.rejectReason}
                            </div>
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
                    <CardContent>
                      {user.photoURL && (
                        <div className="relative aspect-video w-full overflow-hidden rounded-lg border bg-white">
                          <Image
                            src={user.photoURL}
                            alt="시술 부위 사진"
                            fill
                            className="object-contain"
                            unoptimized={user.photoURL.startsWith("data:")}
                            onError={(e) => {
                              console.error(
                                "Failed to load image:",
                                user.photoURL
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
                              예약일: {reservation.date}
                            </span>
                            <span className="flex items-center">
                              시간: {reservation.time}
                            </span>
                          </span>
                        </CardDescription>
                        <div className="mt-2">
                          <div className="text-gray-500 text-sm">
                            예약 생성일:{" "}
                            {new Date(reservation.createdAt).toLocaleDateString(
                              "ko-KR",
                              {
                                year: "numeric",
                                month: "long",
                                day: "numeric",
                                hour: "2-digit",
                                minute: "2-digit",
                              }
                            )}
                          </div>
                        </div>
                      </div>
                      <Badge
                        variant={
                          reservation.status === "confirmed"
                            ? "default"
                            : "secondary"
                        }
                      >
                        {reservation.status === "confirmed" ? "확정" : "대기"}
                      </Badge>
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
    </div>
  );
}
