import { NextIntlClientProvider } from 'next-intl';
import { getMessages, getLocale } from 'next-intl/server';
import AuthProvider from '@/components/providers/session-provider';
import Header from '@/components/layout/Header';
import '../globals.css';
import { Inter } from 'next/font/google';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });

export async function generateMetadata() {
    return {
        title: {
            default: "AI-HealthCare",
            template: "%s | AI-HealthCare",
        },
        description: "AI-powered healthcare platform with symptom checking, telemedicine, and multilingual support.",
        metadataBase: new URL('https://ai-healthcare.vercel.app'),
    };
}

export default async function LocaleLayout({
    children
}: {
    children: React.ReactNode;
}) {
    const locale = await getLocale();
    const messages = await getMessages();

    return (
        <html lang={locale} suppressHydrationWarning>
            <body className={`${inter.variable} font-sans min-h-screen antialiased`}>
                <NextIntlClientProvider locale={locale} messages={messages}>
                    <AuthProvider>
                        <div className="relative flex min-h-screen flex-col">
                            <Header />
                            <main className="flex-1">
                                {children}
                            </main>
                        </div>
                    </AuthProvider>
                </NextIntlClientProvider>
            </body>
        </html>
    );
}
