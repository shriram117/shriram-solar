import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { pool } from "@/lib/db/db";
import { requireAuth } from "@/lib/auth/require-auth";

const updateLeadSchema = z.object({
  customerName: z.string().min(1, "Customer name is required").max(150),
  mobile: z.string().min(1, "Mobile number is required").max(20),
  email: z.string().email().optional().or(z.literal("")),
  city: z.string().max(100).optional(),
  district: z.string().max(100).optional(),
  serviceType: z.string().min(1, "Service type is required").max(50),
  requirement: z.string().optional(),
  estimatedCapacity: z
    .number()
    .min(0, "Capacity cannot be negative")
    .optional(),
  source: z.string().max(50).optional(),
  status: z.enum([
    "NEW",
    "CONTACTED",
    "FOLLOW_UP",
    "QUOTED",
    "CONVERTED",
    "LOST",
    "CANCELLED",
  ]).optional(),
  assignedTo: z.number().int().positive().nullable().optional(),
  followUpDate: z.string().optional(),
  notes: z.string().optional(),
});

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

/**
 * GET single lead
 */
export async function GET(
  request: NextRequest,
  { params }: RouteContext
) {
  const auth = await requireAuth();

  if (auth.response) {
    return auth.response;
  }

  try {
    const { id } = await params;

    const leadId = Number(id);

    if (!Number.isInteger(leadId)) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid lead ID",
        },
        { status: 400 }
      );
    }

    const result = await pool.query(
      `
      SELECT
        l.*,
        u.full_name AS assigned_user_name
      FROM leads l
      LEFT JOIN users u
        ON u.id = l.assigned_to
      WHERE l.id = $1
      `,
      [leadId]
    );

    if (result.rows.length === 0) {
      return NextResponse.json(
        {
          success: false,
          message: "Lead not found",
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: result.rows[0],
    });
  } catch (error) {
    console.error("GET lead error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to fetch lead",
      },
      { status: 500 }
    );
  }
}

/**
 * PATCH update lead
 */
export async function PATCH(
  request: NextRequest,
  { params }: RouteContext
) {
  const auth = await requireAuth();

  if (auth.response) {
    return auth.response;
  }

  try {
    const { id } = await params;

    const leadId = Number(id);

    if (!Number.isInteger(leadId)) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid lead ID",
        },
        { status: 400 }
      );
    }

    const body = await request.json();

    const validation = updateLeadSchema.safeParse(body);

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

    const existingLead = await pool.query(
      `
      SELECT id
      FROM leads
      WHERE id = $1
      `,
      [leadId]
    );

    if (existingLead.rows.length === 0) {
      return NextResponse.json(
        {
          success: false,
          message: "Lead not found",
        },
        { status: 404 }
      );
    }

    const result = await pool.query(
      `
      UPDATE leads
      SET
        customer_name = $1,
        mobile = $2,
        email = $3,
        city = $4,
        district = $5,
        service_type = $6,
        requirement = $7,
        estimated_capacity = $8,
        source = $9,
        status = COALESCE($10, status),
        assigned_to = $11,
        follow_up_date = $12,
        notes = $13,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $14
      RETURNING *
      `,
      [
        data.customerName,
        data.mobile,
        data.email || null,
        data.city || null,
        data.district || null,
        data.serviceType,
        data.requirement || null,
        data.estimatedCapacity ?? null,
        data.source || "ADMIN",
        data.status ?? null,
        data.assignedTo ?? null,
        data.followUpDate || null,
        data.notes || null,
        leadId,
      ]
    );

    return NextResponse.json({
      success: true,
      message: "Lead updated successfully",
      data: result.rows[0],
    });
  } catch (error) {
    console.error("PATCH lead error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to update lead",
      },
      { status: 500 }
    );
  }
}