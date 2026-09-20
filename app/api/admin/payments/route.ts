import { NextRequest, NextResponse } from "next/server";
import { pool } from "@/lib/db/db";
import { requireAuth } from "@/lib/auth/require-auth";

const VALID_PAYMENT_METHODS = [
  "CASH",
  "UPI",
  "BANK_TRANSFER",
  "CARD",
  "CHEQUE",
  "OTHER",
];

function toNumber(value: unknown, defaultValue = 0) {
  const number = Number(value);
  return Number.isFinite(number) ? number : defaultValue;
}

// ============================================================
// GET - Payment List
// ============================================================

export async function GET(request: NextRequest) {
  const { response } = await requireAuth();

  if (response) {
    return response;
  }

  try {
    const { searchParams } = new URL(request.url);

    const search = searchParams.get("search")?.trim() || "";

    const paymentMethod =
      searchParams.get("paymentMethod")?.trim() || "";

    const values: unknown[] = [];
    const conditions: string[] = [];

    if (search) {
      values.push(`%${search}%`);

      conditions.push(`
        (
          p.payment_number ILIKE $${values.length}
          OR i.invoice_number ILIKE $${values.length}
          OR c.customer_name ILIKE $${values.length}
          OR c.customer_code ILIKE $${values.length}
          OR c.mobile ILIKE $${values.length}
          OR COALESCE(p.transaction_reference, '') ILIKE $${values.length}
        )
      `);
    }

    if (paymentMethod) {
      values.push(paymentMethod);

      conditions.push(
        `p.payment_method = $${values.length}`
      );
    }

    const whereClause =
      conditions.length > 0
        ? `WHERE ${conditions.join(" AND ")}`
        : "";

    const result = await pool.query(
      `
      SELECT
        p.id,
        p.payment_number,

        p.invoice_id,
        i.invoice_number,

        p.customer_id,
        c.customer_code,
        c.customer_name,
        c.mobile AS customer_mobile,

        p.payment_date,
        p.amount,
        p.payment_method,
        p.transaction_reference,
        p.notes,

        p.received_by,
        p.created_at,
        p.updated_at

      FROM payments p

      INNER JOIN invoices i
        ON i.id = p.invoice_id

      INNER JOIN customers c
        ON c.id = p.customer_id

      ${whereClause}

      ORDER BY p.id DESC
      `,
      values
    );

    return NextResponse.json({
      success: true,
      data: result.rows,
      count: result.rows.length,
    });
  } catch (error) {
    console.error("GET payments error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to fetch payments",
      },
      { status: 500 }
    );
  }
}

// ============================================================
// POST - Create Payment
// ============================================================

