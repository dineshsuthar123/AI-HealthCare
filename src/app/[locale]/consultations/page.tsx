import { getTranslations } from 'next-intl/server';
import { getSession } from '@/lib/auth';
import { redirect } from '@/navigation';
import ConsultationForm from '@/components/consultations/consultation-form';
import ConsultationsList from '@/components/consultations/consultations-list';
import { Card } from '@/components/ui/card';

export async function generateMetadata({ params }: { params: { locale: string } }) {
    // Fix: Make sure to await the params object before accessing its properties
    const locale = params ? params.locale : 'en';
    const t = await getTranslations({ locale, namespace: 'Consultations' });
    return {
        title: t('pageTitle'),
    };
}

export default async function ConsultationsPage({ params }: { params: { locale: string } }) {
    const session = await getSession();

    if (!session) {
        redirect({ href: '/auth/signin', locale: params.locale });
    }

    const t = await getTranslations('Consultations');

    return (
        <div className="container mx-auto px-4 py-8">
            <div className="mb-10">
                <h1 className="text-3xl font-bold mb-2">{t('title')}</h1>
                <p className="text-gray-600">{t('subtitle')}</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2">
                    <Card className="p-6">
                        <h2 className="text-xl font-semibold mb-4">{t('upcomingConsultations')}</h2>
                        <ConsultationsList />
                    </Card>

                    <Card className="p-6 mt-8">
                        <h2 className="text-xl font-semibold mb-4">{t('pastConsultations')}</h2>
                        <ConsultationsList isPast={true} />
                    </Card>
                </div>

                <div>
                    <Card className="p-6 sticky top-24">
                        <h2 className="text-xl font-semibold mb-4">{t('bookConsultation')}</h2>
                        <ConsultationForm />
                    </Card>
                </div>
            </div>
        </div>
    );
}
