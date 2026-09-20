import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { pool } from "@/lib/db/db";
import { requireAuth } from "@/lib/auth/require-auth";

const statusSchema = z.object({
  status: z.enum([
    "NEW",
    "CONTACTED",
    "FOLLOW_UP",
    "QUOTED",
    "CONVERTED",
    "LOST",
    "CANCELLED",
  ]),
});

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

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

    const validation = statusSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid status",
          errors: validation.error.flatten().fieldErrors,
        },
        { status: 400 }
      );
    }

    const { status } = validation.data;

    const existingLead = await pool.query(
      `
      SELECT
        id,
        lead_code,
        status
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

    const oldStatus = existingLead.rows[0].status;

    const result = await pool.query(
      `
      UPDATE leads
      SET
        status = $1,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $2
      RETURNING
        id,
        lead_code,
        status,
        updated_at
      `,
      [status, leadId]
    );

    return NextResponse.json({
      success: true,
      message: "Lead status updated successfully",
      previous_status: oldStatus,
      data: result.rows[0],
    });
  } catch (error) {
    console.error("PATCH lead status error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to update lead status",
      },
      { status: 500 }
    );
  }
}