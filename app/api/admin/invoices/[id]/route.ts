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
// GET - Invoice Details
// ============================================================

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { response } = await requireAuth();

  if (response) {
    return response;
  }

  try {
    const { id } = await context.params;
    const invoiceId = Number(id);

    if (!Number.isInteger(invoiceId) || invoiceId <= 0) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid invoice id",
        },
        { status: 400 }
      );
    }

    const result = await pool.query(
      `
      SELECT
        i.id,
        i.invoice_number,

        i.customer_id,
        c.customer_code,
        c.customer_name,
        c.mobile AS customer_mobile,
        c.email AS customer_email,
        c.address AS customer_address,

        i.service_job_id,
        sj.job_code,
        sj.service_type,
        sj.service_charge,

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

      WHERE i.id = $1
      `,
      [invoiceId]
    );

    if (result.rowCount === 0) {
      return NextResponse.json(
        {
          success: false,
          message: "Invoice not found",
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: result.rows[0],
    });
  } catch (error) {
    console.error("GET invoice error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to fetch invoice",
      },
      { status: 500 }
    );
  }
}

// ============================================================
// PATCH - Update Invoice
// ============================================================

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { response } = await requireAuth();

  if (response) {
    return response;
  }

  try {
    const { id } = await context.params;
    const invoiceId = Number(id);

    if (!Number.isInteger(invoiceId) || invoiceId <= 0) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid invoice id",
        },
        { status: 400 }
      );
    }

    const body = await request.json();

    // --------------------------------------------------------
    // Existing invoice
    // --------------------------------------------------------

    const existingResult = await pool.query(
      `
      SELECT
        id,
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
        notes
      FROM invoices
      WHERE id = $1
      `,
      [invoiceId]
    );

    if (existingResult.rowCount === 0) {
      return NextResponse.json(
        {
          success: false,
          message: "Invoice not found",
        },
        { status: 404 }
      );
    }

    const existing = existingResult.rows[0];

    // --------------------------------------------------------
    // Values
    // --------------------------------------------------------

    const customerId =
      body.customerId !== undefined
        ? Number(body.customerId)
        : Number(existing.customer_id);

    const serviceJobId =
      body.serviceJobId !== undefined
        ? body.serviceJobId
          ? Number(body.serviceJobId)
          : null
        : existing.service_job_id;

    const invoiceDate =
      body.invoiceDate !== undefined
        ? body.invoiceDate || null
        : existing.invoice_date;

    const dueDate =
      body.dueDate !== undefined
        ? body.dueDate || null
        : existing.due_date;

    const subtotal =
      body.subtotal !== undefined
        ? toNumber(body.subtotal)
        : Number(existing.subtotal);

    const discountAmount =
      body.discountAmount !== undefined
        ? toNumber(body.discountAmount)
        : Number(existing.discount_amount);

    const taxAmount =
      body.taxAmount !== undefined
        ? toNumber(body.taxAmount)
        : Number(existing.tax_amount);

    const notes =
      body.notes !== undefined
        ? body.notes?.trim() || null
        : existing.notes;

    const status =
      body.status !== undefined
        ? String(body.status)
        : existing.status;

    // --------------------------------------------------------
    // Validation
    // --------------------------------------------------------

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

    if (!VALID_STATUSES.includes(status)) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid invoice status",
        },
        { status: 400 }
      );
    }

    // --------------------------------------------------------
    // Customer validation
    // --------------------------------------------------------

    const customerResult = await pool.query(
      `
      SELECT id
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
          customer_id
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
    // Recalculate amounts
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

    const paidAmount = Number(existing.paid_amount);

    if (paidAmount > totalAmount) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Invoice total cannot be less than already paid amount",
        },
        { status: 400 }
      );
    }

    const pendingAmount =
      Math.max(totalAmount - paidAmount, 0);

    // --------------------------------------------------------
    // Automatically determine payment status
    // --------------------------------------------------------

    let finalStatus = status;

    if (status !== "CANCELLED" && status !== "DRAFT") {
      if (paidAmount === 0) {
        finalStatus = "ISSUED";
      } else if (paidAmount < totalAmount) {
        finalStatus = "PARTIALLY_PAID";
      } else {
        finalStatus = "PAID";
      }
    }

    // --------------------------------------------------------
    // Update
    // --------------------------------------------------------

    const result = await pool.query(
      `
      UPDATE invoices
      SET
        customer_id = $1,
        service_job_id = $2,
        invoice_date = $3,
        due_date = $4,
        subtotal = $5,
        discount_amount = $6,
        tax_amount = $7,
        total_amount = $8,
        paid_amount = $9,
        pending_amount = $10,
        status = $11,
        notes = $12,
        updated_at = CURRENT_TIMESTAMP

      WHERE id = $13

      RETURNING *
      `,
      [
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
        finalStatus,
        notes,
        invoiceId,
      ]
    );

    return NextResponse.json({
      success: true,
      message: "Invoice updated successfully",
      data: result.rows[0],
    });
  } catch (error) {
    console.error("PATCH invoice error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to update invoice",
      },
      { status: 500 }
    );
  }
}