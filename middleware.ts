import { NextResponse, type NextRequest } from "next/server";

export function middleware(req: NextRequest) {
  const res = NextResponse.next();
  // Don't let admin panel be indexed
  if (req.nextUrl.pathname.startsWith("/admin")) {
    res.headers.set("X-Robots-Tag", "noindex, nofollow, noarchive");
  }
  return res;
}

export const config = {
  matcher: ["/admin/:path*"],
};
