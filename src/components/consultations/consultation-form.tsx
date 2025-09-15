'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { useRouter } from '@/navigation';
import { useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { FadeIn, ScaleIn, StaggerContainer, StaggerItem } from '@/components/animations/motion-effects';
import { ParticlesBackground } from '@/components/animations/particles-background';

type ConsultationFormData = {
    reason: string;
    date: string;
    time: string;
    type: string;
    providerId?: string;
    symptoms?: string[];
    urgency?: 'routine' | 'urgent' | 'emergency';
    duration?: number;
};

interface Provider {
    id: string;
    name: string;
    specialty: string;
    imageUrl: string;
    rating: number;
    experience: string;
}

export default function ConsultationForm() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const [currentStep, setCurrentStep] = useState(1);
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [provider, setProvider] = useState<Provider | null>(null);
    const [aiSuggestions, setAiSuggestions] = useState<string[]>([]);

    const providerId = searchParams.get('providerId');
    const today = new Date().toISOString().split('T')[0];

    const [formData, setFormData] = useState<ConsultationFormData>({
        reason: '',
        date: '',
        time: '',
        type: 'video',
        providerId: providerId || undefined,
        symptoms: [],
        urgency: 'routine',
        duration: 30
    });

    const handleSubmit = async () => {
        setLoading(true);
        setError(null);

        try {
            const response = await fetch('/api/consultations', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({
                    ...formData,
                    scheduledFor: new Date(`${formData.date}T${formData.time}:00.000Z`)
                }),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Failed to book consultation');
            }

            setSuccess(true);
            setTimeout(() => router.push('/consultations'), 2000);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'An unexpected error occurred');
        } finally {
            setLoading(false);
        }
    };

    if (success) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-green-50 via-blue-50 to-purple-50 flex items-center justify-center p-4 relative">
                <ParticlesBackground />
                <ScaleIn>
                    <div className="bg-white rounded-2xl shadow-2xl p-8 text-center max-w-md w-full relative z-10">
                        <div className="w-20 h-20 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-6">
                            <span className="text-white text-3xl">✓</span>
                        </div>
                        <h2 className="text-2xl font-bold text-gray-800 mb-2">Consultation Booked!</h2>
                        <p className="text-gray-600 mb-4">Your appointment has been scheduled successfully.</p>
                        <div className="animate-pulse text-blue-600">Redirecting to your consultations...</div>
                    </div>
                </ScaleIn>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-green-50 p-4 relative">
            <ParticlesBackground />
            <div className="max-w-2xl mx-auto relative z-10">
                <div className="bg-white rounded-2xl shadow-2xl p-8">
                    {error && (
                        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700">
                            <div className="flex items-center space-x-2">
                                <span>⚠️</span>
                                <span>{error}</span>
                            </div>
                        </div>
                    )}

                    <h1 className="text-2xl font-bold text-center mb-8">Book Your Consultation</h1>
                    <div className="space-y-6">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                What brings you here today?
                            </label>
                            <textarea
                                value={formData.reason}
                                onChange={(e) => setFormData(prev => ({ ...prev, reason: e.target.value }))}
                                className="w-full p-4 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                                rows={4}
                                placeholder="Describe your symptoms or concerns..."
                            />
                        </div>
                        
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Date</label>
                                <Input
                                    type="date"
                                    min={today}
                                    value={formData.date}
                                    onChange={(e) => setFormData(prev => ({ ...prev, date: e.target.value }))}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Time</label>
                                <Input
                                    type="time"
                                    value={formData.time}
                                    onChange={(e) => setFormData(prev => ({ ...prev, time: e.target.value }))}
                                />
                            </div>
                        </div>

                        <Button
                            onClick={handleSubmit}
                            disabled={loading || !formData.reason || !formData.date || !formData.time}
                            className="w-full bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600"
                        >
                            {loading ? (
                                <div className="flex items-center space-x-2">
                                    <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full"></div>
                                    <span>Booking...</span>
                                </div>
                            ) : (
                                '🎉 Book Consultation'
                            )}
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
}
