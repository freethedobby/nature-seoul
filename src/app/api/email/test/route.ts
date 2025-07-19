import { NextRequest, NextResponse } from "next/server";
import nodemailer from "nodemailer";

export async function POST(request: NextRequest) {
  try {
    const { to, testType } = await request.json();

    // Check if SendGrid is configured
    const sendGridApiKey = process.env.SENDGRID_API_KEY;
    const sendGridFromEmail = process.env.SENDGRID_FROM_EMAIL;

    if (sendGridApiKey && sendGridFromEmail) {
      // Use SendGrid
      return await sendWithSendGrid(to, testType, sendGridApiKey, sendGridFromEmail);
    } else {
      // Fallback to Gmail
      return await sendWithGmail(to, testType);
    }
  } catch (error) {
    console.error("Email test error:", error);
    return NextResponse.json(
      { error: "Failed to send test email" },
      { status: 500 }
    );
  }
}

async function sendWithSendGrid(to: string, testType: string, apiKey: string, fromEmail: string) {
  try {
    const sgMail = await import('@sendgrid/mail');
    sgMail.default.setApiKey(apiKey);

    const { subject, text, html } = getEmailContent(testType);

    const msg = {
      to,
      from: fromEmail,
      subject,
      text,
      html,
    };

    await sgMail.default.send(msg);

    return NextResponse.json(
      { message: "Test email sent successfully via SendGrid" },
      { status: 200 }
    );
  } catch (error) {
    console.error("SendGrid error:", error);
    return NextResponse.json(
      { error: `SendGrid error: ${error instanceof Error ? error.message : "Unknown error"}` },
      { status: 500 }
    );
  }
}

async function sendWithGmail(to: string, testType: string) {
  try {
    const emailUser = process.env.EMAIL_USER;
    const emailPass = process.env.EMAIL_PASS;

    if (!emailUser || !emailPass) {
      return NextResponse.json(
        { error: "Gmail credentials not configured" },
        { status: 500 }
      );
    }

    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: emailUser,
        pass: emailPass,
      },
    });

    const { subject, text, html } = getEmailContent(testType);

    await transporter.sendMail({
      from: emailUser,
      to,
      subject,
      text,
      html,
    });

    return NextResponse.json(
      { message: "Test email sent successfully via Gmail" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Gmail error:", error);
    return NextResponse.json(
      { error: `Gmail error: ${error instanceof Error ? error.message : "Unknown error"}` },
      { status: 500 }
    );
  }
}

function getEmailContent(testType: string) {
  if (testType === "kyc") {
    return {
      subject: "🎉 KYC 승인 완료 - Nature Seoul",
      text: `안녕하세요!

축하합니다! 귀하의 KYC(고객확인)가 성공적으로 승인되었습니다.

이제 Nature Seoul의 모든 서비스를 이용하실 수 있습니다.

감사합니다.
Nature Seoul 팀`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #28a745;">🎉 KYC 승인 완료</h2>
          <p>안녕하세요!</p>
          <p>축하합니다! 귀하의 KYC(고객확인)가 성공적으로 승인되었습니다.</p>
          <p>이제 Nature Seoul의 모든 서비스를 이용하실 수 있습니다.</p>
          <hr style="margin: 20px 0;">
          <p style="color: #666;">감사합니다.<br>Nature Seoul 팀</p>
        </div>
      `,
    };
  } else {
    return {
      subject: "❌ KYC 반려 안내 - Nature Seoul",
      text: `안녕하세요!

죄송합니다. 귀하의 KYC(고객확인) 신청이 반려되었습니다.

반려 사유: 제출된 서류가 불완전하거나 명확하지 않습니다.

재신청을 원하시면 다음 사항을 확인해 주세요:
- 모든 필수 서류가 첨부되었는지 확인
- 서류가 명확하고 읽기 쉬운지 확인
- 최신 서류인지 확인

문의사항이 있으시면 언제든 연락주세요.

감사합니다.
Nature Seoul 팀`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #dc3545;">❌ KYC 반려 안내</h2>
          <p>안녕하세요!</p>
          <p>죄송합니다. 귀하의 KYC(고객확인) 신청이 반려되었습니다.</p>
          <p><strong>반려 사유:</strong> 제출된 서류가 불완전하거나 명확하지 않습니다.</p>
          <p><strong>재신청을 원하시면 다음 사항을 확인해 주세요:</strong></p>
          <ul>
            <li>모든 필수 서류가 첨부되었는지 확인</li>
            <li>서류가 명확하고 읽기 쉬운지 확인</li>
            <li>최신 서류인지 확인</li>
          </ul>
          <p>문의사항이 있으시면 언제든 연락주세요.</p>
          <hr style="margin: 20px 0;">
          <p style="color: #666;">감사합니다.<br>Nature Seoul 팀</p>
        </div>
      `,
    };
  }
} 