import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { SignJWT } from "jose";
import { pool } from "@/lib/db/db";

const authSecret = process.env.AUTH_SECRET;

if (!authSecret) {
  throw new Error("AUTH_SECRET is not defined");
}

const secretKey = new TextEncoder().encode(authSecret);

const RATE_LIMIT_WINDOW_MS = 10 * 60 * 1000;
const RATE_LIMIT_MAX_ATTEMPTS = 10;

type LoginAttempt = {
  count: number;
  resetAt: number;
};

const loginAttempts = new Map<string, LoginAttempt>();

function getClientIp(request: NextRequest) {
  const forwardedFor = request.headers.get("x-forwarded-for");

  if (forwardedFor) {
    return forwardedFor.split(",")[0].trim();
  }

  return request.headers.get("x-real-ip") || "unknown";
}

function cleanupLoginAttempts(now: number) {
  for (const [key, value] of loginAttempts.entries()) {
    if (value.resetAt <= now) {
      loginAttempts.delete(key);
    }
  }
}

function isLoginRateLimited(ip: string) {
  const now = Date.now();

  cleanupLoginAttempts(now);

  const existing = loginAttempts.get(ip);

  if (!existing || existing.resetAt <= now) {
    loginAttempts.set(ip, {
      count: 1,
      resetAt: now + RATE_LIMIT_WINDOW_MS,
    });

    return false;
  }

  if (existing.count >= RATE_LIMIT_MAX_ATTEMPTS) {
    return true;
  }

  existing.count += 1;

  return false;
}

export async function POST(request: NextRequest) {
  try {
    // ---------------------------------------------------------
    // 1. CONTENT TYPE
    // ---------------------------------------------------------

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

    // ---------------------------------------------------------
    // 2. RATE LIMIT
    // ---------------------------------------------------------

    const clientIp = getClientIp(request);

    if (isLoginRateLimited(clientIp)) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Too many login attempts. Please try again later.",
        },
        {
          status: 429,
          headers: {
            "Retry-After": "600",
          },
        }
      );
    }

    // ---------------------------------------------------------
    // 3. READ REQUEST BODY
    // ---------------------------------------------------------

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

    const username =
      typeof body.username === "string"
        ? body.username.trim()
        : "";

    const password =
      typeof body.password === "string"
        ? body.password
        : "";

    // ---------------------------------------------------------
    // 4. BASIC VALIDATION
    // ---------------------------------------------------------

    if (!username || !password) {
      return NextResponse.json(
        {
          success: false,
          message: "Username and password are required",
        },
        { status: 400 }
      );
    }

    if (username.length > 100 || password.length > 200) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid username or password",
        },
        { status: 401 }
      );
    }

    // ---------------------------------------------------------
    // 5. FIND USER
    // ---------------------------------------------------------

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

    // ---------------------------------------------------------
    // 6. ACCOUNT STATUS
    // ---------------------------------------------------------

    if (!user.status) {
      return NextResponse.json(
        {
          success: false,
          message: "User account is inactive",
        },
        { status: 403 }
      );
    }

    // ---------------------------------------------------------
    // 7. PASSWORD CHECK
    // ---------------------------------------------------------

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

    // ---------------------------------------------------------
    // 8. CREATE JWT
    // ---------------------------------------------------------

    const token = await new SignJWT({
      userId: user.id,
      username: user.username,
      role: user.role_name,
      fullName: user.full_name,
    })
      .setProtectedHeader({
        alg: "HS256",
      })
      .setIssuedAt()
      .setExpirationTime("8h")
      .sign(secretKey);

    // ---------------------------------------------------------
    // 9. UPDATE LAST LOGIN
    // ---------------------------------------------------------

    await pool.query(
      `
      UPDATE users
      SET
        last_login_at = CURRENT_TIMESTAMP,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $1
      `,
      [user.id]
    );

    // ---------------------------------------------------------
    // 10. RESPONSE
    // ---------------------------------------------------------

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

    // ---------------------------------------------------------
    // 11. SECURE AUTH COOKIE
    // ---------------------------------------------------------

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