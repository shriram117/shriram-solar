import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth/require-auth";
import { pool } from "@/lib/db/db";

const ALLOWED_NET_METERING_STATUS = new Set([
  "PENDING",
  "APPLIED",
  "APPROVED",
  "INSTALLED",
  "NOT_REQUIRED",
]);

const ALLOWED_SUBSIDY_STATUS = new Set([
  "NOT_APPLIED",
  "APPLIED",
  "APPROVED",
  "RECEIVED",
  "NOT_ELIGIBLE",
]);

const ALLOWED_SYSTEM_STATUS = new Set([
  "ACTIVE",
  "INACTIVE",
  "UNDER_INSTALLATION",
  "MAINTENANCE",
]);

function cleanText(value: unknown): string {
  if (typeof value !== "string") return "";
  return value.trim();
}

function isValidDate(value: string): boolean {
  return /^\d{4}-\d{2}-\d{2}$/.test(value);
}

function getId(value: string): number | null {
  const id = Number(value);

  if (!Number.isInteger(id) || id <= 0) {
    return null;
  }

  return id;
}

/* =========================================================
   GET - View Solar System
   ========================================================= */

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { response } = await requireAuth();

    if (response) {
      return response;
    }

    const { id } = await context.params;
    const systemId = getId(id);

    if (!systemId) {
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

      WHERE ss.id = $1

      LIMIT 1
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
    console.error("Get solar system error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Unable to fetch solar system.",
      },
      { status: 500 }
    );
  }
}

