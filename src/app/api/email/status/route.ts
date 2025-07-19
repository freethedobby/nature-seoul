import { NextResponse } from "next/server";
import nodemailer from "nodemailer";

export async function GET() {
  try {
    // Check environment variables
    const emailUser = process.env.EMAIL_USER;
    const emailPass = process.env.EMAIL_PASS;
    const sendGridApiKey = process.env.SENDGRID_API_KEY;
    const sendGridFromEmail = process.env.SENDGRID_FROM_EMAIL;
    
    const status = {
      environmentVariables: {
        EMAIL_USER: emailUser ? "Set" : "Not set",
        EMAIL_PASS: emailPass ? "Set" : "Not set",
        SENDGRID_API_KEY: sendGridApiKey ? "Set" : "Not set",
        SENDGRID_FROM_EMAIL: sendGridFromEmail ? "Set" : "Not set",
      },
      configuration: {
        hasGmail: !!(emailUser && emailPass),
        hasSendGrid: !!(sendGridApiKey && sendGridFromEmail),
        isConfigured: !!(emailUser && emailPass) || !!(sendGridApiKey && sendGridFromEmail),
        preferredService: sendGridApiKey && sendGridFromEmail ? "SendGrid" : "Gmail",
      },
      connection: null as {
        status: string;
        message: string;
        suggestion?: string;
      } | null,
    };

    // Test connection if configured
    if (status.configuration.isConfigured) {
      if (status.configuration.hasSendGrid) {
        // Test SendGrid connection
        try {
          const sgMail = await import('@sendgrid/mail');
          sgMail.default.setApiKey(sendGridApiKey!);
          
          // Test API key by making a simple request
          const response = await fetch('https://api.sendgrid.com/v3/user/profile', {
            headers: {
              'Authorization': `Bearer ${sendGridApiKey}`,
              'Content-Type': 'application/json'
            }
          });
          
          if (response.ok) {
            status.connection = {
              status: "Connected",
              message: "SendGrid API connection successful",
            };
          } else {
            status.connection = {
              status: "Failed",
              message: `SendGrid API error: ${response.status} ${response.statusText}`,
              suggestion: "Check SendGrid API key and account status",
            };
          }
        } catch (error) {
          status.connection = {
            status: "Failed",
            message: error instanceof Error ? error.message : "Unknown error",
            suggestion: "Check SendGrid API key and network connection",
          };
        }
      } else if (status.configuration.hasGmail) {
        // Test Gmail connection
        try {
          const transporter = nodemailer.createTransport({
            service: "gmail",
            auth: {
              user: emailUser,
              pass: emailPass,
            },
          });

          await transporter.verify();
          status.connection = {
            status: "Connected",
            message: "Gmail server connection successful",
          };
        } catch (error) {
          status.connection = {
            status: "Failed",
            message: error instanceof Error ? error.message : "Unknown error",
            suggestion: "Check Gmail app password and 2FA settings",
          };
        }
      }
    } else {
      status.connection = {
        status: "Not configured",
        message: "No email service configured",
        suggestion: "Set either Gmail credentials (EMAIL_USER, EMAIL_PASS) or SendGrid credentials (SENDGRID_API_KEY, SENDGRID_FROM_EMAIL)",
      };
    }

    return NextResponse.json(status, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      { 
        error: "Failed to check email status", 
        details: error instanceof Error ? error.message : "Unknown error" 
      },
      { status: 500 }
    );
  }
} 