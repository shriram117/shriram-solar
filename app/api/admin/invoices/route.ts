import { NextRequest, NextResponse } from "next/server";
import { pool } from "@/lib/db/db";
import { requireAuth } from "@/lib/auth/require-auth";

const VALID_STATUSES = [
  "DRAFT",
  "ISSUED",
  "PARTIALLY_PAID",
  "PAID",
  "OVERDUE",
  "CANCELLED",
];

function toNumber(value: unknown, defaultValue = 0) {
  const number = Number(value);
  return Number.isFinite(number) ? number : defaultValue;
}

// ============================================================
// GET - Invoice List
// ============================================================

export async function GET(request: NextRequest) {
  const { user, response } = await requireAuth();

  if (response) {
    return response;
  }

  try {
    const { searchParams } = new URL(request.url);

    const search = searchParams.get("search")?.trim() || "";
    const status = searchParams.get("status")?.trim() || "";

    const values: unknown[] = [];
    const conditions: string[] = [];

    if (search) {
      values.push(`%${search}%`);

      conditions.push(`
        (
          i.invoice_number ILIKE $${values.length}
          OR c.customer_name ILIKE $${values.length}
          OR c.customer_code ILIKE $${values.length}
          OR c.mobile ILIKE $${values.length}
        )
      `);
    }

    if (status) {
      values.push(status);
      conditions.push(`i.status = $${values.length}`);
    }

    const whereClause =
      conditions.length > 0
        ? `WHERE ${conditions.join(" AND ")}`
        : "";

    const result = await pool.query(
      `
      SELECT
        i.id,
        i.invoice_number,

        i.customer_id,
        c.customer_code,
        c.customer_name,
        c.mobile AS customer_mobile,

        i.service_job_id,
        sj.job_code,

        i.invoice_date,
        i.due_date,

        i.subtotal,
        i.discount_amount,
        i.tax_amount,
        i.total_amount,
        i.paid_amount,
        i.pending_amount,

        i.status,
        i.notes,

        i.created_by,
        i.created_at,
        i.updated_at

      FROM invoices i

      INNER JOIN customers c
        ON c.id = i.customer_id

      LEFT JOIN service_jobs sj
        ON sj.id = i.service_job_id

      ${whereClause}

      ORDER BY i.id DESC
      `,
      values
    );

    return NextResponse.json({
      success: true,
      data: result.rows,
      count: result.rows.length,
    });
  } catch (error) {
    console.error("GET invoices error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to fetch invoices",
      },
      { status: 500 }
    );
  }
}

// ============================================================
// POST - Create Invoice
// ============================================================

export async function POST(request: NextRequest) {
  const { user, response } = await requireAuth();

  if (response) {
    return response;
  }

  try {
    const body = await request.json();

    const customerId = Number(body.customerId);
    const serviceJobId = body.serviceJobId
      ? Number(body.serviceJobId)
      : null;

    const invoiceDate =
      body.invoiceDate || new Date().toISOString().split("T")[0];

    const dueDate = body.dueDate || null;

    const subtotal = toNumber(body.subtotal);
    const discountAmount = toNumber(body.discountAmount);
    const taxAmount = toNumber(body.taxAmount);

    const notes = body.notes?.trim() || null;

    if (!Number.isInteger(customerId) || customerId <= 0) {
      return NextResponse.json(
        {
          success: false,
          message: "Valid customer is required",
        },
        { status: 400 }
      );
    }

    if (subtotal < 0) {
      return NextResponse.json(
        {
          success: false,
          message: "Subtotal cannot be negative",
        },
        { status: 400 }
      );
    }

    if (discountAmount < 0) {
      return NextResponse.json(
        {
          success: false,
          message: "Discount cannot be negative",
        },
        { status: 400 }
      );
    }

    if (taxAmount < 0) {
      return NextResponse.json(
        {
          success: false,
          message: "Tax cannot be negative",
        },
        { status: 400 }
      );
    }

    if (discountAmount > subtotal) {
      return NextResponse.json(
        {
          success: false,
          message: "Discount cannot be greater than subtotal",
        },
        { status: 400 }
      );
    }

    // --------------------------------------------------------
    // Customer validation
    // --------------------------------------------------------

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

    if (customerResult.rowCount === 0) {
      return NextResponse.json(
        {
          success: false,
          message: "Customer not found",
        },
        { status: 404 }
      );
    }

    // --------------------------------------------------------
    // Service Job validation
    // --------------------------------------------------------

    if (serviceJobId) {
      const serviceJobResult = await pool.query(
        `
        SELECT
          id,
          job_code,
          customer_id,
          service_charge
        FROM service_jobs
        WHERE id = $1
        `,
        [serviceJobId]
      );

      if (serviceJobResult.rowCount === 0) {
        return NextResponse.json(
          {
            success: false,
            message: "Service Job not found",
          },
          { status: 404 }
        );
      }

      const serviceJob = serviceJobResult.rows[0];

      if (Number(serviceJob.customer_id) !== customerId) {
        return NextResponse.json(
          {
            success: false,
            message: "Service Job does not belong to selected customer",
          },
          { status: 400 }
        );
      }
    }

    // --------------------------------------------------------
    // Calculate total
    // --------------------------------------------------------

    const totalAmount =
      subtotal - discountAmount + taxAmount;

    if (totalAmount < 0) {
      return NextResponse.json(
        {
          success: false,
          message: "Total amount cannot be negative",
        },
        { status: 400 }
      );
    }

    const paidAmount = 0;
    const pendingAmount = totalAmount;

    // --------------------------------------------------------
    // Generate Invoice Number
    // --------------------------------------------------------

    const sequenceResult = await pool.query(
      `
      SELECT nextval(
        pg_get_serial_sequence('invoices', 'id')
      ) AS next_id
      `
    );

    const nextId = Number(sequenceResult.rows[0].next_id);

    const invoiceNumber =
      `INV-${String(nextId).padStart(6, "0")}`;

    // --------------------------------------------------------
    // Insert Invoice
    // --------------------------------------------------------

    const result = await pool.query(
      `
      INSERT INTO invoices (
        invoice_number,
        customer_id,
        service_job_id,
        invoice_date,
        due_date,
        subtotal,
        discount_amount,
        tax_amount,
        total_amount,
        paid_amount,
        pending_amount,
        status,
        notes,
        created_by
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
      RETURNING *
      `,
      [
        invoiceNumber,
        customerId,
        serviceJobId,
        invoiceDate,
        dueDate,
        subtotal,
        discountAmount,
        taxAmount,
        totalAmount,
        paidAmount,
        pendingAmount,
        "ISSUED",
        notes,
        user!.userId,
      ]
    );

    return NextResponse.json(
      {
        success: true,
        message: "Invoice created successfully",
        data: result.rows[0],
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("POST invoice error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to create invoice",
      },
      { status: 500 }
    );
  }
}