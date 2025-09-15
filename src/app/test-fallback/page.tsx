import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export default function TestFallbackRedirect() {
    // Return a 308 redirect response to a safe, locale-agnostic path
    return NextResponse.redirect(new URL('/en/test-translations', 'http://localhost'));
}
