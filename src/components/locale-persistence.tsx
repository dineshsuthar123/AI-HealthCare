'use client';

import { useEffect } from 'react';
import { useRouter, usePathname } from '@/navigation';
import { useLocale } from 'next-intl';

export default function LocalePersistence() {
    const locale = useLocale();
    const router = useRouter();
    const pathname = usePathname();

    const supportedLocales = ['en', 'es', 'fr', 'hi', 'pt', 'sw', 'ar'] as const;
    const stripLeadingLocale = (path: string | null | undefined) => {
        if (!path) return '/';
        const parts = path.split('/');
        if (parts.length > 1 && supportedLocales.includes(parts[1] as any)) {
            const rest = parts.slice(2).join('/');
            return rest ? `/${rest}` : '/';
        }
        return path || '/';
    };

    useEffect(() => {
        // Save current locale to localStorage
        if (typeof window !== 'undefined') {
            const currentLocale = localStorage.getItem('preferredLocale');

            // Only update if different to avoid unnecessary writes
            if (currentLocale !== locale) {
                localStorage.setItem('preferredLocale', locale);
                console.log(`LocalePersistence: Updated stored locale to ${locale}`);
            }
        }
    }, [locale]);

    useEffect(() => {
        // On mount, check if URL parameter is trying to force a specific locale
        if (typeof window !== 'undefined') {
            const urlParams = new URLSearchParams(window.location.search);
            const forceLocale = urlParams.get('forceLocale');

            if (forceLocale) {
                // Check if the forced locale is supported
                const supportedLocales = ['en', 'es', 'fr', 'hi', 'pt', 'sw', 'ar'];
                if (supportedLocales.includes(forceLocale) && forceLocale !== locale) {
                    console.log(`LocalePersistence: Forcing locale to ${forceLocale} from URL parameter`);

                    // Update localStorage
                    localStorage.setItem('preferredLocale', forceLocale);

                    // Navigate to the new locale using the router for a clean transition
                    router.push(stripLeadingLocale(pathname), { locale: forceLocale });
                    return;
                }
            }

            // Check stored preference only if no force parameter
            const savedLocale = localStorage.getItem('preferredLocale');

            // If saved locale exists and is different from current, redirect
            if (savedLocale && savedLocale !== locale) {
                // Check if the saved locale is supported
                const supportedLocales = ['en', 'es', 'fr', 'hi', 'pt', 'sw', 'ar'];
                if (supportedLocales.includes(savedLocale as any)) {
                    console.log(`LocalePersistence: Switching to saved locale ${savedLocale}`);
                    router.push(stripLeadingLocale(pathname), { locale: savedLocale });
                }
            }
        }
    }, [locale, pathname, router]);

    return null; // This component doesn't render anything
}
