import { NextRequest, NextResponse } from "next/server";
import { SESSION_COOKIE_NAME, verifySessionToken } from "@/lib/auth";
import { findUserByEmail } from "@/lib/db";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  const token = request.cookies.get(SESSION_COOKIE_NAME)?.value;
  const session = verifySessionToken(token);
  if (!session) {
    return NextResponse.json({ ok: false }, { status: 401 });
  }
  const user = await findUserByEmail(session.email);
  if (!user) {
    return NextResponse.json({ ok: false }, { status: 401 });
  }
  return NextResponse.json({
    ok: true,
    user: {
      email: user.email,
      name: user.name,
      mustChangePassword: user.must_change_password,
      lastLogin: user.last_login,
    },
  });
}
