import { type NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { COOKIE_NAME } from "@/lib/auth";

const API_BASE = process.env.API_INTERNAL_URL ?? "http://localhost:8080";
const COOKIE_MAX_AGE = 7 * 24 * 60 * 60; // 7 days

const loginBodySchema = z.object({
  email: z.string(),
  password: z.string(),
});

const loginErrorSchema = z.object({ message: z.string().optional() });

const loginSuccessSchema = z.object({ token: z.string() });

export async function POST(req: NextRequest) {
  try {
    const bodyParsed = loginBodySchema.safeParse(await req.json());
    if (!bodyParsed.success) {
      return NextResponse.json({ message: "Invalid request" }, { status: 400 });
    }
    const body = bodyParsed.data;

    const apiRes = await fetch(`${API_BASE}/api/v1/admin/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    if (!apiRes.ok) {
      const errorParsed = loginErrorSchema.safeParse(await apiRes.json());
      return NextResponse.json(
        {
          message: errorParsed.success
            ? (errorParsed.data.message ?? "Invalid credentials")
            : "Invalid credentials",
        },
        { status: apiRes.status },
      );
    }

    const successParsed = loginSuccessSchema.safeParse(await apiRes.json());
    if (!successParsed.success) {
      return NextResponse.json(
        { message: "Unexpected response from API" },
        { status: 502 },
      );
    }
    const { token } = successParsed.data;

    const response = NextResponse.json({ ok: true });
    response.cookies.set(COOKIE_NAME, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: COOKIE_MAX_AGE,
      path: "/",
    });

    return response;
  } catch (error) {
    console.error("Login route handler error:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 },
    );
  }
}
