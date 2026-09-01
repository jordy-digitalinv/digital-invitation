import { auth } from "@/lib/auth/auth";
import { NextResponse } from "next/server";

const MAIN_DOMAIN =
  process.env.NEXT_PUBLIC_INVITATION_DOMAIN ?? "digital-invitation.my.id";

const CMS_HOST = `cms.${MAIN_DOMAIN}`;

export default auth((req) => {
  const hostname = req.headers.get("host") || req.nextUrl.hostname;
  const isCmsHost = hostname === CMS_HOST;
  const isSubdomain =
    !isCmsHost && hostname !== MAIN_DOMAIN && hostname.endsWith(`.${MAIN_DOMAIN}`);

  if (isSubdomain) {
    // Slug client kini menjadi subdomain: jordy-rea.domain.com -> /invite/jordy-rea
    const slug = hostname.slice(0, hostname.length - MAIN_DOMAIN.length - 1);
    const path = req.nextUrl.pathname;

    if (slug && !slug.includes(".")) {
      const segments = path.split("/").filter(Boolean);
      const isStaticOrApi =
        path.startsWith("/api") ||
        path.startsWith("/_next") ||
        path.startsWith("/print");

      if (!isStaticOrApi && segments.length <= 1) {
        const url = req.nextUrl.clone();
        if (segments.length === 0) {
          url.pathname = `/invite/${slug}`;
        } else {
          // Guest tokens always contain "_" (name-slug_random).
          url.pathname = `/invite/g/${segments[0]}`;
        }
        return NextResponse.rewrite(url);
      }
    }
  }

  const isLoggedIn = !!req.auth;
  const { pathname } = req.nextUrl;
  const isCmsRoot = isCmsHost && pathname === "/";
  const isAdminRoute = isCmsRoot || pathname.startsWith("/admin");
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

  if (isCmsRoot) {
    const url = req.nextUrl.clone();
    url.pathname = "/admin";
    return NextResponse.rewrite(url);
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
