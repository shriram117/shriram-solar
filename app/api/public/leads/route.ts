import { NextRequest, NextResponse } from "next/server";

import { pool } from "@/lib/db/db";

const ALLOWED_SERVICES = new Set([
  "INSTALLATION",
  "PANEL_CLEANING",
  "REPAIR",
  "AMC",
  "INSPECTION",
]);

const ALLOWED_PROPERTY_TYPES = new Set([
  "HOME",
  "SHOP",
  "OFFICE",
  "FACTORY",
  "FARM",
]);

const ALLOWED_SOLAR_CAPACITIES = new Set([
  "2KW",
  "3KW",
  "5KW",
  "10KW",
  "UNKNOWN",
]);

const RATE_LIMIT_WINDOW_MS = 10 * 60 * 1000;
const RATE_LIMIT_MAX_REQUESTS = 5;

type RateLimitEntry = {
  count: number;
  resetAt: number;
};

const rateLimitStore = new Map<string, RateLimitEntry>();

function getClientIp(request: NextRequest) {
  const forwardedFor = request.headers.get("x-forwarded-for");

  if (forwardedFor) {
    return forwardedFor.split(",")[0].trim();
  }

  return request.headers.get("x-real-ip") || "unknown";
}

function cleanupRateLimitStore(now: number) {
  for (const [key, value] of rateLimitStore.entries()) {
    if (value.resetAt <= now) {
      rateLimitStore.delete(key);
    }
  }
}

function isRateLimited(ip: string) {
  const now = Date.now();

  cleanupRateLimitStore(now);

  const existing = rateLimitStore.get(ip);

  if (!existing || existing.resetAt <= now) {
    rateLimitStore.set(ip, {
      count: 1,
      resetAt: now + RATE_LIMIT_WINDOW_MS,
    });

    return false;
  }

  if (existing.count >= RATE_LIMIT_MAX_REQUESTS) {
    return true;
  }

  existing.count += 1;

  return false;
}

function cleanText(value: unknown) {
  if (typeof value !== "string") {
    return "";
  }

  return value.trim();
}

function isValidEmail(email: string) {
  if (!email) {
    return true;
  }

  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function parseMonthlyBill(value: unknown) {
  const text = cleanText(value);

  if (!text) {
    return null;
  }

  if (!/^\d+$/.test(text)) {
    return null;
  }

  const amount = Number(text);

  if (!Number.isSafeInteger(amount) || amount < 0 || amount > 10000000) {
    return null;
  }

  return amount;
}

export async function POST(request: NextRequest) {
  try {
    // ---------------------------------------------------------
    // 1. BASIC REQUEST VALIDATION
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

    if (isRateLimited(clientIp)) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Too many inquiries from this connection. Please try again later.",
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
    // 3. READ BODY
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

    const {
      name,
      mobile,
      email,
      city,
      service,
      propertyType,
      monthlyBill,
      solarCapacity,
      message,
    } = body as Record<string, unknown>;

    // ---------------------------------------------------------
    // 4. CLEAN INPUT
    // ---------------------------------------------------------

    const cleanName = cleanText(name);
    const cleanMobile = cleanText(mobile);
    const cleanEmail = cleanText(email);
    const cleanCity = cleanText(city);
    const cleanService = cleanText(service).toUpperCase();

    const cleanPropertyType = cleanText(propertyType).toUpperCase();

    const cleanSolarCapacity = cleanText(solarCapacity).toUpperCase();

    const cleanMessage = cleanText(message);

    const parsedMonthlyBill = parseMonthlyBill(monthlyBill);

    // ---------------------------------------------------------
    // 5. REQUIRED FIELD VALIDATION
    // ---------------------------------------------------------

    if (!cleanName || !cleanMobile || !cleanCity || !cleanService) {
      return NextResponse.json(
        {
          success: false,
          message: "Name, mobile, city and service are required.",
        },
        { status: 400 }
      );
    }

    // ---------------------------------------------------------
    // 6. NEW SOLAR LEAD FIELD VALIDATION
    // ---------------------------------------------------------

    if (
      cleanPropertyType &&
      !ALLOWED_PROPERTY_TYPES.has(cleanPropertyType)
    ) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid property type selected.",
        },
        { status: 400 }
      );
    }

    if (
      cleanSolarCapacity &&
      !ALLOWED_SOLAR_CAPACITIES.has(cleanSolarCapacity)
    ) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid solar capacity selected.",
        },
        { status: 400 }
      );
    }

    if (cleanPropertyType && !cleanSolarCapacity && parsedMonthlyBill === null) {
      // Allowed: customer can select property without capacity.
      // No action required.
    }

    if (
      cleanText(monthlyBill) &&
      parsedMonthlyBill === null
    ) {
      return NextResponse.json(
        {
          success: false,
          message: "Please enter a valid monthly electricity bill.",
        },
        { status: 400 }
      );
    }

    // ---------------------------------------------------------
    // 7. LENGTH VALIDATION
    // ---------------------------------------------------------

    if (cleanName.length > 100) {
      return NextResponse.json(
        {
          success: false,
          message: "Name is too long.",
        },
        { status: 400 }
      );
    }

    if (cleanCity.length > 100) {
      return NextResponse.json(
        {
          success: false,
          message: "City / area is too long.",
        },
        { status: 400 }
      );
    }

    if (cleanMessage.length > 2000) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Message is too long. Maximum 2000 characters allowed.",
        },
        { status: 400 }
      );
    }

    if (cleanEmail.length > 150) {
      return NextResponse.json(
        {
          success: false,
          message: "Email address is too long.",
        },
        { status: 400 }
      );
    }

    // ---------------------------------------------------------
    // 8. MOBILE VALIDATION
    // ---------------------------------------------------------

    if (!/^[0-9]{10}$/.test(cleanMobile)) {
      return NextResponse.json(
        {
          success: false,
          message: "Please enter a valid 10 digit mobile number.",
        },
        { status: 400 }
      );
    }

    // ---------------------------------------------------------
    // 9. EMAIL VALIDATION
    // ---------------------------------------------------------

    if (!isValidEmail(cleanEmail)) {
      return NextResponse.json(
        {
          success: false,
          message: "Please enter a valid email address.",
        },
        { status: 400 }
      );
    }

    // ---------------------------------------------------------
    // 10. SERVICE VALIDATION
    // ---------------------------------------------------------

    if (!ALLOWED_SERVICES.has(cleanService)) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid service selected.",
        },
        { status: 400 }
      );
    }

    // ---------------------------------------------------------
    // 11. BUILD SOLAR REQUIREMENT
    // ---------------------------------------------------------

    const requirementParts: string[] = [];

    if (cleanPropertyType) {
      requirementParts.push(`Property: ${cleanPropertyType}`);
    }

    if (parsedMonthlyBill !== null) {
      requirementParts.push(
        `Monthly Electricity Bill: ₹${parsedMonthlyBill}`
      );
    }

    if (cleanMessage) {
      requirementParts.push(`Customer Message: ${cleanMessage}`);
    }

    const requirement =
      requirementParts.length > 0
        ? requirementParts.join(" | ")
        : null;

    // ---------------------------------------------------------
    // 12. ESTIMATED CAPACITY
    // ---------------------------------------------------------

