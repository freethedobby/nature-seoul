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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
} from "firebase/firestore";
import Image from "next/image";
import { isAdmin, addAdmin, removeAdmin } from "@/lib/firebase";

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

export default function AdminDashboard() {
  const { user, loading, isAdminMode, setIsAdminMode } = useAuth();
  const router = useRouter();
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [pendingUsers, setPendingUsers] = useState<UserData[]>([]);
  const [approvedUsers, setApprovedUsers] = useState<UserData[]>([]);
  const [reservations, setReservations] = useState<ReservationData[]>([]);
  const [admins, setAdmins] = useState<AdminUser[]>([]);
  const [isRejectDialogOpen, setIsRejectDialogOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [newAdminEmail, setNewAdminEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const checkAdminStatus = async () => {
      if (!loading && user?.email) {
        const adminStatus = await isAdmin(user.email);
        setIsAuthorized(adminStatus);
        if (!adminStatus) {
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

    return () => {
      unsubPending();
      unsubApproved();
      unsubReservations();
      unsubAdmins();
    };
  }, [user, isAuthorized]);

  // Handle admin mode redirect
  useEffect(() => {
    if (isAuthorized && !isAdminMode) {
      router.push("/dashboard");
    }
  }, [isAuthorized, isAdminMode, router]);

  const handleApprove = async (userId: string) => {
    try {
      await updateDoc(doc(db, "users", userId), {
        kycStatus: "approved",
        updatedAt: new Date(),
      });
    } catch (error) {
      console.error("Error approving user:", error);
    }
  };

  const handleReject = async () => {
    if (!selectedUserId || !rejectReason) return;

    try {
      await updateDoc(doc(db, "users", selectedUserId), {
        kycStatus: "rejected",
        rejectReason,
        updatedAt: new Date(),
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
      await addAdmin(newAdminEmail);
      setNewAdminEmail("");
    } catch (error) {
      console.error("Error adding admin:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRemoveAdmin = async (email: string) => {
    try {
      await removeAdmin(email);
    } catch (error) {
      console.error("Error removing admin:", error);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-white">
        <div className="animate-spin border-black h-8 w-8 rounded-full border-b-2"></div>
      </div>
    );
  }

  if (!isAuthorized) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-white">
        <div className="text-center">
          <div className="animate-spin border-black mb-4 h-8 w-8 rounded-full border-b-2"></div>
          <p>Checking authorization...</p>
        </div>
      </div>
    );
  }

  // If not in admin mode, show loading while redirecting
  if (isAuthorized && !isAdminMode) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-white">
        <div className="text-center">
          <div className="animate-spin border-black mb-4 h-8 w-8 rounded-full border-b-2"></div>
          <p>Redirecting to dashboard...</p>
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

        <Tabs defaultValue="pending" className="space-y-6">
          <TabsList
            className="
              bg-gray-100 mb-4 flex w-full scroll-px-3 flex-nowrap gap-x-2 overflow-x-auto rounded-lg
              p-1 pl-3 pr-3
              sm:grid sm:grid-cols-4 sm:gap-x-0 sm:overflow-visible sm:bg-transparent sm:p-0
            "
          >
            <TabsTrigger
              value="pending"
              className="data-[state=active]:shadow min-w-[70px] flex-1 rounded-full px-3 py-2 text-sm font-medium transition-colors data-[state=active]:bg-white"
            >
              KYC ({pendingUsers.length})
            </TabsTrigger>
            <TabsTrigger
              value="approved"
              className="data-[state=active]:shadow min-w-[70px] flex-1 rounded-full px-3 py-2 text-sm font-medium transition-colors data-[state=active]:bg-white"
            >
              승인 ({approvedUsers.length})
            </TabsTrigger>
            <TabsTrigger
              value="reservations"
              className="data-[state=active]:shadow min-w-[70px] flex-1 rounded-full px-3 py-2 text-sm font-medium transition-colors data-[state=active]:bg-white"
            >
              예약 ({reservations.length})
            </TabsTrigger>
            <TabsTrigger
              value="admins"
              className="data-[state=active]:shadow min-w-[70px] flex-1 rounded-full px-3 py-2 text-sm font-medium transition-colors data-[state=active]:bg-white"
            >
              관리자 ({admins.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="pending" className="space-y-4">
            {pendingUsers.map((user) => (
              <Card key={user.id}>
                <CardHeader className="pb-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle>{user.name}</CardTitle>
                      <CardDescription>{user.contact}</CardDescription>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        className="bg-green-600 hover:bg-green-700"
                        onClick={() => handleApprove(user.id)}
                      >
                        <CheckCircle className="mr-1 h-4 w-4" />
                        승인
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => {
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
                          console.error("Failed to load image:", user.photoURL);
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
                </CardContent>
              </Card>
            ))}
          </TabsContent>

          <TabsContent value="approved" className="space-y-4">
            {approvedUsers.map((user) => (
              <Card key={user.id}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle>{user.name}</CardTitle>
                      <CardDescription>{user.contact}</CardDescription>
                    </div>
                    <Badge variant="outline" className="bg-green-50">
                      승인됨
                    </Badge>
                  </div>
                </CardHeader>
              </Card>
            ))}
          </TabsContent>

          <TabsContent value="reservations" className="space-y-4">
            {reservations.map((reservation) => (
              <Card key={reservation.id}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle>{reservation.userName}</CardTitle>
                      <CardDescription className="flex items-center gap-4">
                        <span className="flex items-center">
                          {reservation.date}
                        </span>
                        <span className="flex items-center">
                          {reservation.time}
                        </span>
                      </CardDescription>
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
            ))}
          </TabsContent>

          <TabsContent value="admins" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>새 관리자 추가</CardTitle>
                <CardDescription>
                  새로운 관리자의 이메일 주소를 입력하세요
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleAddAdmin} className="flex gap-4">
                  <div className="flex-1">
                    <Input
                      type="email"
                      placeholder="관리자 이메일 주소"
                      value={newAdminEmail}
                      onChange={(e) => setNewAdminEmail(e.target.value)}
                      required
                    />
                  </div>
                  <Button type="submit" disabled={isSubmitting}>
                    <UserPlus className="mr-2 h-4 w-4" />
                    추가
                  </Button>
                </form>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>관리자 목록</CardTitle>
                <CardDescription>
                  현재 등록된 관리자 목록입니다. 총 {admins.length}명의 관리자가
                  있습니다.
                </CardDescription>
              </CardHeader>
              <CardContent>
                {admins.length === 0 ? (
                  <div className="text-gray-500 py-8 text-center">
                    <p>등록된 관리자가 없습니다.</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {admins.map((admin) => (
                      <div
                        key={admin.id}
                        className="hover:bg-gray-50 flex items-center justify-between rounded-lg border p-4 transition-colors"
                      >
                        <div className="flex-1">
                          <div className="flex items-center gap-3">
                            <div className="bg-gray-200 flex h-8 w-8 items-center justify-center rounded-full">
                              <span className="text-gray-600 text-sm font-medium">
                                {admin.email.charAt(0).toUpperCase()}
                              </span>
                            </div>
                            <div>
                              <p className="text-gray-900 font-medium">
                                {admin.email}
                              </p>
                              <p className="text-gray-500 text-sm">
                                등록일:{" "}
                                {new Date(admin.createdAt).toLocaleDateString(
                                  "ko-KR",
                                  {
                                    year: "numeric",
                                    month: "long",
                                    day: "numeric",
                                    hour: "2-digit",
                                    minute: "2-digit",
                                  }
                                )}
                              </p>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <Badge
                            variant={admin.isActive ? "default" : "secondary"}
                            className={
                              admin.isActive
                                ? "bg-green-100 text-green-800"
                                : "bg-gray-100 text-gray-600"
                            }
                          >
                            {admin.isActive ? "활성" : "비활성"}
                          </Badge>
                          {admin.isActive && admin.email !== user?.email && (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-red-600 hover:text-red-700 hover:bg-red-50"
                              onClick={() => handleRemoveAdmin(admin.email)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          )}
                          {admin.email === user?.email && (
                            <Badge
                              variant="outline"
                              className="text-blue-600 border-blue-200"
                            >
                              현재 사용자
                            </Badge>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
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
