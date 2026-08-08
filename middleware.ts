import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";


const PUBLIC_PATHS = ["/sign-in", "/sign-up"];

export function middleware(request: NextRequest) {
  const session = request.cookies.get("session")?.value;
  const pathname = request.nextUrl.pathname;

  const isPublic = PUBLIC_PATHS.includes(pathname);

  if (!session && !isPublic) {
    return NextResponse.redirect(new URL("/sign-in", request.url));
  }

  return NextResponse.next();
}


export const config = {
  matcher: [
    "/((?!_next|api|static|favicon.ico|public|.*\\.(?:svg|png|jpg|jpeg|gif|ico)$).*)"
  ]
};
