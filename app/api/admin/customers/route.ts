import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { pool } from "@/lib/db/db";
import { requireAuth } from "@/lib/auth/require-auth";

const customerSchema = z.object({
  customerName: z
    .string()
    .trim()
    .min(1, "Customer name is required"),

  mobile: z
    .string()
    .trim()
    .min(1, "Mobile number is required"),

  alternateMobile: z
    .string()
    .trim()
    .optional()
    .or(z.literal("")),

  email: z
    .string()
    .trim()
    .email("Invalid email")
    .optional()
    .or(z.literal("")),

  address: z
    .string()
    .trim()
    .optional()
    .or(z.literal("")),

  city: z
    .string()
    .trim()
    .optional()
    .or(z.literal("")),

  district: z
    .string()
    .trim()
    .optional()
    .or(z.literal("")),

  state: z
    .string()
    .trim()
    .optional()
    .or(z.literal("")),

  pincode: z
    .string()
    .trim()
    .optional()
    .or(z.literal("")),

  customerType: z.enum([
    "RESIDENTIAL",
    "COMMERCIAL",
    "INDUSTRIAL",
    "GOVERNMENT",
  ]),

  status: z.enum([
    "ACTIVE",
    "INACTIVE",
  ]),

  notes: z
    .string()
    .trim()
    .optional()
    .or(z.literal("")),
});

/*
 * GET /api/admin/customers
 */
export async function GET(
  request: NextRequest
) {
  const auth = await requireAuth();

  if (auth.response) {
    return auth.response;
  }

  try {
    const { searchParams } =
      new URL(request.url);

    const search =
      searchParams.get("search")?.trim() || "";

    const status =
      searchParams.get("status") || "ALL";

    const customerType =
      searchParams.get("customerType") || "ALL";

    const conditions: string[] = [];
    const values: string[] = [];

    if (search) {
      values.push(`%${search}%`);

      conditions.push(`
        (
          c.customer_code ILIKE $${values.length}
          OR c.customer_name ILIKE $${values.length}
          OR c.mobile ILIKE $${values.length}
          OR COALESCE(c.email, '') ILIKE $${values.length}
          OR COALESCE(c.city, '') ILIKE $${values.length}
          OR COALESCE(c.district, '') ILIKE $${values.length}
        )
      `);
    }

    if (status !== "ALL") {
      values.push(status);

      conditions.push(
        `c.status = $${values.length}`
      );
    }

    if (customerType !== "ALL") {
      values.push(customerType);

      conditions.push(
        `c.customer_type = $${values.length}`
      );
    }

    const whereClause =
      conditions.length > 0
        ? `WHERE ${conditions.join(" AND ")}`
        : "";

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

        (
          SELECT COUNT(*)
          FROM leads l
          WHERE l.converted_customer_id = c.id
        ) AS converted_leads_count

      FROM customers c

      ${whereClause}

      ORDER BY c.created_at DESC
      `,
      values
    );

    return NextResponse.json({
      success: true,
      data: result.rows,
      count: result.rows.length,
    });
  } catch (error) {
    console.error(
      "GET customers error:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        message: "Failed to fetch customers",
      },
      { status: 500 }
    );
  }
}

/*
 * POST /api/admin/customers
 *
 * Creates a customer manually.
 */
export async function POST(
  request: NextRequest
) {
  const auth = await requireAuth();

  if (auth.response) {
    return auth.response;
  }

  try {
    const body = await request.json();

    const validation =
      customerSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        {
          success: false,
          message: "Validation failed",
          errors:
            validation.error.flatten()
              .fieldErrors,
        },
        { status: 400 }
      );
    }

    const data = validation.data;

    /*
     * Check duplicate mobile
     */
    const duplicate =
      await pool.query(
        `
        SELECT
          id,
          customer_code,
          customer_name,
          mobile
        FROM customers
        WHERE mobile = $1
          AND status = 'ACTIVE'
        LIMIT 1
        `,
        [data.mobile]
      );

    if (duplicate.rows.length > 0) {
      return NextResponse.json(
        {
          success: false,
          message:
            "An active customer with this mobile number already exists",
          existing_customer:
            duplicate.rows[0],
        },
        { status: 409 }
      );
    }

    /*
     * Generate customer code
     */
    const sequenceResult =
      await pool.query(`
        SELECT nextval(
          'customers_id_seq'
        ) AS id
      `);

    const customerId =
      sequenceResult.rows[0].id;

    const customerCode =
      `CUST-${String(customerId).padStart(
        6,
        "0"
      )}`;

    /*
     * Insert customer
     */
    const result =
      await pool.query(
        `
        INSERT INTO customers (
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
          $14
        )
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
          customerId,
          customerCode,
          data.customerName,
          data.mobile,
          data.alternateMobile ||
            null,
          data.email || null,
          data.address || null,
          data.city || null,
          data.district || null,
          data.state || null,
          data.pincode || null,
          data.customerType,
          data.status,
          data.notes || null,
        ]
      );

    return NextResponse.json(
      {
        success: true,
        message:
          "Customer created successfully",
        data: result.rows[0],
      },
      { status: 201 }
    );
  } catch (error) {
    console.error(
      "POST customer error:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        message:
          "Failed to create customer",
      },
      { status: 500 }
    );
  }
}