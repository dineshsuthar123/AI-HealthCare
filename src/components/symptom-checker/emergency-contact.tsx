import { useState } from 'react';
import { Phone, AlertTriangle, CheckCircle } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import type { AIAnalysis } from '@/lib/ai/symptom-analyzer';

interface EmergencyContactProps {
    analysis: AIAnalysis;
    symptoms: string[];
}

export function EmergencyContact({ analysis, symptoms }: EmergencyContactProps) {
    const t = useTranslations('SymptomChecker');
    const [showEmergencyForm, setShowEmergencyForm] = useState(false);
    const [emergencyContact, setEmergencyContact] = useState({ name: '', phone: '' });
    const [emergencyContactSent, setEmergencyContactSent] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Only show for critical or emergency cases
    if (analysis.riskLevel !== 'critical' && analysis.urgency !== 'emergency') {
        return null;
    }

    const handleEmergencyContact = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!emergencyContact.name || !emergencyContact.phone) {
            setError(t('emergencyContact.validationError'));
            return;
        }

        try {
            // Create emergency SMS alert
            const response = await fetch('/api/sms', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    messageType: 'alert',
                    phoneNumber: emergencyContact.phone,
                    recipientName: emergencyContact.name,
                    content: `MEDICAL ALERT: ${symptoms.join(', ')}. Please seek medical attention immediately.`
                }),
            });

            if (!response.ok) {
                throw new Error('Failed to send emergency contact message');
            }

            setEmergencyContactSent(true);
            // Auto-hide the form after success
            setTimeout(() => {
                setShowEmergencyForm(false);
                setEmergencyContactSent(false);
            }, 5000);
        } catch (error) {
            console.error('Error sending emergency contact:', error);
            setError(t('emergencyContact.errorMessage'));
        }
    };

    return (
        <div className="mt-6">
            <div className={showEmergencyForm ? "hidden" : "block"}>
                <Button
                    variant="destructive"
                    className="w-full flex items-center justify-center"
                    onClick={() => setShowEmergencyForm(true)}
                >
                    <Phone className="h-4 w-4 mr-2" />
                    {t('emergencyContact.title')}
                </Button>
            </div>

            {showEmergencyForm && (
                <div className="p-4 border border-red-300 bg-red-50 rounded-lg mt-2">
                    {emergencyContactSent ? (
                        <div className="text-green-700 flex items-center">
                            <CheckCircle className="h-5 w-5 mr-2" />
                            <span>{t('emergencyContact.successMessage')}</span>
                        </div>
                    ) : (
                        <>
                            <h4 className="text-red-700 font-medium mb-3 flex items-center">
                                <AlertTriangle className="h-5 w-5 mr-2" />
                                {t('emergencyContact.title')}
                            </h4>
                            <form onSubmit={handleEmergencyContact} className="space-y-3">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        {t('emergencyContact.nameLabel')}
                                    </label>
                                    <Input
                                        type="text"
                                        placeholder={t('emergencyContact.namePlaceholder')}
                                        value={emergencyContact.name}
                                        onChange={(e) => setEmergencyContact({
                                            ...emergencyContact,
                                            name: e.target.value
                                        })}
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        {t('emergencyContact.phoneLabel')}
                                    </label>
                                    <Input
                                        type="tel"
                                        placeholder={t('emergencyContact.phonePlaceholder')}
                                        value={emergencyContact.phone}
                                        onChange={(e) => setEmergencyContact({
                                            ...emergencyContact,
                                            phone: e.target.value
                                        })}
                                        required
                                    />
                                    <p className="text-xs text-gray-500 mt-1">
                                        {t('emergencyContact.phoneHelp')}
                                    </p>
                                </div>
                                {error && (
                                    <div className="text-red-500 text-sm">
                                        {error}
                                    </div>
                                )}
                                <div className="flex flex-row gap-2">
                                    <Button
                                        type="submit"
                                        variant="destructive"
                                        className="flex-1"
                                    >
                                        {t('emergencyContact.sendAlert')}
                                    </Button>
                                    <Button
                                        type="button"
                                        variant="outline"
                                        className="flex-1"
                                        onClick={() => setShowEmergencyForm(false)}
                                    >
                                        {t('emergencyContact.cancel')}
                                    </Button>
                                </div>
                            </form>
                        </>
                    )}
                </div>
            )}
        </div>
    );
}
