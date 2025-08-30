import { NextRequest, NextResponse } from "next/server";

export function middleware(request: NextRequest) {
  // For now, allow all requests during development
  // TODO: Re-enable authentication middleware once basic functionality is working
  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
};
