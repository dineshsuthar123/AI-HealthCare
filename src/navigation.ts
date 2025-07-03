import { createNavigation } from 'next-intl/navigation';

export const locales = ['en', 'es', 'fr', 'hi', 'pt', 'sw', 'ar'];

export const { Link, redirect, usePathname, useRouter } = createNavigation({
    locales,
});
