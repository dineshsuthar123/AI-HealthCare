'use client';

import { useSession } from 'next-auth/react';
import { useTranslations } from 'next-intl';
import { redirect } from 'next/navigation';
import { Link } from '@/navigation';
import { Activity, Calendar, FileText, Users, Heart, TrendingUp } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export default function DashboardPage() {
    const { data: session, status } = useSession();
    const t = useTranslations('Dashboard');

    if (status === 'loading') {
        return <div className="flex justify-center items-center min-h-screen">{t('loading')}</div>;
    }

    if (!session) {
        redirect('/auth/signin');
    }

    const stats = [
        {
            title: t('stats.healthChecks'),
            value: '12',
            icon: Activity,
            description: t('stats.completedThisMonth'),
            trend: '+2 from last month',
        },
        {
            title: t('stats.consultations'),
            value: '3',
            icon: Calendar,
            description: t('stats.scheduledAppointments'),
            trend: 'Next: Tomorrow 2:00 PM',
        },
        {
            title: t('stats.healthScore'),
            value: '85%',
            icon: Heart,
            description: t('stats.basedOnAssessments'),
            trend: '+5% improvement',
        },
        {
            title: t('stats.reports'),
            value: '8',
            icon: FileText,
            description: t('stats.medicalDocuments'),
            trend: '2 new this week',
        },
    ];

    const recentActivities = [
        {
            id: 1,
            type: 'symptom_check',
            title: 'Symptom Check Completed',
            description: 'Headache and fever assessment',
            date: '2 hours ago',
            status: 'completed',
        },
        {
            id: 2,
            type: 'consultation',
            title: 'Video Consultation',
            description: 'Dr. Sarah Johnson - Follow-up',
            date: 'Yesterday',
            status: 'completed',
        },
        {
            id: 3,
            type: 'prescription',
            title: 'Prescription Updated',
            description: 'Pain medication dosage adjusted',
            date: '3 days ago',
            status: 'active',
        },
    ];

    return (
        <div className="min-h-screen bg-gray-50 py-8">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-gray-900">
                        {t('welcomeBack', { name: session.user?.name })}
                    </h1>
                    <p className="text-lg text-gray-600 mt-2">
                        {t('healthOverview')}
                    </p>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                    {stats.map((stat, index) => (
                        <Card key={index}>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">
                                    {stat.title}
                                </CardTitle>
                                <stat.icon className="h-4 w-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">{stat.value}</div>
                                <p className="text-xs text-muted-foreground">
                                    {stat.description}
                                </p>
                                <p className="text-xs text-green-600 mt-1">
                                    {stat.trend}
                                </p>
                            </CardContent>
                        </Card>
                    ))}
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* Quick Actions */}
                    <Card>
                        <CardHeader>
                            <CardTitle>{t('quickActions')}</CardTitle>
                            <CardDescription>
                                {t('quickActionsDesc')}
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <Link href="/symptom-checker">
                                <Button className="w-full justify-start" variant="outline">
                                    <Activity className="mr-2 h-4 w-4" />
                                    {t('startSymptomCheck')}
                                </Button>
                            </Link>
                            <Link href="/consultations">
                                <Button className="w-full justify-start" variant="outline">
                                    <Calendar className="mr-2 h-4 w-4" />
                                    {t('bookConsultation')}
                                </Button>
                            </Link>
                            <Button className="w-full justify-start" variant="outline">
                                <FileText className="mr-2 h-4 w-4" />
                                {t('viewMedicalRecords')}
                            </Button>
                            <Button className="w-full justify-start" variant="outline">
                                <Users className="mr-2 h-4 w-4" />
                                {t('emergencyContacts')}
                            </Button>
                        </CardContent>
                    </Card>

                    {/* Recent Activities */}
                    <Card>
                        <CardHeader>
                            <CardTitle>{t('recentActivities')}</CardTitle>
                            <CardDescription>
                                {t('recentActivitiesDesc')}
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                {recentActivities.map((activity) => (
                                    <div key={activity.id} className="flex items-start space-x-4">
                                        <div className="flex-shrink-0">
                                            <div className="w-2 h-2 bg-blue-600 rounded-full mt-2"></div>
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-medium text-gray-900">
                                                {activity.title}
                                            </p>
                                            <p className="text-sm text-gray-500">
                                                {activity.description}
                                            </p>
                                            <p className="text-xs text-gray-400 mt-1">
                                                {activity.date}
                                            </p>
                                        </div>
                                        <div className="flex-shrink-0">
                                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${activity.status === 'completed'
                                                ? 'bg-green-100 text-green-800'
                                                : 'bg-blue-100 text-blue-800'
                                                }`}>
                                                {activity.status}
                                            </span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Health Insights */}
                <Card className="mt-8">
                    <CardHeader>
                        <CardTitle className="flex items-center">
                            <TrendingUp className="mr-2 h-5 w-5" />
                            {t('healthInsights')}
                        </CardTitle>
                        <CardDescription>
                            {t('healthInsightsDesc')}
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            <div className="p-4 bg-blue-50 rounded-lg">
                                <h4 className="font-medium text-blue-900 mb-2">
                                    🎯 {t('recommendation')}
                                </h4>
                                <p className="text-blue-800 text-sm">
                                    Based on your recent symptoms, consider scheduling a follow-up consultation with your primary care physician.
                                </p>
                            </div>
                            <div className="p-4 bg-green-50 rounded-lg">
                                <h4 className="font-medium text-green-900 mb-2">
                                    ✅ {t('goodProgress')}
                                </h4>
                                <p className="text-green-800 text-sm">
                                    Your health score has improved by 5% this month. Keep up the good work with your medication adherence!
                                </p>
                            </div>
                            <div className="p-4 bg-yellow-50 rounded-lg">
                                <h4 className="font-medium text-yellow-900 mb-2">
                                    ⚠️ {t('reminder')}
                                </h4>
                                <p className="text-yellow-800 text-sm">
                                    Dont forget to take your evening medication. Set up notifications in your profile settings.
                                </p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
