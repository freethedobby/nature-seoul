import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/firebase";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";

export async function POST(request: NextRequest) {
  try {
    const { email, name, contact } = await request.json();

    // Create a test KYC submission
    const testUserId = `test-${Date.now()}`;
    const testData = {
      userId: testUserId,
      email: email || "test@example.com",
      name: name || "Test User",
      contact: contact || "010-1234-5678",
      photoURL: "data:image/jpeg;base64,test",
      photoType: "base64",
      kycStatus: "pending",
      hasPreviousTreatment: false,
      createdAt: serverTimestamp(),
      submittedAt: serverTimestamp(),
      isTestSubmission: true,
    };

    console.log("Creating test KYC submission:", testData);

    // Save to Firestore
    await setDoc(doc(db, "users", testUserId), testData);

    return NextResponse.json({
      success: true,
      message: "Test KYC submission created successfully",
      userId: testUserId,
      data: testData
    });

  } catch (error) {
    console.error("Test KYC submission error:", error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : "Unknown error"
    }, { status: 500 });
  }
} 