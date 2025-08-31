import { getTranslations, getLocale } from 'next-intl/server';
import { Link } from '@/navigation';
import TestPageClient from './test-client';

export default async function TestPage() {
    const locale = await getLocale();
    const t = await getTranslations('Home');

    return (
        <div className="min-h-screen bg-gray-50 py-12">
            <div className="max-w-4xl mx-auto px-4">
                <h1 className="text-3xl font-bold mb-8">Translation Test Page</h1>

                <div className="bg-white rounded-lg shadow-md p-6 mb-6">
                    <h2 className="text-xl font-semibold mb-4">Current Locale: {locale}</h2>

                    <div className="mb-6 p-3 bg-blue-50 rounded-lg">
                        <h3 className="font-medium mb-2">Navigation Links (Server Component):</h3>
                        <div className="flex flex-wrap gap-2">
                            <Link href="/test-translations" locale="en" className="px-3 py-1 bg-white border rounded hover:bg-gray-50">
                                🇺🇸 English
                            </Link>
                            <Link href="/test-translations" locale="es" className="px-3 py-1 bg-white border rounded hover:bg-gray-50">
                                🇪🇸 Español
                            </Link>
                            <Link href="/test-translations" locale="fr" className="px-3 py-1 bg-white border rounded hover:bg-gray-50">
                                🇫🇷 Français
                            </Link>
                        </div>
                    </div>
                </div>

                <TestPageClient />

                <div className="bg-white rounded-lg shadow-md p-6 mb-6">
                    <h2 className="text-xl font-semibold mb-4">Sample Translations</h2>
                    <div className="space-y-3">
                        <p><strong>Hero Title:</strong> {t('hero.title')}</p>
                        <p><strong>Hero Subtitle:</strong> {t('hero.subtitle')}</p>
                        <p><strong>CTA Button:</strong> {t('cta.button')}</p>
                        <p><strong>Primary CTA:</strong> {t('hero.cta.primary')}</p>
                        <p><strong>Secondary CTA:</strong> {t('hero.cta.secondary')}</p>
                    </div>
                </div>

                <div className="bg-white rounded-lg shadow-md p-6 mb-6">
                    <h2 className="text-xl font-semibold mb-4">All Available Languages (Direct Links)</h2>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <a href="/en/test-translations" className="p-3 border rounded-lg hover:bg-gray-50">🇺🇸 English</a>
                        <a href="/es/test-translations" className="p-3 border rounded-lg hover:bg-gray-50">🇪🇸 Español</a>
                        <a href="/fr/test-translations" className="p-3 border rounded-lg hover:bg-gray-50">🇫🇷 Français</a>
                        <a href="/pt/test-translations" className="p-3 border rounded-lg hover:bg-gray-50">🇧🇷 Português</a>
                        <a href="/ar/test-translations" className="p-3 border rounded-lg hover:bg-gray-50">🇸🇦 العربية</a>
                        <a href="/hi/test-translations" className="p-3 border rounded-lg hover:bg-gray-50">🇮🇳 हिन्दी</a>
                        <a href="/sw/test-translations" className="p-3 border rounded-lg hover:bg-gray-50">🇰🇪 Kiswahili</a>
                    </div>
                </div>

                <div className="bg-white rounded-lg shadow-md p-6">
                    <h2 className="text-xl font-semibold mb-4">Fallback Options</h2>
                    <p className="mb-4">If you're experiencing issues with the translation page, try these options:</p>
                    <div className="space-y-3">
                        <p>
                            <a href={`/${locale}/test-translations?_i18n_refresh=${Date.now()}`} className="text-blue-600 hover:underline">
                                Refresh Current Page with Cache Busting
                            </a>
                        </p>
                        <p>
                            <a href="/" className="text-blue-600 hover:underline">
                                Return to Home Page
                            </a>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
