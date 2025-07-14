'use client';

import { useState, useEffect } from 'react';
import { useLocale } from 'next-intl';
import { Globe, Check, ChevronDown, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { motion, AnimatePresence } from '@/lib/framer-motion';
import { cn } from '@/lib/utils';
import { clearIntlCache } from '@/lib/clear-intl-cache';

interface ReliableLanguageSwitcherProps {
    variant?: 'dropdown' | 'select';
    showIcon?: boolean;
    className?: string;
}

const languages = [
    { code: 'en', name: 'English', flag: '🇺🇸' },
    { code: 'es', name: 'Español', flag: '🇪🇸' },
    { code: 'fr', name: 'Français', flag: '🇫🇷' },
    { code: 'pt', name: 'Português', flag: '🇧🇷' },
    { code: 'ar', name: 'العربية', flag: '🇸🇦' },
    { code: 'hi', name: 'हिन्दी', flag: '🇮🇳' },
    { code: 'sw', name: 'Kiswahili', flag: '🇰🇪' },
];

export default function ReliableLanguageSwitcher({
    variant = 'dropdown',
    showIcon = true,
    className
}: ReliableLanguageSwitcherProps) {
    const [isOpen, setIsOpen] = useState(false);
    const locale = useLocale();
    const [isMounted, setIsMounted] = useState(false);

    // Prevent hydration issues
    useEffect(() => {
        setIsMounted(true);
    }, []);

    const currentLanguage = languages.find(lang => lang.code === locale) || languages[0];

    // This is the most reliable way to switch languages in Next.js with next-intl
    const handleLanguageChange = (newLocale: string) => {
        // Close dropdown
        setIsOpen(false);

        if (typeof window !== 'undefined') {
            try {
                // 1. Clear any cached translation data first
                clearIntlCache();

                // 2. Store preference in localStorage
                localStorage.setItem('preferredLocale', newLocale);

                // 3. Get current path and properly rebuild it with new locale
                const pathname = window.location.pathname;

                // Split the pathname to get segments
                const segments = pathname.split('/').filter(Boolean);

                // Check if first segment is a locale
                const isFirstSegmentLocale = languages.some(lang => lang.code === segments[0]);

                // Remove the current locale from the path if it exists
                let pathWithoutLocale = '';
                if (isFirstSegmentLocale && segments.length > 1) {
                    // There's a locale and more path segments
                    pathWithoutLocale = segments.slice(1).join('/');
                } else if (!isFirstSegmentLocale && segments.length > 0) {
                    // There's no locale but there are path segments
                    pathWithoutLocale = segments.join('/');
                }
                // Otherwise we're on the root path

                // 4. Construct the new path with the selected locale
                const newPath = `/${newLocale}${pathWithoutLocale ? '/' + pathWithoutLocale : ''}`;

                // 5. Add cache-busting parameter to force a clean reload
                const timestamp = Date.now();

                // 6. Add query params if they exist (but exclude our cache busting params)
                const url = new URL(window.location.href);
                url.searchParams.delete('_i18n_refresh');
                url.searchParams.delete('_t');
                url.searchParams.delete('_nocache');
                const cleanSearch = url.search;

                // 7. Add our cache busting parameter
                const separator = cleanSearch ? '&' : '?';
                const finalUrl = `${newPath}${cleanSearch}${separator}_nocache=${timestamp}`;

                // 8. Log for debugging
                console.log(`Language switching: ${pathname} → ${finalUrl}`);

                // 9. Navigate (most reliable method - forces a full page reload)
                window.location.href = finalUrl;

                // 10. For extra reliability, reload after a short delay if the navigation didn't happen
                setTimeout(() => {
                    if (locale === newLocale) {
                        console.log('Forcing reload to refresh translations');
                        window.location.reload();
                    }
                }, 500);
            } catch (error) {
                console.error('Error during language switch:', error);
                // Fallback to a simpler approach if something went wrong
                try {
                    // Add a cache busting parameter
                    window.location.href = `/${newLocale}?_nocache=${Date.now()}`;
                } catch (innerError) {
                    console.error('Fallback navigation failed:', innerError);
                    // Ultimate fallback - just try to go to the language root
                    window.location.href = `/${newLocale}`;
                }
            }
        }
    };

    // Server-side rendering safety
    if (!isMounted) {
        return variant === 'select' ? (
            <div className={cn("w-full h-10 animate-pulse bg-gray-200 rounded", className)}></div>
        ) : (
            <div className={cn("h-9 w-24 animate-pulse bg-gray-200 rounded", className)}></div>
        );
    }

    // Handler for when everything else fails
    const handleFallbackNavigation = (newLocale: string) => {
        try {
            // Store preference
            localStorage.setItem('preferredLocale', newLocale);

            // Navigate directly to the locale root
            window.location.href = `/${newLocale}`;
        } catch (error) {
            console.error('Fallback navigation failed:', error);
        }
    };

    // Render select variant
    if (variant === 'select') {
        return (
            <div className={cn("w-full", className)}>
                <label className="block text-sm font-medium mb-2">Language</label>
                <select
                    value={locale}
                    onChange={(e) => handleLanguageChange(e.target.value)}
                    className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                    aria-label="Select language"
                >
                    {languages.map((lang) => (
                        <option key={lang.code} value={lang.code}>
                            {lang.flag} {lang.name}
                        </option>
                    ))}
                </select>
                <p className="text-xs text-gray-500 mt-1">
                    Page will reload after selection
                </p>
            </div>
        );
    }

    // Render dropdown variant
    return (
        <div className={cn("relative", className)}>
            <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center space-x-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg"
                aria-label="Language selector"
                aria-expanded={isOpen}
            >
                {showIcon && <Globe className="h-4 w-4" />}
                <span className="hidden sm:inline">{currentLanguage.flag}</span>
                <span className="text-sm">{currentLanguage.name}</span>
                <ChevronDown className={cn(
                    "h-4 w-4 transition-transform duration-200",
                    isOpen ? "rotate-180" : ""
                )} />
            </Button>

            <AnimatePresence>
                {isOpen && (
                    <>
                        {/* Overlay */}
                        <div
                            className="fixed inset-0 z-10"
                            onClick={() => setIsOpen(false)}
                            aria-hidden="true"
                        />

                        {/* Dropdown */}
                        <motion.div
                            initial={{ opacity: 0, y: -10, scale: 0.95 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: -10, scale: 0.95 }}
                            transition={{ duration: 0.2 }}
                            className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 z-20 max-h-60 overflow-y-auto"
                        >
                            <div className="py-2">
                                {languages.map((lang) => (
                                    <button
                                        key={lang.code}
                                        onClick={() => handleLanguageChange(lang.code)}
                                        className={cn(
                                            "w-full flex items-center justify-between px-4 py-2 text-left hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors",
                                            locale === lang.code ? "bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300" : "text-gray-700 dark:text-gray-300"
                                        )}
                                        aria-label={`Switch to ${lang.name}`}
                                    >
                                        <div className="flex items-center space-x-3">
                                            <span className="text-lg">{lang.flag}</span>
                                            <span className="text-sm font-medium">{lang.name}</span>
                                        </div>
                                        {locale === lang.code && (
                                            <Check className="h-4 w-4 text-blue-600" />
                                        )}
                                    </button>
                                ))}

                                {/* Fallback options for direct navigation */}
                                <div className="px-4 py-2 border-t border-gray-200 dark:border-gray-700">
                                    <p className="text-xs text-gray-500 mb-2">Direct Navigation Links:</p>
                                    <div className="grid grid-cols-3 gap-1">
                                        {languages.map((lang) => (
                                            <button
                                                key={`fallback-${lang.code}`}
                                                onClick={() => handleFallbackNavigation(lang.code)}
                                                className="p-1 text-xs bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 rounded"
                                            >
                                                {lang.flag}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </div>
    );
}
