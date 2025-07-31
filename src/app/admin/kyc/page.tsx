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
  getDoc,
  addDoc,
  serverTimestamp,
  setDoc,
} from "firebase/firestore";
import { createNotification, notificationTemplates } from "@/lib/notifications";
import Image from "next/image";
import CountdownTimer from "@/components/CountdownTimer";
import {
  provinces,
  districts as districtData,
  dongs as dongData,
} from "@/lib/address-data";

// 레거시 서울시 시군구 데이터 (호환성을 위해 유지)
const legacyDistricts = [
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
  birthDate?: string;
  contact: string;
  province?: string;
  district?: string;
  dong?: string;
  detailedAddress?: string;
  skinType?: string;
  skinTypeOther?: string;
  designDescription?: string;
  eyebrowDesign?: string;
  additionalNotes?: string;
  marketingConsent?: string;
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
  scarAt?: Timestamp;
  scarReason?: string;
  eyebrowProcedure?: "not_started" | "in_progress" | "completed";
  procedureNote?: string;
  procedureCompletedAt?: Date;
}

interface ReservationData {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  date: string;
  time: string;
  slotId?: string; // Add slotId for slot management
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

// 주소 변환 함수 (강화된 버전)
const getAddressLabel = (
  type: "province" | "district" | "dong",
  value: string,
  parentValue?: string
): string => {
  if (!value) return "";

  try {
    switch (type) {
      case "province":
        const province = provinces.find((p) => p.value === value);
        return province?.label || value;

      case "district":
        // 새로운 주소 데이터에서 먼저 찾기
        if (parentValue) {
          const districtList = districtData[parentValue];
          if (districtList) {
            const district = districtList.find((d) => d.value === value);
            if (district) return district.label;
          }
        }

        // 레거시 데이터 호환성 - 기존 서울 데이터에서 찾기
        const legacyDistrict = legacyDistricts.find((d) => d.value === value);
        if (legacyDistrict) return legacyDistrict.label;

        // 일반적인 변환 시도
        if (value.includes("seongdong")) return "성동구";
        if (value.includes("gangnam")) return "강남구";
        if (value.includes("seoul")) return "서울특별시";

        return value;

      case "dong":
        if (parentValue) {
          const dongList = dongData[parentValue];
          if (dongList) {
            const dong = dongList.find((d) => d.value === value);
            if (dong) return dong.label;
          }
        }

        // 일반적인 동 변환 시도
        if (value.includes("seongsu")) return "성수동";
        if (value.includes("hangang")) return "한강로동";

        return value;

      default:
        return value;
    }
  } catch (error) {
    console.error("Address conversion error:", error);
    return value;
  }
};

// 피부타입 변환 함수
const getSkinTypeLabel = (skinType: string): string => {
  const skinTypeMap: { [key: string]: string } = {
    oily: "지성",
    dry: "건성",
    normal: "보통",
    combination: "복합성",
    sensitive: "민감성",
    unknown: "모름",
    other: "기타",
  };
  return skinTypeMap[skinType] || skinType;
};

export default function AdminKYCPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [pendingUsers, setPendingUsers] = useState<UserData[]>([]);
  const [approvedUsers, setApprovedUsers] = useState<UserData[]>([]);
  const [rejectedUsers, setRejectedUsers] = useState<UserData[]>([]);
  const [reservations, setReservations] = useState<ReservationData[]>([]);
  const [scarUsers, setScarUsers] = useState<UserData[]>([]);

  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [expandedUserId, setExpandedUserId] = useState<string | null>(null);
  const [userDataMap, setUserDataMap] = useState<Record<string, UserData>>({});
  const [isRejectDialogOpen, setIsRejectDialogOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState("");

  // 승인 확인 다이얼로그
  const [isApproveDialogOpen, setIsApproveDialogOpen] = useState(false);
  const [selectedApproveUserId, setSelectedApproveUserId] = useState<
    string | null
  >(null);

  // 잔흔 확인 다이얼로그
  const [isScarDialogOpen, setIsScarDialogOpen] = useState(false);
  const [selectedScarUserId, setSelectedScarUserId] = useState<string | null>(
    null
  );
  const [scarReason, setScarReason] = useState("");
  const [isReservationDetailDialogOpen, setIsReservationDetailDialogOpen] =
    useState(false);
  const [selectedReservationDetail, setSelectedReservationDetail] =
    useState<ReservationData | null>(null);
  const [isReservationRejectDialogOpen, setIsReservationRejectDialogOpen] =
    useState(false);
  const [reservationRejectReason, setReservationRejectReason] = useState("");
  const [selectedReservationId, setSelectedReservationId] = useState<
    string | null
  >(null);
  const [isReservationDeleteDialogOpen, setIsReservationDeleteDialogOpen] =
    useState(false);
  const [reservationDeleteReason, setReservationDeleteReason] = useState("");

  // KYC 오픈 기간 설정
  const [kycOpenSettings, setKycOpenSettings] = useState({
    startDate: "",
    startTime: "",
    endDate: "",
    endTime: "",
  });
  const [showKycOpenDialog, setShowKycOpenDialog] = useState(false);
  const [tempKycOpenSettings, setTempKycOpenSettings] = useState({
    startDate: "",
    startTime: "",
    endDate: "",
    endTime: "",
  });

  const [mainTab, setMainTab] = useState<"kyc" | "reservations">("kyc");
  const [kycTab, setKycTab] = useState<
    "pending" | "approved" | "rejected" | "scar"
  >("pending");
  const [reservationTab, setReservationTab] = useState<
    "upcoming" | "procedure"
  >("upcoming");

  const [startMonth, setStartMonth] = useState<string>(() => {
    const today = new Date();
    // 기본적으로 3개월 전부터
    const startDate = new Date(today.getFullYear(), today.getMonth() - 3, 1);
    return `${startDate.getFullYear()}-${String(
      startDate.getMonth() + 1
    ).padStart(2, "0")}`;
  });
  const [endMonth, setEndMonth] = useState<string>(() => {
    const today = new Date();
    // 기본적으로 3개월 후까지
    const endDate = new Date(today.getFullYear(), today.getMonth() + 3, 1);
    return `${endDate.getFullYear()}-${String(endDate.getMonth() + 1).padStart(
      2,
      "0"
    )}`;
  });
  const [showPastReservations, setShowPastReservations] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const [procedureNote, setProcedureNote] = useState("");
  const [showProcedureDialog, setShowProcedureDialog] = useState(false);
  const [selectedReservation, setSelectedReservation] =
    useState<ReservationData | null>(null);

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

  // Load KYC open period settings
  useEffect(() => {
    const loadKycOpenSettings = async () => {
      try {
        const settingsDoc = await getDoc(doc(db, "settings", "kycOpen"));
        if (settingsDoc.exists()) {
          const settings = settingsDoc.data();
          const newSettings = {
            startDate: settings.startDate || "",
            startTime: settings.startTime || "",
            endDate: settings.endDate || "",
            endTime: settings.endTime || "",
          };
          setKycOpenSettings(newSettings);
          setTempKycOpenSettings(newSettings);
        }
      } catch (error) {
        console.error("Error loading KYC open settings:", error);
      }
    };

    loadKycOpenSettings();
  }, []);

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
        try {
          const data = doc.data();
          console.log("📄 User document:", doc.id, data);
          users.push({
            id: doc.id,
            ...data,
            createdAt:
              data.createdAt && data.createdAt.toDate
                ? data.createdAt.toDate()
                : new Date(),
            approvedAt:
              data.approvedAt && data.approvedAt.toDate
                ? data.approvedAt.toDate()
                : null,
            rejectedAt:
              data.rejectedAt && data.rejectedAt.toDate
                ? data.rejectedAt.toDate()
                : null,
          } as UserData);
        } catch (error) {
          console.error("Error processing user document:", doc.id, error);
        }
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
        try {
          const data = doc.data();
          users.push({
            id: doc.id,
            ...data,
            createdAt:
              data.createdAt && data.createdAt.toDate
                ? data.createdAt.toDate()
                : new Date(),
            approvedAt:
              data.approvedAt && data.approvedAt.toDate
                ? data.approvedAt.toDate()
                : null,
            rejectedAt:
              data.rejectedAt && data.rejectedAt.toDate
                ? data.rejectedAt.toDate()
                : null,
          } as UserData);
        } catch (error) {
          console.error(
            "Error processing approved user document:",
            doc.id,
            error
          );
        }
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
        try {
          const data = doc.data();
          users.push({
            id: doc.id,
            ...data,
            createdAt:
              data.createdAt && data.createdAt.toDate
                ? data.createdAt.toDate()
                : new Date(),
            approvedAt:
              data.approvedAt && data.approvedAt.toDate
                ? data.approvedAt.toDate()
                : null,
            rejectedAt:
              data.rejectedAt && data.rejectedAt.toDate
                ? data.rejectedAt.toDate()
                : null,
          } as UserData);
        } catch (error) {
          console.error(
            "Error processing rejected user document:",
            doc.id,
            error
          );
        }
      });
      users.sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
      setRejectedUsers(users);
    });

    // Subscribe to scar users
    const scarQuery = query(
      collection(db, "users"),
      where("kycStatus", "==", "scar")
    );

    const unsubScar = onSnapshot(
      scarQuery,
      (snapshot) => {
        const users = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as UserData[];
        setScarUsers(users);
      },
      (error) => {
        console.error("Error fetching scar users:", error);
      }
    );

    // Subscribe to reservations (excluding cancelled ones)
    const reservationsQuery = query(
      collection(db, "reservations"),
      where("status", "!=", "cancelled")
    );

    const unsubReservations = onSnapshot(
      reservationsQuery,
      async (snapshot) => {
        const reservs: ReservationData[] = [];
        const userIds = new Set<string>();

        snapshot.forEach((doc) => {
          try {
            const data = doc.data();
            reservs.push({
              id: doc.id,
              ...data,
              createdAt:
                data.createdAt && data.createdAt.toDate
                  ? data.createdAt.toDate()
                  : new Date(data.createdAt || Date.now()),
            } as ReservationData);
            if (data.userId) userIds.add(data.userId);
          } catch (error) {
            console.error(
              "Error processing reservation document:",
              doc.id,
              error
            );
          }
        });

        // admin 페이지에서는 모든 예약 표시 (cancelled 포함하여 관리자가 모든 상태 확인 가능)
        const filteredReservs = reservs;

        filteredReservs.sort(
          (a, b) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );

        console.log(
          "🔄 Reservations snapshot received, count:",
          filteredReservs.length
        );
        if (filteredReservs.length > 0) {
          console.log("📋 Sample reservation data:", {
            userName: filteredReservs[0].userName,
            date: filteredReservs[0].date,
            status: filteredReservs[0].status,
            createdAt: filteredReservs[0].createdAt,
            id: filteredReservs[0].id,
          });
          console.log(
            "📋 All reservations:",
            filteredReservs.map((r) => ({
              userName: r.userName,
              date: r.date,
              status: r.status,
            }))
          );
        }

        setReservations(filteredReservs);

        // Fetch user data for all userIds
        const userDataMapTemp: Record<string, UserData> = {};
        await Promise.all(
          Array.from(userIds).map(async (uid) => {
            try {
              const userDoc = await getDoc(doc(db, "users", uid));
              if (userDoc.exists()) {
                const data = userDoc.data();
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
        setUserDataMap(userDataMapTemp);
      }
    );

    return () => {
      unsubPending();
      unsubApproved();
      unsubRejected();
      unsubScar();
      unsubReservations();
    };
  }, [user, isAuthorized]);

  const handleApprove = async () => {
    if (!selectedApproveUserId) return;

    try {
      // Get user data before updating
      const user = pendingUsers.find((u) => u.id === selectedApproveUserId);
      if (!user) {
        console.error("User not found");
        return;
      }

      // Update user status
      await updateDoc(doc(db, "users", selectedApproveUserId), {
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

      // Close dialog and reset state
      setIsApproveDialogOpen(false);
      setSelectedApproveUserId(null);
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

  const handleScar = async () => {
    if (!selectedScarUserId || !scarReason.trim()) return;

    try {
      // Get user data before updating
      const user = pendingUsers.find((u) => u.id === selectedScarUserId);
      if (!user) {
        console.error("User not found");
        return;
      }

      // Update user status
      await updateDoc(doc(db, "users", selectedScarUserId), {
        kycStatus: "scar",
        scarAt: Timestamp.now(),
        scarReason: scarReason.trim(),
      });

      // Create notification for the user
      try {
        const notification = {
          title: "KYC 검토 결과 안내",
          message: `잔흔 제거 후 재신청이 필요합니다.\n\n사유: ${scarReason.trim()}\n\n자세한 내용은 고객센터로 문의해 주세요.`,
        };

        const notificationUserId = user.userId || selectedScarUserId;

        await createNotification({
          userId: notificationUserId,
          type: "admin_kyc_new",
          title: notification.title,
          message: notification.message,
          data: {
            scarAt: new Date(),
            scarReason: scarReason.trim(),
          },
        });
        console.log(
          "✅ KYC scar notification created for user:",
          notificationUserId
        );
      } catch (notificationError) {
        console.error("Error creating notification:", notificationError);
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
            newStatus: "scar",
            subject: "[네이처서울] KYC 검토 결과 안내",
            html: "", // Will be generated by the API
          }),
        });
        console.log("KYC scar email sent to:", user.email);
      } catch (emailError) {
        console.error("Error sending KYC scar email:", emailError);
      }

      // Close dialog and reset state
      setIsScarDialogOpen(false);
      setSelectedScarUserId(null);
      setScarReason("");
    } catch (error) {
      console.error("Error setting scar status:", error);
    }
  };

  // KYC 오픈 기간 저장 함수
  const handleSaveKycOpenSettings = async () => {
    try {
      await setDoc(doc(db, "settings", "kycOpen"), {
        startDate: tempKycOpenSettings.startDate,
        startTime: tempKycOpenSettings.startTime,
        endDate: tempKycOpenSettings.endDate,
        endTime: tempKycOpenSettings.endTime,
        updatedAt: serverTimestamp(),
        updatedBy: user?.email,
      });

      setKycOpenSettings(tempKycOpenSettings);
      setShowKycOpenDialog(false);
      alert("KYC 오픈 기간이 저장되었습니다.");
    } catch (error) {
      console.error("Error saving KYC open settings:", error);
      alert("설정 저장에 실패했습니다.");
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

      // Free up the slot if slotId exists
      if (reservation.slotId) {
        try {
          await updateDoc(doc(db, "slots", reservation.slotId), {
            status: "available",
          });
          console.log("Slot freed up:", reservation.slotId);
        } catch (slotError) {
          console.error("Error freeing up slot:", slotError);
        }
      }

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

  const handleReservationDelete = async () => {
    if (!selectedReservationId || !reservationDeleteReason.trim()) return;

    try {
      const reservation = reservations.find(
        (r) => r.id === selectedReservationId
      );
      if (!reservation) return;

      // Update reservation status to cancelled
      await updateDoc(doc(db, "reservations", selectedReservationId), {
        status: "cancelled",
        deleteReason: reservationDeleteReason.trim(),
        deletedAt: Timestamp.now(),
      });

      // Free up the slot if slotId exists
      if (reservation.slotId) {
        try {
          await updateDoc(doc(db, "slots", reservation.slotId), {
            status: "available",
          });
          console.log("Slot freed up:", reservation.slotId);
        } catch (slotError) {
          console.error("Error freeing up slot:", slotError);
        }
      }

      // Create admin notification
      await createNotification({
        userId: "admin",
        type: "admin_reservation_cancelled",
        title: "예약 삭제 완료",
        message: `${reservation.userName}님의 ${reservation.date} ${
          reservation.time
        } 예약이 삭제되었습니다. 사유: ${reservationDeleteReason.trim()}`,
      });

      // Create user notification
      await createNotification({
        userId: reservation.userId,
        type: "reservation_cancelled",
        title: "예약 삭제 안내",
        message: `${reservation.date} ${
          reservation.time
        } 예약이 관리자에 의해 삭제되었습니다. 사유: ${reservationDeleteReason.trim()}`,
      });

      // Send email notification to user
      try {
        await fetch("/api/email/send", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            to: reservation.userEmail,
            statusType: "reservation",
            newStatus: "cancelled",
            rejectReason: reservationDeleteReason.trim(),
            subject: "[네이처서울] 예약 삭제 안내",
            html: "", // Will be generated by the API
          }),
        });
        console.log(
          "Reservation deletion email sent to:",
          reservation.userEmail
        );
      } catch (emailError) {
        console.error("Error sending reservation deletion email:", emailError);
      }

      setIsReservationDeleteDialogOpen(false);
      setReservationDeleteReason("");
      setSelectedReservationId(null);
    } catch (error) {
      console.error("Error deleting reservation:", error);
    }
  };

  // Handle procedure completion
  const handleProcedureComplete = async () => {
    if (!selectedReservation || !procedureNote.trim()) return;

    try {
      // Update user's procedure status and add procedure note
      const userRef = doc(db, "users", selectedReservation.userId);
      await updateDoc(userRef, {
        eyebrowProcedure: "completed",
        procedureCompletedAt: serverTimestamp(),
        procedureNote: procedureNote.trim(),
        updatedAt: serverTimestamp(),
      });

      // Update reservation with procedure note
      const reservationRef = doc(db, "reservations", selectedReservation.id);
      await updateDoc(reservationRef, {
        procedureCompletedAt: serverTimestamp(),
        procedureNote: procedureNote.trim(),
        updatedAt: serverTimestamp(),
      });

      // Add notification
      await addDoc(collection(db, "notifications"), {
        userId: selectedReservation.userId,
        type: "procedure_completed",
        title: "시술 완료",
        message: `${selectedReservation.date} ${selectedReservation.time} 시술이 완료되었습니다.`,
        createdAt: serverTimestamp(),
        read: false,
      });

      // Send email notification
      try {
        await fetch("/api/email/send", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            to: selectedReservation.userEmail,
            userName: selectedReservation.userName,
            statusType: "procedure",
            newStatus: "completed",
            subject: "[네이처서울] 시술 완료 안내",
            html: "",
            reservationInfo: {
              date: selectedReservation.date,
              time: selectedReservation.time,
            },
          }),
        });
      } catch (emailError) {
        console.error("Error sending procedure completion email:", emailError);
      }

      setShowProcedureDialog(false);
      setProcedureNote("");
      setSelectedReservation(null);
      alert("시술이 완료되었습니다.");
    } catch (error) {
      console.error("Error completing procedure:", error);
      alert("시술 완료 처리 중 오류가 발생했습니다.");
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
                고객관리
              </h1>
            </div>
            <div className="text-gray-500 mt-1 text-xs sm:text-sm">
              KYC 오픈 기간:{" "}
              {kycOpenSettings.startDate && kycOpenSettings.endDate
                ? `${kycOpenSettings.startDate} ${kycOpenSettings.startTime} ~ ${kycOpenSettings.endDate} ${kycOpenSettings.endTime}`
                : "설정되지 않음"}
            </div>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setTempKycOpenSettings(kycOpenSettings);
                setShowKycOpenDialog(true);
              }}
            >
              KYC 오픈 기간 설정
            </Button>
          </div>
        </div>

        <Tabs
          value={mainTab}
          onValueChange={(value) => setMainTab(value as "kyc" | "reservations")}
        >
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="kyc" className="flex items-center gap-2">
              <ClipboardList className="h-4 w-4" />
              KYC 관리
            </TabsTrigger>
            <TabsTrigger
              value="reservations"
              className="flex items-center gap-2"
            >
              <Calendar className="h-4 w-4" />
              예약 관리
            </TabsTrigger>
          </TabsList>

          <TabsContent value="kyc" className="space-y-4">
            <Tabs
              value={kycTab}
              onValueChange={(value) =>
                setKycTab(value as "pending" | "approved" | "rejected" | "scar")
              }
              className="space-y-4"
            >
              <TabsList className="bg-gray-50 mb-4 flex w-full gap-x-1 rounded-lg p-1 sm:grid sm:grid-cols-3 sm:gap-x-0">
                <TabsTrigger
                  value="pending"
                  className="data-[state=active]:bg-orange-500 data-[state=active]:ring-orange-300 data-[state=active]:shadow flex flex-1 flex-col items-center justify-center gap-1 rounded-lg px-3 py-2 text-xs font-medium transition-colors data-[state=active]:scale-105 data-[state=active]:text-white data-[state=active]:ring-2 sm:text-sm"
                >
                  <ClipboardList className="h-4 w-4 sm:h-5 sm:w-5" />
                  <span>대기중 ({pendingUsers.length})</span>
                </TabsTrigger>
                <TabsTrigger
                  value="approved"
                  className="data-[state=active]:bg-green-500 data-[state=active]:ring-green-300 data-[state=active]:shadow flex flex-1 flex-col items-center justify-center gap-1 rounded-lg px-3 py-2 text-xs font-medium transition-colors data-[state=active]:scale-105 data-[state=active]:text-white data-[state=active]:ring-2 sm:text-sm"
                >
                  <CheckCircle className="h-4 w-4 sm:h-5 sm:w-5" />
                  <span>승인됨 ({approvedUsers.length})</span>
                </TabsTrigger>
                <TabsTrigger
                  value="rejected"
                  className="data-[state=active]:bg-red-500 data-[state=active]:ring-red-300 data-[state=active]:shadow flex flex-1 flex-col items-center justify-center gap-1 rounded-lg px-3 py-2 text-xs font-medium transition-colors data-[state=active]:scale-105 data-[state=active]:text-white data-[state=active]:ring-2 sm:text-sm"
                >
                  <XCircle className="h-4 w-4 sm:h-5 sm:w-5" />
                  <span>반려됨 ({rejectedUsers.length})</span>
                </TabsTrigger>
                <TabsTrigger value="scar" className="flex items-center gap-2">
                  <span>잔흔 ({scarUsers.length})</span>
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
                          <div className="flex flex-wrap gap-2 sm:flex-nowrap">
                            <Button
                              size="sm"
                              className="bg-green-600 hover:bg-green-700 min-w-0 flex-1 sm:flex-none"
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedApproveUserId(user.id);
                                setIsApproveDialogOpen(true);
                              }}
                            >
                              승인
                            </Button>
                            <Button
                              size="sm"
                              className="bg-orange-600 hover:bg-orange-700 min-w-0 flex-1 sm:flex-none"
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedScarUserId(user.id);
                                setIsScarDialogOpen(true);
                              }}
                            >
                              잔흔
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              className="min-w-0 flex-1 sm:flex-none"
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedUserId(user.id);
                                setIsRejectDialogOpen(true);
                              }}
                            >
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
                                  <span className="text-gray-600">주소</span>
                                  <span className="font-medium">
                                    {[
                                      user.province
                                        ? getAddressLabel(
                                            "province",
                                            user.province
                                          )
                                        : "",
                                      user.district
                                        ? getAddressLabel(
                                            "district",
                                            user.district,
                                            user.province
                                          )
                                        : "",
                                      user.dong
                                        ? getAddressLabel(
                                            "dong",
                                            user.dong,
                                            user.district
                                          )
                                        : "",
                                    ]
                                      .filter(Boolean)
                                      .join(" ") || "-"}
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
                                    {user.skinType
                                      ? getSkinTypeLabel(user.skinType)
                                      : "-"}
                                    {user.skinType === "other" &&
                                      user.skinTypeOther && (
                                        <span className="text-gray-500 block text-xs">
                                          ({user.skinTypeOther})
                                        </span>
                                      )}
                                  </span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-gray-600">
                                    반영구 이력
                                  </span>
                                  <span className="font-medium">
                                    {user.hasPreviousTreatment
                                      ? "있음"
                                      : "없음"}
                                  </span>
                                </div>
                                {user.designDescription && (
                                  <div className="flex flex-col">
                                    <span className="text-gray-800 mb-2 text-sm font-semibold">
                                      원하는 눈썹 디자인
                                    </span>
                                    <div className="bg-gray-100 border-gray-400 text-gray-900 rounded-r-md border-l-4 p-3 text-sm">
                                      {user.designDescription}
                                    </div>
                                  </div>
                                )}
                                {user.additionalNotes && (
                                  <div className="flex flex-col">
                                    <span className="text-gray-800 mb-2 text-sm font-semibold">
                                      기타 사항
                                    </span>
                                    <div className="bg-gray-100 border-gray-400 text-gray-900 rounded-r-md border-l-4 p-3 text-sm">
                                      {user.additionalNotes}
                                    </div>
                                  </div>
                                )}
                                <div className="flex justify-between">
                                  <span className="text-gray-600">
                                    마케팅 동의
                                  </span>
                                  <span className="font-medium">
                                    {user.marketingConsent ? (
                                      <span className="text-green-600">
                                        동의 (5만원 할인)
                                      </span>
                                    ) : (
                                      <span className="text-gray-500">
                                        미동의
                                      </span>
                                    )}
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
                                  <span className="text-gray-600">주소</span>
                                  <span className="font-medium">
                                    {[
                                      user.province
                                        ? getAddressLabel(
                                            "province",
                                            user.province
                                          )
                                        : "",
                                      user.district
                                        ? getAddressLabel(
                                            "district",
                                            user.district,
                                            user.province
                                          )
                                        : "",
                                      user.dong
                                        ? getAddressLabel(
                                            "dong",
                                            user.dong,
                                            user.district
                                          )
                                        : "",
                                    ]
                                      .filter(Boolean)
                                      .join(" ") || "-"}
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
                                    {user.skinType
                                      ? getSkinTypeLabel(user.skinType)
                                      : "-"}
                                    {user.skinType === "other" &&
                                      user.skinTypeOther && (
                                        <span className="text-gray-500 block text-xs">
                                          ({user.skinTypeOther})
                                        </span>
                                      )}
                                  </span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-gray-600">
                                    반영구 이력
                                  </span>
                                  <span className="font-medium">
                                    {user.hasPreviousTreatment
                                      ? "있음"
                                      : "없음"}
                                  </span>
                                </div>
                                {user.designDescription && (
                                  <div className="flex flex-col">
                                    <span className="text-gray-800 mb-2 text-sm font-semibold">
                                      원하는 눈썹 디자인
                                    </span>
                                    <div className="bg-gray-100 border-gray-400 text-gray-900 rounded-r-md border-l-4 p-3 text-sm">
                                      {user.designDescription}
                                    </div>
                                  </div>
                                )}
                                {user.additionalNotes && (
                                  <div className="flex flex-col">
                                    <span className="text-gray-800 mb-2 text-sm font-semibold">
                                      기타 사항
                                    </span>
                                    <div className="bg-gray-100 border-gray-400 text-gray-900 rounded-r-md border-l-4 p-3 text-sm">
                                      {user.additionalNotes}
                                    </div>
                                  </div>
                                )}
                                <div className="flex justify-between">
                                  <span className="text-gray-600">
                                    마케팅 동의
                                  </span>
                                  <span className="font-medium">
                                    {user.marketingConsent ? (
                                      <span className="text-green-600">
                                        동의 (5만원 할인)
                                      </span>
                                    ) : (
                                      <span className="text-gray-500">
                                        미동의
                                      </span>
                                    )}
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
                            {/* 반려 이유 표시 */}
                            {user.rejectReason && (
                              <div className="mt-3">
                                <div className="text-red-600 bg-red-50 border-red-200 rounded-lg border p-3 text-sm">
                                  <div className="flex items-start gap-2">
                                    <XCircle className="text-red-500 mt-0.5 h-4 w-4 flex-shrink-0" />
                                    <div>
                                      <div className="text-red-700 mb-1 text-xs font-medium">
                                        반려 사유
                                      </div>
                                      <div className="text-red-600">
                                        {user.rejectReason}
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            )}
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
                                  <span className="text-gray-600">주소</span>
                                  <span className="font-medium">
                                    {[
                                      user.province
                                        ? getAddressLabel(
                                            "province",
                                            user.province
                                          )
                                        : "",
                                      user.district
                                        ? getAddressLabel(
                                            "district",
                                            user.district,
                                            user.province
                                          )
                                        : "",
                                      user.dong
                                        ? getAddressLabel(
                                            "dong",
                                            user.dong,
                                            user.district
                                          )
                                        : "",
                                    ]
                                      .filter(Boolean)
                                      .join(" ") || "-"}
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
                                    {user.skinType
                                      ? getSkinTypeLabel(user.skinType)
                                      : "-"}
                                    {user.skinType === "other" &&
                                      user.skinTypeOther && (
                                        <span className="text-gray-500 block text-xs">
                                          ({user.skinTypeOther})
                                        </span>
                                      )}
                                  </span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-gray-600">
                                    반영구 이력
                                  </span>
                                  <span className="font-medium">
                                    {user.hasPreviousTreatment
                                      ? "있음"
                                      : "없음"}
                                  </span>
                                </div>
                                {user.designDescription && (
                                  <div className="flex flex-col">
                                    <span className="text-gray-800 mb-2 text-sm font-semibold">
                                      원하는 눈썹 디자인
                                    </span>
                                    <div className="bg-gray-100 border-gray-400 text-gray-900 rounded-r-md border-l-4 p-3 text-sm">
                                      {user.designDescription}
                                    </div>
                                  </div>
                                )}
                                {user.additionalNotes && (
                                  <div className="flex flex-col">
                                    <span className="text-gray-800 mb-2 text-sm font-semibold">
                                      기타 사항
                                    </span>
                                    <div className="bg-gray-100 border-gray-400 text-gray-900 rounded-r-md border-l-4 p-3 text-sm">
                                      {user.additionalNotes}
                                    </div>
                                  </div>
                                )}
                                <div className="flex justify-between">
                                  <span className="text-gray-600">
                                    마케팅 동의
                                  </span>
                                  <span className="font-medium">
                                    {user.marketingConsent ? (
                                      <span className="text-green-600">
                                        동의 (5만원 할인)
                                      </span>
                                    ) : (
                                      <span className="text-gray-500">
                                        미동의
                                      </span>
                                    )}
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
                        </CardContent>
                      )}
                    </Card>
                  ))
                )}
              </TabsContent>

              <TabsContent value="scar" className="space-y-4">
                <div className="space-y-4">
                  {scarUsers.length === 0 ? (
                    <p className="text-gray-500">
                      잔흔 상태 사용자가 없습니다.
                    </p>
                  ) : (
                    scarUsers.map((user) => (
                      <Card
                        key={user.id}
                        className="border-orange-200 bg-orange-50"
                      >
                        <CardHeader className="pb-3">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-3">
                              <div>
                                <CardTitle className="text-lg">
                                  {user.name}
                                </CardTitle>
                                <CardDescription>{user.email}</CardDescription>
                              </div>
                            </div>
                            <div className="flex items-center space-x-2">
                              <Badge className="bg-orange-100 text-orange-800 border-orange-300">
                                잔흔 제거 필요
                              </Badge>
                            </div>
                          </div>
                        </CardHeader>
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
                                  <span className="font-medium">
                                    {user.name}
                                  </span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-gray-600">이메일</span>
                                  <span className="font-medium">
                                    {user.email}
                                  </span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-gray-600">연락처</span>
                                  <span className="font-medium">
                                    {user.contact}
                                  </span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-gray-600">
                                    생년월일
                                  </span>
                                  <span className="font-medium">
                                    {user.birthDate}
                                  </span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-gray-600">성별</span>
                                  <span className="font-medium">
                                    {user.gender === "male" ? "남성" : "여성"}
                                  </span>
                                </div>
                              </div>
                            </div>

                            <div className="space-y-2">
                              <h4 className="text-gray-900 font-semibold">
                                상태 정보
                              </h4>
                              <div className="space-y-1 text-sm">
                                <div className="flex justify-between">
                                  <span className="text-gray-600">상태</span>
                                  <span className="text-orange-600 font-medium">
                                    잔흔 제거 필요
                                  </span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-gray-600">
                                    처리 시간
                                  </span>
                                  <span className="font-medium">
                                    {user.scarAt
                                      ? user.scarAt
                                          .toDate()
                                          .toLocaleString("ko-KR")
                                      : "정보 없음"}
                                  </span>
                                </div>
                                {user.scarReason && (
                                  <div className="col-span-2">
                                    <span className="text-gray-600 text-sm font-medium">
                                      잔흔 사유:
                                    </span>
                                    <div className="bg-orange-50 border-orange-200 mt-1 rounded-lg border p-3">
                                      <p className="text-orange-700 whitespace-pre-wrap text-sm">
                                        {user.scarReason}
                                      </p>
                                    </div>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>

                          {/* Address Information */}
                          <div className="space-y-2">
                            <h4 className="text-gray-900 font-semibold">
                              주소 정보
                            </h4>
                            <div className="text-sm">
                              <span className="font-medium">
                                {user.province && user.district && user.dong
                                  ? `${
                                      provinces.find(
                                        (p) => p.value === user.province
                                      )?.label || user.province
                                    } ${user.district} ${user.dong}`
                                  : "주소 정보 없음"}
                              </span>
                            </div>
                          </div>

                          {/* Custom Fields */}
                          {(user.eyebrowDesign || user.additionalNotes) && (
                            <div className="space-y-4">
                              {user.eyebrowDesign && (
                                <div className="bg-blue-50 border-blue-200 rounded-lg border p-4">
                                  <h4 className="text-blue-800 mb-2 text-sm font-semibold">
                                    원하는 눈썹 디자인
                                  </h4>
                                  <p className="text-blue-700 whitespace-pre-wrap text-sm">
                                    {user.eyebrowDesign}
                                  </p>
                                </div>
                              )}
                              {user.additionalNotes && (
                                <div className="bg-purple-50 border-purple-200 rounded-lg border p-4">
                                  <h4 className="text-purple-800 mb-2 text-sm font-semibold">
                                    기타 사항
                                  </h4>
                                  <p className="text-purple-700 whitespace-pre-wrap text-sm">
                                    {user.additionalNotes}
                                  </p>
                                </div>
                              )}
                            </div>
                          )}

                          {/* Marketing Consent */}
                          {user.marketingConsent && (
                            <div className="bg-green-50 border-green-200 rounded-lg border p-4">
                              <h4 className="text-green-800 mb-2 text-sm font-semibold">
                                마케팅 초상권 동의
                              </h4>
                              <p className="text-green-700 text-sm">
                                {user.marketingConsent === "agree"
                                  ? "동의함 (5만원 할인)"
                                  : "동의하지 않음"}
                              </p>
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    ))
                  )}
                </div>
              </TabsContent>
            </Tabs>
          </TabsContent>

          <TabsContent value="reservations" className="space-y-4">
            <Tabs
              value={reservationTab}
              onValueChange={(value) =>
                setReservationTab(value as "upcoming" | "procedure")
              }
            >
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="upcoming">예약 관리</TabsTrigger>
                <TabsTrigger value="procedure">시술 관리</TabsTrigger>
              </TabsList>

              <TabsContent value="upcoming" className="space-y-4">
                {/* Filters */}
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-4">
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="이름 검색"
                      className="border-gray-300 py-1.5 focus:border-blue-500 w-full rounded-md border px-3 text-sm focus:outline-none sm:w-auto"
                    />
                    <div className="flex items-center gap-1 sm:gap-2">
                      <select
                        value={startMonth}
                        onChange={(e) => setStartMonth(e.target.value)}
                        className="border-gray-300 py-1.5 focus:border-blue-500 rounded-md border px-2 text-sm focus:outline-none"
                      >
                        {(() => {
                          const months = [];
                          const today = new Date();
                          // 현재 월부터 12개월 전까지, 그리고 12개월 후까지
                          for (let i = -12; i <= 12; i++) {
                            const date = new Date(
                              today.getFullYear(),
                              today.getMonth() + i,
                              1
                            );
                            const value = `${date.getFullYear()}-${String(
                              date.getMonth() + 1
                            ).padStart(2, "0")}`;
                            const label = date.toLocaleDateString("ko-KR", {
                              year: "2-digit",
                              month: "short",
                            });
                            months.push({ value, label });
                          }
                          return months.map((month) => (
                            <option key={month.value} value={month.value}>
                              {month.label}
                            </option>
                          ));
                        })()}
                      </select>
                      <span className="text-gray-400 text-xs">~</span>
                      <select
                        value={endMonth}
                        onChange={(e) => setEndMonth(e.target.value)}
                        className="border-gray-300 py-1.5 focus:border-blue-500 rounded-md border px-2 text-sm focus:outline-none"
                      >
                        {(() => {
                          const months = [];
                          const today = new Date();
                          // 현재 월부터 12개월 전까지, 그리고 12개월 후까지
                          for (let i = -12; i <= 12; i++) {
                            const date = new Date(
                              today.getFullYear(),
                              today.getMonth() + i,
                              1
                            );
                            const value = `${date.getFullYear()}-${String(
                              date.getMonth() + 1
                            ).padStart(2, "0")}`;
                            const label = date.toLocaleDateString("ko-KR", {
                              year: "2-digit",
                              month: "short",
                            });
                            months.push({ value, label });
                          }
                          return months.map((month) => (
                            <option key={month.value} value={month.value}>
                              {month.label}
                            </option>
                          ));
                        })()}
                      </select>
                    </div>
                    <label className="flex items-center gap-2 whitespace-nowrap text-sm">
                      <input
                        type="checkbox"
                        checked={showPastReservations}
                        onChange={(e) =>
                          setShowPastReservations(e.target.checked)
                        }
                        className="rounded"
                      />
                      지난 예약 포함
                    </label>
                  </div>
                  <div className="text-gray-500 text-sm">
                    {(() => {
                      const filtered = reservations.filter((reservation) => {
                        // 예약일이 없으면 필터링에서 제외
                        if (!reservation.date) return false;

                        // 이름 검색 필터
                        if (
                          searchQuery.trim() &&
                          !reservation.userName
                            .toLowerCase()
                            .includes(searchQuery.toLowerCase().trim())
                        ) {
                          return false;
                        }

                        // 예약일 파싱 (다양한 형식 지원)
                        let reservationDate;
                        let reservationMonth;

                        // 날짜 형식 파싱 ('2025. 7. 30.' 또는 '2025-07-30' 형식 모두 지원)
                        if (reservation.date.includes(".")) {
                          // '2025. 7. 30.' 형식
                          const parts = reservation.date
                            .replace(/\./g, "")
                            .trim()
                            .split(" ")
                            .filter((p) => p);
                          const year = parseInt(parts[0]);
                          const month = parseInt(parts[1]);
                          const day = parseInt(parts[2]);
                          reservationDate = new Date(year, month - 1, day);
                          reservationMonth = `${year}-${String(month).padStart(
                            2,
                            "0"
                          )}`;
                        } else {
                          // '2025-07-30' 형식
                          const [year, month, day] = reservation.date
                            .split("-")
                            .map(Number);
                          reservationDate = new Date(year, month - 1, day);
                          reservationMonth = `${year}-${String(month).padStart(
                            2,
                            "0"
                          )}`;
                        }

                        // 기간 필터 (시작월부터 끝월까지) - Date 객체로 비교
                        const startDate = new Date(startMonth + "-01");
                        const endDate = new Date(endMonth + "-01");
                        const resMonthDate = new Date(reservationMonth + "-01");

                        if (resMonthDate < startDate || resMonthDate > endDate)
                          return false;

                        // 지난 예약 필터
                        if (!showPastReservations) {
                          const today = new Date();
                          today.setHours(0, 0, 0, 0);

                          if (reservationDate < today) return false;
                        }

                        return true;
                      });
                      return filtered.length;
                    })()}
                  </div>
                </div>

                {(() => {
                  console.log("🔄 Starting reservation filtering with:", {
                    totalReservations: reservations.length,
                    searchQuery,
                    startMonth,
                    endMonth,
                    showPastReservations,
                    today: new Date().toISOString().split("T")[0],
                  });

                  // 모든 예약의 기본 정보 출력
                  reservations.forEach((reservation, index) => {
                    console.log(`📄 Reservation ${index + 1}:`, {
                      userName: reservation.userName,
                      date: reservation.date,
                      status: reservation.status,
                      hasDate: !!reservation.date,
                    });
                  });

                  const filteredReservations = reservations.filter(
                    (reservation) => {
                      // 예약일이 없으면 필터링에서 제외
                      if (!reservation.date) {
                        console.log(
                          "⚠️ Skipping reservation without date:",
                          reservation.userName
                        );
                        return false;
                      }

                      // 이름 검색 필터
                      if (
                        searchQuery.trim() &&
                        !reservation.userName
                          .toLowerCase()
                          .includes(searchQuery.toLowerCase().trim())
                      ) {
                        console.log(
                          "❌ Failed name search filter:",
                          reservation.userName
                        );
                        return false;
                      }

                      // 예약일 파싱 (다양한 형식 지원)
                      let reservationDate;
                      let reservationMonth;

                      // 날짜 형식 파싱 ('2025. 7. 30.' 또는 '2025-07-30' 형식 모두 지원)
                      if (reservation.date.includes(".")) {
                        // '2025. 7. 30.' 형식
                        const parts = reservation.date
                          .replace(/\./g, "")
                          .trim()
                          .split(" ")
                          .filter((p) => p);
                        const year = parseInt(parts[0]);
                        const month = parseInt(parts[1]);
                        const day = parseInt(parts[2]);
                        reservationDate = new Date(year, month - 1, day);
                        reservationMonth = `${year}-${String(month).padStart(
                          2,
                          "0"
                        )}`;
                      } else {
                        // '2025-07-30' 형식
                        const [year, month, day] = reservation.date
                          .split("-")
                          .map(Number);
                        reservationDate = new Date(year, month - 1, day);
                        reservationMonth = `${year}-${String(month).padStart(
                          2,
                          "0"
                        )}`;
                      }

                      // 기간 필터 체크
                      const startDate = new Date(startMonth + "-01");
                      const endDate = new Date(endMonth + "-01");
                      const resMonthDate = new Date(reservationMonth + "-01");
                      const isInDateRange =
                        resMonthDate >= startDate && resMonthDate <= endDate;

                      // 지난 예약 체크
                      const today = new Date();
                      today.setHours(0, 0, 0, 0);
                      const isPastReservation = reservationDate < today;
                      const shouldShowPastReservation =
                        showPastReservations || !isPastReservation;

                      // 디버깅용 로그
                      console.log("🔍 Filtering reservation:", {
                        userName: reservation.userName,
                        date: reservation.date,
                        reservationMonth,
                        startMonth,
                        endMonth,
                        isInDateRange,
                        isPastReservation,
                        shouldShowPastReservation,
                        showPastReservations,
                        finalResult: isInDateRange && shouldShowPastReservation,
                      });

                      // 기간 및 지난 예약 필터 적용
                      if (!isInDateRange) {
                        console.log("❌ Failed date range filter");
                        return false;
                      }

                      if (!shouldShowPastReservation) {
                        console.log("❌ Failed past reservation filter");
                        return false;
                      }

                      console.log("✅ Passed all filters");
                      return true;
                    }
                  );

                  console.log("✅ Filtering completed:", {
                    totalReservations: reservations.length,
                    filteredCount: filteredReservations.length,
                    filteredReservations: filteredReservations.map((r) => ({
                      userName: r.userName,
                      date: r.date,
                      status: r.status,
                    })),
                  });

                  if (filteredReservations.length === 0) {
                    return (
                      <Card>
                        <CardContent className="py-8 text-center">
                          <p className="text-gray-500">
                            선택한 기간에 예약이 없습니다.
                          </p>
                        </CardContent>
                      </Card>
                    );
                  }

                  return filteredReservations.map((reservation) => {
                    // Get actual KYC name from userDataMap
                    const kycUser = userDataMap[reservation.userId];
                    const displayName =
                      kycUser?.name ||
                      reservation.userName ||
                      reservation.userEmail;

                    return (
                      <Card
                        key={reservation.id}
                        className="hover:shadow-md cursor-pointer transition-shadow"
                        onClick={() => {
                          setSelectedReservationDetail(reservation);
                          setIsReservationDetailDialogOpen(true);
                        }}
                      >
                        <CardHeader>
                          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                            <div className="min-w-0 flex-1">
                              <CardTitle className="break-words text-lg sm:text-xl">
                                {displayName}
                              </CardTitle>
                              <div className="mt-2">
                                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-4">
                                  <span className="text-gray-500 flex items-center text-sm">
                                    예약일: {reservation.date || "미정"}
                                  </span>
                                  <span className="text-gray-500 flex items-center text-sm">
                                    시간: {reservation.time || "미정"}
                                  </span>
                                </div>
                              </div>
                              <div className="mt-2">
                                <div className="text-gray-500 text-xs sm:text-sm">
                                  예약 생성일:{" "}
                                  {reservation.createdAt &&
                                  !isNaN(reservation.createdAt.getTime())
                                    ? reservation.createdAt.toLocaleString(
                                        "ko-KR",
                                        {
                                          year: "numeric",
                                          month: "long",
                                          day: "numeric",
                                          hour: "2-digit",
                                          minute: "2-digit",
                                        }
                                      )
                                    : "날짜 정보 없음"}
                                </div>
                                {/* 입금 대기 상태에서 타이머 표시 */}
                                {reservation.status === "payment_required" && (
                                  <div className="mt-2">
                                    {(() => {
                                      const now = new Date();
                                      const reservationTime = new Date(
                                        reservation.createdAt
                                      );
                                      const timeLimit = new Date(
                                        reservationTime.getTime() +
                                          30 * 60 * 1000
                                      );
                                      const remaining =
                                        timeLimit.getTime() - now.getTime();

                                      if (remaining <= 0) {
                                        return (
                                          <div className="text-red-600 text-xs font-medium sm:text-sm">
                                            ⏰ 입금 시간 만료됨
                                          </div>
                                        );
                                      } else {
                                        return (
                                          <div className="space-y-1">
                                            <div className="text-orange-600 text-xs font-medium sm:text-sm">
                                              ⏰ 입금 마감까지
                                            </div>
                                            <CountdownTimer
                                              deadline={timeLimit}
                                              onExpired={() => {
                                                // 타이머 만료 시 페이지 새로고침 또는 상태 업데이트
                                                window.location.reload();
                                              }}
                                              compact={true}
                                              testMode={
                                                process.env.NODE_ENV ===
                                                "development"
                                              }
                                            />
                                          </div>
                                        );
                                      }
                                    })()}
                                  </div>
                                )}

                                {/* 입금 확인중 상태에서 타이머 표시 */}
                                {reservation.status === "payment_confirmed" && (
                                  <div className="mt-2">
                                    {(() => {
                                      const now = new Date();
                                      // paymentConfirmedAt이 있으면 그것을 기준으로, 없으면 createdAt 기준으로
                                      const baseTime = (() => {
                                        const paymentConfirmedAt =
                                          reservation.paymentConfirmedAt;
                                        const createdAt = reservation.createdAt;

                                        // paymentConfirmedAt이 Date 객체인지 확인
                                        if (
                                          paymentConfirmedAt &&
                                          paymentConfirmedAt instanceof Date
                                        ) {
                                          return paymentConfirmedAt;
                                        }

                                        // createdAt이 Date 객체인지 확인
                                        if (
                                          createdAt &&
                                          createdAt instanceof Date
                                        ) {
                                          return createdAt;
                                        }

                                        // 둘 다 Date 객체가 아니면 현재 시간 사용
                                        return new Date();
                                      })();

                                      const timeLimit = new Date(
                                        baseTime.getTime() + 24 * 60 * 60 * 1000
                                      );
                                      const remaining =
                                        timeLimit.getTime() - now.getTime();

                                      if (remaining <= 0) {
                                        return (
                                          <div className="text-red-600 text-xs font-medium sm:text-sm">
                                            ⏰ 관리자 승인 시간 만료됨
                                          </div>
                                        );
                                      } else {
                                        return (
                                          <div className="space-y-1">
                                            <div className="text-blue-600 text-xs font-medium sm:text-sm">
                                              ⏰ 관리자 승인 마감까지
                                            </div>
                                            <CountdownTimer
                                              deadline={timeLimit}
                                              onExpired={() => {
                                                // 타이머 만료 시 페이지 새로고침
                                                window.location.reload();
                                              }}
                                              compact={true}
                                              testMode={
                                                process.env.NODE_ENV ===
                                                "development"
                                              }
                                            />
                                          </div>
                                        );
                                      }
                                    })()}
                                  </div>
                                )}
                              </div>
                            </div>
                            <div className="flex flex-shrink-0 flex-col items-start gap-2 sm:flex-row sm:items-center sm:gap-2">
                              <Badge
                                variant={
                                  reservation.status === "approved"
                                    ? "default"
                                    : reservation.status === "payment_confirmed"
                                    ? "secondary"
                                    : reservation.status === "payment_required"
                                    ? (() => {
                                        const now = new Date();
                                        const reservationTime = new Date(
                                          reservation.createdAt
                                        );
                                        const timeLimit = new Date(
                                          reservationTime.getTime() +
                                            30 * 60 * 1000
                                        );
                                        return now > timeLimit
                                          ? "destructive"
                                          : "outline";
                                      })()
                                    : reservation.status === "cancelled"
                                    ? "destructive"
                                    : reservation.status === "rejected"
                                    ? "destructive"
                                    : "outline"
                                }
                              >
                                {reservation.status === "approved"
                                  ? "확정"
                                  : reservation.status === "payment_confirmed"
                                  ? "입금확인중"
                                  : reservation.status === "payment_required"
                                  ? (() => {
                                      const now = new Date();
                                      const reservationTime = new Date(
                                        reservation.createdAt
                                      );
                                      const timeLimit = new Date(
                                        reservationTime.getTime() +
                                          30 * 60 * 1000
                                      );
                                      return now > timeLimit
                                        ? "입금시간만료"
                                        : "입금대기";
                                    })()
                                  : reservation.status === "cancelled"
                                  ? "취소됨"
                                  : reservation.status === "rejected"
                                  ? "거절"
                                  : "대기"}
                              </Badge>

                              {/* 승인/거절 버튼 - 입금확인 상태일 때만 표시 */}
                              {reservation.status === "payment_confirmed" && (
                                <div className="flex w-full flex-col gap-1 sm:w-auto sm:flex-row">
                                  <Button
                                    size="sm"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleReservationApprove(reservation.id);
                                    }}
                                    className="bg-green-500 hover:bg-green-600 text-xs text-white sm:text-sm"
                                  >
                                    승인
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="destructive"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setSelectedReservationId(reservation.id);
                                      setIsReservationRejectDialogOpen(true);
                                    }}
                                    className="text-xs sm:text-sm"
                                  >
                                    거절
                                  </Button>
                                </div>
                              )}

                              {/* 확정 버튼 - 입금시간 만료된 예약일 때만 표시 */}
                              {reservation.status === "payment_required" &&
                                (() => {
                                  const now = new Date();
                                  const reservationTime = new Date(
                                    reservation.createdAt
                                  );
                                  const timeLimit = new Date(
                                    reservationTime.getTime() + 30 * 60 * 1000
                                  );
                                  return now > timeLimit ? (
                                    <Button
                                      size="sm"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleReservationApprove(
                                          reservation.id
                                        );
                                      }}
                                      className="bg-green-500 hover:bg-green-600 w-full text-xs text-white sm:w-auto sm:text-sm"
                                    >
                                      확정
                                    </Button>
                                  ) : null;
                                })()}

                              {/* 삭제 버튼 - 입금시간 만료된 예약이 아닐 때만 표시 */}
                              {(() => {
                                if (reservation.status === "payment_required") {
                                  const now = new Date();
                                  const reservationTime = new Date(
                                    reservation.createdAt
                                  );
                                  const timeLimit = new Date(
                                    reservationTime.getTime() + 30 * 60 * 1000
                                  );
                                  // 입금시간 만료된 예약은 삭제 버튼 숨김
                                  if (now > timeLimit) {
                                    return null;
                                  }
                                }
                                return (
                                  <Button
                                    size="sm"
                                    variant="destructive"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setSelectedReservationId(reservation.id);
                                      setIsReservationDeleteDialogOpen(true);
                                    }}
                                    className="w-full text-xs sm:w-auto sm:text-sm"
                                  >
                                    삭제
                                  </Button>
                                );
                              })()}
                            </div>
                          </div>
                        </CardHeader>
                      </Card>
                    );
                  });
                })()}
              </TabsContent>

              <TabsContent value="procedure" className="space-y-4">
                {reservations.filter((r) => {
                  const today = new Date();
                  today.setHours(0, 0, 0, 0);
                  const reservationDate = new Date(r.date);
                  return reservationDate < today && r.status === "approved";
                }).length === 0 ? (
                  <Card>
                    <CardContent className="py-8 text-center">
                      <p className="text-gray-500">
                        시술 대상 예약이 없습니다.
                      </p>
                    </CardContent>
                  </Card>
                ) : (
                  reservations
                    .filter((r) => {
                      const today = new Date();
                      today.setHours(0, 0, 0, 0);
                      const reservationDate = new Date(r.date);
                      return reservationDate < today && r.status === "approved";
                    })
                    .map((reservation) => {
                      // Find corresponding user to check procedure status
                      const correspondingUser =
                        pendingUsers.find(
                          (u) => u.email === reservation.userEmail
                        ) ||
                        approvedUsers.find(
                          (u) => u.email === reservation.userEmail
                        ) ||
                        rejectedUsers.find(
                          (u) => u.email === reservation.userEmail
                        );

                      const isProcedureCompleted =
                        correspondingUser?.eyebrowProcedure === "completed";

                      // Get actual KYC name from userDataMap
                      const kycUser = userDataMap[reservation.userId];
                      const displayName =
                        kycUser?.name ||
                        reservation.userName ||
                        reservation.userEmail;

                      return (
                        <Card
                          key={reservation.id}
                          className="hover:shadow-md transition-shadow"
                        >
                          <CardHeader className="pb-3">
                            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                              <div className="space-y-1">
                                <div className="flex items-center gap-2">
                                  <div className="bg-blue-100 text-blue-800 rounded-full px-2 py-1 text-xs font-medium">
                                    {displayName}
                                  </div>
                                  <Badge
                                    variant={
                                      isProcedureCompleted
                                        ? "secondary"
                                        : "default"
                                    }
                                    className="text-xs"
                                  >
                                    {isProcedureCompleted
                                      ? "시술완료"
                                      : "시술대기"}
                                  </Badge>
                                </div>
                                <p className="text-gray-600 text-sm">
                                  {reservation.date} {reservation.time}
                                </p>
                                <p className="text-gray-500 text-xs">
                                  📧 {reservation.userEmail}
                                </p>
                                {correspondingUser?.procedureNote && (
                                  <p className="text-gray-600 bg-gray-50 mt-2 rounded p-2 text-xs">
                                    💬 {correspondingUser.procedureNote}
                                  </p>
                                )}
                              </div>

                              {!isProcedureCompleted && (
                                <Button
                                  onClick={() => {
                                    setSelectedReservation(reservation);
                                    setShowProcedureDialog(true);
                                  }}
                                  className="bg-green-600 hover:bg-green-700 w-full sm:w-auto"
                                >
                                  시술 완료
                                </Button>
                              )}
                            </div>
                          </CardHeader>
                        </Card>
                      );
                    })
                )}
              </TabsContent>
            </Tabs>
          </TabsContent>
        </Tabs>

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

        {/* 예약 삭제 다이얼로그 */}
        <Dialog
          open={isReservationDeleteDialogOpen}
          onOpenChange={setIsReservationDeleteDialogOpen}
        >
          <DialogContent>
            <DialogHeader>
              <DialogTitle>예약 삭제 사유 입력</DialogTitle>
              <DialogDescription>
                예약을 삭제하는 사유를 입력해 주세요. 삭제된 예약은 복구할 수
                없습니다.
              </DialogDescription>
            </DialogHeader>
            <Textarea
              value={reservationDeleteReason}
              onChange={(e) => setReservationDeleteReason(e.target.value)}
              placeholder="삭제 사유를 입력하세요"
              className="min-h-[100px]"
            />
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => {
                  setIsReservationDeleteDialogOpen(false);
                  setReservationDeleteReason("");
                  setSelectedReservationId(null);
                }}
              >
                취소
              </Button>
              <Button
                variant="destructive"
                onClick={handleReservationDelete}
                disabled={!reservationDeleteReason.trim()}
              >
                삭제하기
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* 예약 상세 정보 다이얼로그 */}
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
                                    <span className="text-gray-600">
                                      연락처
                                    </span>
                                    <span className="font-medium">
                                      {user.contact}
                                    </span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span className="text-gray-600">주소</span>
                                    <span className="font-medium">
                                      {[
                                        user.province
                                          ? getAddressLabel(
                                              "province",
                                              user.province
                                            )
                                          : "",
                                        user.district
                                          ? getAddressLabel(
                                              "district",
                                              user.district,
                                              user.province
                                            )
                                          : "",
                                        user.dong
                                          ? getAddressLabel(
                                              "dong",
                                              user.dong,
                                              user.district
                                            )
                                          : "",
                                      ]
                                        .filter(Boolean)
                                        .join(" ") || "-"}
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
                                    <span className="text-gray-600">
                                      이메일
                                    </span>
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
                                    <span className="text-gray-600">
                                      신청일
                                    </span>
                                    <span className="font-medium">
                                      {user.createdAt
                                        ? user.createdAt.toLocaleString(
                                            "ko-KR",
                                            {
                                              year: "numeric",
                                              month: "long",
                                              day: "numeric",
                                              hour: "2-digit",
                                              minute: "2-digit",
                                            }
                                          )
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
                                          e.currentTarget.style.display =
                                            "none";
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
                                          e.currentTarget.style.display =
                                            "none";
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
                                          e.currentTarget.style.display =
                                            "none";
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
                        {selectedReservationDetail.date &&
                        selectedReservationDetail.time
                          ? `${selectedReservationDetail.date} ${selectedReservationDetail.time}`
                          : "시간 미정"}
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
                          {selectedReservationDetail.slotId || "-"}
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
                              ? (() => {
                                  const now = new Date();
                                  const reservationTime = new Date(
                                    selectedReservationDetail.createdAt
                                  );
                                  const timeLimit = new Date(
                                    reservationTime.getTime() + 30 * 60 * 1000
                                  );
                                  return now > timeLimit
                                    ? "destructive"
                                    : "outline";
                                })()
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
                            ? (() => {
                                const now = new Date();
                                const reservationTime = new Date(
                                  selectedReservationDetail.createdAt
                                );
                                const timeLimit = new Date(
                                  reservationTime.getTime() + 30 * 60 * 1000
                                );
                                return now > timeLimit
                                  ? "입금시간만료"
                                  : "입금대기";
                              })()
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
                {/* 예약 정보 */}
                <div className="space-y-4">
                  <div className="space-y-2">
                    <h3 className="text-gray-900 text-base font-semibold sm:text-lg">
                      예약 정보
                    </h3>
                    <div className="grid grid-cols-1 gap-2 text-xs sm:grid-cols-2 sm:gap-4 sm:text-sm">
                      <div>
                        <span className="font-medium">이름:</span>{" "}
                        <span className="break-words">
                          {selectedReservationDetail.userName}
                        </span>
                      </div>
                      <div>
                        <span className="font-medium">이메일:</span>{" "}
                        <span className="break-all">
                          {selectedReservationDetail.userEmail}
                        </span>
                      </div>
                      <div>
                        <span className="font-medium">예약일:</span>{" "}
                        {selectedReservationDetail.date || "미정"}
                      </div>
                      <div>
                        <span className="font-medium">시간:</span>{" "}
                        {selectedReservationDetail.time || "미정"}
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
                              ? (() => {
                                  const now = new Date();
                                  const reservationTime = new Date(
                                    selectedReservationDetail.createdAt
                                  );
                                  const timeLimit = new Date(
                                    reservationTime.getTime() + 30 * 60 * 1000
                                  );
                                  return now > timeLimit
                                    ? "destructive"
                                    : "outline";
                                })()
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
                            ? (() => {
                                const now = new Date();
                                const reservationTime = new Date(
                                  selectedReservationDetail.createdAt
                                );
                                const timeLimit = new Date(
                                  reservationTime.getTime() + 30 * 60 * 1000
                                );
                                return now > timeLimit
                                  ? "입금시간만료"
                                  : "입금대기";
                              })()
                            : selectedReservationDetail.status === "cancelled"
                            ? "취소됨"
                            : selectedReservationDetail.status === "rejected"
                            ? "거절"
                            : "대기"}
                        </Badge>
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

                    {selectedReservationDetail.paymentConfirmedAt && (
                      <div>
                        <span className="font-medium">입금 확인일:</span>
                        <div className="text-gray-600 break-words">
                          {(() => {
                            const paymentConfirmedAt =
                              selectedReservationDetail.paymentConfirmedAt;
                            if (
                              paymentConfirmedAt &&
                              paymentConfirmedAt instanceof Date
                            ) {
                              return paymentConfirmedAt.toLocaleString(
                                "ko-KR",
                                {
                                  year: "numeric",
                                  month: "long",
                                  day: "numeric",
                                  hour: "2-digit",
                                  minute: "2-digit",
                                  second: "2-digit",
                                }
                              );
                            }
                            return "날짜 정보 없음";
                          })()}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
                {/* 입금 대기 시간 정보 */}
                {selectedReservationDetail.status === "payment_required" && (
                  <div className="space-y-2">
                    <h3 className="text-gray-900 font-semibold">
                      입금 대기 정보
                    </h3>
                    <div className="text-sm">
                      <div>
                        <span className="font-medium">입금 마감 시간:</span>
                        <div className="text-gray-600">
                          {(() => {
                            const reservationTime = new Date(
                              selectedReservationDetail.createdAt
                            );
                            const timeLimit = new Date(
                              reservationTime.getTime() + 30 * 60 * 1000
                            );
                            return timeLimit.toLocaleString("ko-KR", {
                              year: "numeric",
                              month: "long",
                              day: "numeric",
                              hour: "2-digit",
                              minute: "2-digit",
                            });
                          })()}
                        </div>
                      </div>
                      <div className="mt-2">
                        <span className="font-medium">남은 시간:</span>
                        <div className="text-gray-600">
                          {(() => {
                            const reservationTime = new Date(
                              selectedReservationDetail.createdAt
                            );
                            const timeLimit = new Date(
                              reservationTime.getTime() + 30 * 60 * 1000
                            );
                            const now = new Date();
                            const remaining =
                              timeLimit.getTime() - now.getTime();

                            if (remaining <= 0) {
                              return "입금 시간이 만료되었습니다.";
                            }

                            return (
                              <CountdownTimer
                                deadline={timeLimit}
                                onExpired={() => {
                                  // 타이머 만료 시 다이얼로그 닫기
                                  setIsReservationDetailDialogOpen(false);
                                  setSelectedReservationDetail(null);
                                }}
                                compact={true}
                                testMode={
                                  process.env.NODE_ENV === "development"
                                }
                              />
                            );
                          })()}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
                {/* 입금 확인중 시간 정보 */}
                {selectedReservationDetail.status === "payment_confirmed" && (
                  <div className="space-y-2">
                    <h3 className="text-gray-900 font-semibold">
                      입금 확인 정보
                    </h3>
                    <div className="text-sm">
                      <div>
                        <span className="font-medium">상태:</span>
                        <div className="text-blue-600 font-medium">
                          ✅ 입금 확인 완료 - 관리자 승인 대기중
                        </div>
                      </div>
                      {selectedReservationDetail.paymentConfirmedAt && (
                        <div className="mt-2">
                          <span className="font-medium">입금 확인일:</span>
                          <div className="text-gray-600">
                            {(() => {
                              const paymentConfirmedAt =
                                selectedReservationDetail.paymentConfirmedAt;
                              if (
                                paymentConfirmedAt &&
                                paymentConfirmedAt instanceof Date
                              ) {
                                return paymentConfirmedAt.toLocaleString(
                                  "ko-KR",
                                  {
                                    year: "numeric",
                                    month: "long",
                                    day: "numeric",
                                    hour: "2-digit",
                                    minute: "2-digit",
                                    second: "2-digit",
                                  }
                                );
                              }
                              return "날짜 정보 없음";
                            })()}
                          </div>
                        </div>
                      )}
                      <div className="mt-2">
                        <span className="font-medium">
                          관리자 승인 마감 시간:
                        </span>
                        <div className="text-gray-600">
                          {(() => {
                            const baseTime = (() => {
                              const paymentConfirmedAt =
                                selectedReservationDetail.paymentConfirmedAt;
                              const createdAt =
                                selectedReservationDetail.createdAt;

                              // paymentConfirmedAt이 Date 객체인지 확인
                              if (
                                paymentConfirmedAt &&
                                paymentConfirmedAt instanceof Date
                              ) {
                                return paymentConfirmedAt;
                              }

                              // createdAt이 Date 객체인지 확인
                              if (createdAt && createdAt instanceof Date) {
                                return createdAt;
                              }

                              // 둘 다 Date 객체가 아니면 현재 시간 사용
                              return new Date();
                            })();

                            const timeLimit = new Date(
                              baseTime.getTime() + 24 * 60 * 60 * 1000
                            ); // 24시간
                            return timeLimit.toLocaleString("ko-KR", {
                              year: "numeric",
                              month: "long",
                              day: "numeric",
                              hour: "2-digit",
                              minute: "2-digit",
                            });
                          })()}
                        </div>
                      </div>
                      <div className="mt-2">
                        <span className="font-medium">남은 시간:</span>
                        <div className="text-gray-600">
                          {(() => {
                            const baseTime = (() => {
                              const paymentConfirmedAt =
                                selectedReservationDetail.paymentConfirmedAt;
                              const createdAt =
                                selectedReservationDetail.createdAt;

                              // paymentConfirmedAt이 Date 객체인지 확인
                              if (
                                paymentConfirmedAt &&
                                paymentConfirmedAt instanceof Date
                              ) {
                                return paymentConfirmedAt;
                              }

                              // createdAt이 Date 객체인지 확인
                              if (createdAt && createdAt instanceof Date) {
                                return createdAt;
                              }

                              // 둘 다 Date 객체가 아니면 현재 시간 사용
                              return new Date();
                            })();

                            const timeLimit = new Date(
                              baseTime.getTime() + 24 * 60 * 60 * 1000
                            ); // 24시간
                            const now = new Date();
                            const remaining =
                              timeLimit.getTime() - now.getTime();

                            if (remaining <= 0) {
                              return "관리자 승인 시간이 만료되었습니다.";
                            }

                            return (
                              <CountdownTimer
                                deadline={timeLimit}
                                onExpired={() => {
                                  // 타이머 만료 시 다이얼로그 닫기
                                  setIsReservationDetailDialogOpen(false);
                                  setSelectedReservationDetail(null);
                                }}
                                compact={true}
                                testMode={
                                  process.env.NODE_ENV === "development"
                                }
                              />
                            );
                          })()}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
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

        {/* Procedure Completion Dialog */}
        <Dialog
          open={showProcedureDialog}
          onOpenChange={setShowProcedureDialog}
        >
          <DialogContent>
            <DialogHeader>
              <DialogTitle>시술 완료 처리</DialogTitle>
              <DialogDescription>
                {selectedReservation?.userName}님의 시술을 완료하고 메모를
                남겨주세요.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <p className="text-gray-600 mb-2 text-sm">
                  📅 예약일: {selectedReservation?.date}{" "}
                  {selectedReservation?.time}
                </p>
                <p className="text-gray-600 text-sm">
                  📧 이메일: {selectedReservation?.userEmail}
                </p>
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium">
                  시술 메모 (필수)
                </label>
                <Textarea
                  value={procedureNote}
                  onChange={(e) => setProcedureNote(e.target.value)}
                  placeholder="시술 내용, 특이사항, 고객 반응 등을 기록해주세요..."
                  rows={4}
                  className="w-full"
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => {
                  setShowProcedureDialog(false);
                  setProcedureNote("");
                  setSelectedReservation(null);
                }}
              >
                취소
              </Button>
              <Button
                onClick={handleProcedureComplete}
                disabled={!procedureNote.trim()}
                className="bg-green-600 hover:bg-green-700"
              >
                시술 완료 처리
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* KYC 오픈 기간 설정 다이얼로그 */}
        <Dialog open={showKycOpenDialog} onOpenChange={setShowKycOpenDialog}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>KYC 오픈 기간 설정</DialogTitle>
              <DialogDescription>
                KYC 신청을 받을 수 있는 기간을 설정합니다.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">시작일시</label>
                <div className="flex gap-2">
                  <input
                    type="date"
                    value={tempKycOpenSettings.startDate}
                    onChange={(e) =>
                      setTempKycOpenSettings((prev) => ({
                        ...prev,
                        startDate: e.target.value,
                      }))
                    }
                    className="border-gray-300 focus:border-blue-500 flex-1 rounded-md border px-3 py-2 text-sm focus:outline-none"
                  />
                  <input
                    type="time"
                    value={tempKycOpenSettings.startTime}
                    onChange={(e) =>
                      setTempKycOpenSettings((prev) => ({
                        ...prev,
                        startTime: e.target.value,
                      }))
                    }
                    className="border-gray-300 focus:border-blue-500 flex-1 rounded-md border px-3 py-2 text-sm focus:outline-none"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">종료일시</label>
                <div className="flex gap-2">
                  <input
                    type="date"
                    value={tempKycOpenSettings.endDate}
                    onChange={(e) =>
                      setTempKycOpenSettings((prev) => ({
                        ...prev,
                        endDate: e.target.value,
                      }))
                    }
                    className="border-gray-300 focus:border-blue-500 flex-1 rounded-md border px-3 py-2 text-sm focus:outline-none"
                  />
                  <input
                    type="time"
                    value={tempKycOpenSettings.endTime}
                    onChange={(e) =>
                      setTempKycOpenSettings((prev) => ({
                        ...prev,
                        endTime: e.target.value,
                      }))
                    }
                    className="border-gray-300 focus:border-blue-500 flex-1 rounded-md border px-3 py-2 text-sm focus:outline-none"
                  />
                </div>
              </div>
              {tempKycOpenSettings.startDate &&
                tempKycOpenSettings.startTime &&
                tempKycOpenSettings.endDate &&
                tempKycOpenSettings.endTime && (
                  <div className="bg-blue-50 text-blue-800 rounded-md p-3 text-sm">
                    <p className="font-medium">미리보기:</p>
                    <p>
                      KYC 신청은 {tempKycOpenSettings.startDate}{" "}
                      {tempKycOpenSettings.startTime}부터{" "}
                      {tempKycOpenSettings.endDate}{" "}
                      {tempKycOpenSettings.endTime}까지 가능합니다.
                    </p>
                  </div>
                )}
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setShowKycOpenDialog(false)}
              >
                취소
              </Button>
              <Button onClick={handleSaveKycOpenSettings}>저장</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* 승인 확인 다이얼로그 */}
        <Dialog
          open={isApproveDialogOpen}
          onOpenChange={setIsApproveDialogOpen}
        >
          <DialogContent>
            <DialogHeader>
              <DialogTitle>KYC 승인 확인</DialogTitle>
              <DialogDescription>
                이 사용자의 KYC를 승인하시겠습니까?
              </DialogDescription>
            </DialogHeader>
            <div className="py-4">
              <p className="text-gray-600 text-sm">
                승인 후에는 사용자가 예약을 진행할 수 있게 됩니다.
              </p>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => {
                  setIsApproveDialogOpen(false);
                  setSelectedApproveUserId(null);
                }}
              >
                취소
              </Button>
              <Button
                onClick={handleApprove}
                className="bg-green-600 hover:bg-green-700"
              >
                승인하기
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* 잔흔 확인 다이얼로그 */}
        <Dialog open={isScarDialogOpen} onOpenChange={setIsScarDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>잔흔 상태 설정</DialogTitle>
              <DialogDescription>
                잔흔 제거가 필요한 사유를 입력해 주세요. 이 내용은 사용자에게
                전달됩니다.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <label className="text-gray-700 block text-sm font-medium">
                  잔흔 사유 *
                </label>
                <Textarea
                  placeholder="예: 기존 반영구 잔흔이 남아있어 제거 후 재신청이 필요합니다."
                  value={scarReason}
                  onChange={(e) => setScarReason(e.target.value)}
                  className="mt-1"
                  rows={4}
                />
              </div>
              <div className="bg-orange-50 border-orange-200 rounded-lg border p-3">
                <p className="text-orange-700 text-sm">
                  <strong>안내:</strong> 잔흔 상태로 설정된 사용자는 잔흔 제거
                  후에만 재신청 할 수 있습니다.
                </p>
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => {
                  setIsScarDialogOpen(false);
                  setSelectedScarUserId(null);
                  setScarReason("");
                }}
              >
                취소
              </Button>
              <Button
                onClick={handleScar}
                disabled={!scarReason.trim()}
                className="bg-orange-600 hover:bg-orange-700"
              >
                잔흔 설정
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
