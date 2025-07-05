'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useTranslations } from 'next-intl';
import { redirect } from 'next/navigation';
import { Link } from '@/navigation';
import { Activity, Calendar, FileText, Users, Heart, TrendingUp, X, ExternalLink } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/toast';

// Define types for activities
interface UserActivity {
    _id: string;
    type: 'symptom_check' | 'consultation' | 'prescription' | 'report' | 'emergency';
    title: string;
    description: string;
    date: string | Date;
    status: 'completed' | 'pending' | 'active' | 'cancelled';
    referenceId?: string;
    referenceModel?: string;
}

interface FormattedActivity {
    id: string | number;
    type: string;
    title: string;
    description: string;
    date: string;
    status: string;
}

// Helper function to format dates as relative time (e.g., "2 hours ago")
function formatRelativeTime(date: Date): string {
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffInSeconds < 60) {
        return 'Just now';
    }

    const diffInMinutes = Math.floor(diffInSeconds / 60);
    if (diffInMinutes < 60) {
        return `${diffInMinutes} minute${diffInMinutes > 1 ? 's' : ''} ago`;
    }

    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) {
        return `${diffInHours} hour${diffInHours > 1 ? 's' : ''} ago`;
    }

    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays === 1) {
        return 'Yesterday';
    }

    if (diffInDays < 7) {
        return `${diffInDays} days ago`;
    }

    // For older dates, return the formatted date
    return date.toLocaleDateString();
}