export async function POST(request: NextRequest) {
  const { user, response } = await requireAuth();

  if (response) {
    return response;
  }

  const client = await pool.connect();

  try {
    const body = await request.json();

    const invoiceId = Number(body.invoiceId);

    const amount = toNumber(body.amount);

    const paymentDate =
      body.paymentDate ||
      new Date().toISOString().split("T")[0];

    const paymentMethod =
      String(body.paymentMethod || "").trim();

    const transactionReference =
      body.transactionReference?.trim() || null;

    const notes =
      body.notes?.trim() || null;

    // ========================================================
    // Validation
    // ========================================================

    if (!Number.isInteger(invoiceId) || invoiceId <= 0) {
      return NextResponse.json(
        {
          success: false,
          message: "Valid invoice is required",
        },
        { status: 400 }
      );
    }

    if (amount <= 0) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Payment amount must be greater than zero",
        },
        { status: 400 }
      );
    }

    if (!VALID_PAYMENT_METHODS.includes(paymentMethod)) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid payment method",
        },
        { status: 400 }
      );
    }

    // ========================================================
    // BEGIN TRANSACTION
    // ========================================================

    await client.query("BEGIN");

    // ========================================================
    // Lock Invoice
    // ========================================================

    const invoiceResult = await client.query(
      `
      SELECT
        id,
        invoice_number,
        customer_id,
        total_amount,
        status
      FROM invoices
      WHERE id = $1
      FOR UPDATE
      `,
      [invoiceId]
    );

    if (invoiceResult.rowCount === 0) {
      await client.query("ROLLBACK");

      return NextResponse.json(
        {
          success: false,
          message: "Invoice not found",
        },
        { status: 404 }
      );
    }

    const invoice = invoiceResult.rows[0];

    // ========================================================
    // Cancelled Invoice Check
    // ========================================================

    if (invoice.status === "CANCELLED") {
      await client.query("ROLLBACK");

      return NextResponse.json(
        {
          success: false,
          message:
            "Payment cannot be added to a cancelled invoice",
        },
        { status: 400 }
      );
    }

    const totalAmount = Number(invoice.total_amount);

    // ========================================================
    // IMPORTANT:
    // Calculate ACTUAL paid amount from payments table
    // ========================================================

    const paymentTotalResult = await client.query(
      `
      SELECT
        COALESCE(SUM(amount), 0) AS total_paid
      FROM payments
      WHERE invoice_id = $1
      `,
      [invoiceId]
    );

    const currentPaidAmount = Number(
      paymentTotalResult.rows[0].total_paid || 0
    );

    const currentPendingAmount = Math.max(
      totalAmount - currentPaidAmount,
      0
    );

    // ========================================================
    // Payment Amount Validation
    // ========================================================

    if (amount > currentPendingAmount) {
      await client.query("ROLLBACK");

      return NextResponse.json(
        {
          success: false,
          message: `Payment cannot exceed pending amount of ₹${currentPendingAmount.toFixed(
            2
          )}`,
        },
        { status: 400 }
      );
    }

    // ========================================================
    // New Invoice Amounts
    // ========================================================

    const newPaidAmount =
      currentPaidAmount + amount;

    const newPendingAmount = Math.max(
      totalAmount - newPaidAmount,
      0
    );

    // ========================================================
    // Calculate Invoice Status
    // ========================================================

    let newInvoiceStatus = "ISSUED";

    if (newPaidAmount >= totalAmount) {
      newInvoiceStatus = "PAID";
    } else if (newPaidAmount > 0) {
      newInvoiceStatus = "PARTIALLY_PAID";
    }

    // ========================================================
    // Generate Payment Number
    // ========================================================

    const sequenceResult = await client.query(
      `
      SELECT nextval(
        pg_get_serial_sequence('payments', 'id')
      ) AS next_id
      `
    );

    const nextId = Number(
      sequenceResult.rows[0].next_id
    );

    const paymentNumber =
      `PAY-${String(nextId).padStart(6, "0")}`;

    // ========================================================
    // Insert Payment
    // ========================================================

    const paymentResult = await client.query(
      `
      INSERT INTO payments (
        payment_number,
        invoice_id,
        customer_id,
        payment_date,
        amount,
        payment_method,
        transaction_reference,
        notes,
        received_by
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
        $9
      )
      RETURNING *
      `,
      [
        paymentNumber,
        invoiceId,
        invoice.customer_id,
        paymentDate,
        amount,
        paymentMethod,
        transactionReference,
        notes,
        user!.userId,
      ]
    );

    // ========================================================
    // Update Invoice
    // ========================================================

    const invoiceUpdateResult =
      await client.query(
        `
        UPDATE invoices
        SET
          paid_amount = $1,
          pending_amount = $2,
          status = $3,
          updated_at = CURRENT_TIMESTAMP
        WHERE id = $4
        RETURNING
          id,
          invoice_number,
          total_amount,
          paid_amount,
          pending_amount,
          status
        `,
        [
          newPaidAmount,
          newPendingAmount,
          newInvoiceStatus,
          invoiceId,
        ]
      );

    if (invoiceUpdateResult.rowCount === 0) {
      throw new Error(
        "Invoice update failed after payment creation"
      );
    }

    // ========================================================
    // COMMIT
    // ========================================================

    await client.query("COMMIT");

    const updatedInvoice =
      invoiceUpdateResult.rows[0];

    return NextResponse.json(
      {
        success: true,
        message:
          "Payment created and invoice updated successfully",

        data: {
          payment: paymentResult.rows[0],

          invoice: updatedInvoice,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    await client.query("ROLLBACK");

    console.error(
      "POST payment error:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        message: "Failed to create payment",
      },
      { status: 500 }
    );
  } finally {
    client.release();
  }
}