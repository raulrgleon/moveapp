import { NextRequest, NextResponse } from "next/server";
import { mutationOriginAllowed } from "./lib/security/origin";

export function middleware(request: NextRequest) {
  const host = request.headers.get("host")?.split(":")[0];
  if (host === "www.movepilotai.com" || host === "movepilot.dnet.llc") {
    const url = new URL(request.nextUrl.pathname + request.nextUrl.search, "https://movepilotai.com");
    return NextResponse.redirect(url, 308);
  }
  const origins = [process.env.NEXT_PUBLIC_APP_URL || "https://movepilotai.com", ...(process.env.APP_ALLOWED_ORIGINS || "").split(",").filter(Boolean)];
  if (process.env.NODE_ENV !== "production") origins.push(request.nextUrl.origin);
  if (!mutationOriginAllowed(request.method, request.nextUrl.pathname, request.headers.get("origin"), origins)) {
    return NextResponse.json({ error: "This request must come from MovePilot." }, { status: 403 });
  }
  return NextResponse.next();
}
export const config = { matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"] };
