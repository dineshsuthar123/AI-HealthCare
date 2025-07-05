'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useParams, useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { VideoCall } from '@/components/consultations/video-call';

export default function ConsultationRoomPage() {
    const { data: session, status } = useSession();
    const params = useParams();
    const id = params.id as string;
    const router = useRouter();
    const t = useTranslations('ConsultationRoom');
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
            <div className="mb-8">
                <h1 className="text-3xl font-bold mb-2">{t('title')}</h1>
                <p className="text-gray-600">{t('subtitle')}</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2">
                    <VideoCall
                        consultationId={id}
                        userId={session.user.id}
                        userName={session.user.name || 'User'}
                        isProvider={session.user.role === 'provider'}
                    />
                </div>

                <div>
                    <div className="bg-white rounded-lg shadow-md p-6 mb-6">
                        <h2 className="text-xl font-semibold mb-4">{t('consultationDetails')}</h2>
                        <p className="text-gray-600 mb-2">{t('consultationId')}: {id}</p>
                        <p className="text-gray-600 mb-2">{t('provider')}: Dr. Example</p>
                        <p className="text-gray-600 mb-2">{t('date')}: {new Date().toLocaleDateString()}</p>
                        <p className="text-gray-600">{t('time')}: {new Date().toLocaleTimeString()}</p>
                    </div>
                </div>
            </div>
        </div>
    );
}
