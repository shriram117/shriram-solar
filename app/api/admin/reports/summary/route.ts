import { NextRequest, NextResponse } from "next/server";
import { pool } from "@/lib/db/db";
import { requireAuth } from "@/lib/auth/require-auth";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const { user, response } = await requireAuth();

  if (!user) {
    return response;
  }

  try {
    const { searchParams } = new URL(request.url);

    const fromDate = searchParams.get("from");
    const toDate = searchParams.get("to");

    /*
     * Default:
     * Current month
     */
    const today = new Date();

    const defaultFrom = new Date(
      today.getFullYear(),
      today.getMonth(),
      1
    );

    const defaultTo = new Date(
      today.getFullYear(),
      today.getMonth() + 1,
      0
    );

    const formatDate = (date: Date) =>
      date.toISOString().slice(0, 10);

    const from = fromDate || formatDate(defaultFrom);
    const to = toDate || formatDate(defaultTo);

    /*
     * Validate dates
     */
    const fromObj = new Date(from);
    const toObj = new Date(to);

    if (
      Number.isNaN(fromObj.getTime()) ||
      Number.isNaN(toObj.getTime())
    ) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid date range.",
        },
        { status: 400 }
      );
    }

    if (from > to) {
      return NextResponse.json(
        {
          success: false,
          message:
            "From date cannot be greater than To date.",
        },
        { status: 400 }
      );
    }

    /*
     * ----------------------------------------
     * Business Summary
     * ----------------------------------------
     */

    const summaryResult = await pool.query(
      `
      SELECT
        (
          SELECT COUNT(*)
          FROM leads
          WHERE created_at::date BETWEEN $1 AND $2
        ) AS total_leads,

        (
          SELECT COUNT(*)
          FROM leads
          WHERE status = 'CONVERTED'
            AND created_at::date BETWEEN $1 AND $2
        ) AS converted_leads,

        (
          SELECT COUNT(*)
          FROM customers
          WHERE created_at::date BETWEEN $1 AND $2
        ) AS new_customers,

        (
          SELECT COUNT(*)
          FROM customers
          WHERE status = 'ACTIVE'
        ) AS active_customers,

        (
          SELECT COUNT(*)
          FROM solar_systems
          WHERE created_at::date BETWEEN $1 AND $2
        ) AS solar_systems,

        (
          SELECT COUNT(*)
          FROM service_jobs
          WHERE created_at::date BETWEEN $1 AND $2
        ) AS service_jobs,

        (
          SELECT COUNT(*)
          FROM service_jobs
          WHERE status IN (
            'PENDING',
            'ASSIGNED',
            'IN_PROGRESS'
          )
        ) AS active_service_jobs,

        (
          SELECT COUNT(*)
          FROM amc_contracts
          WHERE created_at::date BETWEEN $1 AND $2
        ) AS amc_contracts,

        (
          SELECT COUNT(*)
          FROM amc_contracts
          WHERE status = 'ACTIVE'
        ) AS active_amcs,

        (
          SELECT COALESCE(
            SUM(total_amount),
            0
          )
          FROM invoices
          WHERE invoice_date::date BETWEEN $1 AND $2
            AND status <> 'CANCELLED'
        ) AS invoice_amount,

        (
          SELECT COALESCE(
            SUM(amount),
            0
          )
          FROM payments
          WHERE payment_date::date BETWEEN $1 AND $2
        ) AS collection_amount,

        (
          SELECT COALESCE(
            SUM(pending_amount),
            0
          )
          FROM invoices
          WHERE status IN (
            'ISSUED',
            'PARTIALLY_PAID',
            'OVERDUE'
          )
        ) AS outstanding_amount
      `,
      [from, to]
    );

    /*
     * ----------------------------------------
     * Payment Method Summary
     * ----------------------------------------
     */

    const paymentMethodResult = await pool.query(
      `
      SELECT
        payment_method,
        COUNT(*) AS payment_count,
        COALESCE(
          SUM(amount),
          0
        ) AS total_amount
      FROM payments
      WHERE payment_date::date BETWEEN $1 AND $2
      GROUP BY payment_method
      ORDER BY total_amount DESC
      `,
      [from, to]
    );

    /*
     * ----------------------------------------
     * Service Type Summary
     * ----------------------------------------
     */

    const serviceTypeResult = await pool.query(
      `
      SELECT
        service_type,
        COUNT(*) AS job_count,
        COALESCE(
          SUM(service_charge),
          0
        ) AS service_amount
      FROM service_jobs
      WHERE created_at::date BETWEEN $1 AND $2
      GROUP BY service_type
      ORDER BY job_count DESC
      `,
      [from, to]
    );

    /*
     * ----------------------------------------
     * Service Status Summary
     * ----------------------------------------
     */

    const serviceStatusResult = await pool.query(
      `
      SELECT
        status,
        COUNT(*) AS job_count
      FROM service_jobs
      WHERE created_at::date BETWEEN $1 AND $2
      GROUP BY status
      ORDER BY job_count DESC
      `,
      [from, to]
    );

    /*
     * ----------------------------------------
     * Lead Status Summary
     * ----------------------------------------
     */

    const leadStatusResult = await pool.query(
      `
      SELECT
        status,
        COUNT(*) AS lead_count
      FROM leads
      WHERE created_at::date BETWEEN $1 AND $2
      GROUP BY status
      ORDER BY lead_count DESC
      `,
      [from, to]
    );

    /*
     * ----------------------------------------
     * AMC Summary
     * ----------------------------------------
     */

    const amcStatusResult = await pool.query(
      `
      SELECT
        status,
        COUNT(*) AS amc_count,
        COALESCE(
          SUM(contract_amount),
          0
        ) AS contract_amount
      FROM amc_contracts
      WHERE created_at::date BETWEEN $1 AND $2
      GROUP BY status
      ORDER BY amc_count DESC
      `,
      [from, to]
    );

    /*
     * ----------------------------------------
     * Recent Payments
     * ----------------------------------------
     */

    const recentPaymentsResult = await pool.query(
      `
       SELECT
    p.id,
    p.payment_date,
    p.amount,
    p.payment_method,
    i.invoice_number,
    c.customer_name,
    c.customer_code
  FROM payments p
  INNER JOIN invoices i
    ON i.id = p.invoice_id
  INNER JOIN customers c
    ON c.id = i.customer_id
  WHERE p.payment_date::date BETWEEN $1 AND $2
  ORDER BY p.payment_date DESC, p.id DESC
  LIMIT 10
      `,
      [from, to]
    );

    /*
     * ----------------------------------------
     * Recent Service Jobs
     * ----------------------------------------
     */

    const recentJobsResult = await pool.query(
      `
      SELECT
        sj.id,
        sj.job_code,
        sj.service_type,
        sj.status,
        sj.priority,
        sj.scheduled_date,
        sj.service_charge,
        c.customer_name,
        c.customer_code,
        t.technician_name
      FROM service_jobs sj
      INNER JOIN customers c
        ON c.id = sj.customer_id
      LEFT JOIN technicians t
        ON t.id = sj.technician_id
      WHERE sj.created_at::date BETWEEN $1 AND $2
      ORDER BY sj.created_at DESC, sj.id DESC
      LIMIT 10
      `,
      [from, to]
    );

    /*
     * ----------------------------------------
     * Response
     * ----------------------------------------
     */

    return NextResponse.json({
      success: true,

      filters: {
        from,
        to,
      },

      summary: {
        totalLeads: Number(
          summaryResult.rows[0].total_leads || 0
        ),

        convertedLeads: Number(
          summaryResult.rows[0].converted_leads || 0
        ),

        newCustomers: Number(
          summaryResult.rows[0].new_customers || 0
        ),

        activeCustomers: Number(
          summaryResult.rows[0].active_customers || 0
        ),

        solarSystems: Number(
          summaryResult.rows[0].solar_systems || 0
        ),

        serviceJobs: Number(
          summaryResult.rows[0].service_jobs || 0
        ),

        activeServiceJobs: Number(
          summaryResult.rows[0].active_service_jobs || 0
        ),

        amcContracts: Number(
          summaryResult.rows[0].amc_contracts || 0
        ),

        activeAMCs: Number(
          summaryResult.rows[0].active_amcs || 0
        ),

        invoiceAmount: Number(
          summaryResult.rows[0].invoice_amount || 0
        ),

        collectionAmount: Number(
          summaryResult.rows[0].collection_amount || 0
        ),

        outstandingAmount: Number(
          summaryResult.rows[0].outstanding_amount || 0
        ),
      },

      paymentMethods:
        paymentMethodResult.rows.map(
          (row) => ({
            payment_method:
              row.payment_method,

            payment_count: Number(
              row.payment_count || 0
            ),

            total_amount: Number(
              row.total_amount || 0
            ),
          })
        ),

      serviceTypes:
        serviceTypeResult.rows.map(
          (row) => ({
            service_type:
              row.service_type,

            job_count: Number(
              row.job_count || 0
            ),

            service_amount: Number(
              row.service_amount || 0
            ),
          })
        ),

      serviceStatuses:
        serviceStatusResult.rows.map(
          (row) => ({
            status: row.status,

            job_count: Number(
              row.job_count || 0
            ),
          })
        ),

      leadStatuses:
        leadStatusResult.rows.map(
          (row) => ({
            status: row.status,

            lead_count: Number(
              row.lead_count || 0
            ),
          })
        ),

      amcStatuses:
        amcStatusResult.rows.map(
          (row) => ({
            status: row.status,

            amc_count: Number(
              row.amc_count || 0
            ),

            contract_amount: Number(
              row.contract_amount || 0
            ),
          })
        ),

      recentPayments:
        recentPaymentsResult.rows,

      recentServiceJobs:
        recentJobsResult.rows,
    });
  } catch (error) {
    console.error(
      "Reports summary API error:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        message:
          "Failed to generate report summary.",
      },
      { status: 500 }
    );
  }
}