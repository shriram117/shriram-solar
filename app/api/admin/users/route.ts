import { NextResponse } from "next/server";
import { pool } from "@/lib/db/db";
import { requireAuth } from "@/lib/auth/require-auth";

export async function GET() {
  const auth = await requireAuth();

  if (auth.response) {
    return auth.response;
  }

  try {
    const result = await pool.query(`
      SELECT
        u.id,
        u.username,
        u.full_name,
        u.email,
        u.mobile,
        u.role_id,
        r.role_name,
        u.status
      FROM users u
      INNER JOIN roles r
        ON r.id = u.role_id
      WHERE u.status = TRUE
      ORDER BY u.full_name ASC
    `);

    return NextResponse.json({
      success: true,
      data: result.rows,
      count: result.rows.length,
    });
  } catch (error) {
    console.error("GET users error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to fetch users",
      },
      { status: 500 }
    );
  }
}