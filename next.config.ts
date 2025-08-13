import createNextIntlPlugin from 'next-intl/plugin';
import type { NextConfig } from 'next';

const withNextIntl = createNextIntlPlugin('./src/i18n.ts');

const nextConfig: NextConfig = {
    // Force SWC transpilation even when Babel config exists
    experimental: {
        forceSwcTransforms: true,
    },

    // Do not fail the production build on ESLint errors (Vercel/CI)
    eslint: {
        ignoreDuringBuilds: true,
    },

    // Configure redirects for common issues
    async redirects() {
        return [
            // Redirect test-translations without locale to English version
            {
                source: '/test-translations',
                destination: '/en/test-translations',
                permanent: false,
            },
            // Redirect auth without locale to English version
            {
                source: '/auth/signin',
                destination: '/en/auth/signin',
                permanent: false,
            },
            // Static fallback page
            {
                source: '/static-test',
                destination: '/static-fallback.html',
                permanent: false,
            },
            // Keep /test-fallback accessible
            // (No special basePath handling required)
            // Provide a fallback path to test-fallback in case of issues
            {
                source: '/fallback',
                destination: '/test-fallback',
                permanent: false,
            },
            // If a page is not found, try the English version
            {
                source: '/:path*',
                has: [
                    {
                        type: 'header',
                        key: 'x-not-found',
                        value: 'true',
                    },
                ],
                destination: '/en/:path*',
                permanent: false,
            },
        ];
    }
};

export default withNextIntl(nextConfig);
