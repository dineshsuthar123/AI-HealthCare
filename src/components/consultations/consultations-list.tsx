'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { formatDate, formatTime } from '@/lib/utils';
import { Consultation } from '@/types';
import { useRouter } from '@/navigation';
import { FadeIn, ScaleIn, StaggerContainer, StaggerItem } from '@/components/animations/motion-effects';

interface ConsultationsListProps {
    isPast?: boolean;
}

export default function ConsultationsList({ isPast = false }: ConsultationsListProps) {
    const t = useTranslations('Consultations');
    const [consultations, setConsultations] = useState<Consultation[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState<'all' | 'video' | 'audio' | 'message'>('all');
    const router = useRouter();

    useEffect(() => {
        const fetchConsultations = async () => {
            try {
                const response = await fetch(`/api/consultations?isPast=${isPast}`, {
                    credentials: 'include'
                });
                if (!response.ok) {
                    if (response.status === 401) {
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
    }, [isPast, router]);

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

            setConsultations(consultations.filter(c => c._id !== consultationId));
        } catch (error) {
            console.error('Error cancelling consultation:', error);
        }
    };

    const filteredConsultations = consultations.filter(consultation => 
        filter === 'all' || consultation.type === filter
    );

    const getTimeUntilConsultation = (scheduledFor: Date) => {
        const now = new Date();
        const scheduled = new Date(scheduledFor);
        const diffMs = scheduled.getTime() - now.getTime();
        const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
        const diffMins = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
        
        if (diffMs < 0) return 'Overdue';
        if (diffHours > 24) return `${Math.floor(diffHours / 24)} days`;
        if (diffHours > 0) return `${diffHours}h ${diffMins}m`;
        return `${diffMins} minutes`;
    };

    const getUrgencyLevel = (consultation: Consultation) => {
        if (consultation.aiTriageData?.urgency === 'emergency') return 'critical';
        if (consultation.aiTriageData?.urgency === 'urgent') return 'high';
        if (consultation.priority === 'high') return 'high';
        if (consultation.priority === 'medium') return 'medium';
        return 'normal';
    };

    const getUrgencyColor = (urgency: string) => {
        switch (urgency) {
            case 'critical': return 'bg-red-500 text-white animate-pulse';
            case 'high': return 'bg-orange-500 text-white';
            case 'medium': return 'bg-yellow-500 text-white';
            default: return 'bg-green-500 text-white';
        }
    };

    if (loading) {
        return (
            <div className="py-8 text-center">
                <FadeIn>
                    <div className="animate-spin w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-4"></div>
                    <p className="text-gray-600">{t('loading')}</p>
                </FadeIn>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Filter Pills */}
            <FadeIn>
                <div className="flex flex-wrap gap-2 mb-6">
                    {[
                        { key: 'all', label: '🔍 All', icon: '🔍' },
                        { key: 'video', label: '🎥 Video', icon: '🎥' },
                        { key: 'audio', label: '🎧 Audio', icon: '🎧' },
                        { key: 'message', label: '💬 Message', icon: '💬' }
                    ].map(({ key, label, icon }) => (
                        <button
                            key={key}
                            onClick={() => setFilter(key as typeof filter)}
                            className={`px-4 py-2 rounded-full font-medium transition-all duration-300 ${
                                filter === key
                                    ? 'bg-blue-500 text-white shadow-lg scale-105'
                                    : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
                            }`}
                        >
                            {label}
                        </button>
                    ))}
                </div>
            </FadeIn>

            {filteredConsultations.length === 0 ? (
                <ScaleIn>
                    <div className="py-12 text-center bg-gradient-to-br from-blue-50 to-purple-50 rounded-2xl">
                        <div className="text-6xl mb-4">
                            {isPast ? '📚' : '🗓️'}
                        </div>
                        <h3 className="text-xl font-semibold text-gray-800 mb-2">
                            {isPast ? 'No Past Consultations' : 'No Upcoming Consultations'}
                        </h3>
                        <p className="text-gray-600 mb-6">
                            {isPast 
                                ? 'Your consultation history will appear here once you complete sessions'
                                : 'Book your first consultation to get personalized medical care'
                            }
                        </p>
                        {!isPast && (
                            <Button 
                                onClick={() => router.push('/consultations/new')}
                                className="bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600"
                            >
                                📅 Schedule Consultation
                            </Button>
                        )}
                    </div>
                </ScaleIn>
            ) : (
                <StaggerContainer className="space-y-4">
                    {filteredConsultations.map((consultation, index) => {
                        const urgency = getUrgencyLevel(consultation);
                        const timeUntil = !isPast ? getTimeUntilConsultation(consultation.scheduledFor) : null;
                        
                        return (
                            <StaggerItem key={consultation._id}>
                                <div className={`relative bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden border border-gray-100 ${
                                    urgency === 'critical' ? 'ring-2 ring-red-500 ring-opacity-50' : ''
                                }`}>
                                    {/* Urgency Indicator */}
                                    {urgency !== 'normal' && (
                                        <div className={`absolute top-0 left-0 right-0 h-1 ${getUrgencyColor(urgency)}`}></div>
                                    )}

                                    <div className="p-6">
                                        <div className="flex justify-between items-start">
                                            <div className="flex-1">
                                                {/* Header */}
                                                <div className="flex items-center space-x-3 mb-3">
                                                    <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
                                                        <span className="text-white text-lg">
                                                            {getConsultationTypeIcon(consultation.type)}
                                                        </span>
                                                    </div>
                                                    <div>
                                                        <h3 className="font-semibold text-gray-800 text-lg">
                                                            {consultation.reason}
                                                        </h3>
                                                        <div className="flex items-center space-x-2 text-sm text-gray-500">
                                                            <span>📅 {formatDate(new Date(consultation.scheduledFor))}</span>
                                                            <span>•</span>
                                                            <span>⏰ {formatTime(new Date(consultation.scheduledFor))}</span>
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Badges */}
                                                <div className="flex items-center space-x-2 mb-4">
                                                    <span className={`inline-block px-3 py-1 text-xs rounded-full font-medium ${getConsultationTypeStyle(consultation.type)}`}>
                                                        {getConsultationTypeIcon(consultation.type)} {getConsultationType(consultation.type, t)}
                                                    </span>
                                                    <span className={`inline-block px-3 py-1 text-xs rounded-full font-medium ${getConsultationStatusStyle(consultation.status)}`}>
                                                        {getStatusIcon(consultation.status)} {getConsultationStatus(consultation.status, t)}
                                                    </span>
                                                    {urgency !== 'normal' && (
                                                        <span className={`inline-block px-3 py-1 text-xs rounded-full font-medium ${getUrgencyColor(urgency)}`}>
                                                            ⚡ {urgency.toUpperCase()}
                                                        </span>
                                                    )}
                                                </div>

                                                {/* Time Until */}
                                                {!isPast && timeUntil && (
                                                    <div className="mb-4">
                                                        <div className={`inline-flex items-center space-x-2 px-3 py-1 rounded-full text-sm font-medium ${
                                                            timeUntil === 'Overdue' ? 'bg-red-100 text-red-700' :
                                                            timeUntil.includes('minutes') ? 'bg-yellow-100 text-yellow-700' :
                                                            'bg-blue-100 text-blue-700'
                                                        }`}>
                                                            <span>⏳</span>
                                                            <span>{timeUntil === 'Overdue' ? 'Overdue' : `Starts in ${timeUntil}`}</span>
                                                        </div>
                                                    </div>
                                                )}

                                                {/* Provider Info */}
                                                <div className="flex items-center space-x-2 text-sm text-gray-600 mb-4">
                                                    <div className="w-6 h-6 bg-gray-300 rounded-full flex items-center justify-center">
                                                        👨‍⚕️
                                                    </div>
                                                    <span className="font-medium">
                                                        {consultation.provider?.name || t('notAssigned')}
                                                    </span>
                                                    {consultation.provider?.specialty && (
                                                        <>
                                                            <span>•</span>
                                                            <span className="text-gray-500">{consultation.provider.specialty}</span>
                                                        </>
                                                    )}
                                                </div>

                                                {/* AI Triage Info */}
                                                {consultation.aiTriageData && (
                                                    <div className="bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg p-3 mb-4">
                                                        <div className="flex items-center space-x-2 text-sm">
                                                            <span>🤖</span>
                                                            <span className="font-medium text-purple-700">AI Assessment:</span>
                                                            <span className="text-purple-600">
                                                                {consultation.aiTriageData.riskLevel} risk, {consultation.aiTriageData.urgency} priority
                                                            </span>
                                                        </div>
                                                    </div>
                                                )}
                                            </div>

                                            {/* Action Buttons */}
                                            <div className="flex flex-col space-y-2 ml-4">
                                                {!isPast && consultation.status !== 'cancelled' && (
                                                    <>
                                                        {consultation.status === 'scheduled' && (
                                                            <Button
                                                                onClick={() => handleJoin(consultation._id)}
                                                                className="bg-gradient-to-r from-green-500 to-blue-500 hover:from-green-600 hover:to-blue-600 text-white shadow-lg"
                                                                size="sm"
                                                            >
                                                                🎥 Join Now
                                                            </Button>
                                                        )}
                                                        <Button
                                                            onClick={() => handleCancel(consultation._id)}
                                                            variant="outline"
                                                            className="text-red-600 border-red-300 hover:bg-red-50"
                                                            size="sm"
                                                        >
                                                            ❌ Cancel
                                                        </Button>
                                                    </>
                                                )}

                                                {isPast && (
                                                    <div className="space-y-2">
                                                        <Button
                                                            variant="outline"
                                                            size="sm"
                                                            className="w-full"
                                                        >
                                                            📋 View Notes
                                                        </Button>
                                                        <Button
                                                            variant="outline"
                                                            size="sm"
                                                            className="w-full"
                                                        >
                                                            📄 Download Report
                                                        </Button>
                                                        {consultation.followUp?.required && (
                                                            <Button
                                                                size="sm"
                                                                className="w-full bg-blue-600 hover:bg-blue-700"
                                                            >
                                                                📅 Schedule Follow-up
                                                            </Button>
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Progress Bar for upcoming consultations */}
                                    {!isPast && consultation.status === 'scheduled' && timeUntil && timeUntil !== 'Overdue' && (
                                        <div className="px-6 pb-4">
                                            <div className="w-full bg-gray-200 rounded-full h-2">
                                                <div 
                                                    className="bg-gradient-to-r from-blue-500 to-green-500 h-2 rounded-full transition-all duration-300"
                                                    style={{ 
                                                        width: timeUntil.includes('minutes') ? '90%' : 
                                                               timeUntil.includes('h') ? '50%' : '10%' 
                                                    }}
                                                ></div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </StaggerItem>
                        );
                    })}
                </StaggerContainer>
            )}
        </div>
    );
}

function getConsultationTypeIcon(type: string) {
    switch (type) {
        case 'video': return '🎥';
        case 'audio': return '🎧';
        case 'message': return '💬';
        default: return '📞';
    }
}

function getStatusIcon(status: string) {
    switch (status) {
        case 'scheduled': return '📅';
        case 'completed': return '✅';
        case 'cancelled': return '❌';
        case 'in-progress': return '🔄';
        default: return '❓';
    }
}

function getConsultationType(type: string, t: (key: string) => string) {
    switch (type) {
        case 'video': return t('type.video');
        case 'audio': return t('type.audio');
        case 'message': return t('type.message');
        default: return type;
    }
}

function getConsultationTypeStyle(type: string) {
    switch (type) {
        case 'video': return 'bg-blue-100 text-blue-800 border border-blue-200';
        case 'audio': return 'bg-green-100 text-green-800 border border-green-200';
        case 'message': return 'bg-purple-100 text-purple-800 border border-purple-200';
        default: return 'bg-gray-100 text-gray-800 border border-gray-200';
    }
}

function getConsultationStatus(status: string, t: (key: string) => string) {
    switch (status) {
        case 'scheduled': return t('status.scheduled');
        case 'completed': return t('status.completed');
        case 'cancelled': return t('status.cancelled');
        case 'in-progress': return t('status.inProgress');
        default: return status;
    }
}

function getConsultationStatusStyle(status: string) {
    switch (status) {
        case 'scheduled': return 'bg-yellow-100 text-yellow-800 border border-yellow-200';
        case 'completed': return 'bg-green-100 text-green-800 border border-green-200';
        case 'cancelled': return 'bg-red-100 text-red-800 border border-red-200';
        case 'in-progress': return 'bg-blue-100 text-blue-800 border border-blue-200';
        default: return 'bg-gray-100 text-gray-800 border border-gray-200';
    }
}


