import { createNotification, notificationTemplates } from "./notifications";

// Test function to create sample notifications
export async function createTestNotifications(userId: string, isAdmin: boolean = false) {
  try {
    if (isAdmin) {
      // Create admin notifications
      await createNotification({
        userId: "admin",
        type: "admin_kyc_new",
        title: "새로운 KYC 신청",
        message: "test@example.com님이 새로운 KYC를 신청했습니다.",
      });

      await createNotification({
        userId: "admin",
        type: "admin_kyc_new",
        title: "KYC 승인 요청",
        message: "새로운 고객의 KYC 검토가 필요합니다.",
      });
    } else {
      // Create user notifications
      await createNotification({
        userId: userId,
        type: "kyc_submitted",
        title: "KYC 신청 완료",
        message: "KYC 신청이 완료되었습니다. 검토 후 결과를 알려드리겠습니다.",
      });

      await createNotification({
        userId: userId,
        type: "kyc_approved",
        title: "KYC 승인 완료",
        message: "KYC가 승인되었습니다. 이제 예약을 진행하실 수 있습니다.",
      });

      await createNotification({
        userId: userId,
        type: "reservation_created",
        title: "예약 완료",
        message: "2024년 1월 15일 오후 2시 예약이 완료되었습니다.",
      });
    }

    console.log("Test notifications created successfully!");
  } catch (error) {
    console.error("Error creating test notifications:", error);
  }
}

// Function to clear all notifications (for testing)
export async function clearAllNotifications() {
  try {
    const { db } = await import("./firebase");
    const { collection, getDocs, deleteDoc } = await import("firebase/firestore");
    
    const querySnapshot = await getDocs(collection(db, "notifications"));
    const deletePromises = querySnapshot.docs.map(doc => deleteDoc(doc.ref));
    await Promise.all(deletePromises);
    
    console.log("All notifications cleared successfully!");
  } catch (error) {
    console.error("Error clearing notifications:", error);
  }
} 