const estimatedCapacity =
  cleanSolarCapacity && cleanSolarCapacity !== "UNKNOWN"
    ? Number(cleanSolarCapacity.replace("KW", ""))
    : null;

    // ---------------------------------------------------------
    // 13. DUPLICATE RECENT LEAD PROTECTION
    // ---------------------------------------------------------

    const duplicateCheck = await pool.query(
      `
      SELECT id, lead_code
      FROM leads
      WHERE mobile = $1
        AND source = 'WEBSITE'
        AND created_at >= CURRENT_TIMESTAMP - INTERVAL '10 minutes'
      ORDER BY created_at DESC
      LIMIT 1
      `,
      [cleanMobile]
    );

    if (duplicateCheck.rows.length > 0) {
      return NextResponse.json(
        {
          success: false,
          message:
            "We already received an inquiry from this mobile number. Our team will contact you shortly.",
          lead: duplicateCheck.rows[0],
        },
        { status: 409 }
      );
    }

    // ---------------------------------------------------------
    // 14. GENERATE LEAD CODE
    // ---------------------------------------------------------

    const leadCode = `WEB-${Date.now()}-${Math.floor(
      Math.random() * 1000
    )}`;

    // ---------------------------------------------------------
    // 15. INSERT LEAD
    // ---------------------------------------------------------

    const result = await pool.query(
      `
      INSERT INTO leads (
        lead_code,
        customer_name,
        mobile,
        email,
        city,
        district,
        service_type,
        requirement,
        estimated_capacity,
        source,
        status,
        follow_up_date,
        notes
      )
      VALUES (
        $1,
        $2,
        $3,
        $4,
        $5,
        $6,
        $7,
        $8,
        $9,
        $10,
        $11,
        $12,
        $13
      )
      RETURNING id, lead_code
      `,
      [
        leadCode,
        cleanName,
        cleanMobile,
        cleanEmail || null,
        cleanCity,
        null,
        cleanService,
        requirement,
        estimatedCapacity,
        "WEBSITE",
        "NEW",
        null,
        "Website inquiry",
      ]
    );

    // ---------------------------------------------------------
    // 16. SUCCESS RESPONSE
    // ---------------------------------------------------------

    return NextResponse.json(
      {
        success: true,
        message: "Your inquiry has been submitted successfully.",
        lead: result.rows[0],
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Public lead creation error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Unable to submit inquiry. Please try again.",
      },
      { status: 500 }
    );
  }
}