import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const formData = await request.json();
    
    console.log("=== FORM SUBMISSION TEST ===");
    console.log("Received form data:", formData);
    console.log("Content-Type:", request.headers.get("content-type"));
    
    return NextResponse.json({
      success: true,
      message: "Form data received successfully",
      receivedData: formData,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error("Form submission test error:", error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : "Unknown error"
    }, { status: 500 });
  }
} 