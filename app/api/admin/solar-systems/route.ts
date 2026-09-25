import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth/require-auth";
import { pool } from "@/lib/db/db";

const ALLOWED_NET_METERING = [
  "PENDING",
  "APPLIED",
  "APPROVED",
  "INSTALLED",
  "NOT_REQUIRED",
];

const ALLOWED_SUBSIDY = [
  "NOT_APPLIED",
  "APPLIED",
  "APPROVED",
  "RECEIVED",
  "NOT_ELIGIBLE",
];

const ALLOWED_SYSTEM_STATUS = [
  "ACTIVE",
  "INACTIVE",
  "UNDER_INSTALLATION",
  "MAINTENANCE",
];

function cleanText(value: unknown) {
  if (typeof value !== "string") return "";
  return value.trim();
}

function toNumber(value: unknown) {
  if (value === "" || value === null || value === undefined) {
    return null;
  }

  const number = Number(value);

  return Number.isFinite(number) ? number : null;
}

function isValidDate(value: string) {
  return /^\d{4}-\d{2}-\d{2}$/.test(value);
}

// ============================================================
// GET - Solar Systems List
// ============================================================

export async function GET(request: NextRequest) {
  try {
    const { response } = await requireAuth();

    if (response) {
      return response;
    }

    const searchParams = request.nextUrl.searchParams;

    const search = cleanText(
      searchParams.get("search")
    );

    const customerId = searchParams.get("customerId");

    const status = cleanText(
      searchParams.get("status")
    ).toUpperCase();

    const conditions: string[] = [];
    const values: unknown[] = [];

    if (search) {
      values.push(`%${search}%`);

      conditions.push(`
        (
          ss.system_code ILIKE $${values.length}
          OR c.customer_name ILIKE $${values.length}
          OR c.customer_code ILIKE $${values.length}
          OR c.mobile ILIKE $${values.length}
        )
      `);
    }

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

      conditions.push(
        `ss.customer_id = $${values.length}`
      );
    }

    if (status) {
      if (!ALLOWED_SYSTEM_STATUS.includes(status)) {
        return NextResponse.json(
          {
            success: false,
            message: "Invalid system status.",
          },
          { status: 400 }
        );
      }

      values.push(status);

      conditions.push(
        `ss.system_status = $${values.length}`
      );
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
        c.mobile AS customer_mobile,

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
        t.mobile AS technician_mobile,

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

      ORDER BY ss.id DESC
      `,
      values
    );

    return NextResponse.json({
      success: true,
      data: result.rows,
    });
  } catch (error) {
    console.error(
      "Solar systems GET error:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        message: "Unable to load solar systems.",
      },
      { status: 500 }
    );
  }
}

// ============================================================
// POST - Create Solar System
// ============================================================

export async function POST(request: NextRequest) {
  const client = await pool.connect();

  try {
    const { user, response } = await requireAuth();

    if (response) {
      return response;
    }

    const contentType =
      request.headers.get("content-type") || "";

    if (
      !contentType
        .toLowerCase()
        .includes("application/json")
    ) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid request format.",
        },
        { status: 415 }
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

    const customerId = Number(body.customer_id);

    if (
      !Number.isInteger(customerId) ||
      customerId <= 0
    ) {
      return NextResponse.json(
        {
          success: false,
          message: "Valid customer is required.",
        },
        { status: 400 }
      );
    }

    const systemCapacityKw = toNumber(
      body.system_capacity_kw
    );

    if (
      systemCapacityKw === null ||
      systemCapacityKw <= 0
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "System capacity must be greater than zero.",
        },
        { status: 400 }
      );
    }

    const panelBrand = cleanText(
      body.panel_brand
    );

    const panelModel = cleanText(
      body.panel_model
    );

    const panelQuantity =
      body.panel_quantity === "" ||
      body.panel_quantity === null ||
      body.panel_quantity === undefined
        ? null
        : Number(body.panel_quantity);

    if (
      panelQuantity !== null &&
      (!Number.isInteger(panelQuantity) ||
        panelQuantity < 0)
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Panel quantity must be a valid non-negative number.",
        },
        { status: 400 }
      );
    }

    const inverterBrand = cleanText(
      body.inverter_brand
    );

    const inverterModel = cleanText(
      body.inverter_model
    );

    const inverterCapacityKw = toNumber(
      body.inverter_capacity_kw
    );

    if (
      inverterCapacityKw !== null &&
      inverterCapacityKw <= 0
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Inverter capacity must be greater than zero.",
        },
        { status: 400 }
      );
    }

    const installationDate = cleanText(
      body.installation_date
    );

    if (
      installationDate &&
      !isValidDate(installationDate)
    ) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid installation date.",
        },
        { status: 400 }
      );
    }

    const installerTechnicianId =
      body.installer_technician_id === "" ||
      body.installer_technician_id === null ||
      body.installer_technician_id === undefined
        ? null
        : Number(body.installer_technician_id);

    if (
      installerTechnicianId !== null &&
      (!Number.isInteger(
        installerTechnicianId
      ) ||
        installerTechnicianId <= 0)
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Invalid installer technician.",
        },
        { status: 400 }
      );
    }

    const panelWarrantyYears = toNumber(
      body.panel_warranty_years
    );

    if (
      panelWarrantyYears !== null &&
      panelWarrantyYears < 0
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Panel warranty cannot be negative.",
        },
        { status: 400 }
      );
    }

    const inverterWarrantyYears = toNumber(
      body.inverter_warranty_years
    );

    if (
      inverterWarrantyYears !== null &&
      inverterWarrantyYears < 0
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Inverter warranty cannot be negative.",
        },
        { status: 400 }
      );
    }

    const netMeteringStatus =
      cleanText(
        body.net_metering_status
      ).toUpperCase() || "PENDING";

    if (
      !ALLOWED_NET_METERING.includes(
        netMeteringStatus
      )
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Invalid net metering status.",
        },
        { status: 400 }
      );
    }

    const subsidyStatus =
      cleanText(
        body.subsidy_status
      ).toUpperCase() || "NOT_APPLIED";

    if (
      !ALLOWED_SUBSIDY.includes(
        subsidyStatus
      )
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Invalid subsidy status.",
        },
        { status: 400 }
      );
    }

    const systemStatus =
      cleanText(
        body.system_status
      ).toUpperCase() || "ACTIVE";

    if (
      !ALLOWED_SYSTEM_STATUS.includes(
        systemStatus
      )
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Invalid system status.",
        },
        { status: 400 }
      );
    }

    const notes = cleanText(body.notes);

    if (notes.length > 5000) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Notes cannot exceed 5000 characters.",
        },
        { status: 400 }
      );
    }

    // ----------------------------------------------------------
    // Verify Customer
    // ----------------------------------------------------------

    const customerResult =
      await client.query(
        `
        SELECT id
        FROM customers
        WHERE id = $1
        LIMIT 1
        `,
        [customerId]
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

    // ----------------------------------------------------------
    // Verify Technician
    // ----------------------------------------------------------

    if (installerTechnicianId !== null) {
      const technicianResult =
        await client.query(
          `
          SELECT id
          FROM technicians
          WHERE id = $1
            AND status = 'ACTIVE'
          LIMIT 1
          `,
          [installerTechnicianId]
        );

      if (
        technicianResult.rows.length === 0
      ) {
        return NextResponse.json(
          {
            success: false,
            message:
              "Installer technician not found or inactive.",
          },
          { status: 400 }
        );
      }
    }

    // ----------------------------------------------------------
    // Transaction
    // ----------------------------------------------------------

    await client.query("BEGIN");

    const insertResult =
      await client.query(
        `
        INSERT INTO solar_systems (
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
        )
        VALUES (
          'TEMP',
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
          CURRENT_TIMESTAMP,
          CURRENT_TIMESTAMP
        )
        RETURNING id
        `,
        [
          customerId,
          systemCapacityKw,
          panelBrand || null,
          panelModel || null,
          panelQuantity,
          inverterBrand || null,
          inverterModel || null,
          inverterCapacityKw,
          installationDate || null,
          installerTechnicianId,
          panelWarrantyYears,
          inverterWarrantyYears,
          netMeteringStatus,
          subsidyStatus,
          systemStatus,
          notes || null,
        ]
      );

    const id = insertResult.rows[0].id;

    const systemCode =
      `SYS-${String(id).padStart(6, "0")}`;

    const updateResult =
      await client.query(
        `
        UPDATE solar_systems
        SET
          system_code = $1,
          updated_at = CURRENT_TIMESTAMP
        WHERE id = $2
        RETURNING *
        `,
        [systemCode, id]
      );

    await client.query("COMMIT");

    return NextResponse.json(
      {
        success: true,
        message:
          "Solar system created successfully.",
        data: updateResult.rows[0],
        created_by: user?.userId,
      },
      { status: 201 }
    );
  } catch (error) {
    await client.query("ROLLBACK");

    console.error(
      "Solar system POST error:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        message:
          "Unable to create solar system.",
      },
      { status: 500 }
    );
  } finally {
    client.release();
  }
}