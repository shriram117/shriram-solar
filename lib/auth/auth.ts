import { cookies } from "next/headers";
import { jwtVerify } from "jose";

const authSecret = process.env.AUTH_SECRET;

if (!authSecret) {
  throw new Error("AUTH_SECRET is not defined");
}

const secretKey = new TextEncoder().encode(authSecret);

export type AuthUser = {
  userId: number;
  username: string;
  role: string;
  fullName: string;
};

export async function getCurrentUser(): Promise<AuthUser | null> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("auth_token")?.value;

    if (!token) {
      return null;
    }

    const { payload } = await jwtVerify(token, secretKey);

    return {
      userId: Number(payload.userId),
      username: String(payload.username),
      role: String(payload.role),
      fullName: String(payload.fullName),
    };
  } catch {
    return null;
  }
}