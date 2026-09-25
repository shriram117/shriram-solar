import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { pool } from "@/lib/db/db";
import { requireAuth } from "@/lib/auth/require-auth";

const amcSchema = z.object({
  customer_id: z.number().int().positive(),

  solar_system_id: z.number().int().positive(),

  start_date: z.string().regex(
    /^\d{4}-\d{2}-\d{2}$/,
    "Invalid start date."
  ),

  end_date: z.string().regex(
    /^\d{4}-\d{2}-\d{2}$/,
    "Invalid end date."
  ),

  contract_amount: z.number().min(0),

  visit_frequency: z.enum([
    "MONTHLY",
    "QUARTERLY",
    "HALF_YEARLY",
    "YEARLY",
    "CUSTOM",
  ]),

  total_visits: z.number().int().min(0),

  status: z.enum([
    "DRAFT",
    "ACTIVE",
    "EXPIRING",
    "EXPIRED",
    "CANCELLED",
  ]).default("DRAFT"),

  terms_conditions: z
    .string()
    .max(10000)
    .optional()
    .nullable(),

  notes: z
    .string()
    .max(5000)
    .optional()
    .nullable(),
});

/* -------------------------------------------------------------------------- */
/* GET AMC LIST                                                               */
/* -------------------------------------------------------------------------- */

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
      searchParams.get("status")?.trim().toUpperCase() || "";

    const customerId =
      searchParams.get("customerId")?.trim() || "";

    const conditions: string[] = [];
    const values: unknown[] = [];

    let parameterIndex = 1;

    /* ---------------------------------------------------------------------- */
    /* Search                                                                  */
    /* ---------------------------------------------------------------------- */

    if (search) {
      conditions.push(`
        (
          a.amc_number ILIKE $${parameterIndex}
          OR c.customer_name ILIKE $${parameterIndex}
          OR c.customer_code ILIKE $${parameterIndex}
          OR s.system_code ILIKE $${parameterIndex}
          OR c.mobile ILIKE $${parameterIndex}
        )
      `);

      values.push(`%${search}%`);
      parameterIndex++;
    }

    /* ---------------------------------------------------------------------- */
    /* Status                                                                  */
    /* ---------------------------------------------------------------------- */

    if (status) {
      conditions.push(
        `a.status = $${parameterIndex}`
      );

      values.push(status);
      parameterIndex++;
    }

    /* ---------------------------------------------------------------------- */
    /* Customer                                                                 */
    /* ---------------------------------------------------------------------- */

    if (customerId) {
      const customerIdNumber = Number(customerId);

      if (
        !Number.isInteger(customerIdNumber) ||
        customerIdNumber <= 0
      ) {
        return NextResponse.json(
          {
            success: false,
            message: "Invalid customer ID.",
          },
          { status: 400 }
        );
      }

      conditions.push(
        `a.customer_id = $${parameterIndex}`
      );

      values.push(customerIdNumber);
      parameterIndex++;
    }

    const whereClause =
      conditions.length > 0
        ? `WHERE ${conditions.join(" AND ")}`
        : "";

    /* ---------------------------------------------------------------------- */
    /* Query                                                                   */
    /* ---------------------------------------------------------------------- */

    const result = await pool.query(
      `
      SELECT
        a.id,
        a.amc_number,

        a.customer_id,
        c.customer_code,
        c.customer_name,
        c.mobile,

        a.solar_system_id,
        s.system_code,
        s.system_capacity_kw,

        a.start_date,
        a.end_date,

        a.contract_amount,

        a.visit_frequency,
        a.total_visits,
        a.used_visits,

        (
          a.total_visits - a.used_visits
        ) AS pending_visits,

        a.status,

        a.terms_conditions,
        a.notes,

        a.created_by,
        a.created_at,
        a.updated_at

      FROM amc_contracts a

      INNER JOIN customers c
        ON c.id = a.customer_id

      INNER JOIN solar_systems s
        ON s.id = a.solar_system_id

      ${whereClause}

      ORDER BY
        a.created_at DESC,
        a.id DESC
      `,
      values
    );

    return NextResponse.json({
      success: true,
      data: result.rows,
    });
  } catch (error) {
    console.error("GET AMC ERROR:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to fetch AMC contracts.",
      },
      { status: 500 }
    );
  }
}

/* -------------------------------------------------------------------------- */
/* POST AMC                                                                   */
/* -------------------------------------------------------------------------- */

