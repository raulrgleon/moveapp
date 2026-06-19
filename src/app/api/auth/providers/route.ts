import { NextResponse } from "next/server";
import { getOAuthProvidersStatus } from "@/lib/auth/oauth-providers";

export async function GET() {
  return NextResponse.json(getOAuthProvidersStatus());
}
