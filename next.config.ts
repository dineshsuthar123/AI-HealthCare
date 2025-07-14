import createNextIntlPlugin from 'next-intl/plugin';

const withNextIntl = createNextIntlPlugin('./src/i18n.ts');

/** @type {import('next').NextConfig} */
const nextConfig = {
    // Force SWC transpilation even when Babel config exists
    experimental: {
        forceSwcTransforms: true,
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
            // Ensure /test-fallback works (for cases where it might not be properly excluded from middleware)
            {
                source: '/test-fallback',
                destination: '/test-fallback',
                permanent: false,
                basePath: false, // Bypass Next.js's base path
            },
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