export async function POST(request: NextRequest) {
  const { user, response } = await requireAuth();

  if (!user) {
    return response;
  }

  try {
    /* ---------------------------------------------------------------------- */
    /* Content Type                                                            */
    /* ---------------------------------------------------------------------- */

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
        { status: 415 }
      );
    }

    /* ---------------------------------------------------------------------- */
    /* Request Body                                                             */
    /* ---------------------------------------------------------------------- */

    const body = await request.json();

    const parsed = amcSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid AMC data.",
          errors: parsed.error.flatten(),
        },
        { status: 400 }
      );
    }

    const data = parsed.data;

    /* ---------------------------------------------------------------------- */
    /* Date Validation                                                         */
    /* ---------------------------------------------------------------------- */

    const startDate = new Date(
      `${data.start_date}T00:00:00Z`
    );

    const endDate = new Date(
      `${data.end_date}T00:00:00Z`
    );

    if (
      Number.isNaN(startDate.getTime()) ||
      Number.isNaN(endDate.getTime())
    ) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid AMC dates.",
        },
        { status: 400 }
      );
    }

    if (endDate < startDate) {
      return NextResponse.json(
        {
          success: false,
          message:
            "End date cannot be earlier than start date.",
        },
        { status: 400 }
      );
    }

    /* ---------------------------------------------------------------------- */
    /* Customer Check                                                          */
    /* ---------------------------------------------------------------------- */

    const customerResult = await pool.query(
      `
      SELECT
        id,
        customer_code,
        customer_name,
        status
      FROM customers
      WHERE id = $1
      LIMIT 1
      `,
      [data.customer_id]
    );

    if (customerResult.rows.length === 0) {
      return NextResponse.json(
        {
          success: false,
          message: "Customer not found.",
        },
        { status: 404 }
      );
    }

    const customer =
      customerResult.rows[0];

    if (customer.status !== "ACTIVE") {
      return NextResponse.json(
        {
          success: false,
          message:
            "AMC can only be created for an active customer.",
        },
        { status: 409 }
      );
    }

    /* ---------------------------------------------------------------------- */
    /* Solar System Check                                                      */
    /* ---------------------------------------------------------------------- */

    const solarSystemResult = await pool.query(
      `
      SELECT
        id,
        system_code,
        customer_id,
        system_capacity_kw,
        system_status
      FROM solar_systems
      WHERE id = $1
      LIMIT 1
      `,
      [data.solar_system_id]
    );

    if (solarSystemResult.rows.length === 0) {
      return NextResponse.json(
        {
          success: false,
          message: "Solar System not found.",
        },
        { status: 404 }
      );
    }

    const solarSystem =
      solarSystemResult.rows[0];

    /* ---------------------------------------------------------------------- */
    /* IMPORTANT: Solar System must belong to Customer                         */
    /* ---------------------------------------------------------------------- */

    if (
      Number(solarSystem.customer_id) !==
      Number(data.customer_id)
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Selected Solar System does not belong to the selected customer.",
        },
        { status: 409 }
      );
    }

    /* ---------------------------------------------------------------------- */
    /* Visit Validation                                                        */
    /* ---------------------------------------------------------------------- */

    if (data.total_visits <= 0) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Total visits must be greater than 0.",
        },
        { status: 400 }
      );
    }

    /* ---------------------------------------------------------------------- */
    /* Prevent overlapping ACTIVE AMC                                          */
    /* ---------------------------------------------------------------------- */

    const overlappingAmc =
      await pool.query(
        `
        SELECT
          id,
          amc_number,
          start_date,
          end_date,
          status
        FROM amc_contracts
        WHERE customer_id = $1
          AND solar_system_id = $2
          AND status IN (
            'DRAFT',
            'ACTIVE',
            'EXPIRING'
          )
          AND start_date <= $4
          AND end_date >= $3
        LIMIT 1
        `,
        [
          data.customer_id,
          data.solar_system_id,
          data.start_date,
          data.end_date,
        ]
      );

    if (overlappingAmc.rows.length > 0) {
      const existing =
        overlappingAmc.rows[0];

      return NextResponse.json(
        {
          success: false,
          message:
            "An AMC contract already exists for this Solar System during the selected period.",
          data: {
            amc_number:
              existing.amc_number,
            start_date:
              existing.start_date,
            end_date:
              existing.end_date,
            status:
              existing.status,
          },
        },
        { status: 409 }
      );
    }

    /* ---------------------------------------------------------------------- */
    /* Transaction                                                             */
    /* ---------------------------------------------------------------------- */

    const client = await pool.connect();

    try {
      await client.query("BEGIN");

      /* -------------------------------------------------------------------- */
      /* Create temporary AMC number                                           */
      /* -------------------------------------------------------------------- */

      const insertResult =
        await client.query(
          `
          INSERT INTO amc_contracts (
            amc_number,
            customer_id,
            solar_system_id,
            start_date,
            end_date,
            contract_amount,
            visit_frequency,
            total_visits,
            used_visits,
            status,
            terms_conditions,
            notes,
            created_by
          )
          VALUES (
            'TEMP',
            $1,
            $2,
            $3,
            $4,
            $5,
            $6,
            $7,
            0,
            $8,
            $9,
            $10,
            $11
          )
          RETURNING id
          `,
          [
            data.customer_id,
            data.solar_system_id,
            data.start_date,
            data.end_date,
            data.contract_amount,
            data.visit_frequency,
            data.total_visits,
            data.status,
            data.terms_conditions || null,
            data.notes || null,
            user.userId,
          ]
        );

      const amcId =
        insertResult.rows[0].id;

      /* -------------------------------------------------------------------- */
      /* Generate AMC Number                                                   */
      /* -------------------------------------------------------------------- */

      const amcNumber =
        `AMC-${String(amcId).padStart(6, "0")}`;

      const updateResult =
        await client.query(
          `
          UPDATE amc_contracts
          SET
            amc_number = $1,
            updated_at = CURRENT_TIMESTAMP
          WHERE id = $2

          RETURNING
            id,
            amc_number,
            customer_id,
            solar_system_id,
            start_date,
            end_date,
            contract_amount,
            visit_frequency,
            total_visits,
            used_visits,
            (
              total_visits - used_visits
            ) AS pending_visits,
            status,
            terms_conditions,
            notes,
            created_by,
            created_at,
            updated_at
          `,
          [
            amcNumber,
            amcId,
          ]
        );

      await client.query("COMMIT");

      return NextResponse.json(
        {
          success: true,
          message:
            "AMC contract created successfully.",
          data: {
            ...updateResult.rows[0],
            customer_code:
              customer.customer_code,
            customer_name:
              customer.customer_name,
            system_code:
              solarSystem.system_code,
          },
        },
        { status: 201 }
      );
    } catch (transactionError) {
      await client.query("ROLLBACK");

      throw transactionError;
    } finally {
      client.release();
    }
  } catch (error) {
    console.error("CREATE AMC ERROR:", error);

    return NextResponse.json(
      {
        success: false,
        message:
          "Failed to create AMC contract.",
      },
      { status: 500 }
    );
  }
}