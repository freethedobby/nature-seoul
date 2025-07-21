import { NextRequest, NextResponse } from "next/server";
import { createNotification, notificationTemplates } from "@/lib/notifications";

export async function POST(request: NextRequest) {
  try {
    const { userId, userName } = await request.json();

    if (!userId) {
      return NextResponse.json(
        { error: "userId is required" },
        { status: 400 }
      );
    }

    console.log("🧪 Creating test KYC rejection notification for userId:", userId);

    const notification = notificationTemplates.kycRejected(
      userName || "Test User",
      "테스트 반려 사유입니다."
    );

    await createNotification({
      userId: userId,
      type: "kyc_rejected",
      title: notification.title,
      message: notification.message,
      data: {
        rejectReason: "테스트 반려 사유입니다.",
        rejectedAt: new Date(),
      },
    });

    return NextResponse.json({
      success: true,
      message: "Test KYC rejection notification created successfully",
      userId: userId,
      notification: notification
    });

  } catch (error) {
    console.error("Test notification error:", error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : "Unknown error"
    }, { status: 500 });
  }
} 