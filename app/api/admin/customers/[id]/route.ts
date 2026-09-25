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

/* -------------------------------------------------------------------------- */
/* Helper: Check Customer Dependencies                                        */
/* -------------------------------------------------------------------------- */

async function getCustomerDependencies(customerId: string) {
  const result = await pool.query(
    `
    SELECT
      EXISTS (
        SELECT 1
        FROM invoices
        WHERE customer_id = $1
      ) AS has_invoices,

      EXISTS (
        SELECT 1
        FROM payments p
        INNER JOIN invoices i
          ON i.id = p.invoice_id
        WHERE i.customer_id = $1
      ) AS has_payments,

      EXISTS (
        SELECT 1
        FROM service_jobs
        WHERE customer_id = $1
      ) AS has_service_jobs,

      EXISTS (
        SELECT 1
        FROM solar_systems
        WHERE customer_id = $1
      ) AS has_solar_systems
    `,
    [customerId]
  );

  return result.rows[0];
}

/* -------------------------------------------------------------------------- */
/* GET CUSTOMER                                                               */
/* -------------------------------------------------------------------------- */

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

/* -------------------------------------------------------------------------- */
/* PATCH CUSTOMER                                                             */
/* -------------------------------------------------------------------------- */

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

    /* ---------------------------------------------------------------------- */
    /* Check Customer Exists                                                   */
    /* ---------------------------------------------------------------------- */

    const existingCustomer = await pool.query(
      `
      SELECT
        id,
        status
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

    /* ---------------------------------------------------------------------- */
    /* Check Duplicate Mobile                                                 */
    /* ---------------------------------------------------------------------- */

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

    /* ---------------------------------------------------------------------- */
    /* Protected Customer Check                                               */
    /* ---------------------------------------------------------------------- */

    if (data.status === "INACTIVE") {
      const dependencies =
        await getCustomerDependencies(id);

      const hasDependency =
        dependencies.has_invoices ||
        dependencies.has_payments ||
        dependencies.has_service_jobs ||
        dependencies.has_solar_systems;

      if (hasDependency) {
        return NextResponse.json(
          {
            success: false,
            message:
              "Customer cannot be marked inactive because transaction or service records exist.",
            details: {
              has_invoices:
                dependencies.has_invoices,

              has_payments:
                dependencies.has_payments,

              has_service_jobs:
                dependencies.has_service_jobs,

              has_solar_systems:
                dependencies.has_solar_systems,
            },
          },
          { status: 409 }
        );
      }
    }

    /* ---------------------------------------------------------------------- */
    /* Update Customer                                                         */
    /* ---------------------------------------------------------------------- */

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

/* -------------------------------------------------------------------------- */
/* DELETE CUSTOMER                                                            */
/* -------------------------------------------------------------------------- */

export async function DELETE(
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
    /* ---------------------------------------------------------------------- */
    /* Check Customer Exists                                                   */
    /* ---------------------------------------------------------------------- */

    const existingCustomer = await pool.query(
      `
      SELECT
        id,
        customer_code,
        customer_name,
        status
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

    const customer =
      existingCustomer.rows[0];

    /* ---------------------------------------------------------------------- */
    /* Check Dependencies                                                      */
    /* ---------------------------------------------------------------------- */

    const dependencies =
      await getCustomerDependencies(id);

    const hasDependency =
      dependencies.has_invoices ||
      dependencies.has_payments ||
      dependencies.has_service_jobs ||
      dependencies.has_solar_systems;

    if (hasDependency) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Customer cannot be deleted because transaction or service records exist.",
          details: {
            customer_code:
              customer.customer_code,

            customer_name:
              customer.customer_name,

            has_invoices:
              dependencies.has_invoices,

            has_payments:
              dependencies.has_payments,

            has_service_jobs:
              dependencies.has_service_jobs,

            has_solar_systems:
              dependencies.has_solar_systems,
          },
        },
        { status: 409 }
      );
    }

    /* ---------------------------------------------------------------------- */
    /* Delete Customer                                                         */
    /* ---------------------------------------------------------------------- */

    await pool.query(
      `
      DELETE FROM customers
      WHERE id = $1
      `,
      [id]
    );

    return NextResponse.json({
      success: true,
      message: "Customer deleted successfully.",
    });
  } catch (error) {
    console.error("DELETE CUSTOMER ERROR:", error);

    return NextResponse.json(
      {
        success: false,
        message:
          "Customer cannot be deleted because related records exist.",
      },
      { status: 409 }
    );
  }
}