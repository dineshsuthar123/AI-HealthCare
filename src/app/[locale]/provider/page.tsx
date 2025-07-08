import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function ProviderPage() {
    const t = useTranslations('Provider');
    const [sharedRecords, setSharedRecords] = useState([]);

    const handleShareRecord = (recordId) => {
        // Logic to share the record with the provider
        console.log(`Shared record with ID: ${recordId}`);
        setSharedRecords((prev) => [...prev, recordId]);
    };

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
            <div className="max-w-4xl mx-auto px-4">
                <Card className="mb-8">
                    <CardHeader>
                        <CardTitle>{t('title')}</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p>{t('description')}</p>
                    </CardContent>
                </Card>

                <div className="space-y-4">
                    {/* Example records */}
                    {[1, 2, 3].map((recordId) => (
                        <Card key={recordId} className="p-4">
                            <div className="flex justify-between items-center">
                                <p>{t('record', { id: recordId })}</p>
                                <Button
                                    onClick={() => handleShareRecord(recordId)}
                                    disabled={sharedRecords.includes(recordId)}
                                >
                                    {sharedRecords.includes(recordId) ? t('shared') : t('share')}
                                </Button>
                            </div>
                        </Card>
                    ))}
                </div>
            </div>
        </div>
    );
}
