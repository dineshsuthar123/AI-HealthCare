'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from '@/navigation';
import { useParams } from 'next/navigation';
import { FullConsultationRoom } from '@/components/consultations/full-consultation-room';
import { ParticlesBackground } from '@/components/animations/particles-background';
import type { Consultation } from '@/types';
import type { CallMode } from '@/lib/webrtc';

export default function ConsultationRoomPage() {
    const { data: session, status } = useSession();
    const params = useParams();
    const id = params.id as string;
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(true);
    const [consultation, setConsultation] = useState<Consultation | null>(null);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (status === 'unauthenticated') {
            router.push('/auth/signin');
        } else if (status !== 'loading') {
            setIsLoading(false);
        }
    }, [status, router]);

    useEffect(() => {
        const fetchConsultationDetails = async () => {
            if (!session?.user?.id || !id) return;

            try {
                const response = await fetch(`/api/consultations/${id}`, {
                    credentials: 'include'
                });
                
                if (!response.ok) {
                    if (response.status === 404) {
                        setError('Consultation not found');
                    } else if (response.status === 403) {
                        setError('You do not have access to this consultation');
                    } else {
                        setError('Failed to load consultation');
                    }
                    return;
                }

                const data = await response.json();
                setConsultation(data);
            } catch (err) {
                console.error('Error fetching consultation details:', err);
                setError('Failed to load consultation details');
            }
        };

        if (session?.user?.id) {
            fetchConsultationDetails();
        }
    }, [session, id]);

    const handleEndCall = async () => {
        // Update consultation status
        try {
            await fetch(`/api/consultations/${id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({ status: 'completed' })
            });
        } catch (err) {
            console.error('Error updating consultation status:', err);
        }

        // Redirect to consultations page
        setTimeout(() => {
            router.push('/consultations');
        }, 2000);
    };

    if (isLoading) {
        return (
            <div className="fixed inset-0 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
                <ParticlesBackground />
                <div className="relative z-10 text-center">
                    <div className="animate-pulse mb-4">
                        <div className="w-16 h-16 bg-blue-500 rounded-full mx-auto mb-4 flex items-center justify-center">
                            <svg className="w-8 h-8 text-white animate-spin" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                        </div>
                    </div>
                    <h2 className="text-2xl font-semibold text-white mb-2">Preparing Your Consultation</h2>
                    <p className="text-slate-400">Setting up secure connection...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="fixed inset-0 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
                <div className="text-center max-w-md p-8">
                    <div className="w-16 h-16 bg-red-500 rounded-full mx-auto mb-6 flex items-center justify-center">
                        <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </div>
                    <h2 className="text-2xl font-semibold text-white mb-2">Error</h2>
                    <p className="text-slate-400 mb-6">{error}</p>
                    <button 
                        onClick={() => router.push('/consultations')}
                        className="px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                    >
                        Back to Consultations
                    </button>
                </div>
            </div>
        );
    }

    if (!session) {
        return null;
    }

    // Determine consultation type (default to video)
    const consultationType: CallMode = (consultation?.type as CallMode) || 'video';

    return (
        <div className="fixed inset-0 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 overflow-hidden">
            <FullConsultationRoom
                consultationId={id}
                userId={session.user.id || ''}
                userName={session.user.name || 'User'}
                userRole={(session.user.role as 'patient' | 'provider') || 'patient'}
                consultationType={consultationType}
                onEndCall={handleEndCall}
            />
        </div>
    );
}
