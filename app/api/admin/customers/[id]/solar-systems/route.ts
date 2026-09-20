import { NextRequest, NextResponse } from "next/server";
import { pool } from "@/lib/db/db";
import { requireAuth } from "@/lib/auth/require-auth";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

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
    const customerId = Number(id);

    if (!Number.isInteger(customerId) || customerId <= 0) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid customer ID.",
        },
        { status: 400 }
      );
    }

    const customerResult = await pool.query(
      `
      SELECT
        id,
        customer_code,
        customer_name,
        mobile
      FROM customers
      WHERE id = $1
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

    const result = await pool.query(
      `
      SELECT
        ss.id,
        ss.system_code,
        ss.customer_id,
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
      LEFT JOIN technicians t
        ON t.id = ss.installer_technician_id
      WHERE ss.customer_id = $1
      ORDER BY ss.created_at DESC
      `,
      [customerId]
    );

    return NextResponse.json({
      success: true,
      customer: customerResult.rows[0],
      data: result.rows,
      count: result.rows.length,
    });
  } catch (error) {
    console.error("GET CUSTOMER SOLAR SYSTEMS ERROR:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to fetch customer solar systems.",
      },
      { status: 500 }
    );
  }
}