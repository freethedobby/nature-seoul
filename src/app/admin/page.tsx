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
import { CheckCircle, XCircle } from "lucide-react";
import { db } from "@/lib/firebase";
import {
  collection,
  query,
  where,
  updateDoc,
  doc,
  onSnapshot,
  orderBy,
} from "firebase/firestore";
import Image from "next/image";
import { isAdmin } from "@/lib/firebase";

interface UserData {
  id: string;
  email: string;
  name: string;
  contact: string;
  photoURL: string;
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

export default function AdminDashboard() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [pendingUsers, setPendingUsers] = useState<UserData[]>([]);
  const [approvedUsers, setApprovedUsers] = useState<UserData[]>([]);
  const [reservations, setReservations] = useState<ReservationData[]>([]);
  const [isRejectDialogOpen, setIsRejectDialogOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);

  useEffect(() => {
    const checkAdminStatus = async () => {
      if (!loading && user?.email) {
        const adminStatus = await isAdmin(user.email);
        setIsAuthorized(adminStatus);
        if (!adminStatus) {
          router.push("/");
        }
      } else if (!loading && !user) {
        router.push("/");
      }
    };

    checkAdminStatus();
  }, [user, loading, router]);

  useEffect(() => {
    if (!user) return;

    // Subscribe to pending users
    const pendingQuery = query(
      collection(db, "users"),
      where("kycStatus", "==", "pending"),
      orderBy("createdAt", "desc")
    );

    const unsubPending = onSnapshot(pendingQuery, (snapshot) => {
      const users: UserData[] = [];
      snapshot.forEach((doc) => {
        users.push({ id: doc.id, ...doc.data() } as UserData);
      });
      setPendingUsers(users);
    });

    // Subscribe to approved users
    const approvedQuery = query(
      collection(db, "users"),
      where("kycStatus", "==", "approved"),
      orderBy("createdAt", "desc")
    );

    const unsubApproved = onSnapshot(approvedQuery, (snapshot) => {
      const users: UserData[] = [];
      snapshot.forEach((doc) => {
        users.push({ id: doc.id, ...doc.data() } as UserData);
      });
      setApprovedUsers(users);
    });

    // Subscribe to reservations
    const reservationsQuery = query(
      collection(db, "reservations"),
      orderBy("date", "desc")
    );

    const unsubReservations = onSnapshot(reservationsQuery, (snapshot) => {
      const reservs: ReservationData[] = [];
      snapshot.forEach((doc) => {
        reservs.push({ id: doc.id, ...doc.data() } as ReservationData);
      });
      setReservations(reservs);
    });

    return () => {
      unsubPending();
      unsubApproved();
      unsubReservations();
    };
  }, [user]);

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

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-white">
        <div className="animate-spin border-black h-8 w-8 rounded-full border-b-2"></div>
      </div>
    );
  }

  if (!isAuthorized) {
    return null;
  }

  return (
    <div className="bg-gray-50 min-h-screen p-4">
      <div className="container mx-auto max-w-7xl">
        <h1 className="mb-6 text-2xl font-bold">관리자 대시보드</h1>

        <Tabs defaultValue="pending" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="pending">
              KYC 대기 ({pendingUsers.length})
            </TabsTrigger>
            <TabsTrigger value="approved">
              승인된 회원 ({approvedUsers.length})
            </TabsTrigger>
            <TabsTrigger value="reservations">
              예약 내역 ({reservations.length})
            </TabsTrigger>
            <TabsTrigger
              value="admins"
              onClick={() => router.push("/admin/admins")}
            >
              관리자 관리
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
                      />
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
                          {/* <Calendar className="mr-1 h-4 w-4" /> */}
                          {reservation.date}
                        </span>
                        <span className="flex items-center">
                          {/* <Clock className="mr-1 h-4 w-4" /> */}
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