export default function DashboardPage() {
    const { data: session, status } = useSession();
    const t = useTranslations('Dashboard');
    const tHealth = useTranslations('HealthRecords');
    const { success, error: showError } = useToast();
    const [showMedicalRecords, setShowMedicalRecords] = useState(false);
    const [showEmergencyContacts, setShowEmergencyContacts] = useState(false);
    const [healthRecords, setHealthRecords] = useState<any[]>([]);
    const [isLoadingRecords, setIsLoadingRecords] = useState(false);
    const [recentActivities, setRecentActivities] = useState<FormattedActivity[]>([
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
    ]);

    // Fetch user's recent activities
    useEffect(() => {
        if (session?.user?.id) {
            const fetchUserActivities = async () => {
                try {
                    const response = await fetch('/api/user/activities');

                    if (response.ok) {
                        const data = await response.json();
                        if (data.activities && data.activities.length > 0) {
                            setRecentActivities(data.activities.map((activity: UserActivity) => ({
                                id: activity._id,
                                type: activity.type,
                                title: activity.title,
                                description: activity.description,
                                date: formatRelativeTime(new Date(activity.date)),
                                status: activity.status
                            })));
                        }
                    }
                } catch (error) {
                    console.error('Error fetching recent activities:', error);
                }
            };

            fetchUserActivities();
        }
    }, [session]);

    // Fetch health records when the modal is opened
    useEffect(() => {
        if (showMedicalRecords && session?.user?.id) {
            const fetchHealthRecords = async () => {
                setIsLoadingRecords(true);
                try {
                    const response = await fetch('/api/health-records?limit=5');
                    if (!response.ok) throw new Error('Failed to fetch records');

                    const data = await response.json();
                    setHealthRecords(data.records);
                } catch (error) {
                    console.error('Error fetching health records:', error);
                    showError(tHealth('fetchError'));
                } finally {
                    setIsLoadingRecords(false);
                }
            };

            fetchHealthRecords();
        }
    }, [showMedicalRecords, session, tHealth, showError]);

    if (status === 'loading') {
        return <div className="flex justify-center items-center min-h-screen">{t('loading')}</div>;
    }

    if (!session) {
        redirect('/auth/signin');
    } const stats = [
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
                            <Button
                                className="w-full justify-start"
                                variant="outline"
                                onClick={() => setShowMedicalRecords(true)}
                            >
                                <FileText className="mr-2 h-4 w-4" />
                                {t('viewMedicalRecords')}
                            </Button>
                            <Link href="/health-records">
                                <Button className="w-full justify-start" variant="outline">
                                    <FileText className="mr-2 h-4 w-4" />
                                    {t('healthRecords')}
                                </Button>
                            </Link>
                            <Button
                                className="w-full justify-start"
                                variant="outline"
                                onClick={() => setShowEmergencyContacts(true)}
                            >
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

                {/* Medical Records Modal */}
                {showMedicalRecords && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
                        <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[80vh] overflow-y-auto">
                            <div className="flex justify-between items-center p-4 border-b">
                                <h2 className="text-xl font-semibold">{t('viewMedicalRecords')}</h2>
                                <Button variant="ghost" size="icon" onClick={() => setShowMedicalRecords(false)}>
                                    <X className="h-5 w-5" />
                                </Button>
                            </div>
                            <div className="p-6">
                                {isLoadingRecords ? (
                                    <div className="flex justify-center items-center h-40">
                                        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
                                    </div>
                                ) : healthRecords.length > 0 ? (
                                    <div className="space-y-4">
                                        {/* Recent Health Records */}
                                        <div>
                                            <h3 className="font-medium text-lg mb-2">{tHealth('title')}</h3>
                                            <div className="space-y-2">
                                                {healthRecords.map((record) => (
                                                    <Card key={record._id} className="p-3">
                                                        <div className="flex justify-between items-center">
                                                            <div>
                                                                <p className="font-medium">{record.title}</p>
                                                                <p className="text-sm text-gray-500">
                                                                    {tHealth(`recordType.${record.type}`)} • {new Date(record.date).toLocaleDateString()}
                                                                </p>
                                                                <p className="text-sm text-gray-700 mt-1 line-clamp-1">{record.description}</p>
                                                            </div>
                                                            <div className="flex space-x-2">
                                                                {record.attachmentUrl && (
                                                                    <Button
                                                                        size="sm"
                                                                        variant="outline"
                                                                        onClick={() => window.open(record.attachmentUrl, '_blank')}
                                                                        title={tHealth('viewAttachment')}
                                                                    >
                                                                        <ExternalLink className="h-4 w-4" />
                                                                    </Button>
                                                                )}
                                                                <Link href={`/health-records?edit=${record._id}`}>
                                                                    <Button size="sm" variant="outline">{tHealth('edit')}</Button>
                                                                </Link>
                                                            </div>
                                                        </div>
                                                    </Card>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="text-center py-8">
                                        <div className="text-5xl mb-4">📋</div>
                                        <h3 className="text-xl font-semibold mb-2">{tHealth('noRecords')}</h3>
                                        <p className="text-gray-500 mb-6">{tHealth('createFirstRecord')}</p>
                                        <Link href="/health-records">
                                            <Button>
                                                <FileText className="h-4 w-4 mr-2" />
                                                {tHealth('addRecord')}
                                            </Button>
                                        </Link>
                                    </div>
                                )}
                            </div>
                            <div className="border-t p-4 flex justify-between">
                                <Link href="/health-records">
                                    <Button variant="outline">
                                        <FileText className="h-4 w-4 mr-2" />
                                        {t('viewAllRecords')}
                                    </Button>
                                </Link>
                                <Button variant="outline" onClick={() => setShowMedicalRecords(false)}>{tHealth('cancel')}</Button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Emergency Contacts Modal */}
                {showEmergencyContacts && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
                        <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
                            <div className="flex justify-between items-center p-4 border-b">
                                <h2 className="text-xl font-semibold">{t('emergencyContacts')}</h2>
                                <Button variant="ghost" size="icon" onClick={() => setShowEmergencyContacts(false)}>
                                    <X className="h-5 w-5" />
                                </Button>
                            </div>
                            <div className="p-6">
                                <div className="space-y-4">
                                    <Card className="p-3">
                                        <div className="flex justify-between items-center">
                                            <div>
                                                <p className="font-medium">Dr. Sarah Johnson</p>
                                                <p className="text-sm text-gray-500">Primary Care Physician</p>
                                                <p className="text-sm text-gray-700">+1 (555) 123-4567</p>
                                            </div>
                                            <Button size="sm" variant="outline">Call</Button>
                                        </div>
                                    </Card>
                                    <Card className="p-3">
                                        <div className="flex justify-between items-center">
                                            <div>
                                                <p className="font-medium">Local Hospital</p>
                                                <p className="text-sm text-gray-500">Emergency Room</p>
                                                <p className="text-sm text-gray-700">+1 (555) 987-6543</p>
                                            </div>
                                            <Button size="sm" variant="outline">Call</Button>
                                        </div>
                                    </Card>
                                    <Card className="p-3">
                                        <div className="flex justify-between items-center">
                                            <div>
                                                <p className="font-medium">Jane Doe</p>
                                                <p className="text-sm text-gray-500">Family Contact</p>
                                                <p className="text-sm text-gray-700">+1 (555) 555-5555</p>
                                            </div>
                                            <Button size="sm" variant="outline">Call</Button>
                                        </div>
                                    </Card>
                                    <div className="mt-4">
                                        <Button className="w-full">Add New Contact</Button>
                                    </div>
                                </div>
                            </div>
                            <div className="border-t p-4 flex justify-end">
                                <Button variant="outline" onClick={() => setShowEmergencyContacts(false)}>Close</Button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
