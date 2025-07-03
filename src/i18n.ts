import { getRequestConfig } from 'next-intl/server';

export default getRequestConfig(async ({ locale }) => {
    const resolvedLocale = locale || 'en'; // Default to 'en' if locale is undefined
    return {
        locale: resolvedLocale,
        messages: (await import(`../messages/${resolvedLocale}.json`)).default
    };
});
