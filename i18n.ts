import { getRequestConfig } from 'next-intl/server';

export default getRequestConfig(async ({ locale }) => {
    const resolvedLocale = locale || 'en';
    return {
        locale: resolvedLocale,
        // Keep messages folder next to this file for reliable bundling
        messages: (await import(`./messages/${resolvedLocale}.json`)).default
    };
});
