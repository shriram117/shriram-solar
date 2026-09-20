import { NextResponse } from "next/server";
import { pool } from "@/lib/db/db";
import { requireAuth } from "@/lib/auth/require-auth";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

export async function POST(
  request: Request,
  { params }: RouteContext
) {
  const auth = await requireAuth();

  if (auth.response) {
    return auth.response;
  }

  const client = await pool.connect();

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

    await client.query("BEGIN");

    /*
     * Lock the lead row so that two users cannot
     * convert the same lead at the same time.
     */
    const leadResult = await client.query(
      `
      SELECT
        id,
        lead_code,
        customer_name,
        mobile,
        email,
        city,
        district,
        status,
        converted_customer_id,
        notes
      FROM leads
      WHERE id = $1
      FOR UPDATE
      `,
      [leadId]
    );

    if (leadResult.rows.length === 0) {
      await client.query("ROLLBACK");

      return NextResponse.json(
        {
          success: false,
          message: "Lead not found",
        },
        { status: 404 }
      );
    }

    const lead = leadResult.rows[0];

    /*
     * Prevent duplicate conversion.
     */
    if (lead.converted_customer_id) {
      await client.query("ROLLBACK");

      return NextResponse.json(
        {
          success: false,
          message: "Lead has already been converted to customer",
          customer_id: lead.converted_customer_id,
        },
        { status: 409 }
      );
    }

    /*
     * Lost / cancelled leads should not be converted.
     */
    if (
      lead.status === "LOST" ||
      lead.status === "CANCELLED"
    ) {
      await client.query("ROLLBACK");

      return NextResponse.json(
        {
          success: false,
          message: `Lead with status ${lead.status} cannot be converted to customer`,
        },
        { status: 400 }
      );
    }

    /*
     * Check whether the same mobile already belongs
     * to an active customer.
     *
     * We do not automatically merge customers.
     * Instead, return a conflict so the admin can
     * decide later.
     */
    const existingCustomer = await client.query(
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
      [lead.mobile]
    );

    if (existingCustomer.rows.length > 0) {
      await client.query("ROLLBACK");

      return NextResponse.json(
        {
          success: false,
          message:
            "A customer with this mobile number already exists",
          existing_customer: existingCustomer.rows[0],
        },
        { status: 409 }
      );
    }

    /*
     * Generate Customer ID and Customer Code
     * from the PostgreSQL customers sequence.
     *
     * Example:
     * CUST-000001
     */
    const customerResult = await client.query(
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
        nextval('customers_id_seq'),
        'CUST-' || LPAD(currval('customers_id_seq')::text, 6, '0'),
        $1,
        $2,
        NULL,
        $3,
        NULL,
        $4,
        $5,
        NULL,
        NULL,
        'RESIDENTIAL',
        'ACTIVE',
        $6
      )
      RETURNING
        id,
        customer_code,
        customer_name,
        mobile,
        email,
        city,
        district,
        customer_type,
        status,
        created_at
      `,
      [
        lead.customer_name,
        lead.mobile,
        lead.email || null,
        lead.city || null,
        lead.district || null,
        lead.notes || null,
      ]
    );

    const customer = customerResult.rows[0];

    /*
     * Link customer back to lead
     * and change lead status to CONVERTED.
     */
    const updatedLeadResult = await client.query(
      `
      UPDATE leads
      SET
        converted_customer_id = $1,
        status = 'CONVERTED',
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $2
      RETURNING
        id,
        lead_code,
        status,
        converted_customer_id,
        updated_at
      `,
      [customer.id, leadId]
    );

    await client.query("COMMIT");

    return NextResponse.json(
      {
        success: true,
        message: "Lead converted to customer successfully",
        data: {
          lead: updatedLeadResult.rows[0],
          customer,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    await client.query("ROLLBACK");

    console.error(
      "Convert lead to customer error:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        message:
          "Failed to convert lead to customer",
      },
      { status: 500 }
    );
  } finally {
    client.release();
  }
}