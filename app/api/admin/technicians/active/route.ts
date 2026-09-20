import { NextResponse } from "next/server";
import { pool } from "@/lib/db/db";
import { requireAuth } from "@/lib/auth/require-auth";

export async function GET() {
  const { user, response } = await requireAuth();

  if (!user) {
    return response;
  }

  try {
    const result = await pool.query(`
      SELECT
        id,
        technician_code,
        technician_name,
        mobile,
        specialization
      FROM technicians
      WHERE status = 'ACTIVE'
      ORDER BY technician_name ASC
    `);

    return NextResponse.json({
      success: true,
      data: result.rows,
      count: result.rows.length,
    });
  } catch (error) {
    console.error("GET active technicians error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to fetch active technicians.",
      },
      { status: 500 }
    );
  }
}