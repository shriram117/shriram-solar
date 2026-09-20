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
// GET - Payment Details
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
    const paymentId = Number(id);

    if (!Number.isInteger(paymentId) || paymentId <= 0) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid payment id",
        },
        { status: 400 }
      );
    }

    const result = await pool.query(
      `
      SELECT
        p.id,
        p.payment_number,

        p.invoice_id,
        i.invoice_number,
        i.total_amount AS invoice_total_amount,
        i.paid_amount AS invoice_paid_amount,
        i.pending_amount AS invoice_pending_amount,
        i.status AS invoice_status,

        p.customer_id,
        c.customer_code,
        c.customer_name,
        c.mobile AS customer_mobile,
        c.email AS customer_email,

        p.payment_date,
        p.amount,
        p.payment_method,
        p.transaction_reference,
        p.notes,

        p.received_by,
        u.full_name AS received_by_name,

        p.created_at,
        p.updated_at

      FROM payments p

      INNER JOIN invoices i
        ON i.id = p.invoice_id

      INNER JOIN customers c
        ON c.id = p.customer_id

      LEFT JOIN users u
        ON u.id = p.received_by

      WHERE p.id = $1
      `,
      [paymentId]
    );

    if (result.rowCount === 0) {
      return NextResponse.json(
        {
          success: false,
          message: "Payment not found",
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: result.rows[0],
    });
  } catch (error) {
    console.error("GET payment error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to fetch payment",
      },
      { status: 500 }
    );
  }
}

// ============================================================
// PATCH - Update Payment
// ============================================================

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { user, response } = await requireAuth();

  if (response) {
    return response;
  }

  const client = await pool.connect();

  try {
    const { id } = await context.params;
    const paymentId = Number(id);

    if (!Number.isInteger(paymentId) || paymentId <= 0) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid payment id",
        },
        { status: 400 }
      );
    }

    const body = await request.json();

    await client.query("BEGIN");

    // --------------------------------------------------------
    // Lock existing payment
    // --------------------------------------------------------

    const existingPaymentResult = await client.query(
      `
      SELECT
        id,
        payment_number,
        invoice_id,
        customer_id,
        payment_date,
        amount,
        payment_method,
        transaction_reference,
        notes
      FROM payments
      WHERE id = $1
      FOR UPDATE
      `,
      [paymentId]
    );

    if (existingPaymentResult.rowCount === 0) {
      await client.query("ROLLBACK");

      return NextResponse.json(
        {
          success: false,
          message: "Payment not found",
        },
        { status: 404 }
      );
    }

    const existingPayment =
      existingPaymentResult.rows[0];

    const invoiceId = Number(
      existingPayment.invoice_id
    );

    // --------------------------------------------------------
    // Lock invoice
    // --------------------------------------------------------

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
          message: "Related invoice not found",
        },
        { status: 404 }
      );
    }

    const invoice = invoiceResult.rows[0];

    // --------------------------------------------------------
    // Invoice validation
    // --------------------------------------------------------

    if (invoice.status === "CANCELLED") {
      await client.query("ROLLBACK");

      return NextResponse.json(
        {
          success: false,
          message:
            "Payment cannot be updated because invoice is cancelled",
        },
        { status: 400 }
      );
    }

    // --------------------------------------------------------
    // Updated values
    // --------------------------------------------------------

    const amount =
      body.amount !== undefined
        ? toNumber(body.amount)
        : Number(existingPayment.amount);

    const paymentDate =
      body.paymentDate !== undefined
        ? body.paymentDate
        : existingPayment.payment_date;

    const paymentMethod =
      body.paymentMethod !== undefined
        ? String(body.paymentMethod).trim()
        : existingPayment.payment_method;

    const transactionReference =
      body.transactionReference !== undefined
        ? body.transactionReference?.trim() || null
        : existingPayment.transaction_reference;

    const notes =
      body.notes !== undefined
        ? body.notes?.trim() || null
        : existingPayment.notes;

    // --------------------------------------------------------
    // Validation
    // --------------------------------------------------------

    if (amount <= 0) {
      await client.query("ROLLBACK");

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
      await client.query("ROLLBACK");

      return NextResponse.json(
        {
          success: false,
          message: "Invalid payment method",
        },
        { status: 400 }
      );
    }

    // --------------------------------------------------------
    // Calculate invoice paid amount
    //
    // Remove old payment amount first,
    // then apply new payment amount.
    // --------------------------------------------------------

    const oldAmount = Number(
      existingPayment.amount
    );

    const totalAmount = Number(
      invoice.total_amount
    );

    const currentPaidAmountResult =
      await client.query(
        `
        SELECT COALESCE(SUM(amount), 0) AS paid_amount
        FROM payments
        WHERE invoice_id = $1
          AND id <> $2
        `,
        [invoiceId, paymentId]
      );

    const paidFromOtherPayments = Number(
      currentPaidAmountResult.rows[0].paid_amount
    );

    const newPaidAmount =
      paidFromOtherPayments + amount;

    if (newPaidAmount > totalAmount) {
      await client.query("ROLLBACK");

      return NextResponse.json(
        {
          success: false,
          message: `Payment amount cannot make total paid amount exceed invoice total of ₹${totalAmount.toFixed(
            2
          )}`,
        },
        { status: 400 }
      );
    }

    const newPendingAmount = Math.max(
      totalAmount - newPaidAmount,
      0
    );

    let newInvoiceStatus = "ISSUED";

    if (newPaidAmount >= totalAmount) {
      newInvoiceStatus = "PAID";
    } else if (newPaidAmount > 0) {
      newInvoiceStatus = "PARTIALLY_PAID";
    }

    // --------------------------------------------------------
    // Update payment
    // --------------------------------------------------------

    const paymentResult = await client.query(
      `
      UPDATE payments
      SET
        payment_date = $1,
        amount = $2,
        payment_method = $3,
        transaction_reference = $4,
        notes = $5,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $6
      RETURNING *
      `,
      [
        paymentDate,
        amount,
        paymentMethod,
        transactionReference,
        notes,
        paymentId,
      ]
    );

    // --------------------------------------------------------
    // Update invoice
    // --------------------------------------------------------

    await client.query(
      `
      UPDATE invoices
      SET
        paid_amount = $1,
        pending_amount = $2,
        status = $3,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $4
      `,
      [
        newPaidAmount,
        newPendingAmount,
        newInvoiceStatus,
        invoiceId,
      ]
    );

    await client.query("COMMIT");

    return NextResponse.json({
      success: true,
      message: "Payment updated successfully",
      data: {
        payment: paymentResult.rows[0],
        invoice: {
          invoice_id: invoiceId,
          invoice_number: invoice.invoice_number,
          total_amount: totalAmount,
          paid_amount: newPaidAmount,
          pending_amount: newPendingAmount,
          status: newInvoiceStatus,
        },
      },
    });
  } catch (error) {
    await client.query("ROLLBACK");

    console.error("PATCH payment error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to update payment",
      },
      { status: 500 }
    );
  } finally {
    client.release();
  }
}