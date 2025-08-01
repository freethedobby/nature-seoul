"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  ArrowLeft,
  Edit,
  Trash2,
  Search,
  Filter,
  MessageSquare,
  Calendar,
  User,
  Phone,
  Mail,
} from "lucide-react";
import { db } from "@/lib/firebase";
import {
  collection,
  onSnapshot,
  query,
  doc,
  updateDoc,
  deleteDoc,
  addDoc,
  serverTimestamp,
  where,
  getDocs,
} from "firebase/firestore";

interface UserData {
  id: string;
  name: string;
  email: string;
  contact: string; // KYC에서는 contact 필드를 사용
  phone: string; // 기존 호환성 유지
  kycStatus: "pending" | "approved" | "rejected";
  reservationStatus: "none" | "scheduled" | "completed" | "cancelled";
  latestReservation?: {
    date: string;
    time: string;
    status: string;
  };
  eyebrowProcedure: "not_started" | "in_progress" | "completed";
  adminComments: string;
  createdAt: unknown;
  updatedAt: unknown;
}

interface Comment {
  id: string;
  userId: string;
  adminEmail: string;
  comment: string;
  createdAt: unknown;
}

export default function Masterboard() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [users, setUsers] = useState<UserData[]>([]);
  const [comments, setComments] = useState<Comment[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [editingUser, setEditingUser] = useState<UserData | null>(null);
  const [newComment, setNewComment] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Check admin authorization
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

  // Fetch users data
  useEffect(() => {
    if (!isAuthorized) return;

    const usersQuery = query(collection(db, "users"));
    const unsubUsers = onSnapshot(usersQuery, (snapshot) => {
      const userData: UserData[] = [];
      snapshot.forEach((doc) => {
        const data = doc.data();
        // Debug: Log available contact fields for troubleshooting
        if (
          data.name &&
          !data.contact &&
          !data.phone &&
          !data.phoneNumber &&
          !data.mobile
        ) {
          console.log("⚠️ User without contact info:", doc.id, {
            name: data.name,
            email: data.email,
            availableFields: Object.keys(data),
          });
        }

        userData.push({
          id: doc.id,
          name: data.name || "N/A",
          email: data.email || "N/A",
          contact:
            data.contact ||
            data.phone ||
            data.phoneNumber ||
            data.mobile ||
            "N/A", // 모든 가능한 연락처 필드 확인
          phone:
            data.phone ||
            data.contact ||
            data.phoneNumber ||
            data.mobile ||
            "N/A", // 기존 호환성 유지
          kycStatus: data.kycStatus || "pending",
          reservationStatus: data.reservationStatus || "none",
          latestReservation: data.latestReservation,
          eyebrowProcedure: data.eyebrowProcedure || "not_started",
          adminComments: data.adminComments || "",
          createdAt: data.createdAt,
          updatedAt: data.updatedAt,
        });
      });
      setUsers(userData);
    });

    return () => unsubUsers();
  }, [isAuthorized]);

  // Fetch comments
  useEffect(() => {
    if (!isAuthorized) return;

    const commentsQuery = query(collection(db, "adminComments"));
    const unsubComments = onSnapshot(commentsQuery, (snapshot) => {
      const commentData: Comment[] = [];
      snapshot.forEach((doc) => {
        commentData.push({ id: doc.id, ...doc.data() } as Comment);
      });
      setComments(commentData);
    });

    return () => unsubComments();
  }, [isAuthorized]);

  // Filter and search users
  const filteredUsers = users.filter((user) => {
    const matchesSearch =
      user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (user.contact &&
        user.contact !== "N/A" &&
        user.contact.includes(searchTerm)) ||
      (user.phone && user.phone !== "N/A" && user.phone.includes(searchTerm));

    const matchesFilter =
      filterStatus === "all" ||
      user.kycStatus === filterStatus ||
      user.reservationStatus === filterStatus ||
      user.eyebrowProcedure === filterStatus;

    return matchesSearch && matchesFilter;
  });

  // Get user comments
  const getUserComments = (userId: string) => {
    return comments
      .filter((comment) => comment.userId === userId)
      .sort((a, b) => {
        const dateA =
          (a.createdAt as { toDate?: () => Date })?.toDate?.() ||
          new Date(a.createdAt as string | number | Date);
        const dateB =
          (b.createdAt as { toDate?: () => Date })?.toDate?.() ||
          new Date(b.createdAt as string | number | Date);
        return dateB.getTime() - dateA.getTime();
      });
  };

  // Get user comments count
  const getUserCommentsCount = (userId: string) =>
    comments.filter((comment) => comment.userId === userId).length;

  // Handle user update
  const handleUpdateUser = async (
    userId: string,
    updates: Partial<UserData>
  ) => {
    setIsSubmitting(true);
    try {
      // Validate inputs
      if (!userId) {
        throw new Error("사용자 ID가 없습니다");
      }

      if (!updates || Object.keys(updates).length === 0) {
        throw new Error("업데이트할 데이터가 없습니다");
      }

      // Validate required fields
      if (updates.name && !updates.name.trim()) {
        throw new Error("이름은 필수 항목입니다");
      }

      if (updates.email && !updates.email.trim()) {
        throw new Error("이메일은 필수 항목입니다");
      }

      const userRef = doc(db, "users", userId);

      // Get current user data to compare status changes
      const currentUser = users.find((u) => u.id === userId);
      if (!currentUser) {
        throw new Error("사용자를 찾을 수 없습니다");
      }

      // Check for status changes
      const statusChanges = [];
      if (updates.kycStatus && updates.kycStatus !== currentUser.kycStatus) {
        statusChanges.push({
          type: "kyc",
          oldStatus: currentUser.kycStatus,
          newStatus: updates.kycStatus,
        });
      }
      if (
        updates.reservationStatus &&
        updates.reservationStatus !== currentUser.reservationStatus
      ) {
        statusChanges.push({
          type: "reservation",
          oldStatus: currentUser.reservationStatus,
          newStatus: updates.reservationStatus,
        });
      }

      // Update user data
      await updateDoc(userRef, {
        ...updates,
        updatedAt: serverTimestamp(),
      });

      // Send email notifications for status changes
      for (const change of statusChanges) {
        try {
          const emailData: {
            to: string;
            userName: string;
            statusType: string;
            newStatus: string;
            subject: string;
            html: string;
            reservationInfo?: {
              date: string;
              time: string;
            };
          } = {
            to: currentUser.email,
            userName: currentUser.name,
            statusType: change.type,
            newStatus: change.newStatus,
            subject: `[네이처서울] ${
              change.type === "kyc" ? "KYC" : "예약"
            } 상태 변경 안내`,
            html: "", // Will be generated by the API
          };

          // Add reservation info for reservation status changes
          if (change.type === "reservation" && currentUser.latestReservation) {
            emailData.reservationInfo = {
              date: currentUser.latestReservation.date,
              time: currentUser.latestReservation.time,
            };
          }

          await fetch("/api/email/send", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify(emailData),
          });
        } catch (emailError) {
          console.error("Error sending email notification:", emailError);
          // Don't fail the entire update if email fails
        }
      }

      setEditingUser(null);

      // Show success message with email notification info
      if (statusChanges.length > 0) {
        alert(
          `사용자 정보가 업데이트되었습니다.\n${statusChanges.length}개의 상태 변경에 대해 이메일 알림이 발송되었습니다.`
        );
      } else {
        alert("사용자 정보가 업데이트되었습니다.");
      }
    } catch (error) {
      console.error("Error updating user:", error);
      const errorMessage =
        error instanceof Error ? error.message : "알 수 없는 오류";
      alert(
        `사용자 정보 업데이트 중 오류가 발생했습니다.\n\n오류 내용: ${errorMessage}\n\n문제가 지속되면 관리자에게 문의하세요.`
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle comment addition
  const handleAddComment = async (userId: string) => {
    if (!newComment.trim() || !user?.email) return;

    setIsSubmitting(true);
    try {
      await addDoc(collection(db, "adminComments"), {
        userId,
        adminEmail: user.email,
        comment: newComment.trim(),
        createdAt: serverTimestamp(),
      });
      setNewComment("");
    } catch (error) {
      console.error("Error adding comment:", error);
      alert("댓글 추가 중 오류가 발생했습니다.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle user deletion
  const handleDeleteUser = async (userId: string, userName: string) => {
    if (
      !confirm(
        `정말로 "${userName}" 사용자를 삭제하시겠습니까?\n\n⚠️ 이 작업은 되돌릴 수 없으며, 사용자의 모든 데이터가 영구적으로 삭제됩니다.`
      )
    ) {
      return;
    }

    setIsSubmitting(true);
    try {
      // 1. Delete user's reservations
      const reservationsQuery = query(
        collection(db, "reservations"),
        where("userId", "==", userId)
      );
      const reservationsSnapshot = await getDocs(reservationsQuery);
      const deleteReservationPromises = reservationsSnapshot.docs.map((doc) =>
        deleteDoc(doc.ref)
      );
      await Promise.all(deleteReservationPromises);

      // 2. Delete user's admin comments
      const commentsQuery = query(
        collection(db, "adminComments"),
        where("userId", "==", userId)
      );
      const commentsSnapshot = await getDocs(commentsQuery);
      const deleteCommentPromises = commentsSnapshot.docs.map((doc) =>
        deleteDoc(doc.ref)
      );
      await Promise.all(deleteCommentPromises);

      // 3. Delete the user document
      await deleteDoc(doc(db, "users", userId));

      alert("사용자가 성공적으로 삭제되었습니다.");
    } catch (error) {
      console.error("Error deleting user:", error);
      alert("사용자 삭제 중 오류가 발생했습니다.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Get status badge
  const getStatusBadge = (
    status: string,
    type: "kyc" | "reservation" | "procedure"
  ) => {
    const colors = {
      kyc: {
        pending: "bg-yellow-100 text-yellow-800",
        approved: "bg-green-100 text-green-800",
        rejected: "bg-red-100 text-red-800",
      },
      reservation: {
        none: "bg-gray-100 text-gray-800",
        scheduled: "bg-blue-100 text-blue-800",
        completed: "bg-green-100 text-green-800",
        cancelled: "bg-red-100 text-red-800",
      },
      procedure: {
        not_started: "bg-gray-100 text-gray-800",
        in_progress: "bg-yellow-100 text-yellow-800",
        completed: "bg-green-100 text-green-800",
      },
    };

    const labels = {
      kyc: {
        pending: "대기중",
        approved: "승인됨",
        rejected: "거부됨",
      },
      reservation: {
        none: "예약 없음",
        scheduled: "예약됨",
        completed: "완료됨",
        cancelled: "취소됨",
      },
      procedure: {
        not_started: "시작 안함",
        in_progress: "진행중",
        completed: "완료됨",
      },
    };

    return (
      <Badge
        className={colors[type][status as keyof (typeof colors)[typeof type]]}
      >
        {labels[type][status as keyof (typeof labels)[typeof type]]}
      </Badge>
    );
  };

  if (loading || !isAuthorized) {
    return (
      <div className="bg-gradient-to-br from-gray-50 min-h-screen to-white p-4">
        <div className="container mx-auto max-w-7xl">
          <div className="text-center">
            <div className="animate-spin border-black mb-4 h-8 w-8 rounded-full border-b-2"></div>
            <p>Loading...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-br from-gray-50 min-h-screen to-white p-4">
      <div className="container mx-auto max-w-7xl">
        {/* Header */}
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
              <h1 className="text-gray-900 font-sans text-xl font-extrabold tracking-tight sm:text-3xl">
                마스터보드
              </h1>
            </div>
            <p className="text-gray-600 sm:text-base text-sm">
              모든 사용자 정보를 관리합니다
            </p>
          </div>
        </div>

        {/* Search and Filter */}
        <Card className="mb-4 sm:mb-6">
          <CardContent className="pt-4 sm:pt-6">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
              <div className="flex flex-1 items-center gap-2">
                <Search className="text-gray-400 h-4 w-4" />
                <Input
                  placeholder="이름, 이메일, 전화번호로 검색..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full sm:max-w-sm"
                />
              </div>
              <div className="flex items-center gap-2">
                <Filter className="text-gray-400 h-4 w-4" />
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="border-gray-300 w-full rounded-md border px-3 py-2 text-sm sm:w-auto"
                >
                  <option value="all">모든 상태</option>
                  <option value="pending">KYC 대기중</option>
                  <option value="approved">KYC 승인됨</option>
                  <option value="rejected">KYC 거부됨</option>
                  <option value="scheduled">예약됨</option>
                  <option value="completed">완료됨</option>
                </select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Users Table */}
        <Card>
          <CardHeader>
            <CardTitle>사용자 목록 ({filteredUsers.length}명)</CardTitle>
            <CardDescription>
              모든 사용자의 정보와 상태를 확인하고 관리할 수 있습니다
            </CardDescription>
          </CardHeader>
          <CardContent>
            {/* Mobile Card View */}
            <div className="space-y-4 md:hidden">
              {filteredUsers.length === 0 ? (
                <div className="py-8 text-center">
                  <p className="text-gray-500">
                    조건에 맞는 사용자가 없습니다.
                  </p>
                </div>
              ) : (
                filteredUsers.map((user) => (
                  <Card key={user.id} className="border-gray-200 border p-4">
                    <div className="space-y-3">
                      {/* User Basic Info */}
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <User className="text-gray-400 h-4 w-4" />
                            <span className="font-medium">{user.name}</span>
                          </div>
                          <div className="mt-1 space-y-1">
                            <div className="text-gray-600 flex items-center gap-2 text-sm">
                              <Mail className="h-3 w-3" />
                              <span className="truncate">{user.email}</span>
                            </div>
                            <div className="text-gray-600 flex items-center gap-2 text-sm">
                              <Phone className="h-3 w-3" />
                              {user.contact || user.phone}
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Status Badges */}
                      <div className="flex flex-wrap gap-2">
                        {getStatusBadge(user.kycStatus, "kyc")}
                        {getStatusBadge(user.reservationStatus, "reservation")}
                        {getStatusBadge(user.eyebrowProcedure, "procedure")}
                        {/* Comments Count Badge - Clickable */}
                        <Dialog>
                          <DialogTrigger asChild>
                            <button
                              className={`inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs font-medium transition-colors ${
                                getUserCommentsCount(user.id) > 0
                                  ? "bg-blue-100 text-blue-800 hover:bg-blue-200"
                                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                              }`}
                            >
                              <MessageSquare className="h-3 w-3" />
                              {getUserCommentsCount(user.id)}
                            </button>
                          </DialogTrigger>
                          <DialogContent className="max-w-2xl">
                            <DialogHeader>
                              <DialogTitle>
                                {user.name} - 관리자 댓글
                              </DialogTitle>
                              <DialogDescription>
                                선택한 사용자에 대한 관리자 댓글 목록을 확인하고
                                새로운 댓글을 추가할 수 있는 관리 도구입니다
                              </DialogDescription>
                            </DialogHeader>
                            <div className="space-y-4">
                              {/* Comments List */}
                              <div className="max-h-60 space-y-3 overflow-y-auto">
                                {getUserComments(user.id).length === 0 ? (
                                  <p className="text-gray-500 text-center text-sm">
                                    아직 댓글이 없습니다.
                                  </p>
                                ) : (
                                  getUserComments(user.id).map((comment) => (
                                    <div
                                      key={comment.id}
                                      className="border-gray-200 rounded border p-3"
                                    >
                                      <div className="mb-3 space-y-1">
                                        <div className="text-gray-600 text-sm font-medium">
                                          {comment.adminEmail}
                                        </div>
                                        <div className="text-gray-500 text-xs">
                                          {(() => {
                                            const date =
                                              (
                                                comment.createdAt as {
                                                  toDate?: () => Date;
                                                }
                                              )?.toDate?.() ||
                                              new Date(
                                                comment.createdAt as
                                                  | string
                                                  | number
                                                  | Date
                                              );
                                            return date.toLocaleString("ko-KR");
                                          })()}
                                        </div>
                                      </div>
                                      <p className="text-gray-700 whitespace-pre-wrap text-sm">
                                        {comment.comment}
                                      </p>
                                    </div>
                                  ))
                                )}
                              </div>

                              {/* Add Comment */}
                              <div className="space-y-2">
                                <label className="text-gray-700 block text-sm font-medium">
                                  새 댓글 추가
                                </label>
                                <Textarea
                                  placeholder="댓글을 입력하세요..."
                                  value={
                                    editingUser?.id === user.id
                                      ? newComment
                                      : ""
                                  }
                                  onChange={(e) => {
                                    setNewComment(e.target.value);
                                    setEditingUser(user);
                                  }}
                                  className="min-h-20"
                                />
                                <div className="flex justify-end gap-2">
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => {
                                      setEditingUser(null);
                                      setNewComment("");
                                    }}
                                  >
                                    취소
                                  </Button>
                                  <Button
                                    size="sm"
                                    onClick={() => handleAddComment(user.id)}
                                    disabled={!newComment.trim()}
                                  >
                                    댓글 추가
                                  </Button>
                                </div>
                              </div>
                            </div>
                          </DialogContent>
                        </Dialog>
                      </div>

                      {/* Latest Reservation */}
                      {user.latestReservation && (
                        <div className="text-gray-600 text-sm">
                          <div className="flex items-center gap-2">
                            <Calendar className="h-3 w-3" />
                            <span>
                              최근 예약: {user.latestReservation.date}{" "}
                              {user.latestReservation.time}
                            </span>
                          </div>
                        </div>
                      )}

                      {/* Action Buttons */}
                      <div className="flex justify-between gap-2 pt-2">
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setEditingUser(user)}
                              className="flex-1"
                            >
                              <Edit className="mr-1 h-3 w-3" />
                              편집
                            </Button>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle>사용자 정보 편집</DialogTitle>
                              <DialogDescription>
                                사용자의 개인정보, KYC 상태, 예약 상태 등을
                                수정할 수 있는 편집 도구입니다
                              </DialogDescription>
                            </DialogHeader>
                            {editingUser && editingUser.id === user.id && (
                              <div className="space-y-4">
                                <div>
                                  <label className="text-sm font-medium">
                                    이름
                                  </label>
                                  <Input
                                    value={editingUser.name}
                                    onChange={(e) =>
                                      setEditingUser({
                                        ...editingUser,
                                        name: e.target.value,
                                      })
                                    }
                                  />
                                </div>
                                <div>
                                  <label className="text-sm font-medium">
                                    이메일
                                  </label>
                                  <Input
                                    value={editingUser.email}
                                    onChange={(e) =>
                                      setEditingUser({
                                        ...editingUser,
                                        email: e.target.value,
                                      })
                                    }
                                  />
                                </div>
                                <div>
                                  <label className="text-sm font-medium">
                                    전화번호
                                  </label>
                                  <Input
                                    value={editingUser.phone}
                                    onChange={(e) =>
                                      setEditingUser({
                                        ...editingUser,
                                        phone: e.target.value,
                                      })
                                    }
                                  />
                                </div>
                                <div>
                                  <label className="text-sm font-medium">
                                    KYC 상태
                                  </label>
                                  <select
                                    value={editingUser.kycStatus}
                                    onChange={(e) =>
                                      setEditingUser({
                                        ...editingUser,
                                        kycStatus: e.target.value as
                                          | "pending"
                                          | "approved"
                                          | "rejected",
                                      })
                                    }
                                    className="border-gray-300 w-full rounded-md border px-3 py-2"
                                  >
                                    <option value="pending">대기중</option>
                                    <option value="approved">승인됨</option>
                                    <option value="rejected">거부됨</option>
                                  </select>
                                </div>
                                <div>
                                  <label className="text-sm font-medium">
                                    예약 상태
                                  </label>
                                  <select
                                    value={editingUser.reservationStatus}
                                    onChange={(e) =>
                                      setEditingUser({
                                        ...editingUser,
                                        reservationStatus: e.target.value as
                                          | "none"
                                          | "scheduled"
                                          | "completed"
                                          | "cancelled",
                                      })
                                    }
                                    className="border-gray-300 w-full rounded-md border px-3 py-2"
                                  >
                                    <option value="none">예약 없음</option>
                                    <option value="scheduled">예약됨</option>
                                    <option value="completed">완료됨</option>
                                    <option value="cancelled">취소됨</option>
                                  </select>
                                </div>
                                <div>
                                  <label className="text-sm font-medium">
                                    시술 진행
                                  </label>
                                  <select
                                    value={editingUser.eyebrowProcedure}
                                    onChange={(e) =>
                                      setEditingUser({
                                        ...editingUser,
                                        eyebrowProcedure: e.target.value as
                                          | "not_started"
                                          | "in_progress"
                                          | "completed",
                                      })
                                    }
                                    className="border-gray-300 w-full rounded-md border px-3 py-2"
                                  >
                                    <option value="not_started">
                                      시작 안함
                                    </option>
                                    <option value="in_progress">진행중</option>
                                    <option value="completed">완료됨</option>
                                  </select>
                                </div>
                                <div>
                                  <label className="text-sm font-medium">
                                    관리자 댓글
                                  </label>
                                  <Textarea
                                    value={editingUser.adminComments}
                                    onChange={(e) =>
                                      setEditingUser({
                                        ...editingUser,
                                        adminComments: e.target.value,
                                      })
                                    }
                                    rows={3}
                                  />
                                </div>
                                <div className="flex gap-2">
                                  <Button
                                    onClick={() =>
                                      handleUpdateUser(
                                        editingUser.id,
                                        editingUser
                                      )
                                    }
                                    disabled={isSubmitting}
                                    className="flex-1"
                                  >
                                    저장
                                  </Button>
                                  <Button
                                    variant="outline"
                                    onClick={() => setEditingUser(null)}
                                    className="flex-1"
                                  >
                                    취소
                                  </Button>
                                </div>
                              </div>
                            )}
                          </DialogContent>
                        </Dialog>

                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => handleDeleteUser(user.id, user.name)}
                          disabled={isSubmitting}
                          className="flex-1"
                        >
                          <Trash2 className="mr-1 h-3 w-3" />
                          삭제
                        </Button>
                      </div>
                    </div>
                  </Card>
                ))
              )}
            </div>

            {/* Desktop Table View */}
            <div className="hidden overflow-x-auto md:block">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>기본 정보</TableHead>
                    <TableHead>KYC 상태</TableHead>
                    <TableHead>예약 상태</TableHead>
                    <TableHead>시술 진행</TableHead>
                    <TableHead>댓글</TableHead>
                    <TableHead>작업</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredUsers.map((user) => (
                    <TableRow key={user.id}>
                      {/* Basic Information */}
                      <TableCell>
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <User className="text-gray-400 h-4 w-4" />
                            <span className="font-medium">{user.name}</span>
                          </div>
                          <div className="text-gray-600 flex items-center gap-2 text-sm">
                            <Mail className="h-3 w-3" />
                            {user.email}
                          </div>
                          <div className="text-gray-600 flex items-center gap-2 text-sm">
                            <Phone className="h-3 w-3" />
                            {user.contact || user.phone}
                          </div>
                        </div>
                      </TableCell>

                      {/* KYC Status */}
                      <TableCell>
                        {getStatusBadge(user.kycStatus, "kyc")}
                      </TableCell>

                      {/* Reservation Status */}
                      <TableCell>
                        <div className="space-y-1">
                          {getStatusBadge(
                            user.reservationStatus,
                            "reservation"
                          )}
                          {user.latestReservation && (
                            <div className="text-gray-600 flex items-center gap-1 text-xs">
                              <Calendar className="h-3 w-3" />
                              {user.latestReservation.date}{" "}
                              {user.latestReservation.time}
                            </div>
                          )}
                        </div>
                      </TableCell>

                      {/* Eyebrow Procedure */}
                      <TableCell>
                        {getStatusBadge(user.eyebrowProcedure, "procedure")}
                      </TableCell>

                      {/* Comments Count */}
                      <TableCell>
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="flex h-auto items-center gap-2 p-2"
                            >
                              <MessageSquare className="text-gray-400 h-4 w-4" />
                              <span className="font-medium">
                                {getUserCommentsCount(user.id)}
                              </span>
                              {getUserCommentsCount(user.id) > 0 && (
                                <span className="bg-blue-100 text-blue-800 px-1.5 py-0.5 rounded-full text-xs font-medium">
                                  NEW
                                </span>
                              )}
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-2xl">
                            <DialogHeader>
                              <DialogTitle>
                                {user.name} - 관리자 댓글
                              </DialogTitle>
                              <DialogDescription>
                                선택한 사용자에 대한 관리자 댓글 목록을 확인하고
                                새로운 댓글을 추가할 수 있는 관리 도구입니다
                              </DialogDescription>
                            </DialogHeader>
                            <div className="space-y-4">
                              {/* Comments List */}
                              <div className="max-h-60 space-y-3 overflow-y-auto">
                                {getUserComments(user.id).length === 0 ? (
                                  <p className="text-gray-500 text-center text-sm">
                                    아직 댓글이 없습니다.
                                  </p>
                                ) : (
                                  getUserComments(user.id).map((comment) => (
                                    <div
                                      key={comment.id}
                                      className="border-gray-200 rounded border p-3"
                                    >
                                      <div className="mb-3 space-y-1">
                                        <div className="text-gray-600 text-sm font-medium">
                                          {comment.adminEmail}
                                        </div>
                                        <div className="text-gray-500 text-xs">
                                          {(() => {
                                            const date =
                                              (
                                                comment.createdAt as {
                                                  toDate?: () => Date;
                                                }
                                              )?.toDate?.() ||
                                              new Date(
                                                comment.createdAt as
                                                  | string
                                                  | number
                                                  | Date
                                              );
                                            return date.toLocaleString("ko-KR");
                                          })()}
                                        </div>
                                      </div>
                                      <p className="text-gray-700 whitespace-pre-wrap text-sm">
                                        {comment.comment}
                                      </p>
                                    </div>
                                  ))
                                )}
                              </div>

                              {/* Add Comment */}
                              <div className="space-y-2">
                                <label className="text-gray-700 block text-sm font-medium">
                                  새 댓글 추가
                                </label>
                                <Textarea
                                  placeholder="댓글을 입력하세요..."
                                  value={
                                    editingUser?.id === user.id
                                      ? newComment
                                      : ""
                                  }
                                  onChange={(e) => {
                                    setNewComment(e.target.value);
                                    setEditingUser(user);
                                  }}
                                  className="min-h-20"
                                />
                                <div className="flex justify-end gap-2">
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => {
                                      setEditingUser(null);
                                      setNewComment("");
                                    }}
                                  >
                                    취소
                                  </Button>
                                  <Button
                                    size="sm"
                                    onClick={() => handleAddComment(user.id)}
                                    disabled={!newComment.trim()}
                                  >
                                    댓글 추가
                                  </Button>
                                </div>
                              </div>
                            </div>
                          </DialogContent>
                        </Dialog>
                      </TableCell>

                      {/* Actions */}
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setEditingUser(user)}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                            </DialogTrigger>
                            <DialogContent>
                              <DialogHeader>
                                <DialogTitle>사용자 정보 편집</DialogTitle>
                                <DialogDescription>
                                  사용자의 개인정보, KYC 상태, 예약 상태 등을
                                  수정할 수 있는 편집 도구입니다
                                </DialogDescription>
                              </DialogHeader>
                              {editingUser && editingUser.id === user.id && (
                                <div className="space-y-4">
                                  <div>
                                    <label className="text-sm font-medium">
                                      이름
                                    </label>
                                    <Input
                                      value={editingUser.name}
                                      onChange={(e) =>
                                        setEditingUser({
                                          ...editingUser,
                                          name: e.target.value,
                                        })
                                      }
                                    />
                                  </div>
                                  <div>
                                    <label className="text-sm font-medium">
                                      이메일
                                    </label>
                                    <Input
                                      value={editingUser.email}
                                      onChange={(e) =>
                                        setEditingUser({
                                          ...editingUser,
                                          email: e.target.value,
                                        })
                                      }
                                    />
                                  </div>
                                  <div>
                                    <label className="text-sm font-medium">
                                      전화번호
                                    </label>
                                    <Input
                                      value={editingUser.phone}
                                      onChange={(e) =>
                                        setEditingUser({
                                          ...editingUser,
                                          phone: e.target.value,
                                        })
                                      }
                                    />
                                  </div>
                                  <div>
                                    <label className="text-sm font-medium">
                                      KYC 상태
                                    </label>
                                    <select
                                      value={editingUser.kycStatus}
                                      onChange={(e) =>
                                        setEditingUser({
                                          ...editingUser,
                                          kycStatus: e.target.value as
                                            | "pending"
                                            | "approved"
                                            | "rejected",
                                        })
                                      }
                                      className="border-gray-300 w-full rounded-md border px-3 py-2"
                                    >
                                      <option value="pending">대기중</option>
                                      <option value="approved">승인됨</option>
                                      <option value="rejected">거부됨</option>
                                    </select>
                                  </div>
                                  <div>
                                    <label className="text-sm font-medium">
                                      예약 상태
                                    </label>
                                    <select
                                      value={editingUser.reservationStatus}
                                      onChange={(e) =>
                                        setEditingUser({
                                          ...editingUser,
                                          reservationStatus: e.target.value as
                                            | "none"
                                            | "scheduled"
                                            | "completed"
                                            | "cancelled",
                                        })
                                      }
                                      className="border-gray-300 w-full rounded-md border px-3 py-2"
                                    >
                                      <option value="none">예약 없음</option>
                                      <option value="scheduled">예약됨</option>
                                      <option value="completed">완료됨</option>
                                      <option value="cancelled">취소됨</option>
                                    </select>
                                  </div>
                                  <div>
                                    <label className="text-sm font-medium">
                                      시술 진행
                                    </label>
                                    <select
                                      value={editingUser.eyebrowProcedure}
                                      onChange={(e) =>
                                        setEditingUser({
                                          ...editingUser,
                                          eyebrowProcedure: e.target.value as
                                            | "not_started"
                                            | "in_progress"
                                            | "completed",
                                        })
                                      }
                                      className="border-gray-300 w-full rounded-md border px-3 py-2"
                                    >
                                      <option value="not_started">
                                        시작 안함
                                      </option>
                                      <option value="in_progress">
                                        진행중
                                      </option>
                                      <option value="completed">완료됨</option>
                                    </select>
                                  </div>
                                  <div>
                                    <label className="text-sm font-medium">
                                      관리자 댓글
                                    </label>
                                    <Textarea
                                      value={editingUser.adminComments}
                                      onChange={(e) =>
                                        setEditingUser({
                                          ...editingUser,
                                          adminComments: e.target.value,
                                        })
                                      }
                                      rows={3}
                                    />
                                  </div>
                                  <div className="flex gap-2">
                                    <Button
                                      onClick={() =>
                                        handleUpdateUser(
                                          editingUser.id,
                                          editingUser
                                        )
                                      }
                                      disabled={isSubmitting}
                                      className="flex-1"
                                    >
                                      저장
                                    </Button>
                                    <Button
                                      variant="outline"
                                      onClick={() => setEditingUser(null)}
                                      className="flex-1"
                                    >
                                      취소
                                    </Button>
                                  </div>
                                </div>
                              )}
                            </DialogContent>
                          </Dialog>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteUser(user.id, user.name)}
                            disabled={isSubmitting}
                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
