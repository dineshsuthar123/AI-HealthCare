import { getTranslations } from 'next-intl/server';
import { getSession } from '@/lib/auth';
import { redirect } from '@/navigation';

export async function generateMetadata({ params }: { params: { locale: string, id: string } }) {
    const t = await getTranslations({ locale: params.locale, namespace: 'ConsultationRoom' });
    return {
        title: t('pageTitle'),
    };
}

export default async function ConsultationRoomPage({ params: { id } }: { params: { id: string } }) {
    const session = await getSession();

    if (!session) {
        redirect('/auth/signin');
    }

    const t = await getTranslations('ConsultationRoom');

    // We'll implement the actual video chat functionality in a separate component
    // For now, we'll just display a placeholder UI

    return (
        <div className="container mx-auto px-4 py-8">
            <div className="mb-8">
                <h1 className="text-3xl font-bold mb-2">{t('title')}</h1>
                <p className="text-gray-600">{t('subtitle')}</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2">
                    <div className="bg-black rounded-lg aspect-video w-full mb-4 flex items-center justify-center">
                        <p className="text-white">{t('connecting')}</p>
                    </div>

                    <div className="flex justify-center space-x-4 p-4 bg-gray-100 rounded-lg">
                        <button className="p-3 bg-red-600 text-white rounded-full" aria-label={t('endCall')} title={t('endCall')}>
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                        <button className="p-3 bg-gray-700 text-white rounded-full" aria-label={t('toggleMute')} title={t('toggleMute')}>
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                            </svg>
                        </button>
                        <button className="p-3 bg-gray-700 text-white rounded-full" aria-label={t('toggleCamera')} title={t('toggleCamera')}>
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                            </svg>
                        </button>
                    </div>
                </div>

                <div>
                    <div className="bg-white rounded-lg shadow-md p-6 mb-6">
                        <h2 className="text-xl font-semibold mb-4">{t('consultationDetails')}</h2>
                        <p className="text-gray-600 mb-2">{t('consultationId')}: {id}</p>
                        <p className="text-gray-600 mb-2">{t('provider')}: Dr. Example</p>
                        <p className="text-gray-600 mb-2">{t('date')}: {new Date().toLocaleDateString()}</p>
                        <p className="text-gray-600">{t('time')}: {new Date().toLocaleTimeString()}</p>
                    </div>

                    <div className="bg-white rounded-lg shadow-md p-6">
                        <h2 className="text-xl font-semibold mb-4">{t('chat')}</h2>
                        <div className="h-64 bg-gray-50 rounded-md p-4 mb-4 overflow-y-auto">
                            <p className="text-center text-gray-500">{t('chatPlaceholder')}</p>
                        </div>
                        <div className="flex">
                            <input
                                type="text"
                                className="flex-1 p-2 border border-gray-300 rounded-l-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                placeholder={t('typeMessage')}
                            />
                            <button className="bg-blue-600 text-white p-2 rounded-r-md" aria-label={t('sendMessage')} title={t('sendMessage')}>
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                                </svg>
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
