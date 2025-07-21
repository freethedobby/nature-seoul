import { db } from "@/lib/firebase";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";

export interface CreateNotificationParams {
  userId: string;
  type: "kyc_submitted" | "kyc_approved" | "kyc_rejected" | "reservation_created" | "reservation_cancelled" | "admin_kyc_new" | "admin_reservation_new" | "admin_reservation_cancelled" | "payment_required" | "payment_confirmed" | "reservation_approved" | "reservation_rejected";
  title: string;
  message: string;
  data?: Record<string, unknown>;
}

export async function createNotification(params: CreateNotificationParams) {
  console.log("🔔 Creating notification with params:", params);
  try {
    const notificationData = {
      userId: params.userId,
      type: params.type,
      title: params.title,
      message: params.message,
      data: params.data || null,
      read: false,
      createdAt: serverTimestamp(),
    };
    console.log("📝 Notification data to save:", notificationData);
    
    const docRef = await addDoc(collection(db, "notifications"), notificationData);
    console.log("✅ Notification created successfully with ID:", docRef.id);
  } catch (error) {
    console.error("❌ Error creating notification:", error);
    throw error; // Re-throw to allow caller to handle
  }
}

// Predefined notification templates
export const notificationTemplates = {
  kycSubmitted: (userName: string) => ({
    title: "KYC 신청 완료",
    message: `${userName}님이 KYC 신청을 완료했습니다. 검토 후 승인/반려를 진행해주세요.`,
  }),
  
  kycApproved: (userName: string) => ({
    title: "KYC 승인 완료",
    message: `${userName}님의 KYC가 승인되었습니다. 이제 모든 서비스를 이용하실 수 있습니다.`,
  }),
  
  kycRejected: (userName: string, reason?: string) => ({
    title: "KYC 반려 안내",
    message: `${userName}님의 KYC가 반려되었습니다.${reason ? ` 사유: ${reason}` : ""} 재신청을 원하시면 문의해주세요.`,
  }),
  
  adminKycNew: (userName: string, userEmail: string) => ({
    title: "새로운 KYC 신청",
    message: `${userName}(${userEmail})님이 새로운 KYC를 신청했습니다.`,
  }),
  
  reservationCreated: (userName: string, date: string, time: string) => ({
    title: "예약 완료",
    message: `${userName}님의 ${date} ${time} 예약이 완료되었습니다.`,
  }),
  
  reservationCancelled: (userName: string, date: string, time: string) => ({
    title: "예약 취소",
    message: `${userName}님의 ${date} ${time} 예약이 취소되었습니다.`,
  }),
}; 