/* =========================================================
   PATCH - Update Solar System
   ========================================================= */

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
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
    const systemId = getId(id);

    if (!systemId) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid solar system ID.",
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

    const customerId = Number(body.customer_id);

    const systemCapacity = Number(body.system_capacity_kw);

    const panelQuantity =
      body.panel_quantity === undefined ||
      body.panel_quantity === null ||
      body.panel_quantity === ""
        ? 0
        : Number(body.panel_quantity);

    const inverterCapacity =
      body.inverter_capacity_kw === undefined ||
      body.inverter_capacity_kw === null ||
      body.inverter_capacity_kw === ""
        ? null
        : Number(body.inverter_capacity_kw);

    const panelWarranty =
      body.panel_warranty_years === undefined ||
      body.panel_warranty_years === null ||
      body.panel_warranty_years === ""
        ? 0
        : Number(body.panel_warranty_years);

    const inverterWarranty =
      body.inverter_warranty_years === undefined ||
      body.inverter_warranty_years === null ||
      body.inverter_warranty_years === ""
        ? 0
        : Number(body.inverter_warranty_years);

    const panelBrand = cleanText(body.panel_brand);
    const panelModel = cleanText(body.panel_model);

    const inverterBrand = cleanText(body.inverter_brand);
    const inverterModel = cleanText(body.inverter_model);

    const installationDate = cleanText(body.installation_date);

    const installerTechnicianId =
      body.installer_technician_id === undefined ||
      body.installer_technician_id === null ||
      body.installer_technician_id === ""
        ? null
        : Number(body.installer_technician_id);

    const netMeteringStatus =
      cleanText(body.net_metering_status).toUpperCase() || "PENDING";

    const subsidyStatus =
      cleanText(body.subsidy_status).toUpperCase() || "NOT_APPLIED";

    const systemStatus =
      cleanText(body.system_status).toUpperCase() || "ACTIVE";

    const notes = cleanText(body.notes);

    /* ---------- Validation ---------- */

    if (!Number.isInteger(customerId) || customerId <= 0) {
      return NextResponse.json(
        {
          success: false,
          message: "Valid customer is required.",
        },
        { status: 400 }
      );
    }

    if (!Number.isFinite(systemCapacity) || systemCapacity <= 0) {
      return NextResponse.json(
        {
          success: false,
          message: "System capacity must be greater than 0.",
        },
        { status: 400 }
      );
    }

    if (
      !Number.isInteger(panelQuantity) ||
      panelQuantity < 0
    ) {
      return NextResponse.json(
        {
          success: false,
          message: "Panel quantity cannot be negative.",
        },
        { status: 400 }
      );
    }

    if (
      inverterCapacity !== null &&
      (!Number.isFinite(inverterCapacity) || inverterCapacity <= 0)
    ) {
      return NextResponse.json(
        {
          success: false,
          message: "Inverter capacity must be greater than 0.",
        },
        { status: 400 }
      );
    }

    if (installationDate && !isValidDate(installationDate)) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid installation date.",
        },
        { status: 400 }
      );
    }

    if (
      installerTechnicianId !== null &&
      (!Number.isInteger(installerTechnicianId) ||
        installerTechnicianId <= 0)
    ) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid installer technician.",
        },
        { status: 400 }
      );
    }

    if (panelWarranty < 0 || inverterWarranty < 0) {
      return NextResponse.json(
        {
          success: false,
          message: "Warranty years cannot be negative.",
        },
        { status: 400 }
      );
    }

    if (!ALLOWED_NET_METERING_STATUS.has(netMeteringStatus)) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid net metering status.",
        },
        { status: 400 }
      );
    }

    if (!ALLOWED_SUBSIDY_STATUS.has(subsidyStatus)) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid subsidy status.",
        },
        { status: 400 }
      );
    }

    if (!ALLOWED_SYSTEM_STATUS.has(systemStatus)) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid system status.",
        },
        { status: 400 }
      );
    }

    if (notes.length > 5000) {
      return NextResponse.json(
        {
          success: false,
          message: "Notes cannot exceed 5000 characters.",
        },
        { status: 400 }
      );
    }

    /* ---------- Existing system ---------- */

    const existingSystem = await pool.query(
      `
      SELECT
        id,
        system_code
      FROM solar_systems
      WHERE id = $1
      LIMIT 1
      `,
      [systemId]
    );

    if (existingSystem.rows.length === 0) {
      return NextResponse.json(
        {
          success: false,
          message: "Solar system not found.",
        },
        { status: 404 }
      );
    }

    /* ---------- Customer validation ---------- */

    const customerResult = await pool.query(
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

    /* ---------- Technician validation ---------- */

    if (installerTechnicianId !== null) {
      const technicianResult = await pool.query(
        `
        SELECT id
        FROM technicians
        WHERE id = $1
          AND status = 'ACTIVE'
        LIMIT 1
        `,
        [installerTechnicianId]
      );

      if (technicianResult.rows.length === 0) {
        return NextResponse.json(
          {
            success: false,
            message: "Active installer technician not found.",
          },
          { status: 400 }
        );
      }
    }

    /* ---------- Update ---------- */

    const result = await pool.query(
      `
      UPDATE solar_systems
      SET
        customer_id = $1,
        system_capacity_kw = $2,

        panel_brand = $3,
        panel_model = $4,
        panel_quantity = $5,

        inverter_brand = $6,
        inverter_model = $7,
        inverter_capacity_kw = $8,

        installation_date = $9,
        installer_technician_id = $10,

        panel_warranty_years = $11,
        inverter_warranty_years = $12,

        net_metering_status = $13,
        subsidy_status = $14,
        system_status = $15,

        notes = $16,
        updated_at = CURRENT_TIMESTAMP

      WHERE id = $17

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
        customerId,
        systemCapacity,
        panelBrand || null,
        panelModel || null,
        panelQuantity,
        inverterBrand || null,
        inverterModel || null,
        inverterCapacity,
        installationDate || null,
        installerTechnicianId,
        panelWarranty,
        inverterWarranty,
        netMeteringStatus,
        subsidyStatus,
        systemStatus,
        notes || null,
        systemId,
      ]
    );

    return NextResponse.json({
      success: true,
      message: "Solar system updated successfully.",
      data: result.rows[0],
      updated_by: user?.userId,
    });
  } catch (error) {
    console.error("Update solar system error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Unable to update solar system.",
      },
      { status: 500 }
    );
  }
}

/* =========================================================
   DELETE - Delete Solar System
   ========================================================= */

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { response } = await requireAuth();

    if (response) {
      return response;
    }

    const { id } = await context.params;
    const systemId = getId(id);

    if (!systemId) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid solar system ID.",
        },
        { status: 400 }
      );
    }

    const existingSystem = await pool.query(
      `
      SELECT
        id,
        system_code
      FROM solar_systems
      WHERE id = $1
      LIMIT 1
      `,
      [systemId]
    );

    if (existingSystem.rows.length === 0) {
      return NextResponse.json(
        {
          success: false,
          message: "Solar system not found.",
        },
        { status: 404 }
      );
    }

    /* 
       Do not allow deletion when service jobs
       are already linked to this solar system.
    */

    const serviceJobResult = await pool.query(
      `
      SELECT id
      FROM service_jobs
      WHERE solar_system_id = $1
      LIMIT 1
      `,
      [systemId]
    );

    if (serviceJobResult.rows.length > 0) {
      return NextResponse.json(
        {
          success: false,
          message:
            "This solar system cannot be deleted because service jobs are linked to it.",
        },
        { status: 409 }
      );
    }

    await pool.query(
      `
      DELETE FROM solar_systems
      WHERE id = $1
      `,
      [systemId]
    );

    return NextResponse.json({
      success: true,
      message: "Solar system deleted successfully.",
      data: {
        id: systemId,
        system_code: existingSystem.rows[0].system_code,
      },
    });
  } catch (error) {
    console.error("Delete solar system error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Unable to delete solar system.",
      },
      { status: 500 }
    );
  }
}