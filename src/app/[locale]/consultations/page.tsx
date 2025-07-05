'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';
import ConsultationForm from '@/components/consultations/consultation-form';
import ConsultationsList from '@/components/consultations/consultations-list';
import { Card } from '@/components/ui/card';

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
        <div className="container mx-auto px-4 py-8">
            <div className="mb-10">
                <h1 className="text-3xl font-bold mb-2">{t('title')}</h1>
                <p className="text-gray-600">{t('subtitle')}</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2">
                    <Card className="p-6">
                        <h2 className="text-xl font-semibold mb-4">{t('upcomingConsultations')}</h2>
                        <ConsultationsList />
                    </Card>

                    <Card className="p-6 mt-8">
                        <h2 className="text-xl font-semibold mb-4">{t('pastConsultations')}</h2>
                        <ConsultationsList isPast={true} />
                    </Card>
                </div>

                <div>
                    <Card className="p-6 sticky top-24">
                        <h2 className="text-xl font-semibold mb-4">{t('bookConsultation')}</h2>
                        <ConsultationForm />
                    </Card>
                </div>
            </div>
        </div>
    );
}
