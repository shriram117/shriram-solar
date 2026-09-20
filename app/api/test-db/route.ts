import { NextResponse } from "next/server";
import { pool } from "@/lib/db/db";

export async function GET() {
  try {
    const result = await pool.query(`
      SELECT
        current_database() AS database_name,
        current_user AS database_user,
        NOW() AS current_time;
    `);

    return NextResponse.json({
      success: true,
      message: "Database connected successfully",
      data: result.rows[0],
    });
  } catch (error) {
    console.error("Database connection error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Database connection failed",
      },
      { status: 500 }
    );
  }
}