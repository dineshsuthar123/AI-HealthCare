'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from '@/navigation';
import { useEffect, useState } from 'react';
import { AppointmentScheduler } from '@/components/consultations/appointment-scheduler';
import { ParticlesBackground } from '@/components/animations/particles-background';

export default function ScheduleAppointmentPage() {
    const { data: session, status } = useSession();
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
        return (
            <div className="min-h-screen bg-[#030613] flex items-center justify-center">
                <div className="text-center">
                    <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                    <p className="text-white">Loading...</p>
                </div>
            </div>
        );
    }

    if (!session) {
        return null;
    }

    return (
        <div className="min-h-screen bg-[#030613] relative overflow-hidden">
            <ParticlesBackground />
            <div className="relative z-10">
                <AppointmentScheduler 
                    onScheduled={(appointment) => {
                        console.log('Appointment scheduled:', appointment);
                    }}
                />
            </div>
        </div>
    );
}
