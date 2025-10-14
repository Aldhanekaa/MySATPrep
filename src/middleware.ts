import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

export default function middleware(req: NextRequest) {
  void req;
  return NextResponse.next();
}

export const config = {
  matcher:
    "/((?!_next/static|_next/image|favicon\\.ico|robots\\.txt|sitemap\\.xml|sitemap/.*|site\\.webmanifest).*)",
};
