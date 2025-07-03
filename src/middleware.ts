import createMiddleware from 'next-intl/middleware';

export default createMiddleware({
    // A list of all locales that are supported
    locales: ['en', 'es', 'fr', 'hi', 'pt', 'sw', 'ar'],

    // Used when no locale matches
    defaultLocale: 'en',

    // Add localePrefix to always enforce locale in URL
    localePrefix: 'always'
});

export const config = {
    // Match only internationalized pathnames
    matcher: ['/((?!api|_next|.*\\..*).*)']
};
