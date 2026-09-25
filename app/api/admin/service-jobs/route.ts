import { NextRequest, NextResponse } from "next/server";
import { pool } from "@/lib/db/db";
import { requireAuth } from "@/lib/auth/require-auth";

const ALLOWED_SERVICE_TYPES = [
  "INSTALLATION",
  "REPAIR",
  "PANEL_CLEANING",
  "INSPECTION",
  "AMC",
  "MAINTENANCE",
  "OTHER",
] as const;

const SERVICES_REQUIRING_SOLAR_SYSTEM = new Set([
  "REPAIR",
  "PANEL_CLEANING",
  "INSPECTION",
  "AMC",
  "MAINTENANCE",
  "OTHER",
]);

const ALLOWED_PRIORITIES = [
  "LOW",
  "NORMAL",
  "HIGH",
  "URGENT",
] as const;

function cleanText(value: unknown): string {
  if (typeof value !== "string") {
    return "";
  }

  return value.trim();
}

function isValidDate(value: string): boolean {
  return /^\d{4}-\d{2}-\d{2}$/.test(value);
}

/* =========================================================
   GET SERVICE JOBS
========================================================= */

export async function GET(request: NextRequest) {
  const { user, response } = await requireAuth();

  if (!user) {
    return response;
  }

  try {
    const { searchParams } = new URL(request.url);

    const search =
      searchParams.get("search")?.trim() || "";

    const status =
      searchParams.get("status")?.trim() || "";

    const priority =
      searchParams.get("priority")?.trim() || "";

    const conditions: string[] = [];
    const values: string[] = [];

    /* -----------------------------------------
       Search
    ----------------------------------------- */

    if (search) {
      values.push(`%${search}%`);

      conditions.push(`
        (
          sj.job_code ILIKE $${values.length}
          OR c.customer_name ILIKE $${values.length}
          OR c.mobile ILIKE $${values.length}
          OR t.technician_name ILIKE $${values.length}
          OR t.technician_code ILIKE $${values.length}
        )
      `);
    }

    /* -----------------------------------------
       Status filter
    ----------------------------------------- */

    if (status) {
      values.push(status);

      conditions.push(`
        sj.status = $${values.length}
      `);
    }

    /* -----------------------------------------
       Priority filter
    ----------------------------------------- */

    if (priority) {
      values.push(priority);

      conditions.push(`
        sj.priority = $${values.length}
      `);
    }

    const whereClause =
      conditions.length > 0
        ? `WHERE ${conditions.join(" AND ")}`
        : "";

    /* -----------------------------------------
       Query
    ----------------------------------------- */

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

          ss.system_code,
          ss.system_capacity_kw,

          t.technician_code,
          t.technician_name,
          t.mobile AS technician_mobile

        FROM service_jobs sj

        INNER JOIN customers c
          ON c.id = sj.customer_id

        LEFT JOIN solar_systems ss
          ON ss.id = sj.solar_system_id

        LEFT JOIN technicians t
          ON t.id = sj.technician_id

        ${whereClause}

        ORDER BY
          sj.scheduled_date ASC NULLS LAST,
          sj.id DESC
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
      "GET service jobs error:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        message: "Failed to fetch service jobs.",
      },
      {
        status: 500,
      }
    );
  }
}

/* =========================================================
   POST SERVICE JOB
========================================================= */

