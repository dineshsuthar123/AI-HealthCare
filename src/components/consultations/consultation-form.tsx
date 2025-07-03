'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

type ConsultationFormData = {
    reason: string;
    date: string;
    time: string;
    type: string;
};

export default function ConsultationForm() {
    const t = useTranslations('Consultations');
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState<ConsultationFormData>({
        reason: '',
        date: '',
        time: '',
        type: 'video',
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            const response = await fetch('/api/consultations', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(formData),
            });

            if (!response.ok) {
                throw new Error('Failed to book consultation');
            }

            // Success - refresh the page to show the new consultation
            router.refresh();

            // Reset form
            setFormData({
                reason: '',
                date: '',
                time: '',
                type: 'video',
            });
        } catch (error) {
            console.error('Error booking consultation:', error);
        } finally {
            setLoading(false);
        }
    };

    // Calculate minimum date (today)
    const today = new Date().toISOString().split('T')[0];

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div>
                <label htmlFor="reason" className="block text-sm font-medium mb-1">
                    {t('form.reason')}
                </label>
                <Input
                    id="reason"
                    name="reason"
                    value={formData.reason}
                    onChange={handleChange}
                    placeholder={t('form.reasonPlaceholder')}
                    required
                />
            </div>

            <div>
                <label htmlFor="date" className="block text-sm font-medium mb-1">
                    {t('form.date')}
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
                <label htmlFor="time" className="block text-sm font-medium mb-1">
                    {t('form.time')}
                </label>
                <Input
                    id="time"
                    name="time"
                    type="time"
                    value={formData.time}
                    onChange={handleChange}
                    required
                />
            </div>

            <div>
                <label htmlFor="type" className="block text-sm font-medium mb-1">
                    {t('form.type')}
                </label>
                <select
                    id="type"
                    name="type"
                    value={formData.type}
                    onChange={handleChange}
                    className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                >
                    <option value="video">{t('form.videoCall')}</option>
                    <option value="audio">{t('form.audioCall')}</option>
                    <option value="message">{t('form.message')}</option>
                </select>
            </div>

            <Button type="submit" className="w-full" disabled={loading}>
                {loading ? t('form.booking') : t('form.bookNow')}
            </Button>
        </form>
    );
}
