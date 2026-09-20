import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { pool } from "@/lib/db/db";
import { requireAuth } from "@/lib/auth/require-auth";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

const updateSolarSystemSchema = z.object({
  systemCapacityKw: z.coerce.number().positive(),

  panelBrand: z.string().optional().nullable(),
  panelModel: z.string().optional().nullable(),
  panelQuantity: z.coerce.number().int().positive().optional().nullable(),

  inverterBrand: z.string().optional().nullable(),
  inverterModel: z.string().optional().nullable(),
  inverterCapacityKw: z.coerce.number().positive().optional().nullable(),

  installationDate: z.string().optional().nullable(),

  installerTechnicianId: z.coerce
    .number()
    .int()
    .positive()
    .optional()
    .nullable(),

  panelWarrantyYears: z.coerce
    .number()
    .nonnegative()
    .optional()
    .nullable(),

  inverterWarrantyYears: z.coerce
    .number()
    .nonnegative()
    .optional()
    .nullable(),

  netMeteringStatus: z.enum([
    "PENDING",
    "APPLIED",
    "APPROVED",
    "INSTALLED",
    "NOT_REQUIRED",
  ]),

  subsidyStatus: z.enum([
    "NOT_APPLIED",
    "APPLIED",
    "APPROVED",
    "RECEIVED",
    "NOT_ELIGIBLE",
  ]),

  systemStatus: z.enum([
    "ACTIVE",
    "INACTIVE",
    "UNDER_MAINTENANCE",
    "DECOMMISSIONED",
  ]),

  notes: z.string().optional().nullable(),
});

/**
 * GET SINGLE SOLAR SYSTEM
 */
export async function GET(
  request: NextRequest,
  context: RouteContext
) {
  const { user, response } = await requireAuth();

  if (!user) {
    return response;
  }

  try {
    const { id } = await context.params;

    const systemId = Number(id);

    if (!Number.isInteger(systemId) || systemId <= 0) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid solar system ID.",
        },
        { status: 400 }
      );
    }

    const result = await pool.query(
      `
      SELECT
        ss.id,
        ss.system_code,
        ss.customer_id,

        c.customer_code,
        c.customer_name,
        c.mobile,

        ss.system_capacity_kw,

        ss.panel_brand,
        ss.panel_model,
        ss.panel_quantity,

        ss.inverter_brand,
        ss.inverter_model,
        ss.inverter_capacity_kw,

        ss.installation_date,

        ss.installer_technician_id,
        t.technician_code,
        t.technician_name,

        ss.panel_warranty_years,
        ss.inverter_warranty_years,

        ss.net_metering_status,
        ss.subsidy_status,
        ss.system_status,

        ss.notes,

        ss.created_at,
        ss.updated_at

      FROM solar_systems ss

      INNER JOIN customers c
        ON c.id = ss.customer_id

      LEFT JOIN technicians t
        ON t.id = ss.installer_technician_id

      WHERE ss.id = $1
      `,
      [systemId]
    );

    if (result.rows.length === 0) {
      return NextResponse.json(
        {
          success: false,
          message: "Solar system not found.",
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: result.rows[0],
    });
  } catch (error) {
    console.error("GET SOLAR SYSTEM ERROR:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to fetch solar system.",
      },
      { status: 500 }
    );
  }
}

/**
 * UPDATE SOLAR SYSTEM
 */
export async function PATCH(
  request: NextRequest,
  context: RouteContext
) {
  const { user, response } = await requireAuth();

  if (!user) {
    return response;
  }

  try {
    const { id } = await context.params;

    const systemId = Number(id);

    if (!Number.isInteger(systemId) || systemId <= 0) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid solar system ID.",
        },
        { status: 400 }
      );
    }

    const body = await request.json();

    const parsed = updateSolarSystemSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid solar system data.",
          errors: parsed.error.flatten(),
        },
        { status: 400 }
      );
    }

    const data = parsed.data;

    // Check Solar System
    const systemResult = await pool.query(
      `
      SELECT
        id,
        customer_id
      FROM solar_systems
      WHERE id = $1
      `,
      [systemId]
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

    // Check technician if provided
    if (data.installerTechnicianId) {
      const technicianResult = await pool.query(
        `
        SELECT id
        FROM technicians
        WHERE id = $1
          AND status = 'ACTIVE'
        `,
        [data.installerTechnicianId]
      );

      if (technicianResult.rows.length === 0) {
        return NextResponse.json(
          {
            success: false,
            message: "Active technician not found.",
          },
          { status: 400 }
        );
      }
    }

    const result = await pool.query(
      `
      UPDATE solar_systems
      SET
        system_capacity_kw = $1,

        panel_brand = $2,
        panel_model = $3,
        panel_quantity = $4,

        inverter_brand = $5,
        inverter_model = $6,
        inverter_capacity_kw = $7,

        installation_date = $8,

        installer_technician_id = $9,

        panel_warranty_years = $10,
        inverter_warranty_years = $11,

        net_metering_status = $12,
        subsidy_status = $13,
        system_status = $14,

        notes = $15,

        updated_at = CURRENT_TIMESTAMP

      WHERE id = $16

      RETURNING
        id,
        system_code,
        customer_id,

        system_capacity_kw,

        panel_brand,
        panel_model,
        panel_quantity,

        inverter_brand,
        inverter_model,
        inverter_capacity_kw,

        installation_date,

        installer_technician_id,

        panel_warranty_years,
        inverter_warranty_years,

        net_metering_status,
        subsidy_status,
        system_status,

        notes,

        created_at,
        updated_at
      `,
      [
        data.systemCapacityKw,

        data.panelBrand || null,
        data.panelModel || null,
        data.panelQuantity ?? null,

        data.inverterBrand || null,
        data.inverterModel || null,
        data.inverterCapacityKw ?? null,

        data.installationDate || null,

        data.installerTechnicianId ?? null,

        data.panelWarrantyYears ?? null,
        data.inverterWarrantyYears ?? null,

        data.netMeteringStatus,
        data.subsidyStatus,
        data.systemStatus,

        data.notes || null,

        systemId,
      ]
    );

    return NextResponse.json({
      success: true,
      message: "Solar system updated successfully.",
      data: result.rows[0],
    });
  } catch (error) {
    console.error("UPDATE SOLAR SYSTEM ERROR:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to update solar system.",
      },
      { status: 500 }
    );
  }
}