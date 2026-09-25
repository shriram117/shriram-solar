export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth/require-auth";
import { pool } from "@/lib/db/db";

export async function GET() {
  try {
    const { user, response } = await requireAuth();

    if (response) {
      return response;
    }

    // Run dashboard queries in parallel
    const [
      leadsResult,
      customersResult,
      serviceJobsResult,
      outstandingResult,
      todayCollectionResult,
      monthlyCollectionResult,
      recentLeadsResult,
      recentJobsResult,
    ] = await Promise.all([
      // New leads
      pool.query(`
        SELECT COUNT(*)::int AS count
        FROM leads
        WHERE status = 'NEW'
      `),

      // Active customers
      pool.query(`
        SELECT COUNT(*)::int AS count
        FROM customers
        WHERE status = 'ACTIVE'
      `),

      // Pending / active service jobs
      pool.query(`
        SELECT COUNT(*)::int AS count
        FROM service_jobs
        WHERE status IN ('PENDING', 'ASSIGNED', 'IN_PROGRESS')
      `),

      // Outstanding invoice amount
      pool.query(`
        SELECT COALESCE(SUM(pending_amount), 0)::numeric AS amount
        FROM invoices
        WHERE status IN ('ISSUED', 'PARTIALLY_PAID', 'OVERDUE')
      `),

      // Today's collection
      pool.query(`
        SELECT COALESCE(SUM(amount), 0)::numeric AS amount
        FROM payments
        WHERE payment_date::date = CURRENT_DATE
      `),

      // Current month collection
      pool.query(`
        SELECT COALESCE(SUM(amount), 0)::numeric AS amount
        FROM payments
        WHERE payment_date >= date_trunc('month', CURRENT_DATE)
          AND payment_date < date_trunc('month', CURRENT_DATE) + INTERVAL '1 month'
      `),

      // Recent leads
      pool.query(`
        SELECT
          id,
          lead_code,
          customer_name,
          mobile,
          service_type,
          source,
          status,
          created_at
        FROM leads
        ORDER BY created_at DESC
        LIMIT 5
      `),

      // Recent service jobs
      pool.query(`
  SELECT
    sj.id,
    sj.job_code,
    sj.service_type,
    sj.priority,
    sj.status,
    sj.scheduled_date,
    sj.service_charge,
    c.customer_name,
    t.technician_name
  FROM service_jobs sj
  INNER JOIN customers c
    ON c.id = sj.customer_id
  LEFT JOIN technicians t
    ON t.id = sj.technician_id
  WHERE
    sj.status IN ('PENDING', 'ASSIGNED', 'IN_PROGRESS')
    AND (
      sj.scheduled_date IS NULL
      OR sj.scheduled_date >= CURRENT_DATE
    )
  ORDER BY
    CASE
      WHEN sj.scheduled_date IS NULL THEN 1
      ELSE 0
    END,
    sj.scheduled_date ASC,
    CASE sj.priority
      WHEN 'URGENT' THEN 1
      WHEN 'HIGH' THEN 2
      WHEN 'NORMAL' THEN 3
      WHEN 'LOW' THEN 4
      ELSE 5
    END
  LIMIT 5
`),
    ]);

    return NextResponse.json({
      success: true,

      dashboard: {
        summary: {
          newLeads: leadsResult.rows[0]?.count ?? 0,

          customers: customersResult.rows[0]?.count ?? 0,

          activeServiceJobs:
            serviceJobsResult.rows[0]?.count ?? 0,

          outstandingAmount:
            Number(outstandingResult.rows[0]?.amount ?? 0),

          todayCollection:
            Number(todayCollectionResult.rows[0]?.amount ?? 0),

          monthlyCollection:
            Number(monthlyCollectionResult.rows[0]?.amount ?? 0),
        },

        recentLeads: recentLeadsResult.rows,

        recentServiceJobs: recentJobsResult.rows,
      },
    });
  } catch (error) {
    console.error("Dashboard API error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Unable to load dashboard data.",
      },
      { status: 500 }
    );
  }
}