export async function POST(request: NextRequest) {
  const { user, response } = await requireAuth();

  if (!user) {
    return response;
  }

  try {
    /* -----------------------------------------
       Content-Type validation
    ----------------------------------------- */

    const contentType =
      request.headers.get("content-type") || "";

    if (
      !contentType
        .toLowerCase()
        .includes("application/json")
    ) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid request format.",
        },
        {
          status: 415,
        }
      );
    }

    /* -----------------------------------------
       Parse body
    ----------------------------------------- */

    const body = await request.json();

    if (
      !body ||
      typeof body !== "object"
    ) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid request data.",
        },
        {
          status: 400,
        }
      );
    }

    const {
      customerId,
      solarSystemId,
      technicianId,
      serviceType,
      priority = "NORMAL",
      scheduledDate,
      problemDescription,
      customerNotes,
      serviceCharge = 0,
    } = body;

    /* -----------------------------------------
       Customer validation
    ----------------------------------------- */

    const customerIdNumber =
      Number(customerId);

    if (
      !Number.isInteger(customerIdNumber) ||
      customerIdNumber <= 0
    ) {
      return NextResponse.json(
        {
          success: false,
          message: "Valid customer is required.",
        },
        {
          status: 400,
        }
      );
    }

    /* -----------------------------------------
       Service type validation
    ----------------------------------------- */

    const serviceTypeValue =
      cleanText(serviceType).toUpperCase();

    if (
      !ALLOWED_SERVICE_TYPES.includes(
        serviceTypeValue as
          (typeof ALLOWED_SERVICE_TYPES)[number]
      )
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Valid service type is required.",
        },
        {
          status: 400,
        }
      );
    }

    /* -----------------------------------------
       PRIORITY validation
    ----------------------------------------- */

    const priorityValue =
      cleanText(priority).toUpperCase();

    if (
      !ALLOWED_PRIORITIES.includes(
        priorityValue as
          (typeof ALLOWED_PRIORITIES)[number]
      )
    ) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid priority.",
        },
        {
          status: 400,
        }
      );
    }

    /* -----------------------------------------
       Service charge validation
    ----------------------------------------- */

    const charge = Number(serviceCharge);

    if (
      !Number.isFinite(charge) ||
      charge < 0
    ) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid service charge.",
        },
        {
          status: 400,
        }
      );
    }

    /* -----------------------------------------
       Scheduled date validation
    ----------------------------------------- */

    const scheduledDateValue =
      cleanText(scheduledDate);

    if (
      scheduledDateValue &&
      !isValidDate(scheduledDateValue)
    ) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid scheduled date.",
        },
        {
          status: 400,
        }
      );
    }

    /* -----------------------------------------
       Text length validation
    ----------------------------------------- */

    const problemDescriptionValue =
      cleanText(problemDescription);

    const customerNotesValue =
      cleanText(customerNotes);

    if (problemDescriptionValue.length > 5000) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Problem description cannot exceed 5000 characters.",
        },
        {
          status: 400,
        }
      );
    }

    if (customerNotesValue.length > 3000) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Customer notes cannot exceed 3000 characters.",
        },
        {
          status: 400,
        }
      );
    }

    /* =====================================================
       IMPORTANT BUSINESS RULE
       
       Installation:
       Solar System optional

       Repair:
       Solar System required

       Panel Cleaning:
       Solar System required

       Inspection:
       Solar System required

       AMC:
       Solar System required

       Maintenance:
       Solar System required

       Other:
       Solar System required
    ===================================================== */

    const requiresSolarSystem =
      SERVICES_REQUIRING_SOLAR_SYSTEM.has(
        serviceTypeValue
      );

    /* -----------------------------------------
       Solar System ID validation
    ----------------------------------------- */

    let solarSystemIdNumber: number | null =
      null;

    if (
      solarSystemId !== null &&
      solarSystemId !== undefined &&
      solarSystemId !== ""
    ) {
      solarSystemIdNumber =
        Number(solarSystemId);

      if (
        !Number.isInteger(
          solarSystemIdNumber
        ) ||
        solarSystemIdNumber <= 0
      ) {
        return NextResponse.json(
          {
            success: false,
            message: "Invalid solar system.",
          },
          {
            status: 400,
          }
        );
      }
    }

    /* -----------------------------------------
       REQUIRED SYSTEM CHECK
    ----------------------------------------- */

    if (
      requiresSolarSystem &&
      !solarSystemIdNumber
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            `${serviceTypeValue.replace(
              "_",
              " "
            )} service requires an existing solar system. Please select a solar system.`,
        },
        {
          status: 400,
        }
      );
    }

    /* -----------------------------------------
       Customer existence
    ----------------------------------------- */

    const customerCheck =
      await pool.query(
        `
          SELECT
            id,
            customer_code,
            customer_name,
            mobile
          FROM customers
          WHERE id = $1
          LIMIT 1
        `,
        [customerIdNumber]
      );

    if (
      customerCheck.rows.length === 0
    ) {
      return NextResponse.json(
        {
          success: false,
          message: "Customer not found.",
        },
        {
          status: 404,
        }
      );
    }

    /* -----------------------------------------
       Solar System validation
    ----------------------------------------- */

    if (solarSystemIdNumber) {
      const solarSystemCheck =
        await pool.query(
          `
            SELECT
              id,
              customer_id,
              system_code,
              system_capacity_kw,
              system_status
            FROM solar_systems
            WHERE id = $1
            LIMIT 1
          `,
          [solarSystemIdNumber]
        );

      if (
        solarSystemCheck.rows.length === 0
      ) {
        return NextResponse.json(
          {
            success: false,
            message:
              "Solar system not found.",
          },
          {
            status: 404,
          }
        );
      }

      /* -----------------------------------------
         Ensure system belongs to customer
      ----------------------------------------- */

      if (
        Number(
          solarSystemCheck.rows[0]
            .customer_id
        ) !== customerIdNumber
      ) {
        return NextResponse.json(
          {
            success: false,
            message:
              "Selected solar system does not belong to the selected customer.",
          },
          {
            status: 400,
          }
        );
      }
    }

    /* -----------------------------------------
       Technician validation
    ----------------------------------------- */

    let technicianIdNumber: number | null =
      null;

    if (
      technicianId !== null &&
      technicianId !== undefined &&
      technicianId !== ""
    ) {
      technicianIdNumber =
        Number(technicianId);

      if (
        !Number.isInteger(
          technicianIdNumber
        ) ||
        technicianIdNumber <= 0
      ) {
        return NextResponse.json(
          {
            success: false,
            message: "Invalid technician.",
          },
          {
            status: 400,
          }
        );
      }

      const technicianCheck =
        await pool.query(
          `
            SELECT
              id,
              technician_code,
              technician_name,
              status
            FROM technicians
            WHERE id = $1
            LIMIT 1
          `,
          [technicianIdNumber]
        );

      if (
        technicianCheck.rows.length === 0
      ) {
        return NextResponse.json(
          {
            success: false,
            message:
              "Technician not found.",
          },
          {
            status: 404,
          }
        );
      }

      if (
        technicianCheck.rows[0].status !==
        "ACTIVE"
      ) {
        return NextResponse.json(
          {
            success: false,
            message:
              "Only active technicians can be assigned.",
          },
          {
            status: 400,
          }
        );
      }
    }

    /* =====================================================
       CREATE SERVICE JOB
    ===================================================== */

    const client =
      await pool.connect();

    try {
      await client.query("BEGIN");

      /* -----------------------------------------
         Generate ID
      ----------------------------------------- */

      const sequenceResult =
        await client.query(
          `
            SELECT nextval(
              'service_jobs_id_seq'
            ) AS id
          `
        );

      const id = Number(
        sequenceResult.rows[0].id
      );

      /* -----------------------------------------
         Generate Job Code
      ----------------------------------------- */

      const jobCode =
        `JOB-${String(id).padStart(6, "0")}`;

      /* -----------------------------------------
         Initial Status
         
         Technician assigned:
         ASSIGNED

         No technician:
         PENDING
      ----------------------------------------- */

      const initialStatus =
        technicianIdNumber
          ? "ASSIGNED"
          : "PENDING";

      /* -----------------------------------------
         Insert
      ----------------------------------------- */

      const result =
        await client.query(
          `
            INSERT INTO service_jobs (
              id,
              job_code,
              customer_id,
              solar_system_id,
              technician_id,
              service_type,
              priority,
              scheduled_date,
              status,
              problem_description,
              customer_notes,
              service_charge,
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
              $13
            )
            RETURNING
              id,
              job_code,
              customer_id,
              solar_system_id,
              technician_id,
              service_type,
              priority,
              scheduled_date,
              status,
              problem_description,
              customer_notes,
              service_charge,
              created_by,
              created_at,
              updated_at
          `,
          [
            id,
            jobCode,
            customerIdNumber,
            solarSystemIdNumber,
            technicianIdNumber,
            serviceTypeValue,
            priorityValue,
            scheduledDateValue || null,
            initialStatus,
            problemDescriptionValue || null,
            customerNotesValue || null,
            charge,
            user.userId,
          ]
        );

      await client.query("COMMIT");

      return NextResponse.json(
        {
          success: true,
          message:
            "Service job created successfully.",
          data: result.rows[0],
        },
        {
          status: 201,
        }
      );
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  } catch (error) {
    console.error(
      "POST service job error:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        message:
          "Failed to create service job.",
      },
      {
        status: 500,
      }
    );
  }
}