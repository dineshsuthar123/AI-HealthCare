import { useTranslations } from 'next-intl';
import Link from 'next/link';
import { Heart, Stethoscope, Video, MessageSquare, BarChart3, Shield } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ParticlesBackground } from '@/components/animations/particles-background';
import { DNAAnimation, HeartbeatAnimation, PulseRingsAnimation, StethoscopeIcon } from '@/components/animations/medical-animations';
import { FadeIn, FloatingElement, GlowingText, ScaleIn, StaggerContainer, StaggerItem } from '@/components/animations/motion-effects';

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
        <div className="min-h-screen relative overflow-hidden">
            {/* Particles Background */}
            <ParticlesBackground variant="medical" />

            {/* Hero Section */}
            <section className="relative py-28 px-4 sm:px-6 lg:px-8 overflow-hidden">
                <div className="max-w-7xl mx-auto">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
                        <FadeIn direction="left" className="text-center lg:text-left">
                            <div className="inline-block mb-6">
                                <FloatingElement amplitude={6}>
                                    <div className="h-16 w-16 rounded-2xl bg-gradient-to-r from-blue-500 to-indigo-600 flex items-center justify-center mx-auto lg:mx-0">
                                        <Heart className="h-8 w-8 text-white" />
                                    </div>
                                </FloatingElement>
                            </div>

                            <h1 className="text-4xl md:text-6xl font-bold mb-6 text-gray-900">
                                <GlowingText text={t('hero.title')} className="font-bold" />
                            </h1>

                            <p className="text-xl text-gray-600 mb-8 max-w-3xl lg:mx-0 mx-auto">
                                {t('hero.subtitle')}
                            </p>

                            <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
                                <Button
                                    variant="gradient"
                                    size="lg"
                                    glow
                                    animated
                                    asChild
                                >
                                    <Link href="/symptom-checker">
                                        {t('hero.cta.primary')}
                                    </Link>
                                </Button>

                                <Button
                                    variant="outline"
                                    size="lg"
                                    animated
                                    asChild
                                >
                                    <Link href="/consultations">
                                        {t('hero.cta.secondary')}
                                    </Link>
                                </Button>
                            </div>
                        </FadeIn>

                        <ScaleIn delay={0.3} className="relative hidden lg:block">
                            <div className="w-full h-[500px] relative">
                                {/* Animated medical elements */}
                                <div className="absolute top-1/4 left-1/4 transform -translate-x-1/2 -translate-y-1/2">
                                    <DNAAnimation size={180} />
                                </div>
                                <div className="absolute top-1/2 right-0 transform translate-x-1/4">
                                    <PulseRingsAnimation size={120} />
                                </div>
                                <div className="absolute bottom-1/4 left-1/2 transform -translate-x-1/2">
                                    <HeartbeatAnimation size={200} />
                                </div>
                                <div className="absolute top-0 right-1/4">
                                    <StethoscopeIcon size={80} />
                                </div>

                                {/* Central element */}
                                <div className="absolute inset-0 flex items-center justify-center">
                                    <div className="h-64 w-64 rounded-full bg-gradient-to-r from-blue-500 to-violet-600 opacity-20 blur-xl"></div>
                                    <div className="absolute inset-0 flex items-center justify-center">
                                        <div className="h-48 w-48 rounded-full glass flex items-center justify-center">
                                            <Heart className="h-24 w-24 text-blue-500" />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </ScaleIn>
                    </div>
                </div>

                {/* Decorative elements */}
                <div className="absolute top-1/3 right-0 w-64 h-64 bg-blue-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20"></div>
                <div className="absolute bottom-1/3 left-0 w-64 h-64 bg-violet-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20"></div>
            </section>

            {/* Features Section */}
            <section className="py-20 px-4 sm:px-6 lg:px-8 relative">
                <div className="max-w-7xl mx-auto">
                    <FadeIn>
                        <div className="text-center mb-16">
                            <h2 className="text-3xl md:text-4xl font-bold mb-4">
                                {t('features.title')}
                            </h2>
                            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
                                {t('features.subtitle')}
                            </p>
                        </div>
                    </FadeIn>

                    <StaggerContainer className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                        {features.map((feature, index) => (
                            <StaggerItem key={index}>
                                <Link href={feature.href}>
                                    <Card className="h-full hover-lift glass" hover="lift">
                                        <CardHeader>
                                            <div className="mb-4 h-12 w-12 rounded-lg bg-gradient-to-r from-blue-500 to-indigo-600 flex items-center justify-center">
                                                <feature.icon className="h-6 w-6 text-white" />
                                            </div>
                                            <CardTitle>{feature.title}</CardTitle>
                                        </CardHeader>
                                        <CardContent>
                                            <p className="text-gray-600">{feature.description}</p>
                                        </CardContent>
                                    </Card>
                                </Link>
                            </StaggerItem>
                        ))}
                    </StaggerContainer>
                </div>

                {/* Decorative element */}
                <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] rounded-full border border-gray-200 opacity-20"></div>
            </section>

            {/* Stats Section */}
            <section className="py-16 px-4 sm:px-6 lg:px-8 bg-gradient-to-r from-blue-500 to-indigo-600 relative overflow-hidden">
                <div className="absolute inset-0 opacity-10">
                    <ParticlesBackground variant="minimal" />
                </div>
                <div className="max-w-7xl mx-auto relative z-10">
                    <StaggerContainer className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
                        <StaggerItem>
                            <div className="glass p-8 rounded-xl">
                                <h3 className="text-2xl font-bold text-white mb-2">24/7</h3>
                                <p className="text-blue-100">{t('stats.availability')}</p>
                            </div>
                        </StaggerItem>
                        <StaggerItem>
                            <div className="glass p-8 rounded-xl">
                                <h3 className="text-2xl font-bold text-white mb-2">10+</h3>
                                <p className="text-blue-100">{t('stats.languages')}</p>
                            </div>
                        </StaggerItem>
                        <StaggerItem>
                            <div className="glass p-8 rounded-xl">
                                <h3 className="text-2xl font-bold text-white mb-2">100%</h3>
                                <p className="text-blue-100">{t('stats.secure')}</p>
                            </div>
                        </StaggerItem>
                    </StaggerContainer>
                </div>
            </section>

            {/* CTA Section */}
            <section className="py-20 px-4 sm:px-6 lg:px-8 relative">
                <div className="max-w-5xl mx-auto text-center">
                    <FadeIn>
                        <h2 className="text-3xl md:text-4xl font-bold mb-6">
                            {t('cta.title')}
                        </h2>
                        <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
                            {t('cta.subtitle')}
                        </p>

                        <Button
                            variant="gradient"
                            size="xl"
                            glow
                            animated
                            asChild
                        >
                            <Link href="/auth/signup">
                                {t('cta.button')}
                            </Link>
                        </Button>
                    </FadeIn>
                </div>

                {/* Decorative elements */}
                <div className="absolute bottom-0 left-0 w-32 h-32 bg-blue-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20"></div>
                <div className="absolute top-1/2 right-0 w-32 h-32 bg-indigo-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20"></div>
            </section>
        </div>
    );
}