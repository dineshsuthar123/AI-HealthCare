'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';
import ConsultationForm from '@/components/consultations/consultation-form';
import ConsultationsList from '@/components/consultations/consultations-list';
import { Card } from '@/components/ui/card';
import { ParticlesBackground } from '@/components/animations/particles-background';
import { FadeIn, ScaleIn, StaggerContainer } from '@/components/animations/motion-effects';
import { Video, Calendar, Clock } from 'lucide-react';

export default function ConsultationsPage() {
    const { data: session, status } = useSession();
    const t = useTranslations('Consultations');
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        if (status === 'unauthenticated') {
            router.push('/auth/signin');
        } else if (status !== 'loading') {
            setIsLoading(false);
        }
    }, [status, router]);

    if (isLoading) {
        return <div className="container mx-auto px-4 py-8">Loading...</div>;
    }

    if (!session) {
        return null; // Router will redirect, this prevents flash of content
    }

    return (
        <div className="min-h-screen relative overflow-hidden">
            <ParticlesBackground variant="medical" />

            <div className="relative z-10 py-24 px-4 sm:px-6 lg:px-8">
                <div className="max-w-7xl mx-auto">
                    <StaggerContainer className="space-y-8">
                        {/* Header */}
                        <FadeIn className="text-center mb-12">
                            <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br from-purple-500 to-violet-600 mb-6 shadow-2xl">
                                <Video className="h-10 w-10 text-white" />
                            </div>
                            <h1 className="text-4xl md:text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-violet-600 mb-4">
                                {t('title')}
                            </h1>
                            <p className="text-xl text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
                                {t('subtitle')}
                            </p>
                        </FadeIn>

                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                            <div className="lg:col-span-2 space-y-8">
                                <ScaleIn delay={0.2}>
                                    <Card className="glass border-0 shadow-2xl">
                                        <div className="p-6">
                                            <div className="flex items-center mb-4">
                                                <Clock className="h-6 w-6 text-blue-500 mr-3" />
                                                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                                                    {t('upcomingConsultations')}
                                                </h2>
                                            </div>
                                            <ConsultationsList />
                                        </div>
                                    </Card>
                                </ScaleIn>

                                <ScaleIn delay={0.4}>
                                    <Card className="glass border-0 shadow-xl">
                                        <div className="p-6">
                                            <div className="flex items-center mb-4">
                                                <Calendar className="h-6 w-6 text-gray-500 mr-3" />
                                                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                                                    {t('pastConsultations')}
                                                </h2>
                                            </div>
                                            <ConsultationsList isPast={true} />
                                        </div>
                                    </Card>
                                </ScaleIn>
                            </div>

                            <ScaleIn delay={0.6}>
                                <Card className="glass border-0 shadow-xl sticky top-24">
                                    <div className="p-6">
                                        <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">
                                            {t('bookConsultation')}
                                        </h2>
                                        <ConsultationForm />
                                    </div>
                                </Card>
                            </ScaleIn>
                        </div>
                    </StaggerContainer>
                </div>
            </div>
        </div>
    );
}
