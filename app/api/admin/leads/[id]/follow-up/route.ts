import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth/require-auth";
import { pool } from "@/lib/db/db";

const ALLOWED_STATUSES = new Set([
  "NEW",
  "CONTACTED",
  "FOLLOW_UP",
  "QUOTED",
  "CONVERTED",
  "LOST",
  "CANCELLED",
]);

function cleanText(value: unknown) {
  if (typeof value !== "string") {
    return "";
  }

  return value.trim();
}

function isValidDate(value: string) {
  return /^\d{4}-\d{2}-\d{2}$/.test(value);
}

export async function PATCH(
  request: NextRequest,
  context: {
    params: Promise<{ id: string }>;
  }
) {
  try {
    const { user, response } = await requireAuth();

    if (response) {
      return response;
    }

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

    const { id } = await context.params;

    const leadId = Number(id);

    if (!Number.isInteger(leadId) || leadId <= 0) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid lead ID.",
        },
        { status: 400 }
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

    const status = cleanText(body.status).toUpperCase();

    const followUpDate = cleanText(body.follow_up_date);

    const notes = cleanText(body.notes);

    if (!status) {
      return NextResponse.json(
        {
          success: false,
          message: "Lead status is required.",
        },
        { status: 400 }
      );
    }

    if (!ALLOWED_STATUSES.has(status)) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid lead status.",
        },
        { status: 400 }
      );
    }

    if (followUpDate && !isValidDate(followUpDate)) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid follow-up date.",
        },
        { status: 400 }
      );
    }

    if (notes.length > 2000) {
      return NextResponse.json(
        {
          success: false,
          message: "Notes cannot exceed 2000 characters.",
        },
        { status: 400 }
      );
    }

    // Follow-up date is useful only for active follow-up work.
    if (
      status === "FOLLOW_UP" &&
      !followUpDate
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Follow-up date is required when status is FOLLOW_UP.",
        },
        { status: 400 }
      );
    }

    const existingLead = await pool.query(
      `
      SELECT
        id,
        lead_code,
        customer_name,
        status
      FROM leads
      WHERE id = $1
      LIMIT 1
      `,
      [leadId]
    );

    if (existingLead.rows.length === 0) {
      return NextResponse.json(
        {
          success: false,
          message: "Lead not found.",
        },
        { status: 404 }
      );
    }

    const result = await pool.query(
      `
      UPDATE leads
      SET
        status = $1,
        follow_up_date = $2,
        notes = $3,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $4
      RETURNING
        id,
        lead_code,
        customer_name,
        mobile,
        service_type,
        status,
        follow_up_date,
        notes,
        updated_at
      `,
      [
        status,
        followUpDate || null,
        notes || null,
        leadId,
      ]
    );

    return NextResponse.json({
      success: true,
      message: "Lead follow-up updated successfully.",
      data: result.rows[0],
      updated_by: user?.userId,
    });
  } catch (error) {
    console.error("Lead follow-up update error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Unable to update lead follow-up.",
      },
      { status: 500 }
    );
  }
}