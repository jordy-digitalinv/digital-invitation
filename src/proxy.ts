import { auth } from "@/lib/auth/auth";
import { NextResponse } from "next/server";

const MAIN_DOMAIN =
  process.env.NEXT_PUBLIC_INVITATION_DOMAIN ?? "digital-invitation.my.id";

export default auth((req) => {
  const hostname = req.headers.get("host") || req.nextUrl.hostname;
  const isSubdomain =
    hostname !== MAIN_DOMAIN && hostname.endsWith(`.${MAIN_DOMAIN}`);

  if (isSubdomain) {
    const path = req.nextUrl.pathname.slice(1);
    if (path && !path.startsWith("_next") && !path.startsWith("api")) {
      const url = req.nextUrl.clone();
      const segments = path.split("/");
      // Guest tokens always contain "_" (name-slug_random); bare client slugs never do.
      const isGuestToken = segments.length === 1 && segments[0].includes("_");
      url.pathname = isGuestToken ? `/invite/g/${segments[0]}` : `/invite/${path}`;
      return NextResponse.rewrite(url);
    }
  }

  const isLoggedIn = !!req.auth;
  const { pathname } = req.nextUrl;
  const isAdminRoute = pathname.startsWith("/admin");
  const isLoginPage = pathname === "/login";

  if (isAdminRoute && !isLoggedIn) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  if (isLoginPage && isLoggedIn) {
    return NextResponse.redirect(new URL("/admin", req.url));
  }

  // STAFF: only allowed on client overview and attendance sub-routes
  const role = (req.auth?.user as any)?.role as string | undefined;
  if (role === "STAFF" && isAdminRoute) {
    const clientMatch = pathname.match(/^\/admin\/clients\/([^/]+)(\/.*)?$/);
    if (clientMatch) {
      const clientId = clientMatch[1];
      const subPath = clientMatch[2] || "";
      if (subPath !== "" && !subPath.startsWith("/attendance")) {
        return NextResponse.redirect(
          new URL(`/admin/clients/${clientId}/attendance`, req.url)
        );
      }
    }
  }

  return NextResponse.next();
});

export const config = {
  matcher: [
    "/admin/:path*",
    "/login",
    "/((?!_next/static|_next/image|favicon.ico|api).*)",
  ],
};
