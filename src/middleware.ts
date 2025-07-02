import createMiddleware from 'next-intl/middleware';
import { NextRequest, NextResponse } from 'next/server';

const locales = ['en', 'es', 'fr', 'pt', 'hi', 'ar', 'sw'];
const defaultLocale = 'en';
// Create the next-intl middleware handler
const intlMiddleware = createMiddleware({ locales, defaultLocale, localePrefix: 'always' });

export default function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  // If API route is prefixed with locale (e.g. /en/api/...), rewrite to /api/...
  const localeApiMatch = pathname.match(new RegExp(`^/(${locales.join('|')})/api(/.*)`));
  if (localeApiMatch) {
    const [, , rest] = localeApiMatch;
    const url = req.nextUrl.clone();
    url.pathname = `/api${rest}`;
    return NextResponse.rewrite(url);
  }
  // Otherwise, handle localization for pages
  return intlMiddleware(req);
}

export const config = {
  // Match all pages and root, except Next.js internals and static files
  matcher: ['/', '/((?!api|_next/static|_next/image|favicon.ico|.*\\..*).*)']
};
