import { NextRequest, NextResponse } from "next/server";
import { verifySessionToken, COOKIE_NAME } from "@/lib/auth";

const PROTECTED_PATHS = ["/admin", "/api/employees", "/api/rounds"];
const PUBLIC_PATHS = ["/api/auth/login", "/api/auth/logout"];

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // 평가 페이지와 평가 API는 토큰 기반이므로 보호하지 않음
  if (pathname.startsWith("/eval") || pathname.startsWith("/api/eval")) {
    return NextResponse.next();
  }

  // 인증 API는 통과
  if (PUBLIC_PATHS.some((p) => pathname.startsWith(p))) {
    return NextResponse.next();
  }

  // 보호 대상 경로인지 확인
  const isProtected = PROTECTED_PATHS.some((p) => pathname.startsWith(p));
  if (!isProtected) {
    return NextResponse.next();
  }

  // 세션 쿠키 검증
  const token = req.cookies.get(COOKIE_NAME)?.value;

  if (!token || !(await verifySessionToken(token))) {
    // API 요청은 401 반환
    if (pathname.startsWith("/api/")) {
      return NextResponse.json(
        { error: "인증이 필요합니다" },
        { status: 401 }
      );
    }
    // 페이지 요청은 로그인으로 리다이렉트
    const loginUrl = new URL("/login", req.url);
    loginUrl.searchParams.set("redirect", pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*", "/api/employees/:path*", "/api/rounds/:path*"],
};
