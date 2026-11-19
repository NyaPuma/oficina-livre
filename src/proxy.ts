import { jwtVerify } from "jose";
import { NextResponse, type NextRequest } from "next/server";

const COOKIE = "oficina_session";
const PUBLIC_PATHS = [
  "/login",
  "/sem-permissao",
  "/agendar",
  "/orcamento",
  "/diagnostico",
  "/api/v1",
  "/api/webhooks",
  "/api/cron",
  "/api/auth/login",
];

function securityHeaders(response: NextResponse, nonce: string): NextResponse {
  const csp = [
    "default-src 'self'",
    `script-src 'self' 'nonce-${nonce}' 'strict-dynamic'${process.env.NODE_ENV === "development" ? " 'unsafe-eval'" : ""}`,
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: blob: https:",
    "font-src 'self' data:",
    "connect-src 'self'",
    "form-action 'self' https://checkout.stripe.com",
    "frame-ancestors 'none'",
    "base-uri 'self'",
    "object-src 'none'",
  ].join("; ");

  response.headers.set("Content-Security-Policy", csp);
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("X-Frame-Options", "DENY");
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  response.headers.set("Permissions-Policy", "camera=(self), microphone=(), geolocation=()");
  response.headers.set(
    "Strict-Transport-Security",
    "max-age=31536000; includeSubDomains; preload",
  );
  return response;
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const nonce = crypto.randomUUID().replace(/-/g, "");
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-nonce", nonce);

  const isPublic = PUBLIC_PATHS.some((path) => pathname === path || pathname.startsWith(`${path}/`));

  if (!isPublic) {
    const token = request.cookies.get(COOKIE)?.value;
    const secret = process.env.SESSION_SECRET;
    let valid = false;

    if (token && secret && secret.length >= 16) {
      try {
        await jwtVerify(token, new TextEncoder().encode(secret));
        valid = true;
      } catch {
        valid = false;
      }
    }

    if (!valid) {
      const loginUrl = new URL("/login", request.url);
      loginUrl.searchParams.set("next", pathname);
      return securityHeaders(NextResponse.redirect(loginUrl), nonce);
    }
  }

  // Reenvia o nonce ao renderizador para os scripts inline do Next.js.
  return securityHeaders(
    NextResponse.next({ request: { headers: requestHeaders } }),
    nonce,
  );
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|icon.svg|api/files).*)"],
};
