import { notFound } from 'next/navigation';
import { getRequestConfig } from 'next-intl/server';

const locales = ['en', 'es', 'fr', 'pt', 'hi', 'ar', 'sw'];

export default getRequestConfig(async ({ locale }) => {
  // Validate that the incoming `locale` parameter is a valid string
  if (typeof locale !== 'string' || !locales.includes(locale)) {
    notFound();
  }

  return {
    messages: (await import(`../messages/${locale}.json`)).default,
    locale: locale
  };
});
