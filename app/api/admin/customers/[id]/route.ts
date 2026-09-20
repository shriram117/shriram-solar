import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { pool } from "@/lib/db/db";
import { requireAuth } from "@/lib/auth/require-auth";

const customerSchema = z.object({
  customerName: z.string().min(2),
  mobile: z.string().min(5),
  alternateMobile: z.string().optional().nullable(),
  email: z.string().email().optional().or(z.literal("")).nullable(),
  address: z.string().optional().nullable(),
  city: z.string().optional().nullable(),
  district: z.string().optional().nullable(),
  state: z.string().optional().nullable(),
  pincode: z.string().optional().nullable(),
  customerType: z.enum([
    "RESIDENTIAL",
    "COMMERCIAL",
    "INDUSTRIAL",
    "GOVERNMENT",
  ]),
  status: z.enum(["ACTIVE", "INACTIVE"]),
  notes: z.string().optional().nullable(),
});

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

export async function GET(
  _request: NextRequest,
  { params }: RouteContext
) {
  const { user, response } = await requireAuth();

  if (!user) {
    return response;
  }

  const { id } = await params;

  if (!/^\d+$/.test(id)) {
    return NextResponse.json(
      {
        success: false,
        message: "Invalid customer ID.",
      },
      { status: 400 }
    );
  }

  try {
    const result = await pool.query(
      `
      SELECT
        c.id,
        c.customer_code,
        c.customer_name,
        c.mobile,
        c.alternate_mobile,
        c.email,
        c.address,
        c.city,
        c.district,
        c.state,
        c.pincode,
        c.customer_type,
        c.status,
        c.notes,
        c.created_at,
        c.updated_at,

        COUNT(
          CASE
            WHEN l.converted_customer_id = c.id
            THEN 1
          END
        )::int AS converted_leads_count

      FROM customers c
      LEFT JOIN leads l
        ON l.converted_customer_id = c.id

      WHERE c.id = $1

      GROUP BY
        c.id,
        c.customer_code,
        c.customer_name,
        c.mobile,
        c.alternate_mobile,
        c.email,
        c.address,
        c.city,
        c.district,
        c.state,
        c.pincode,
        c.customer_type,
        c.status,
        c.notes,
        c.created_at,
        c.updated_at
      `,
      [id]
    );

    if (result.rows.length === 0) {
      return NextResponse.json(
        {
          success: false,
          message: "Customer not found.",
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: result.rows[0],
    });
  } catch (error) {
    console.error("GET CUSTOMER ERROR:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to fetch customer.",
      },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: RouteContext
) {
  const { user, response } = await requireAuth();

  if (!user) {
    return response;
  }

  const { id } = await params;

  if (!/^\d+$/.test(id)) {
    return NextResponse.json(
      {
        success: false,
        message: "Invalid customer ID.",
      },
      { status: 400 }
    );
  }

  try {
    const body = await request.json();

    const parsed = customerSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid customer data.",
          errors: parsed.error.flatten(),
        },
        { status: 400 }
      );
    }

    const data = parsed.data;

    const existingCustomer = await pool.query(
      `
      SELECT id
      FROM customers
      WHERE id = $1
      `,
      [id]
    );

    if (existingCustomer.rows.length === 0) {
      return NextResponse.json(
        {
          success: false,
          message: "Customer not found.",
        },
        { status: 404 }
      );
    }

    const duplicateMobile = await pool.query(
      `
      SELECT id
      FROM customers
      WHERE mobile = $1
        AND id <> $2
        AND status = 'ACTIVE'
      LIMIT 1
      `,
      [data.mobile, id]
    );

    if (duplicateMobile.rows.length > 0) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Another active customer already exists with this mobile number.",
        },
        { status: 409 }
      );
    }

    const result = await pool.query(
      `
      UPDATE customers
      SET
        customer_name = $1,
        mobile = $2,
        alternate_mobile = $3,
        email = $4,
        address = $5,
        city = $6,
        district = $7,
        state = $8,
        pincode = $9,
        customer_type = $10,
        status = $11,
        notes = $12,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $13
      RETURNING
        id,
        customer_code,
        customer_name,
        mobile,
        alternate_mobile,
        email,
        address,
        city,
        district,
        state,
        pincode,
        customer_type,
        status,
        notes,
        created_at,
        updated_at
      `,
      [
        data.customerName,
        data.mobile,
        data.alternateMobile || null,
        data.email || null,
        data.address || null,
        data.city || null,
        data.district || null,
        data.state || null,
        data.pincode || null,
        data.customerType,
        data.status,
        data.notes || null,
        id,
      ]
    );

    return NextResponse.json({
      success: true,
      message: "Customer updated successfully.",
      data: result.rows[0],
    });
  } catch (error) {
    console.error("UPDATE CUSTOMER ERROR:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to update customer.",
      },
      { status: 500 }
    );
  }
}