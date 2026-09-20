import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { SignJWT } from "jose";
import { pool } from "@/lib/db/db";

const authSecret = process.env.AUTH_SECRET;

if (!authSecret) {
  throw new Error("AUTH_SECRET is not defined");
}

const secretKey = new TextEncoder().encode(authSecret);

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const username = body.username?.trim();
    const password = body.password;

    if (!username || !password) {
      return NextResponse.json(
        {
          success: false,
          message: "Username and password are required",
        },
        { status: 400 }
      );
    }

    const result = await pool.query(
      `
      SELECT
        u.id,
        u.username,
        u.password_hash,
        u.full_name,
        u.email,
        u.status,
        r.role_name
      FROM users u
      INNER JOIN roles r
        ON r.id = u.role_id
      WHERE u.username = $1
      LIMIT 1
      `,
      [username]
    );

    if (result.rows.length === 0) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid username or password",
        },
        { status: 401 }
      );
    }

    const user = result.rows[0];

    if (!user.status) {
      return NextResponse.json(
        {
          success: false,
          message: "User account is inactive",
        },
        { status: 403 }
      );
    }

    const passwordValid = await bcrypt.compare(
      password,
      user.password_hash
    );

    if (!passwordValid) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid username or password",
        },
        { status: 401 }
      );
    }

    const token = await new SignJWT({
      userId: user.id,
      username: user.username,
      role: user.role_name,
      fullName: user.full_name,
    })
      .setProtectedHeader({ alg: "HS256" })
      .setIssuedAt()
      .setExpirationTime("8h")
      .sign(secretKey);

    await pool.query(
      `
      UPDATE users
      SET last_login_at = CURRENT_TIMESTAMP,
          updated_at = CURRENT_TIMESTAMP
      WHERE id = $1
      `,
      [user.id]
    );

    const response = NextResponse.json({
      success: true,
      message: "Login successful",
      user: {
        id: user.id,
        username: user.username,
        fullName: user.full_name,
        email: user.email,
        role: user.role_name,
      },
    });

    response.cookies.set("auth_token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 8,
      path: "/",
    });

    return response;
  } catch (error) {
    console.error("Login error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Internal server error",
      },
      { status: 500 }
    );
  }
}