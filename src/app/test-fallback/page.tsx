'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

export default function TestFallbackPage() {
    // List of supported languages
    const languages = [
        { code: 'en', name: 'English', flag: '🇺🇸' },
        { code: 'es', name: 'Español', flag: '🇪🇸' },
        { code: 'fr', name: 'Français', flag: '🇫🇷' },
        { code: 'pt', name: 'Português', flag: '🇧🇷' },
        { code: 'ar', name: 'العربية', flag: '🇸🇦' },
        { code: 'hi', name: 'हिन्दी', flag: '🇮🇳' },
        { code: 'sw', name: 'Kiswahili', flag: '🇰🇪' },
    ];

    const [locale, setLocale] = useState('en');
    const [pathname, setPathname] = useState('');
    const [message, setMessage] = useState('Loading...');
    const [statusMsg, setStatusMsg] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [pageStatus, setPageStatus] = useState<'loading' | 'success' | 'error'>('loading');

    useEffect(() => {
        // Only run on client
        if (typeof window !== 'undefined') {
            try {
                // Extract locale from URL or use default
                const path = window.location.pathname;
                const pathSegments = path.split('/').filter(Boolean);
                const urlLocale = pathSegments[0];

                // Check if it looks like a locale
                if (languages.some(lang => lang.code === urlLocale)) {
                    setLocale(urlLocale);
                } else {
                    // Default to English or get from localStorage
                    const savedLocale = localStorage.getItem('preferredLocale') || 'en';
                    setLocale(savedLocale);
                }

                setPathname(path);
                setMessage('Page loaded successfully.');
                setPageStatus('success');

                // Log success for debugging
                console.log('TestFallbackPage loaded successfully!');
                setStatusMsg('The test-fallback page loaded successfully. You can use it to test language switching.');
            } catch (error) {
                console.error('Error in useEffect:', error);
                setMessage('Error loading page: ' + (error instanceof Error ? error.message : String(error)));
                setPageStatus('error');
                setStatusMsg('There was an error loading the page. This might be due to a middleware issue or navigation problem.');
            }
        }
    }, [languages]); // Add languages as dependency

    const switchLanguage = (newLocale: string) => {
        if (typeof window !== 'undefined' && !isLoading) {
            try {
                setIsLoading(true);
                setMessage(`Switching to ${newLocale}...`);

                // Store in localStorage
                localStorage.setItem('preferredLocale', newLocale);

                // Add cache-busting parameter
                const timestamp = Date.now();
                const newUrl = `/${newLocale}/test-translations?_nocache=${timestamp}`;

                console.log(`Navigating to: ${newUrl}`);

                // Add a timeout to ensure we restore the loading state if navigation fails
                const navigationTimeout = setTimeout(() => {
                    setIsLoading(false);
                    setMessage('Navigation timeout - please try clicking one of the direct links below');
                    setPageStatus('error');
                }, 5000);

                // Clear any existing navigation timeouts before navigation
                window.clearTimeout(navigationTimeout);

                // Navigate to the new URL
                window.location.href = newUrl;
            } catch (error) {
                console.error('Error switching language:', error);
                setMessage('Error switching language: ' + (error instanceof Error ? error.message : String(error)));
                setPageStatus('error');
                setIsLoading(false);

                // Show fallback message and options
                setStatusMsg('Language switching failed. Please try using one of the direct links below.');
            }
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 py-12">
            <div className="max-w-4xl mx-auto px-4">
                <h1 className="text-3xl font-bold mb-8">Translation Test Fallback Page</h1>

                {/* Status Message */}
                <div className={`border rounded-lg p-4 mb-6 ${pageStatus === 'success' ? 'bg-green-50 border-green-200' :
                        pageStatus === 'error' ? 'bg-red-50 border-red-200' :
                            'bg-blue-50 border-blue-200'
                    }`}>
                    <p><strong>Status:</strong> {message}</p>
                    {statusMsg && <p className="mt-2">{statusMsg}</p>}
                </div>

                <div className="bg-white rounded-lg shadow-md p-6 mb-6">
                    <h2 className="text-xl font-semibold mb-4">Current Locale: {locale}</h2>
                    <p className="mb-4">Current Path: {pathname}</p>
                    <p className="mb-4">Use the buttons below to test language switching directly:</p>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                        {languages.map(lang => (
                            <button
                                key={lang.code}
                                onClick={() => switchLanguage(lang.code)}
                                disabled={isLoading}
                                className={`p-3 border rounded-lg hover:bg-gray-50 text-center ${locale === lang.code ? 'bg-blue-50 border-blue-300' : ''
                                    } ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
                            >
                                {lang.flag} {lang.name}
                            </button>
                        ))}
                    </div>

                    <h3 className="text-lg font-medium mb-2">Direct Links (Bypass Router):</h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                        {languages.map(lang => (
                            <a
                                key={lang.code}
                                href={`/${lang.code}/test-translations?_nocache=${Date.now()}`}
                                className="p-3 border rounded-lg hover:bg-gray-50 text-center"
                            >
                                {lang.flag} {lang.name}
                            </a>
                        ))}
                    </div>

                    <div className="mt-6 space-y-3">
                        <p>
                            <Link href="/" className="text-blue-600 hover:underline">Go to Home Page</Link>
                        </p>
                        <p>
                            <Link href="/static-test" className="text-blue-600 hover:underline">
                                Go to Static Fallback Page (100% reliable)
                            </Link>
                        </p>
                        <p>
                            <button
                                onClick={() => {
                                    if (typeof window !== 'undefined') {
                                        localStorage.clear();
                                        setMessage('Local storage cleared. Reloading page...');
                                        setTimeout(() => window.location.reload(), 1000);
                                    }
                                }}
                                className="text-red-600 hover:underline"
                            >
                                Clear Local Storage & Reload
                            </button>
                        </p>
                    </div>
                </div>

                {/* Additional Troubleshooting Options */}
                <div className="bg-white rounded-lg shadow-md p-6 mb-6">
                    <h2 className="text-xl font-semibold mb-4">Troubleshooting</h2>

                    <div className="space-y-4">
                        <div>
                            <h3 className="font-medium mb-2">Check URL Access:</h3>
                            <ul className="list-disc pl-5 space-y-2">
                                <li>
                                    <Link href="/static-test" className="text-blue-600 hover:underline">
                                        Static Test Page
                                    </Link>
                                    <span className="ml-2 text-gray-500">(Pure HTML, bypasses Next.js)</span>
                                </li>
                                <li>
                                    <a href="/static-fallback.html" className="text-blue-600 hover:underline">
                                        Direct Static HTML
                                    </a>
                                    <span className="ml-2 text-gray-500">(Direct access to static file)</span>
                                </li>
                                <li>
                                    <Link href="/fallback" className="text-blue-600 hover:underline">
                                        Fallback Redirect
                                    </Link>
                                    <span className="ml-2 text-gray-500">(Alternate path to this page)</span>
                                </li>
                            </ul>
                        </div>

                        <div>
                            <h3 className="font-medium mb-2">Language Tests:</h3>
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                                {languages.map(lang => (
                                    <a
                                        key={`static-${lang.code}`}
                                        href={`/${lang.code}?_nocache=${Date.now()}`}
                                        className="p-2 border rounded-lg hover:bg-gray-50 text-center text-sm"
                                    >
                                        {lang.flag} {lang.name} Root
                                    </a>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
