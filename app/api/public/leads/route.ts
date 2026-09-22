import { NextRequest, NextResponse } from "next/server";
import { pool } from "@/lib/db/db";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const {
      name,
      mobile,
      email,
      city,
      service,
      message,
    } = body;

    if (!name || !mobile || !city || !service) {
      return NextResponse.json(
        {
          success: false,
          message: "Name, mobile, city and service are required.",
        },
        { status: 400 }
      );
    }

    const cleanName = String(name).trim();
    const cleanMobile = String(mobile).trim();
    const cleanEmail = email ? String(email).trim() : null;
    const cleanCity = String(city).trim();
    const cleanService = String(service).trim();
    const cleanMessage = message ? String(message).trim() : null;

    if (!/^[0-9]{10}$/.test(cleanMobile)) {
      return NextResponse.json(
        {
          success: false,
          message: "Please enter a valid 10 digit mobile number.",
        },
        { status: 400 }
      );
    }

    const leadCode = `WEB-${Date.now()}`;

    const result = await pool.query(
      `
      INSERT INTO leads (
        lead_code,
        customer_name,
        mobile,
        email,
        city,
        district,
        service_type,
        requirement,
        estimated_capacity,
        source,
        status,
        follow_up_date,
        notes
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
      RETURNING id, lead_code
      `,
      [
        leadCode,
        cleanName,
        cleanMobile,
        cleanEmail,
        cleanCity,
        null,
        cleanService,
        cleanMessage,
        null,
        "WEBSITE",
        "NEW",
        null,
        "Website inquiry",
      ]
    );

    return NextResponse.json(
      {
        success: true,
        message: "Your inquiry has been submitted successfully.",
        lead: result.rows[0],
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Public lead creation error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Unable to submit inquiry. Please try again.",
      },
      { status: 500 }
    );
  }
}