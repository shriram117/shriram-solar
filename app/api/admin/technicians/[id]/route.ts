import { NextRequest, NextResponse } from "next/server";
import { pool } from "@/lib/db/db";
import { requireAuth } from "@/lib/auth/require-auth";

type RouteContext = {
  params: Promise<{ id: string }>;
};

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
    const technicianId = Number(id);

    if (!Number.isInteger(technicianId) || technicianId <= 0) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid technician ID.",
        },
        { status: 400 }
      );
    }

    const result = await pool.query(
      `
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

        WHERE t.id = $1

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
      `,
      [technicianId]
    );

    if (result.rows.length === 0) {
      return NextResponse.json(
        {
          success: false,
          message: "Technician not found.",
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: result.rows[0],
    });
  } catch (error) {
    console.error("GET technician error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to fetch technician.",
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
    const technicianId = Number(id);

    if (!Number.isInteger(technicianId) || technicianId <= 0) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid technician ID.",
        },
        { status: 400 }
      );
    }

    const body = await request.json();

    const {
      technicianName,
      mobile,
      email,
      address,
      specialization,
      experienceYears,
      joiningDate,
      status,
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
            message:
              "Experience must be a valid whole number of years.",
          },
          { status: 400 }
        );
      }

      experienceYearsValue = parsedExperience;
    }

    /*
     * Check technician exists
     */
    const technicianCheck = await pool.query(
      `
        SELECT id
        FROM technicians
        WHERE id = $1
      `,
      [technicianId]
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

    /*
     * Duplicate active technician check
     */
    const duplicateCheck = await pool.query(
      `
        SELECT id
        FROM technicians
        WHERE mobile = $1
          AND status = 'ACTIVE'
          AND id <> $2
        LIMIT 1
      `,
      [mobile.trim(), technicianId]
    );

    if (duplicateCheck.rows.length > 0) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Another active technician with this mobile number already exists.",
        },
        { status: 409 }
      );
    }

    /*
     * Update technician
     */
    const result = await pool.query(
      `
        UPDATE technicians
        SET
          technician_name = $1,
          mobile = $2,
          email = $3,
          address = $4,
          specialization = $5,
          experience_years = $6,
          joining_date = $7,
          status = $8,
          updated_at = CURRENT_TIMESTAMP

        WHERE id = $9

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
        technicianName.trim(),
        mobile.trim(),
        email?.trim() || null,
        address?.trim() || null,
        specialization?.trim() || null,
        experienceYearsValue,
        joiningDate || null,
        status,
        technicianId,
      ]
    );

    return NextResponse.json({
      success: true,
      message: "Technician updated successfully.",
      data: result.rows[0],
    });
  } catch (error) {
    console.error("PATCH technician error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to update technician.",
      },
      { status: 500 }
    );
  }
}