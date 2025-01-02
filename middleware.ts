import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

const isPublicRoute = createRouteMatcher(["/sign-in(.*)", "/sign-up(.*)"]);

export default clerkMiddleware((auth, req) => {
  if (isPublicRoute(req)) {
    return;
  }

  // Get user agent and check if mobile
  const userAgent = req.headers.get('user-agent') || '';
  const isMobile = /Mobile|Android|iPhone/i.test(userAgent);
  const path = req.nextUrl.pathname;

  // Only handle the root path
  if (path === '/' && isMobile) {
    return NextResponse.redirect(new URL('/mobile-dashboard', req.url));
  }

  auth().protect();
});

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
};
