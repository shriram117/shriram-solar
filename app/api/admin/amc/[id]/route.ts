import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { pool } from "@/lib/db/db";
import { requireAuth } from "@/lib/auth/require-auth";

const updateAmcSchema = z.object({
  customer_id: z.coerce.number().int().positive(),
  solar_system_id: z.coerce.number().int().positive(),
  start_date: z.string().min(1),
  end_date: z.string().min(1),
  contract_amount: z.coerce.number().min(0),
  visit_frequency: z.enum([
    "MONTHLY",
    "QUARTERLY",
    "HALF_YEARLY",
    "YEARLY",
    "CUSTOM",
  ]),
  total_visits: z.coerce.number().int().positive(),
  status: z.enum([
    "DRAFT",
    "ACTIVE",
    "EXPIRING",
    "EXPIRED",
    "CANCELLED",
  ]),
  terms_conditions: z.string().max(10000).optional().nullable(),
  notes: z.string().max(5000).optional().nullable(),
});

function parseId(value: string) {
  const id = Number(value);

  if (!Number.isInteger(id) || id <= 0) {
    return null;
  }

  return id;
}

/**
 * GET AMC by ID
 */
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { user, response } = await requireAuth();

  if (!user) {
    return response;
  }

  try {
    const { id: idParam } = await context.params;
    const id = parseId(idParam);

    if (!id) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid AMC ID.",
        },
        { status: 400 }
      );
    }

    const result = await pool.query(
      `
      SELECT
        a.id,
        a.amc_number,
        a.customer_id,
        c.customer_code,
        c.customer_name,
        c.mobile,
        a.solar_system_id,
        s.system_code,
        s.system_capacity_kw,
        a.start_date,
        a.end_date,
        a.contract_amount,
        a.visit_frequency,
        a.total_visits,
        a.used_visits,
        (a.total_visits - a.used_visits) AS pending_visits,
        a.status,
        a.terms_conditions,
        a.notes,
        a.created_by,
        a.created_at,
        a.updated_at
      FROM amc_contracts a
      INNER JOIN customers c
        ON c.id = a.customer_id
      INNER JOIN solar_systems s
        ON s.id = a.solar_system_id
      WHERE a.id = $1
      LIMIT 1
      `,
      [id]
    );

    if (result.rows.length === 0) {
      return NextResponse.json(
        {
          success: false,
          message: "AMC not found.",
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: result.rows[0],
    });
  } catch (error) {
    console.error("GET AMC error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to fetch AMC.",
      },
      { status: 500 }
    );
  }
}

/**
 * UPDATE AMC
 */
