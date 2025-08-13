import type { ReactNode } from 'react';

export default function TestFallbackLayout({ children }: { children: ReactNode }) {
    // Segment layout (do not include <html>/<body>): wraps the test-fallback page
    return (
        <section className="min-h-screen">
            {children}
        </section>
    );
}
