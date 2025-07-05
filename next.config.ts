import createNextIntlPlugin from 'next-intl/plugin';

const withNextIntl = createNextIntlPlugin('./src/i18n.ts');

/** @type {import('next').NextConfig} */
const nextConfig = {
    // Force SWC transpilation even when Babel config exists
    experimental: {
        forceSwcTransforms: true,
    }
};

export default withNextIntl(nextConfig);
