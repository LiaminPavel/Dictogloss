import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

import { auth } from "@/auth";

const LOGIN_PATH = "/login";
const ADMIN_PREFIX = "/admin";
const ADMIN_API_PREFIX = "/api/admin";

export default auth((req: NextRequest & { auth: { user?: { role?: string } } | null }) => {
  const { pathname } = req.nextUrl;
  const isAdminPage = pathname.startsWith(ADMIN_PREFIX);
  const isAdminApi = pathname.startsWith(ADMIN_API_PREFIX);
  const isAuthenticated = Boolean(req.auth?.user);
  const isAdmin = req.auth?.user?.role === "ADMIN";

  if (!isAdminPage && !isAdminApi) {
    return NextResponse.next();
  }

  if (!isAuthenticated) {
    if (isAdminApi) {
      return NextResponse.json(
        {
          data: null,
          error: {
            message: "Unauthorized",
            code: "UNAUTHORIZED",
          },
        },
        { status: 401 },
      );
    }

    const loginUrl = new URL(LOGIN_PATH, req.url);
    loginUrl.searchParams.set("from", pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (!isAdmin) {
    if (isAdminApi) {
      return NextResponse.json(
        {
          data: null,
          error: {
            message: "Unauthorized",
            code: "UNAUTHORIZED",
          },
        },
        { status: 401 },
      );
    }

    return NextResponse.redirect(new URL(LOGIN_PATH, req.url));
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/admin/:path*", "/api/admin/:path*"],
};
