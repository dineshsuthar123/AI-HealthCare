'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { formatDate, formatTime } from '@/lib/utils';
import { Consultation } from '@/types';
import { useRouter } from '@/navigation';

interface ConsultationsListProps {
    isPast?: boolean;
}

export default function ConsultationsList({ isPast = false }: ConsultationsListProps) {
    const t = useTranslations('Consultations');
    const [consultations, setConsultations] = useState<Consultation[]>([]);
    const [loading, setLoading] = useState(true);
    const router = useRouter();

    useEffect(() => {
        const fetchConsultations = async () => {
            try {
                const response = await fetch(`/api/consultations?isPast=${isPast}` , {
                    credentials: 'include'
                });
                if (!response.ok) {
                    if (response.status === 401) {
                        // Redirect unauthenticated users to sign-in (locale-aware)
                        router.push('/auth/signin');
                        return;
                    }
                    throw new Error('Failed to fetch consultations');
                }
                const data = await response.json();
                setConsultations(data);
            } catch (error) {
                console.error('Error fetching consultations:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchConsultations();
    }, [isPast]);

    const handleJoin = (consultationId: string) => {
        window.open(`/consultations/room/${consultationId}`, '_blank');
    };

    const handleCancel = async (consultationId: string) => {
        try {
            const response = await fetch(`/api/consultations/cancel`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ id: consultationId }),
                credentials: 'include',
            });

            if (!response.ok) {
                if (response.status === 401) {
                    router.push('/auth/signin');
                    return;
                }
                throw new Error('Failed to cancel consultation');
            }

            // Remove the cancelled consultation from the list
            setConsultations(consultations.filter(c => c._id !== consultationId));
        } catch (error) {
            console.error('Error cancelling consultation:', error);
        }
    };

    if (loading) {
        return <div className="py-8 text-center">{t('loading')}</div>;
    }

    if (consultations.length === 0) {
        return (
            <div className="py-8 text-center text-gray-500">
                {isPast ? t('noPastConsultations') : t('noUpcomingConsultations')}
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {consultations.map((consultation) => (
                <div
                    key={consultation._id}
                    className="border rounded-lg p-4 hover:shadow-md transition-shadow"
                >
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="font-medium">{consultation.reason}</p>
                            <p className="text-sm text-gray-500">
                                {formatDate(new Date(consultation.scheduledFor))} • {formatTime(new Date(consultation.scheduledFor))}
                            </p>
                            <div className="mt-1">
                                <span className={`inline-block px-2 py-1 text-xs rounded-full ${getConsultationTypeStyle(consultation.type)}`}>
                                    {getConsultationType(consultation.type, t)}
                                </span>
                                <span className={`ml-2 inline-block px-2 py-1 text-xs rounded-full ${getConsultationStatusStyle(consultation.status)}`}>
                                    {getConsultationStatus(consultation.status, t)}
                                </span>
                            </div>
                            <p className="text-sm mt-2">
                                {t('provider')}: {consultation.provider?.name || t('notAssigned')}
                            </p>
                        </div>

                        {!isPast && consultation.status !== 'cancelled' && (
                            <div className="space-y-2">
                                {consultation.status === 'scheduled' && (
                                    <>
                                        <Button
                                            onClick={() => handleJoin(consultation._id)}
                                            className="w-full bg-blue-600 hover:bg-blue-700"
                                            size="sm"
                                        >
                                            {t('joinConsultation')}
                                        </Button>
                                        <Button
                                            onClick={() => handleCancel(consultation._id)}
                                            variant="outline"
                                            className="w-full text-red-600 border-red-300 hover:bg-red-50"
                                            size="sm"
                                        >
                                            {t('cancel')}
                                        </Button>
                                    </>
                                )}
                            </div>
                        )}

                        {isPast && (
                            <Button
                                className="text-sm"
                                variant="ghost"
                                size="sm"
                            >
                                {t('viewDetails')}
                            </Button>
                        )}
                    </div>
                </div>
            ))}
        </div>
    );
}

function getConsultationType(type: string, t: (key: string) => string) {
    switch (type) {
        case 'video':
            return t('type.video');
        case 'audio':
            return t('type.audio');
        case 'message':
            return t('type.message');
        default:
            return type;
    }
}

function getConsultationTypeStyle(type: string) {
    switch (type) {
        case 'video':
            return 'bg-blue-100 text-blue-800';
        case 'audio':
            return 'bg-green-100 text-green-800';
        case 'message':
            return 'bg-purple-100 text-purple-800';
        default:
            return 'bg-gray-100 text-gray-800';
    }
}

function getConsultationStatus(status: string, t: (key: string) => string) {
    switch (status) {
        case 'scheduled':
            return t('status.scheduled');
        case 'completed':
            return t('status.completed');
        case 'cancelled':
            return t('status.cancelled');
        case 'in-progress':
            return t('status.inProgress');
        default:
            return status;
    }
}

function getConsultationStatusStyle(status: string) {
    switch (status) {
        case 'scheduled':
            return 'bg-yellow-100 text-yellow-800';
        case 'completed':
            return 'bg-green-100 text-green-800';
        case 'cancelled':
            return 'bg-red-100 text-red-800';
        case 'in-progress':
            return 'bg-blue-100 text-blue-800';
        default:
            return 'bg-gray-100 text-gray-800';
    }
}
