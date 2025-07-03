import { useTranslations } from 'next-intl';
import Link from 'next/link';
import { Heart, Stethoscope, Video, MessageSquare, BarChart3, Shield } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function HomePage() {
    const t = useTranslations('Home');

    const features = [
        {
            icon: Stethoscope,
            title: t('features.symptomChecker.title'),
            description: t('features.symptomChecker.description'),
            href: '/symptom-checker',
        },
        {
            icon: Video,
            title: t('features.telemedicine.title'),
            description: t('features.telemedicine.description'),
            href: '/consultations',
        },
        {
            icon: MessageSquare,
            title: t('features.smsSupport.title'),
            description: t('features.smsSupport.description'),
            href: '/sms-support',
        },
        {
            icon: BarChart3,
            title: t('features.analytics.title'),
            description: t('features.analytics.description'),
            href: '/analytics',
        },
    ];

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-white">
            {/* Hero Section */}
            <section className="relative py-20 px-4 sm:px-6 lg:px-8">
                <div className="max-w-7xl mx-auto text-center">
                    <div className="flex justify-center mb-8">
                        <Heart className="h-16 w-16 text-blue-600" />
                    </div>
                    <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6">
                        {t('hero.title')}
                    </h1>
                    <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
                        {t('hero.subtitle')}
                    </p>
                    <div className="flex flex-col sm:flex-row gap-4 justify-center">
                        <Link href="/symptom-checker">
                            <Button size="lg" className="px-8 py-3">
                                {t('hero.cta.primary')}
                            </Button>
                        </Link>
                        <Link href="/consultations">
                            <Button variant="outline" size="lg" className="px-8 py-3">
                                {t('hero.cta.secondary')}
                            </Button>
                        </Link>
                    </div>
                </div>
            </section>

            {/* Features Section */}
            <section className="py-20 px-4 sm:px-6 lg:px-8 bg-white">
                <div className="max-w-7xl mx-auto">
                    <div className="text-center mb-16">
                        <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
                            {t('features.title')}
                        </h2>
                        <p className="text-xl text-gray-600 max-w-2xl mx-auto">
                            {t('features.subtitle')}
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                        {features.map((feature, index) => (
                            <Card key={index} className="hover:shadow-lg transition-shadow cursor-pointer">
                                <Link href={feature.href}>
                                    <CardHeader className="text-center">
                                        <feature.icon className="h-12 w-12 text-blue-600 mx-auto mb-4" />
                                        <CardTitle className="text-xl">{feature.title}</CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <CardDescription className="text-center">
                                            {feature.description}
                                        </CardDescription>
                                    </CardContent>
                                </Link>
                            </Card>
                        ))}
                    </div>
                </div>
            </section>

            {/* Stats Section */}
            <section className="py-20 px-4 sm:px-6 lg:px-8 bg-blue-50">
                <div className="max-w-7xl mx-auto">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
                        <div>
                            <div className="text-4xl font-bold text-blue-600 mb-2">24/7</div>
                            <div className="text-lg text-gray-600">{t('stats.availability')}</div>
                        </div>
                        <div>
                            <div className="text-4xl font-bold text-blue-600 mb-2">7+</div>
                            <div className="text-lg text-gray-600">{t('stats.languages')}</div>
                        </div>
                        <div>
                            <div className="text-4xl font-bold text-blue-600 mb-2">100%</div>
                            <div className="text-lg text-gray-600">{t('stats.secure')}</div>
                        </div>
                    </div>
                </div>
            </section>

            {/* CTA Section */}
            <section className="py-20 px-4 sm:px-6 lg:px-8 bg-blue-600">
                <div className="max-w-4xl mx-auto text-center">
                    <Shield className="h-16 w-16 text-white mx-auto mb-8" />
                    <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
                        {t('cta.title')}
                    </h2>
                    <p className="text-xl text-blue-100 mb-8">
                        {t('cta.subtitle')}
                    </p>
                    <Link href="/auth/signup">
                        <Button variant="outline" size="lg" className="bg-white text-blue-600 hover:bg-gray-100 px-8 py-3">
                            {t('cta.button')}
                        </Button>
                    </Link>
                </div>
            </section>
        </div>
    );
}