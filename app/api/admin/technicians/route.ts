import { NextRequest, NextResponse } from "next/server";
import { pool } from "@/lib/db/db";
import { requireAuth } from "@/lib/auth/require-auth";

export async function GET(request: NextRequest) {
  const { user, response } = await requireAuth();

  if (!user) {
    return response;
  }

  try {
    const { searchParams } = new URL(request.url);

    const search = searchParams.get("search")?.trim() || "";
    const status = searchParams.get("status")?.trim() || "";

    const conditions: string[] = [];
    const values: string[] = [];

    /*
     * Search
     */
    if (search) {
      values.push(`%${search}%`);

      conditions.push(`
        (
          t.technician_code ILIKE $${values.length}
          OR t.technician_name ILIKE $${values.length}
          OR t.mobile ILIKE $${values.length}
          OR t.email ILIKE $${values.length}
        )
      `);
    }

    /*
     * Status filter
     */
    if (status) {
      values.push(status);

      conditions.push(`
        t.status = $${values.length}
      `);
    }

    const whereClause =
      conditions.length > 0
        ? `WHERE ${conditions.join(" AND ")}`
        : "";

    /*
     * Get technicians
     */
    const query = `
      SELECT
        t.id,
        t.technician_code,
        t.technician_name,
        t.mobile,
        t.email,
        t.address,
        t.specialization,
        t.experience_years,
        t.joining_date,
        t.status,
        t.created_at,
        t.updated_at,

        COUNT(DISTINCT ss.id)::int AS assigned_systems_count

      FROM technicians t

      LEFT JOIN solar_systems ss
        ON ss.installer_technician_id = t.id

      ${whereClause}

      GROUP BY
        t.id,
        t.technician_code,
        t.technician_name,
        t.mobile,
        t.email,
        t.address,
        t.specialization,
        t.experience_years,
        t.joining_date,
        t.status,
        t.created_at,
        t.updated_at

      ORDER BY t.id DESC
    `;

    const result = await pool.query(query, values);

    return NextResponse.json({
      success: true,
      data: result.rows,
      count: result.rows.length,
    });
  } catch (error) {
    console.error("GET technicians error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to fetch technicians.",
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  const { user, response } = await requireAuth();

  if (!user) {
    return response;
  }

  try {
    const body = await request.json();

    const {
      technicianName,
      mobile,
      email,
      address,
      specialization,
      experienceYears,
      joiningDate,
      status = "ACTIVE",
    } = body;

    /*
     * Technician name validation
     */
    if (!technicianName?.trim()) {
      return NextResponse.json(
        {
          success: false,
          message: "Technician name is required.",
        },
        { status: 400 }
      );
    }

    /*
     * Mobile validation
     */
    if (!mobile?.trim()) {
      return NextResponse.json(
        {
          success: false,
          message: "Mobile number is required.",
        },
        { status: 400 }
      );
    }

    /*
     * Status validation
     */
    if (!["ACTIVE", "INACTIVE"].includes(status)) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid technician status.",
        },
        { status: 400 }
      );
    }

    /*
     * Experience validation
     */
    let experienceYearsValue: number | null = null;

    if (
      experienceYears !== null &&
      experienceYears !== undefined &&
      experienceYears !== ""
    ) {
      const parsedExperience = Number(experienceYears);

      if (
        !Number.isFinite(parsedExperience) ||
        !Number.isInteger(parsedExperience) ||
        parsedExperience < 0
      ) {
        return NextResponse.json(
          {
            success: false,
            message: "Experience must be a valid whole number of years.",
          },
          { status: 400 }
        );
      }

      experienceYearsValue = parsedExperience;
    }

    /*
     * Duplicate active technician check
     */
    const duplicateCheck = await pool.query(
      `
        SELECT id
        FROM technicians
        WHERE mobile = $1
          AND status = 'ACTIVE'
        LIMIT 1
      `,
      [mobile.trim()]
    );

    if (duplicateCheck.rows.length > 0) {
      return NextResponse.json(
        {
          success: false,
          message:
            "An active technician with this mobile number already exists.",
        },
        { status: 409 }
      );
    }

    /*
     * Transaction
     */
    const client = await pool.connect();

    try {
      await client.query("BEGIN");

      /*
       * Generate ID
       */
      const sequenceResult = await client.query(
        `
          SELECT nextval('technicians_id_seq') AS id
        `
      );

      const id = Number(sequenceResult.rows[0].id);

      /*
       * Generate technician code
       */
      const technicianCode = `TECH-${String(id).padStart(6, "0")}`;

      /*
       * Insert technician
       */
      const result = await client.query(
        `
          INSERT INTO technicians (
            id,
            technician_code,
            technician_name,
            mobile,
            email,
            address,
            specialization,
            experience_years,
            joining_date,
            status
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
            $10
          )
          RETURNING
            id,
            technician_code,
            technician_name,
            mobile,
            email,
            address,
            specialization,
            experience_years,
            joining_date,
            status,
            created_at,
            updated_at
        `,
        [
          id,
          technicianCode,
          technicianName.trim(),
          mobile.trim(),
          email?.trim() || null,
          address?.trim() || null,
          specialization?.trim() || null,
          experienceYearsValue,
          joiningDate || null,
          status,
        ]
      );

      await client.query("COMMIT");

      return NextResponse.json(
        {
          success: true,
          message: "Technician created successfully.",
          data: result.rows[0],
        },
        { status: 201 }
      );
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  } catch (error) {
    console.error("POST technician error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to create technician.",
      },
      { status: 500 }
    );
  }
}