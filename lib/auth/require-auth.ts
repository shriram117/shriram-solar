import { NextResponse } from "next/server";
import { getCurrentUser } from "./auth";

export async function requireAuth() {
  const user = await getCurrentUser();

  if (!user) {
    return {
      user: null,
      response: NextResponse.json(
        {
          success: false,
          message: "Unauthorized",
        },
        { status: 401 }
      ),
    };
  }

  return {
    user,
    response: null,
  };
}