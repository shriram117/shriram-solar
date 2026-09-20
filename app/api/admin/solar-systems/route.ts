import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { pool } from "@/lib/db/db";
import { requireAuth } from "@/lib/auth/require-auth";

const solarSystemSchema = z.object({
  customerId: z.coerce.number().int().positive(),

  systemCapacityKw: z.coerce.number().positive(),

  panelBrand: z.string().optional().nullable(),
  panelModel: z.string().optional().nullable(),
  panelQuantity: z.coerce
    .number()
    .int()
    .positive()
    .optional()
    .nullable(),

  inverterBrand: z.string().optional().nullable(),
  inverterModel: z.string().optional().nullable(),
  inverterCapacityKw: z.coerce
    .number()
    .positive()
    .optional()
    .nullable(),

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

function generateSystemCode(id: string | number) {
  return `SYS-${String(id).padStart(6, "0")}`;
}

/*
|--------------------------------------------------------------------------
| GET /api/admin/solar-systems
|--------------------------------------------------------------------------
*/
export async function GET(request: NextRequest) {
  const { user, response } = await requireAuth();

  if (!user) {
    return response;
  }

  try {
    const { searchParams } = new URL(request.url);

    const customerId = searchParams.get("customerId");
    const status = searchParams.get("status");
    const search = searchParams.get("search");

    const conditions: string[] = [];
    const values: unknown[] = [];

    if (customerId) {
      const customerIdNumber = Number(customerId);

      if (
        !Number.isInteger(customerIdNumber) ||
        customerIdNumber <= 0
      ) {
        return NextResponse.json(
          {
            success: false,
            message: "Invalid customer ID.",
          },
          { status: 400 }
        );
      }

      values.push(customerIdNumber);
      conditions.push(`ss.customer_id = $${values.length}`);
    }

    if (status) {
      values.push(status);
      conditions.push(`ss.system_status = $${values.length}`);
    }

    if (search) {
      values.push(`%${search}%`);

      conditions.push(`
        (
          ss.system_code ILIKE $${values.length}
          OR c.customer_name ILIKE $${values.length}
          OR c.customer_code ILIKE $${values.length}
          OR ss.panel_brand ILIKE $${values.length}
          OR ss.inverter_brand ILIKE $${values.length}
        )
      `);
    }

    const whereClause =
      conditions.length > 0
        ? `WHERE ${conditions.join(" AND ")}`
        : "";

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

      ${whereClause}

      ORDER BY ss.created_at DESC
      `,
      values
    );

    return NextResponse.json({
      success: true,
      data: result.rows,
      count: result.rows.length,
    });
  } catch (error) {
    console.error("GET SOLAR SYSTEMS ERROR:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to fetch solar systems.",
      },
      { status: 500 }
    );
  }
}

/*
|--------------------------------------------------------------------------
| POST /api/admin/solar-systems
|--------------------------------------------------------------------------
*/
export async function POST(request: NextRequest) {
  const { user, response } = await requireAuth();

  if (!user) {
    return response;
  }

  try {
    const body = await request.json();

    const parsed = solarSystemSchema.safeParse(body);

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

    const customerResult = await pool.query(
      `
      SELECT id
      FROM customers
      WHERE id = $1
      `,
      [data.customerId]
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

    const client = await pool.connect();

    try {
      await client.query("BEGIN");

      const sequenceResult = await client.query(
        `SELECT nextval('solar_systems_id_seq') AS id`
      );

      const id = sequenceResult.rows[0].id;

      const systemCode = generateSystemCode(id);

      const result = await client.query(
        `
        INSERT INTO solar_systems (
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

          $13,
          $14,

          $15,
          $16,
          $17,

          $18
        )
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
          id,
          systemCode,
          data.customerId,
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
        ]
      );

      await client.query("COMMIT");

      return NextResponse.json(
        {
          success: true,
          message: "Solar system created successfully.",
          data: result.rows[0],
        },
        { status: 201 }
      );
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  } catch (error) {
    console.error("CREATE SOLAR SYSTEM ERROR:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to create solar system.",
      },
      { status: 500 }
    );
  }
}