import { NextRequest, NextResponse } from "next/server";
import { mutationOriginAllowed } from "./lib/security/origin";

export function middleware(request: NextRequest) {
  const origins = [process.env.NEXT_PUBLIC_APP_URL || "https://movepilot.dnet.llc", ...(process.env.APP_ALLOWED_ORIGINS || "").split(",").filter(Boolean)];
  if (process.env.NODE_ENV !== "production") origins.push(request.nextUrl.origin);
  if (!mutationOriginAllowed(request.method, request.nextUrl.pathname, request.headers.get("origin"), origins)) {
    return NextResponse.json({ error: "This request must come from MovePilot." }, { status: 403 });
  }
  return NextResponse.next();
}
export const config = { matcher: ["/api/:path*"] };