export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { user, response } = await requireAuth();

  if (!user) {
    return response;
  }

  try {
    const { id: idParam } = await context.params;
    const id = parseId(idParam);

    if (!id) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid AMC ID.",
        },
        { status: 400 }
      );
    }

    const contentType = request.headers.get("content-type") || "";

    if (!contentType.includes("application/json")) {
      return NextResponse.json(
        {
          success: false,
          message: "Content-Type must be application/json.",
        },
        { status: 415 }
      );
    }

    const body = await request.json();

    const parsed = updateAmcSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid AMC data.",
          errors: parsed.error.flatten(),
        },
        { status: 400 }
      );
    }

    const data = parsed.data;

    /*
     * Check AMC exists
     */
    const existingResult = await pool.query(
      `
      SELECT
        id,
        amc_number,
        customer_id,
        solar_system_id,
        start_date,
        end_date,
        status
      FROM amc_contracts
      WHERE id = $1
      LIMIT 1
      `,
      [id]
    );

    if (existingResult.rows.length === 0) {
      return NextResponse.json(
        {
          success: false,
          message: "AMC not found.",
        },
        { status: 404 }
      );
    }

    /*
     * Date validation
     */
    const startDate = new Date(data.start_date);
    const endDate = new Date(data.end_date);

    if (
      Number.isNaN(startDate.getTime()) ||
      Number.isNaN(endDate.getTime())
    ) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid AMC dates.",
        },
        { status: 400 }
      );
    }

    if (endDate < startDate) {
      return NextResponse.json(
        {
          success: false,
          message: "End date cannot be before start date.",
        },
        { status: 400 }
      );
    }

    /*
     * Customer validation
     */
    const customerResult = await pool.query(
      `
      SELECT
        id,
        customer_code,
        customer_name,
        status
      FROM customers
      WHERE id = $1
      LIMIT 1
      `,
      [data.customer_id]
    );

    if (customerResult.rows.length === 0) {
      return NextResponse.json(
        {
          success: false,
          message: "Customer not found.",
        },
        { status: 404 }
      );
    }

    if (customerResult.rows[0].status !== "ACTIVE") {
      return NextResponse.json(
        {
          success: false,
          message: "Selected customer is not active.",
        },
        { status: 400 }
      );
    }

    /*
     * Solar system validation
     */
    const systemResult = await pool.query(
      `
      SELECT
        id,
        system_code,
        customer_id
      FROM solar_systems
      WHERE id = $1
      LIMIT 1
      `,
      [data.solar_system_id]
    );

    if (systemResult.rows.length === 0) {
      return NextResponse.json(
        {
          success: false,
          message: "Solar system not found.",
        },
        { status: 404 }
      );
    }

    if (
      Number(systemResult.rows[0].customer_id) !==
      Number(data.customer_id)
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Selected solar system does not belong to the selected customer.",
        },
        { status: 400 }
      );
    }

    /*
     * Check used visits
     *
     * Existing used_visits must never become greater
     * than the new total_visits.
     */
    const currentResult = await pool.query(
      `
      SELECT used_visits
      FROM amc_contracts
      WHERE id = $1
      `,
      [id]
    );

    const usedVisits = Number(
      currentResult.rows[0]?.used_visits || 0
    );

    if (data.total_visits < usedVisits) {
      return NextResponse.json(
        {
          success: false,
          message:
            `Total visits cannot be less than already used visits (${usedVisits}).`,
        },
        { status: 400 }
      );
    }

    /*
     * Prevent overlapping AMC contracts
     *
     * Ignore the current AMC while checking.
     */
    const overlapResult = await pool.query(
      `
      SELECT
        id,
        amc_number,
        start_date,
        end_date,
        status
      FROM amc_contracts
      WHERE customer_id = $1
        AND solar_system_id = $2
        AND id <> $3
        AND status IN ('DRAFT', 'ACTIVE', 'EXPIRING')
        AND start_date <= $5
        AND end_date >= $4
      LIMIT 1
      `,
      [
        data.customer_id,
        data.solar_system_id,
        id,
        data.start_date,
        data.end_date,
      ]
    );

    if (overlapResult.rows.length > 0) {
      const existing = overlapResult.rows[0];

      return NextResponse.json(
        {
          success: false,
          message:
            `Another AMC (${existing.amc_number}) already exists for this solar system during the selected period.`,
        },
        { status: 409 }
      );
    }

    /*
     * Update AMC
     */
    const updateResult = await pool.query(
      `
      UPDATE amc_contracts
      SET
        customer_id = $1,
        solar_system_id = $2,
        start_date = $3,
        end_date = $4,
        contract_amount = $5,
        visit_frequency = $6,
        total_visits = $7,
        status = $8,
        terms_conditions = $9,
        notes = $10,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $11
      RETURNING
        id,
        amc_number,
        customer_id,
        solar_system_id,
        start_date,
        end_date,
        contract_amount,
        visit_frequency,
        total_visits,
        used_visits,
        status,
        terms_conditions,
        notes,
        created_by,
        created_at,
        updated_at
      `,
      [
        data.customer_id,
        data.solar_system_id,
        data.start_date,
        data.end_date,
        data.contract_amount,
        data.visit_frequency,
        data.total_visits,
        data.status,
        data.terms_conditions?.trim() || null,
        data.notes?.trim() || null,
        id,
      ]
    );

    return NextResponse.json({
      success: true,
      message: "AMC updated successfully.",
      data: updateResult.rows[0],
    });
  } catch (error) {
    console.error("PATCH AMC error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to update AMC.",
      },
      { status: 500 }
    );
  }
}