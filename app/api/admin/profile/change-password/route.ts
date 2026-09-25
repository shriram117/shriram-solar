import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { pool } from "@/lib/db/db";
import { requireAuth } from "@/lib/auth/require-auth";

export async function POST(request: NextRequest) {
  try {
    // Check login
    const { user, response } = await requireAuth();

    if (response) {
      return response;
    }

    // Content-Type validation
    const contentType = request.headers.get("content-type") || "";

    if (!contentType.toLowerCase().includes("application/json")) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid request format.",
        },
        { status: 415 }
      );
    }

    const body = await request.json();

    if (!body || typeof body !== "object") {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid request data.",
        },
        { status: 400 }
      );
    }

    const currentPassword =
      typeof body.currentPassword === "string"
        ? body.currentPassword
        : "";

    const newPassword =
      typeof body.newPassword === "string"
        ? body.newPassword
        : "";

    const confirmPassword =
      typeof body.confirmPassword === "string"
        ? body.confirmPassword
        : "";

    // Required validation
    if (!currentPassword || !newPassword || !confirmPassword) {
      return NextResponse.json(
        {
          success: false,
          message: "All password fields are required.",
        },
        { status: 400 }
      );
    }

    // Password length validation
    if (newPassword.length < 8) {
      return NextResponse.json(
        {
          success: false,
          message: "New password must be at least 8 characters long.",
        },
        { status: 400 }
      );
    }

    if (newPassword.length > 200) {
      return NextResponse.json(
        {
          success: false,
          message: "New password is too long.",
        },
        { status: 400 }
      );
    }

    // Confirm password
    if (newPassword !== confirmPassword) {
      return NextResponse.json(
        {
          success: false,
          message: "New password and confirm password do not match.",
        },
        { status: 400 }
      );
    }

    // Prevent same password
    if (currentPassword === newPassword) {
      return NextResponse.json(
        {
          success: false,
          message:
            "New password must be different from your current password.",
        },
        { status: 400 }
      );
    }

    // Get current password hash
    const result = await pool.query(
      `
      SELECT id, password_hash
      FROM users
      WHERE id = $1
      LIMIT 1
      `,
      [user!.userId]
    );

    if (result.rows.length === 0) {
      return NextResponse.json(
        {
          success: false,
          message: "User account not found.",
        },
        { status: 404 }
      );
    }

    const dbUser = result.rows[0];

    // Verify current password
    const currentPasswordValid = await bcrypt.compare(
      currentPassword,
      dbUser.password_hash
    );

    if (!currentPasswordValid) {
      return NextResponse.json(
        {
          success: false,
          message: "Current password is incorrect.",
        },
        { status: 401 }
      );
    }

    // Hash new password
    const newPasswordHash = await bcrypt.hash(newPassword, 12);

    // Update password
    await pool.query(
      `
      UPDATE users
      SET
        password_hash = $1,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $2
      `,
      [newPasswordHash, user!.userId]
    );

    return NextResponse.json(
      {
        success: true,
        message: "Password changed successfully.",
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Change password error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Unable to change password. Please try again.",
      },
      { status: 500 }
    );
  }
}