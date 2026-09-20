import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { pool } from "@/lib/db/db";
import { requireAuth } from "@/lib/auth/require-auth";

const leadSchema = z.object({
  customerName: z
    .string()
    .trim()
    .min(2, "Customer name is required")
    .max(150),

  mobile: z
    .string()
    .trim()
    .min(10, "Valid mobile number is required")
    .max(20),

  email: z
    .string()
    .trim()
    .email("Invalid email address")
    .max(150)
    .optional()
    .or(z.literal("")),

  city: z.string().trim().max(100).optional().or(z.literal("")),

  district: z
    .string()
    .trim()
    .max(100)
    .optional()
    .or(z.literal("")),

  serviceType: z
    .string()
    .trim()
    .min(1, "Service type is required")
    .max(50),

  requirement: z
    .string()
    .trim()
    .max(2000)
    .optional()
    .or(z.literal("")),

  estimatedCapacity: z
    .number()
    .nonnegative()
    .optional(),

  source: z
    .string()
    .trim()
    .max(50)
    .optional()
    .default("ADMIN"),

  followUpDate: z
    .string()
    .optional()
    .or(z.literal("")),

  notes: z
    .string()
    .trim()
    .max(2000)
    .optional()
    .or(z.literal("")),
});

function generateLeadCode() {
  const timestamp = Date.now().toString().slice(-8);

  return `LD-${timestamp}`;
}

// ============================================================
// GET /api/admin/leads
// ============================================================

export async function GET() {
  try {
    const { user, response } = await requireAuth();

    if (!user) {
      return response;
    }

    const result = await pool.query(`
      SELECT
        l.id,
        l.lead_code,
        l.customer_name,
        l.mobile,
        l.email,
        l.city,
        l.district,
        l.service_type,
        l.requirement,
        l.estimated_capacity,
        l.source,
        l.status,
        l.follow_up_date,
        l.notes,
        l.created_at,
        l.updated_at,
        u.full_name AS assigned_user_name
      FROM leads l
      LEFT JOIN users u
        ON u.id = l.assigned_to
      ORDER BY l.created_at DESC
    `);

    return NextResponse.json({
      success: true,
      data: result.rows,
      count: result.rows.length,
    });
  } catch (error) {
    console.error("Get leads error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to fetch leads",
      },
      { status: 500 }
    );
  }
}

// ============================================================
// POST /api/admin/leads
// ============================================================

export async function POST(request: NextRequest) {
  try {
    const { user, response } = await requireAuth();

    if (!user) {
      return response;
    }

    const body = await request.json();

    const validation = leadSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        {
          success: false,
          message: "Validation failed",
          errors: validation.error.flatten().fieldErrors,
        },
        { status: 400 }
      );
    }

    const data = validation.data;

    const leadCode = generateLeadCode();

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
        NULLIF($4, ''),
        NULLIF($5, ''),
        NULLIF($6, ''),
        $7,
        NULLIF($8, ''),
        $9,
        COALESCE(NULLIF($10, ''), 'ADMIN'),
        'NEW',
        NULLIF($11, '')::DATE,
        NULLIF($12, '')
      )
      RETURNING
        id,
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
        notes,
        created_at
      `,
      [
        leadCode,
        data.customerName,
        data.mobile,
        data.email ?? "",
        data.city ?? "",
        data.district ?? "",
        data.serviceType,
        data.requirement ?? "",
        data.estimatedCapacity ?? null,
        data.source ?? "ADMIN",
        data.followUpDate ?? "",
        data.notes ?? "",
      ]
    );

    return NextResponse.json(
      {
        success: true,
        message: "Lead created successfully",
        data: result.rows[0],
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Create lead error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to create lead",
      },
      { status: 500 }
    );
  }
}