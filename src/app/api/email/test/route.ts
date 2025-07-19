import { NextRequest, NextResponse } from "next/server";
import nodemailer from "nodemailer";

// Email transporter configuration
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

export async function POST(request: NextRequest) {
  try {
    const { to, testType = "kyc" } = await request.json();

    if (!to) {
      return NextResponse.json(
        { error: "Email address required" },
        { status: 400 }
      );
    }

    // Test email templates
    let emailSubject = "";
    let emailHtml = "";

    if (testType === "kyc") {
      emailSubject = `[테스트] 네이처서울 KYC 승인 안내`;
      emailHtml = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
            <h1 style="margin: 0; font-size: 24px;">네이처서울</h1>
            <p style="margin: 10px 0 0 0; opacity: 0.9;">KYC 승인 안내 (테스트)</p>
          </div>
          
          <div style="background: white; padding: 30px; border: 1px solid #e1e5e9; border-radius: 0 0 10px 10px;">
            <p style="font-size: 16px; color: #333; margin-bottom: 20px;">
              안녕하세요, <strong>테스트 사용자</strong>님
            </p>
            
            <p style="font-size: 16px; color: #333; margin-bottom: 20px;">
              이는 <strong>테스트 이메일</strong>입니다.
            </p>
            
            <div style="background: #d4edda; border: 1px solid #c3e6cb; padding: 15px; border-radius: 8px; margin: 20px 0;">
              <h4 style="margin: 0 0 10px 0; color: #155724;">🎉 테스트 성공!</h4>
              <p style="margin: 0; color: #155724;">
                이메일 시스템이 정상적으로 작동하고 있습니다.
              </p>
            </div>
            
            <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <h3 style="margin: 0 0 10px 0; color: #333;">테스트 정보</h3>
              <p style="margin: 0; color: #333;">
                📧 받는 사람: ${to}<br>
                🕐 전송 시간: ${new Date().toLocaleString('ko-KR')}<br>
                🔧 테스트 타입: KYC 승인
              </p>
            </div>
            
            <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e1e5e9;">
              <p style="font-size: 14px; color: #666; margin-bottom: 10px;">
                이 이메일은 테스트 목적으로 전송되었습니다.
              </p>
              <p style="font-size: 14px; color: #666; margin: 0;">
                📧 이메일: info@natureseoul.com<br>
                📞 전화: 02-1234-5678
              </p>
            </div>
          </div>
          
          <div style="text-align: center; margin-top: 20px; color: #666; font-size: 12px;">
            © 2024 네이처서울. All rights reserved.
          </div>
        </div>
      `;
    } else if (testType === "rejection") {
      emailSubject = `[테스트] 네이처서울 KYC 반려 안내`;
      emailHtml = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
            <h1 style="margin: 0; font-size: 24px;">네이처서울</h1>
            <p style="margin: 10px 0 0 0; opacity: 0.9;">KYC 반려 안내 (테스트)</p>
          </div>
          
          <div style="background: white; padding: 30px; border: 1px solid #e1e5e9; border-radius: 0 0 10px 10px;">
            <p style="font-size: 16px; color: #333; margin-bottom: 20px;">
              안녕하세요, <strong>테스트 사용자</strong>님
            </p>
            
            <p style="font-size: 16px; color: #333; margin-bottom: 20px;">
              이는 <strong>테스트 이메일</strong>입니다.
            </p>
            
            <div style="background: #f8d7da; border: 1px solid #f5c6cb; padding: 15px; border-radius: 8px; margin: 20px 0;">
              <h4 style="margin: 0 0 10px 0; color: #721c24;">⚠️ 테스트 - 반려 안내</h4>
              <p style="margin: 0; color: #721c24;">
                이는 반려 이메일 템플릿 테스트입니다.
              </p>
              <div style="margin-top: 15px; padding: 10px; background: rgba(255,255,255,0.5); border-radius: 5px;">
                <h5 style="margin: 0 0 8px 0; color: #721c24; font-size: 14px;">📝 테스트 반려 사유</h5>
                <p style="margin: 0; color: #721c24; font-size: 14px; line-height: 1.4;">이것은 테스트용 반려 사유입니다.</p>
              </div>
            </div>
            
            <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <h3 style="margin: 0 0 10px 0; color: #333;">테스트 정보</h3>
              <p style="margin: 0; color: #333;">
                📧 받는 사람: ${to}<br>
                🕐 전송 시간: ${new Date().toLocaleString('ko-KR')}<br>
                🔧 테스트 타입: KYC 반려
              </p>
            </div>
            
            <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e1e5e9;">
              <p style="font-size: 14px; color: #666; margin-bottom: 10px;">
                이 이메일은 테스트 목적으로 전송되었습니다.
              </p>
              <p style="font-size: 14px; color: #666; margin: 0;">
                📧 이메일: info@natureseoul.com<br>
                📞 전화: 02-1234-5678
              </p>
            </div>
          </div>
          
          <div style="text-align: center; margin-top: 20px; color: #666; font-size: 12px;">
            © 2024 네이처서울. All rights reserved.
          </div>
        </div>
      `;
    }

    // Send email
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: to,
      subject: emailSubject,
      html: emailHtml,
    };

    await transporter.sendMail(mailOptions);

    return NextResponse.json(
      { message: "Test email sent successfully", to, testType },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error sending test email:", error);
    return NextResponse.json(
      { error: "Failed to send test email", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
} 