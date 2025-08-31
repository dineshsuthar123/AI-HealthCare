'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { useRouter } from '@/navigation';
import { useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card';
import { Calendar, Clock, Video, Phone, MessageSquare, AlertCircle } from 'lucide-react';

type ConsultationFormData = {
    reason: string;
    date: string;
    time: string;
    type: string;
    providerId?: string;
};

interface Provider {
    id: string;
    name: string;
    specialty: string;
    imageUrl: string;
}

export default function ConsultationForm() {
    const t = useTranslations('Consultations');
    const router = useRouter();
    const searchParams = useSearchParams();
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [provider, setProvider] = useState<Provider | null>(null);

    // Get providerId and slot from URL if present
    const providerId = searchParams.get('providerId');
    const slot = searchParams.get('slot');

    // Calculate minimum date (today)
    const today = new Date().toISOString().split('T')[0];

    // Parse slot into date and time if available
    useEffect(() => {
        if (slot) {
            // Example slot format: "Today, 2:00 PM" or "Tomorrow, 10:00 AM" or "Friday, 11:30 AM"
            const parts = slot.split(', ');
            if (parts.length === 2) {
                let dateValue = '';
                const today = new Date();

                if (parts[0] === 'Today') {
                    dateValue = today.toISOString().split('T')[0];
                } else if (parts[0] === 'Tomorrow') {
                    const tomorrow = new Date(today);
                    tomorrow.setDate(today.getDate() + 1);
                    dateValue = tomorrow.toISOString().split('T')[0];
                } else {
                    // Handle day of week like "Friday"
                    const daysOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
                    const targetDayIndex = daysOfWeek.indexOf(parts[0]);
                    if (targetDayIndex !== -1) {
                        const currentDayIndex = today.getDay();
                        let daysToAdd = targetDayIndex - currentDayIndex;
                        if (daysToAdd <= 0) daysToAdd += 7; // If the day has passed this week, go to next week

                        const targetDate = new Date(today);
                        targetDate.setDate(today.getDate() + daysToAdd);
                        dateValue = targetDate.toISOString().split('T')[0];
                    }
                }

                setFormData(prev => ({
                    ...prev,
                    date: dateValue,
                    time: parts[1],
                    providerId: providerId || '',
                }));
            }
        }
    }, [slot, providerId]);

    // Fetch provider details if providerId is present
    useEffect(() => {
        const fetchProviderDetails = async () => {
            if (!providerId) return;

            try {
                // In a real app, this would call an API
                // For now, we'll simulate it with mock data
                const mockProviders = [
                    {
                        id: '1',
                        name: 'Dr. Sarah Johnson',
                        specialty: 'Cardiology',
                        imageUrl: 'https://randomuser.me/api/portraits/women/44.jpg',
                    },
                    {
                        id: '2',
                        name: 'Dr. Michael Chen',
                        specialty: 'Pediatrics',
                        imageUrl: 'https://randomuser.me/api/portraits/men/35.jpg',
                    },
                    {
                        id: '3',
                        name: 'Dr. Amara Okafor',
                        specialty: 'Neurology',
                        imageUrl: 'https://randomuser.me/api/portraits/women/22.jpg',
                    },
                    {
                        id: '4',
                        name: 'Dr. James Rodriguez',
                        specialty: 'Family Medicine',
                        imageUrl: 'https://randomuser.me/api/portraits/men/41.jpg',
                    },
                    {
                        id: '5',
                        name: 'Dr. Ayesha Patel',
                        specialty: 'Dermatology',
                        imageUrl: 'https://randomuser.me/api/portraits/women/59.jpg',
                    }
                ];

                const found = mockProviders.find(p => p.id === providerId);
                if (found) {
                    setProvider(found);
                }
            } catch (err) {
                console.error('Error fetching provider details:', err);
            }
        };

        fetchProviderDetails();
    }, [providerId]);

    const [formData, setFormData] = useState<ConsultationFormData>({
        reason: '',
        date: '',
        time: '',
        type: 'video',
        providerId: providerId || undefined,
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            const response = await fetch('/api/consultations', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(formData),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Failed to book consultation');
            }

            // Show success message
            setSuccess(true);

            // After a delay, redirect to consultations list
            setTimeout(() => {
                router.push('/consultations');
            }, 2000);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'An unexpected error occurred');
        } finally {
            setLoading(false);
        }
    };

    // Consultation type options with icons
    const consultationTypes = [
        { id: 'video', label: t('form.videoCall'), icon: Video },
        { id: 'audio', label: t('form.audioCall'), icon: Phone },
        { id: 'message', label: t('form.message'), icon: MessageSquare }
    ];

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="max-w-xl mx-auto p-4"
        >
            <Card className="w-full">
                <CardHeader>
                    <CardTitle className="text-2xl font-bold text-center">
                        {t('bookConsultation')}
                    </CardTitle>
                </CardHeader>

                <CardContent>
                    {error && (
                        <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 rounded-lg flex items-center">
                            <AlertCircle className="h-5 w-5 mr-2" />
                            <span>{error}</span>
                        </div>
                    )}

                    {success ? (
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="text-center py-6"
                        >
                            <div className="mx-auto w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mb-4">
                                <svg className="w-8 h-8 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                            </div>
                            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                                {t('form.consultationBooked')}
                            </h3>
                            <p className="text-gray-600 dark:text-gray-300">
                                {t('form.redirecting')}
                            </p>
                        </motion.div>
                    ) : (
                        <form onSubmit={handleSubmit} className="space-y-4">
                            {provider && (
                                <div className="mb-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                                    <div className="flex items-center">
                                        <img
                                            src={provider.imageUrl}
                                            alt={provider.name}
                                            className="h-12 w-12 rounded-full mr-4"
                                        />
                                        <div>
                                            <h3 className="font-medium text-gray-900 dark:text-white">
                                                {provider.name}
                                            </h3>
                                            <p className="text-sm text-blue-600 dark:text-blue-400">
                                                {provider.specialty}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            )}

                            <div>
                                <label htmlFor="reason" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                    {t('form.reason')} *
                                </label>
                                <textarea
                                    id="reason"
                                    name="reason"
                                    rows={3}
                                    className="w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-sm"
                                    value={formData.reason}
                                    onChange={handleChange}
                                    required
                                    placeholder={t('form.reasonPlaceholder')}
                                />
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label htmlFor="date" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                        <Calendar className="inline-block w-4 h-4 mr-1" />
                                        {t('form.date')} *
                                    </label>
                                    <Input
                                        id="date"
                                        name="date"
                                        type="date"
                                        min={today}
                                        value={formData.date}
                                        onChange={handleChange}
                                        required
                                    />
                                </div>

                                <div>
                                    <label htmlFor="time" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                        <Clock className="inline-block w-4 h-4 mr-1" />
                                        {t('form.time')} *
                                    </label>
                                    <Input
                                        id="time"
                                        name="time"
                                        type="time"
                                        value={formData.time.split(' ')[0]} // Extract just the time part if needed
                                        onChange={handleChange}
                                        required
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                    {t('form.type')} *
                                </label>
                                <div className="grid grid-cols-3 gap-2">
                                    {consultationTypes.map((type) => {
                                        const Icon = type.icon;
                                        return (
                                            <label
                                                key={type.id}
                                                className={`
                                                    flex flex-col items-center justify-center p-3 rounded-lg border cursor-pointer transition-all
                                                    ${formData.type === type.id
                                                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400'
                                                        : 'border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800'}
                                                `}
                                            >
                                                <input
                                                    type="radio"
                                                    name="type"
                                                    value={type.id}
                                                    checked={formData.type === type.id}
                                                    onChange={handleChange}
                                                    className="sr-only"
                                                />
                                                <Icon className="h-6 w-6 mb-1" />
                                                <span className="text-sm">{type.label}</span>
                                            </label>
                                        );
                                    })}
                                </div>
                            </div>
                        </form>
                    )}
                </CardContent>

                {!success && (
                    <CardFooter className="flex justify-between">
                        <Button
                            variant="outline"
                            onClick={() => router.back()}
                            disabled={loading}
                        >
                            {t('form.cancel')}
                        </Button>
                        <Button
                            type="submit"
                            onClick={handleSubmit}
                            disabled={loading}
                            className="relative"
                        >
                            {loading ? (
                                <>
                                    <span className="opacity-0">{t('form.bookNow')}</span>
                                    <span className="absolute inset-0 flex items-center justify-center">
                                        <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                        </svg>
                                    </span>
                                </>
                            ) : (
                                t('form.bookNow')
                            )}
                        </Button>
                    </CardFooter>
                )}
            </Card>
        </motion.div>
    );
}
