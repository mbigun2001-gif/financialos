import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Маршрути, які не потребують автентифікації
const publicRoutes = ["/login"];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Перевіряємо чи це публічний маршрут
  if (publicRoutes.includes(pathname)) {
    return NextResponse.next();
  }

  // Для всіх інших маршрутів перевірка буде на клієнті
  // (оскільки ми використовуємо localStorage, який доступний тільки на клієнті)
  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    "/((?!api|_next/static|_next/image|favicon.ico).*)",
  ],
};
