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
    const { to, subject, html, userName, statusType, newStatus, rejectReason, reservationInfo } = await request.json();

    // Validate required fields
    if (!to || !subject || !html) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Email template based on status type
    let emailSubject = subject;
    let emailHtml = html;

    if (statusType === "kyc") {
      emailSubject = `[네이처서울] KYC 상태 변경 안내`;
      emailHtml = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
            <h1 style="margin: 0; font-size: 24px;">네이처서울</h1>
            <p style="margin: 10px 0 0 0; opacity: 0.9;">KYC 상태 변경 안내</p>
          </div>
          
          <div style="background: white; padding: 30px; border: 1px solid #e1e5e9; border-radius: 0 0 10px 10px;">
            <p style="font-size: 16px; color: #333; margin-bottom: 20px;">
              안녕하세요, <strong>${userName}</strong>님
            </p>
            
            <p style="font-size: 16px; color: #333; margin-bottom: 20px;">
              귀하의 KYC(고객확인) 상태가 변경되었습니다.
            </p>
            
            <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <h3 style="margin: 0 0 10px 0; color: #333;">현재 상태</h3>
              <div style="display: inline-block; padding: 8px 16px; border-radius: 20px; font-weight: bold; ${
                newStatus === "approved" 
                  ? "background: #d4edda; color: #155724;" 
                  : newStatus === "rejected"
                  ? "background: #f8d7da; color: #721c24;"
                  : "background: #fff3cd; color: #856404;"
              }">
                ${
                  newStatus === "approved" 
                    ? "✅ 승인됨" 
                    : newStatus === "rejected"
                    ? "❌ 거부됨"
                    : "⏳ 대기중"
                }
              </div>
            </div>
            
            ${
              newStatus === "approved" 
                ? `
                <div style="background: #d4edda; border: 1px solid #c3e6cb; padding: 15px; border-radius: 8px; margin: 20px 0;">
                  <h4 style="margin: 0 0 10px 0; color: #155724;">🎉 축하합니다!</h4>
                  <p style="margin: 0; color: #155724;">
                    KYC가 승인되었습니다. 이제 예약 서비스를 이용하실 수 있습니다.
                  </p>
                </div>
                `
                : newStatus === "rejected"
                ? `
                <div style="background: #f8d7da; border: 1px solid #f5c6cb; padding: 15px; border-radius: 8px; margin: 20px 0;">
                  <h4 style="margin: 0 0 10px 0; color: #721c24;">⚠️ 안내사항</h4>
                  <p style="margin: 0; color: #721c24;">
                    KYC가 거부되었습니다. 추가 정보가 필요하거나 문의사항이 있으시면 연락주세요.
                  </p>
                  ${rejectReason ? `
                  <div style="margin-top: 15px; padding: 10px; background: rgba(255,255,255,0.5); border-radius: 5px;">
                    <h5 style="margin: 0 0 8px 0; color: #721c24; font-size: 14px;">📝 거부 사유</h5>
                    <p style="margin: 0; color: #721c24; font-size: 14px; line-height: 1.4;">${rejectReason}</p>
                  </div>
                  ` : ''}
                </div>
                `
                : `
                <div style="background: #fff3cd; border: 1px solid #ffeaa7; padding: 15px; border-radius: 8px; margin: 20px 0;">
                  <h4 style="margin: 0 0 10px 0; color: #856404;">⏳ 처리 중</h4>
                  <p style="margin: 0; color: #856404;">
                    KYC 검토가 진행 중입니다. 검토 완료 시 다시 안내드리겠습니다.
                  </p>
                </div>
                `
            }
            
            <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e1e5e9;">
              <p style="font-size: 14px; color: #666; margin-bottom: 10px;">
                문의사항이 있으시면 언제든 연락주세요.
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
    } else if (statusType === "reservation") {
      emailSubject = `[네이처서울] 예약 상태 변경 안내`;
      emailHtml = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
            <h1 style="margin: 0; font-size: 24px;">네이처서울</h1>
            <p style="margin: 10px 0 0 0; opacity: 0.9;">예약 상태 변경 안내</p>
          </div>
          
          <div style="background: white; padding: 30px; border: 1px solid #e1e5e9; border-radius: 0 0 10px 10px;">
            <p style="font-size: 16px; color: #333; margin-bottom: 20px;">
              안녕하세요, <strong>${userName}</strong>님
            </p>
            
            <p style="font-size: 16px; color: #333; margin-bottom: 20px;">
              귀하의 예약 상태가 변경되었습니다.
            </p>
            
            <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <h3 style="margin: 0 0 10px 0; color: #333;">현재 상태</h3>
              <div style="display: inline-block; padding: 8px 16px; border-radius: 20px; font-weight: bold; ${
                newStatus === "scheduled" 
                  ? "background: #cce5ff; color: #004085;" 
                  : newStatus === "completed"
                  ? "background: #d4edda; color: #155724;"
                  : newStatus === "cancelled"
                  ? "background: #f8d7da; color: #721c24;"
                  : "background: #e2e3e5; color: #383d41;"
              }">
                ${
                  newStatus === "scheduled" 
                    ? "📅 예약됨" 
                    : newStatus === "completed"
                    ? "✅ 완료됨"
                    : newStatus === "cancelled"
                    ? "❌ 취소됨"
                    : "📋 예약 없음"
                }
              </div>
            </div>
            
            ${
              newStatus === "scheduled" 
                ? `
                <div style="background: #cce5ff; border: 1px solid #b3d7ff; padding: 15px; border-radius: 8px; margin: 20px 0;">
                  <h4 style="margin: 0 0 10px 0; color: #004085;">📅 예약이 확정되었습니다!</h4>
                  <p style="margin: 0; color: #004085;">
                    예약이 성공적으로 확정되었습니다. 예약 시간에 맞춰 방문해 주세요.
                  </p>
                  ${reservationInfo ? `
                  <div style="margin-top: 15px; padding: 10px; background: rgba(255,255,255,0.5); border-radius: 5px;">
                    <h5 style="margin: 0 0 8px 0; color: #004085; font-size: 14px;">📋 예약 정보</h5>
                    <p style="margin: 0; color: #004085; font-size: 14px; line-height: 1.4;">
                      📅 날짜: ${reservationInfo.date}<br>
                      🕐 시간: ${reservationInfo.time}
                    </p>
                  </div>
                  ` : ''}
                </div>
                `
                : newStatus === "completed"
                ? `
                <div style="background: #d4edda; border: 1px solid #c3e6cb; padding: 15px; border-radius: 8px; margin: 20px 0;">
                  <h4 style="margin: 0 0 10px 0; color: #155724;">✅ 시술이 완료되었습니다!</h4>
                  <p style="margin: 0; color: #155724;">
                    시술이 성공적으로 완료되었습니다. 감사합니다!
                  </p>
                </div>
                `
                : newStatus === "cancelled"
                ? `
                <div style="background: #f8d7da; border: 1px solid #f5c6cb; padding: 15px; border-radius: 8px; margin: 20px 0;">
                  <h4 style="margin: 0 0 10px 0; color: #721c24;">❌ 예약이 취소되었습니다</h4>
                  <p style="margin: 0; color: #721c24;">
                    예약이 취소되었습니다. 새로운 예약을 원하시면 다시 예약해 주세요.
                  </p>
                </div>
                `
                : `
                <div style="background: #e2e3e5; border: 1px solid #d6d8db; padding: 15px; border-radius: 8px; margin: 20px 0;">
                  <h4 style="margin: 0 0 10px 0; color: #383d41;">📋 예약 정보</h4>
                  <p style="margin: 0; color: #383d41;">
                    현재 예약이 없습니다. 새로운 예약을 원하시면 예약 페이지를 방문해 주세요.
                  </p>
                </div>
                `
            }
            
            <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e1e5e9;">
              <p style="font-size: 14px; color: #666; margin-bottom: 10px;">
                문의사항이 있으시면 언제든 연락주세요.
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
      { message: "Email sent successfully" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error sending email:", error);
    return NextResponse.json(
      { error: "Failed to send email" },
      { status: 500 }
    );
  }
} 