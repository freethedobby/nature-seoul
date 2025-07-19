import { NextRequest, NextResponse } from "next/server";
import nodemailer from "nodemailer";

export async function GET() {
  try {
    // Check environment variables
    const emailUser = process.env.EMAIL_USER;
    const emailPass = process.env.EMAIL_PASS;
    
    const status = {
      environmentVariables: {
        EMAIL_USER: emailUser ? "Set" : "Not set",
        EMAIL_PASS: emailPass ? "Set" : "Not set",
      },
      configuration: {
        hasEmailUser: !!emailUser,
        hasEmailPass: !!emailPass,
        isConfigured: !!(emailUser && emailPass),
      },
      connection: null as {
        status: string;
        message: string;
        suggestion?: string;
      } | null,
    };

    // Test connection if configured
    if (status.configuration.isConfigured) {
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
          message: "Email server connection successful",
        };
      } catch (error) {
        status.connection = {
          status: "Failed",
          message: error instanceof Error ? error.message : "Unknown error",
          suggestion: "Check Gmail app password and 2FA settings",
        };
      }
    } else {
      status.connection = {
        status: "Not configured",
        message: "Email environment variables are not set",
        suggestion: "Set EMAIL_USER and EMAIL_PASS in Vercel environment variables",
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