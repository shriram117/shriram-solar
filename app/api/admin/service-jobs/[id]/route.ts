import { NextRequest, NextResponse } from "next/server";
import { pool } from "@/lib/db/db";
import { requireAuth } from "@/lib/auth/require-auth";

type RouteContext = {
  params: Promise<{ id: string }>;
};

const SERVICE_TYPES = [
  "INSTALLATION",
  "REPAIR",
  "PANEL_CLEANING",
  "INSPECTION",
  "AMC",
  "MAINTENANCE",
  "OTHER",
];

const PRIORITIES = [
  "LOW",
  "NORMAL",
  "HIGH",
  "URGENT",
];

const STATUSES = [
  "PENDING",
  "ASSIGNED",
  "IN_PROGRESS",
  "COMPLETED",
  "CANCELLED",
];

export async function GET(
  request: NextRequest,
  context: RouteContext
) {
  const { user, response } = await requireAuth();

  if (!user) {
    return response;
  }

  try {
    const { id } = await context.params;
    const jobId = Number(id);

    if (!Number.isInteger(jobId) || jobId <= 0) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid service job ID.",
        },
        { status: 400 }
      );
    }

    const result = await pool.query(
      `
        SELECT
          sj.id,
          sj.job_code,
          sj.customer_id,
          sj.solar_system_id,
          sj.technician_id,
          sj.service_type,
          sj.priority,
          sj.scheduled_date,
          sj.started_at,
          sj.completed_at,
          sj.status,
          sj.problem_description,
          sj.work_performed,
          sj.technician_notes,
          sj.customer_notes,
          sj.service_charge,
          sj.created_by,
          sj.created_at,
          sj.updated_at,

          c.customer_code,
          c.customer_name,
          c.mobile AS customer_mobile,
          c.email AS customer_email,
          c.address AS customer_address,

          ss.system_code,
          ss.system_capacity_kw,
          ss.panel_brand,
          ss.panel_model,
          ss.inverter_brand,
          ss.inverter_model,

          t.technician_code,
          t.technician_name,
          t.mobile AS technician_mobile,
          t.specialization

        FROM service_jobs sj

        INNER JOIN customers c
          ON c.id = sj.customer_id

        LEFT JOIN solar_systems ss
          ON ss.id = sj.solar_system_id

        LEFT JOIN technicians t
          ON t.id = sj.technician_id

        WHERE sj.id = $1
        LIMIT 1
      `,
      [jobId]
    );

    if (result.rows.length === 0) {
      return NextResponse.json(
        {
          success: false,
          message: "Service job not found.",
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: result.rows[0],
    });
  } catch (error) {
    console.error("GET service job error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to fetch service job.",
      },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  context: RouteContext
) {
  const { user, response } = await requireAuth();

  if (!user) {
    return response;
  }

  try {
    const { id } = await context.params;
    const jobId = Number(id);

    if (!Number.isInteger(jobId) || jobId <= 0) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid service job ID.",
        },
        { status: 400 }
      );
    }

    const body = await request.json();

    const {
      customerId,
      solarSystemId,
      technicianId,
      serviceType,
      priority,
      scheduledDate,
      status,
      problemDescription,
      workPerformed,
      technicianNotes,
      customerNotes,
      serviceCharge,
      startedAt,
      completedAt,
    } = body;

    // Check existing job
    const existingJob = await pool.query(
      `
        SELECT
          id,
          status
        FROM service_jobs
        WHERE id = $1
        LIMIT 1
      `,
      [jobId]
    );

    if (existingJob.rows.length === 0) {
      return NextResponse.json(
        {
          success: false,
          message: "Service job not found.",
        },
        { status: 404 }
      );
    }

    const currentStatus = existingJob.rows[0].status;

    const customerIdNumber =
      customerId !== undefined &&
      customerId !== null &&
      customerId !== ""
        ? Number(customerId)
        : null;

    const solarSystemIdNumber =
      solarSystemId !== undefined &&
      solarSystemId !== null &&
      solarSystemId !== ""
        ? Number(solarSystemId)
        : null;

    const technicianIdNumber =
      technicianId !== undefined &&
      technicianId !== null &&
      technicianId !== ""
        ? Number(technicianId)
        : null;

    // Customer validation
    if (
      customerIdNumber !== null &&
      (!Number.isInteger(customerIdNumber) ||
        customerIdNumber <= 0)
    ) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid customer.",
        },
        { status: 400 }
      );
    }

    if (customerIdNumber !== null) {
      const customerCheck = await pool.query(
        `
          SELECT id
          FROM customers
          WHERE id = $1
          LIMIT 1
        `,
        [customerIdNumber]
      );

      if (customerCheck.rows.length === 0) {
        return NextResponse.json(
          {
            success: false,
            message: "Customer not found.",
          },
          { status: 404 }
        );
      }
    }

    // Solar system validation
    if (
      solarSystemIdNumber !== null &&
      (!Number.isInteger(solarSystemIdNumber) ||
        solarSystemIdNumber <= 0)
    ) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid solar system.",
        },
        { status: 400 }
      );
    }

    if (solarSystemIdNumber !== null) {
      const solarSystemCheck = await pool.query(
        `
          SELECT
            id,
            customer_id
          FROM solar_systems
          WHERE id = $1
          LIMIT 1
        `,
        [solarSystemIdNumber]
      );

      if (solarSystemCheck.rows.length === 0) {
        return NextResponse.json(
          {
            success: false,
            message: "Solar system not found.",
          },
          { status: 404 }
        );
      }

      const selectedCustomerId =
        customerIdNumber ??
        Number(
          (
            await pool.query(
              `
                SELECT customer_id
                FROM service_jobs
                WHERE id = $1
              `,
              [jobId]
            )
          ).rows[0].customer_id
        );

      if (
        Number(solarSystemCheck.rows[0].customer_id) !==
        selectedCustomerId
      ) {
        return NextResponse.json(
          {
            success: false,
            message:
              "Selected solar system does not belong to the selected customer.",
          },
          { status: 400 }
        );
      }
    }

    // Technician validation
    if (
      technicianIdNumber !== null &&
      (!Number.isInteger(technicianIdNumber) ||
        technicianIdNumber <= 0)
    ) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid technician.",
        },
        { status: 400 }
      );
    }

    if (technicianIdNumber !== null) {
      const technicianCheck = await pool.query(
        `
          SELECT
            id,
            status
          FROM technicians
          WHERE id = $1
          LIMIT 1
        `,
        [technicianIdNumber]
      );

      if (technicianCheck.rows.length === 0) {
        return NextResponse.json(
          {
            success: false,
            message: "Technician not found.",
          },
          { status: 404 }
        );
      }

      if (technicianCheck.rows[0].status !== "ACTIVE") {
        return NextResponse.json(
          {
            success: false,
            message:
              "Only active technicians can be assigned.",
          },
          { status: 400 }
        );
      }
    }

    // Service type validation
    if (
      serviceType !== undefined &&
      !SERVICE_TYPES.includes(serviceType)
    ) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid service type.",
        },
        { status: 400 }
      );
    }

    // Priority validation
    if (
      priority !== undefined &&
      !PRIORITIES.includes(priority)
    ) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid priority.",
        },
        { status: 400 }
      );
    }

    // Status validation
    if (
      status !== undefined &&
      !STATUSES.includes(status)
    ) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid service job status.",
        },
        { status: 400 }
      );
    }

    // Service charge validation
    let serviceChargeNumber: number | null = null;

    if (
      serviceCharge !== undefined &&
      serviceCharge !== null &&
      serviceCharge !== ""
    ) {
      serviceChargeNumber = Number(serviceCharge);

      if (
        !Number.isFinite(serviceChargeNumber) ||
        serviceChargeNumber < 0
      ) {
        return NextResponse.json(
          {
            success: false,
            message: "Invalid service charge.",
          },
          { status: 400 }
        );
      }
    }

    /*
      Status timestamp handling:

      IN_PROGRESS -> started_at
      COMPLETED   -> completed_at

      We preserve existing timestamps when the
      corresponding status has already been reached.
    */

    let finalStartedAt = startedAt || null;
    let finalCompletedAt = completedAt || null;

    if (
      status === "IN_PROGRESS" &&
      !finalStartedAt
    ) {
      finalStartedAt = new Date();
    }

    if (
      status === "COMPLETED" &&
      !finalCompletedAt
    ) {
      finalCompletedAt = new Date();

      if (!finalStartedAt) {
        finalStartedAt = new Date();
      }
    }

    if (
      currentStatus === "IN_PROGRESS" &&
      status === undefined &&
      !finalStartedAt
    ) {
      finalStartedAt = new Date();
    }

    if (
      currentStatus === "COMPLETED" &&
      status === undefined &&
      !finalCompletedAt
    ) {
      finalCompletedAt = new Date();
    }

    const result = await pool.query(
      `
        UPDATE service_jobs
        SET
          customer_id = COALESCE($1, customer_id),
          solar_system_id = $2,
          technician_id = $3,
          service_type = COALESCE($4, service_type),
          priority = COALESCE($5, priority),
          scheduled_date = $6,
          status = COALESCE($7, status),
          problem_description = $8,
          work_performed = $9,
          technician_notes = $10,
          customer_notes = $11,
          service_charge = COALESCE($12, service_charge),
          started_at = COALESCE($13, started_at),
          completed_at = COALESCE($14, completed_at),
          updated_at = CURRENT_TIMESTAMP
        WHERE id = $15
        RETURNING
          id,
          job_code,
          customer_id,
          solar_system_id,
          technician_id,
          service_type,
          priority,
          scheduled_date,
          started_at,
          completed_at,
          status,
          problem_description,
          work_performed,
          technician_notes,
          customer_notes,
          service_charge,
          created_by,
          created_at,
          updated_at
      `,
      [
        customerIdNumber,
        solarSystemIdNumber,
        technicianIdNumber,
        serviceType ?? null,
        priority ?? null,
        scheduledDate || null,
        status ?? null,
        problemDescription?.trim() || null,
        workPerformed?.trim() || null,
        technicianNotes?.trim() || null,
        customerNotes?.trim() || null,
        serviceChargeNumber,
        finalStartedAt,
        finalCompletedAt,
        jobId,
      ]
    );

    return NextResponse.json({
      success: true,
      message: "Service job updated successfully.",
      data: result.rows[0],
    });
  } catch (error) {
    console.error("PATCH service job error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to update service job.",
      },
      { status: 500 }
    );
  }
}