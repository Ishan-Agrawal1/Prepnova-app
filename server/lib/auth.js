import { betterAuth } from "better-auth";
import { mongodbAdapter } from "better-auth/adapters/mongodb";
import { expo } from "@better-auth/expo";
import { MongoClient } from "mongodb";
import nodemailer from "nodemailer";

// ─── MongoDB Client (raw driver, separate from Mongoose) ───
const mongoClient = new MongoClient(process.env.MONGODB_URI);
const db = mongoClient.db(); // uses the DB name from the connection string

// ─── Nodemailer Transporter ───
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || "smtp.gmail.com",
  port: parseInt(process.env.SMTP_PORT || "587"),
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

// ─── Better Auth Instance ───
export const auth = betterAuth({
  baseURL: process.env.BETTER_AUTH_URL || "http://localhost:3001",
  secret: process.env.BETTER_AUTH_SECRET,

  database: mongodbAdapter(db),

  emailAndPassword: {
    enabled: true,
    // Password reset email handler
    sendResetPassword: async ({ user, url }) => {
      try {
        await transporter.sendMail({
          from: process.env.SMTP_FROM || '"PrepNova" <noreply@prepnova.com>',
          to: user.email,
          subject: "Reset Your PrepNova Password",
          html: `
            <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #0a0a1a; color: #e0e0e0; border-radius: 16px; overflow: hidden;">
              <div style="background: linear-gradient(135deg, #6366f1, #8b5cf6); padding: 32px; text-align: center;">
                <h1 style="margin: 0; color: #ffffff; font-size: 28px;">PrepNova</h1>
                <p style="color: rgba(255,255,255,0.85); margin-top: 8px;">Password Reset Request</p>
              </div>
              <div style="padding: 32px;">
                <p style="font-size: 16px; line-height: 1.6;">Hi <strong>${user.name || "there"}</strong>,</p>
                <p style="font-size: 16px; line-height: 1.6;">We received a request to reset your password. Click the button below to set a new password:</p>
                <div style="text-align: center; margin: 32px 0;">
                  <a href="${url}" style="background: linear-gradient(135deg, #6366f1, #8b5cf6); color: #ffffff; padding: 14px 32px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 16px; display: inline-block;">Reset Password</a>
                </div>
                <p style="font-size: 14px; color: #888;">This link will expire in 1 hour. If you didn't request this, you can safely ignore this email.</p>
              </div>
              <div style="padding: 16px 32px; background: rgba(255,255,255,0.03); text-align: center; font-size: 12px; color: #666;">
                © ${new Date().getFullYear()} PrepNova — AI Interview Preparation Platform
              </div>
            </div>
          `,
        });
        console.log(`Password reset email sent to ${user.email}`);
      } catch (error) {
        console.error("Failed to send password reset email:", error);
      }
    },
  },

  socialProviders: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    },
  },

  user: {
    additionalFields: {
      role: {
        type: "string",
        required: false,
        defaultValue: "Student",
        input: true,
      },
    },
  },

  trustedOrigins: [
    "http://localhost:5173",
    "http://localhost:3001",
    "http://localhost:8081",
    "http://localhost:19006",
    "http://192.168.1.5:8081",
    "http://192.168.1.5:3001",
    "exp://192.168.1.5:8081",
    "https://prepnova-app.onrender.com",
    "prepnova://",
  ],

  plugins: [
    expo(),
  ],

  advanced: {
    disableCSRFCheck: true,
    cookieOptions: {
      sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
      secure: process.env.NODE_ENV === "production",
    },
  },
});
