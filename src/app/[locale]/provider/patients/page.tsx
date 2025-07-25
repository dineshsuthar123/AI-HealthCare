import React from 'react';
import { useTranslations } from 'next-intl';
import { getTranslations } from 'next-intl/server';
import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import dbConnect from '@/lib/mongodb';
import User from '@/models/User';
import {
    Tabs,
    TabsContent,
    TabsList,
    TabsTrigger
} from '@/components/ui/tabs';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { SearchIcon } from 'lucide-react';

async function getProviderWithPatients() {
    try {
        const session = await getServerSession();
        if (!session?.user?.email) return null;

        await dbConnect();
        const provider = await User.findOne({
            email: session.user.email,
            role: 'provider'
        }).lean();

        if (!provider) return null;

        // Get all patients assigned to this provider
        const patients = await User.find({
            assignedProvider: provider._id
        })
            .select('name email profile.age profile.gender')
            .lean();

        // Get patients who requested this provider but aren't assigned yet
        const requestingPatients = await User.find({
            'providerRequests.provider': provider._id,
            'providerRequests.status': 'pending'
        })
            .select('name email profile.age profile.gender providerRequests')
            .lean();

        return {
            provider,
            patients,
            requestingPatients
        };
    } catch (error) {
        console.error("Error fetching provider data:", error);
        return null;
    }
}

export async function generateMetadata({ params: { locale } }) {
    const t = await getTranslations({ locale, namespace: 'ProviderPatients' });

    return {
        title: t('title'),
        description: t('description'),
    };
}

export default async function ProviderPatientsPage() {
    const data = await getProviderWithPatients();

    if (!data) {
        redirect('/auth/signin');
    }

    const { provider, patients, requestingPatients } = data;

    return (
        <ProviderPatientsUI
            provider={provider}
            patients={patients}
            requestingPatients={requestingPatients}
        />
    );
}

function ProviderPatientsUI({ provider, patients, requestingPatients }) {
    const t = useTranslations('ProviderPatients');
    const [searchTerm, setSearchTerm] = React.useState('');
    const [filter, setFilter] = React.useState('all');
    const [pendingRequests, setPendingRequests] = React.useState(requestingPatients);
    const [assignedPatients, setAssignedPatients] = React.useState(patients);
    const [processingRequest, setProcessingRequest] = React.useState(null);

    const filteredPatients = React.useMemo(() => {
        return assignedPatients.filter(patient => {
            const matchesSearch = !searchTerm ||
                patient.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                patient.email.toLowerCase().includes(searchTerm.toLowerCase());

            if (filter === 'all') return matchesSearch;
            if (filter === 'recent') {
                // Assumes _id contains timestamp info (MongoDB ObjectId does)
                const isRecent = new Date(parseInt(patient._id.substring(0, 8), 16) * 1000) >
                    new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
                return matchesSearch && isRecent;
            }
            if (filter === 'alphabetical') {
                // Already filtered by search, just return true for sorting later
                return matchesSearch;
            }

            return matchesSearch;
        });
    }, [assignedPatients, searchTerm, filter]);

    // Sort patients if needed
    const sortedPatients = React.useMemo(() => {
        if (filter === 'alphabetical') {
            return [...filteredPatients].sort((a, b) => a.name.localeCompare(b.name));
        }
        return filteredPatients;
    }, [filteredPatients, filter]);

    async function handleRequest(patientId, action) {
        try {
            setProcessingRequest(patientId);

            const response = await fetch('/api/provider/patients/handle-request', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ patientId, action }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Failed to process request');
            }

            // Update UI based on action
            if (action === 'accept') {
                // Find patient in pending requests
                const acceptedPatient = pendingRequests.find(p => p._id === patientId);

                // Remove from pending requests
                setPendingRequests(pendingRequests.filter(p => p._id !== patientId));

                // Add to assigned patients if not already there
                if (acceptedPatient && !assignedPatients.some(p => p._id === patientId)) {
                    setAssignedPatients([...assignedPatients, acceptedPatient]);
                }
            } else {
                // Just remove from pending requests
                setPendingRequests(pendingRequests.filter(p => p._id !== patientId));
            }
        } catch (error) {
            console.error('Error handling request:', error);
            alert(error.message);
        } finally {
            setProcessingRequest(null);
        }
    }

    return (
        <div className="container mx-auto p-6">
            <h1 className="text-3xl font-bold mb-2">{t('title')}</h1>
            <p className="text-gray-500 mb-8">{t('description')}</p>

            <div className="flex justify-between mb-6">
                <div className="flex-1 mr-4">
                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle>{t('stats.totalPatients')}</CardTitle>
                            <CardDescription>{t('stats.patientsUnderYourCare')}</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="text-3xl font-bold">{assignedPatients.length}</div>
                        </CardContent>
                    </Card>
                </div>
                <div className="flex-1 mx-2">
                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle>{t('stats.pendingRequests')}</CardTitle>
                            <CardDescription>{t('stats.patientsRequestingYou')}</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="text-3xl font-bold">{pendingRequests.length}</div>
                        </CardContent>
                    </Card>
                </div>
                <div className="flex-1 ml-4">
                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle>{t('stats.availability')}</CardTitle>
                            <CardDescription>{t('stats.yourCurrentStatus')}</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="flex items-center">
                                <div className="w-4 h-4 rounded-full bg-green-500 mr-2"></div>
                                <span className="text-xl font-semibold">{t('stats.available')}</span>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>

            <Tabs defaultValue="assigned" className="mt-6">
                <TabsList className="mb-4">
                    <TabsTrigger value="assigned">
                        {t('tabs.assigned')} ({assignedPatients.length})
                    </TabsTrigger>
                    <TabsTrigger value="requests">
                        {t('tabs.requests')} ({pendingRequests.length})
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="assigned">
                    <Card>
                        <CardHeader>
                            <div className="flex items-center justify-between">
                                <CardTitle>{t('assignedPatients')}</CardTitle>
                                <div className="flex w-full max-w-sm items-center space-x-2">
                                    <Input
                                        placeholder={t('searchPatients')}
                                        className="flex-1"
                                        icon={<SearchIcon className="h-4 w-4" />}
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                    />
                                    <Select
                                        defaultValue="all"
                                        value={filter}
                                        onValueChange={setFilter}
                                    >
                                        <SelectTrigger className="w-[180px]">
                                            <SelectValue placeholder={t('filter')} />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="all">{t('all')}</SelectItem>
                                            <SelectItem value="recent">{t('recentlyAdded')}</SelectItem>
                                            <SelectItem value="alphabetical">{t('alphabetical')}</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent>
                            {sortedPatients.length === 0 ? (
                                <div className="text-center py-8">
                                    <p className="text-gray-500">{t('noAssignedPatients')}</p>
                                </div>
                            ) : (
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>{t('patientName')}</TableHead>
                                            <TableHead>{t('email')}</TableHead>
                                            <TableHead>{t('age')}</TableHead>
                                            <TableHead>{t('gender')}</TableHead>
                                            <TableHead className="text-right">{t('actions')}</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {sortedPatients.map((patient) => (
                                            <TableRow key={patient._id}>
                                                <TableCell className="font-medium">{patient.name}</TableCell>
                                                <TableCell>{patient.email}</TableCell>
                                                <TableCell>{patient.profile?.age || '-'}</TableCell>
                                                <TableCell>{patient.profile?.gender || '-'}</TableCell>
                                                <TableCell className="text-right">
                                                    <div className="flex justify-end space-x-2">
                                                        <Button variant="outline" size="sm">
                                                            {t('viewRecords')}
                                                        </Button>
                                                        <Button variant="default" size="sm">
                                                            {t('scheduleConsultation')}
                                                        </Button>
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="requests">
                    <Card>
                        <CardHeader>
                            <CardTitle>{t('patientRequests')}</CardTitle>
                            <CardDescription>
                                {t('requestsDescription')}
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            {pendingRequests.length === 0 ? (
                                <div className="text-center py-8">
                                    <p className="text-gray-500">{t('noRequests')}</p>
                                </div>
                            ) : (
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>{t('patientName')}</TableHead>
                                            <TableHead>{t('email')}</TableHead>
                                            <TableHead>{t('requestDate')}</TableHead>
                                            <TableHead className="text-right">{t('actions')}</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {pendingRequests.map((patient) => {
                                            const request = patient.providerRequests.find(
                                                r => r.provider.toString() === provider._id.toString()
                                            );

                                            return (
                                                <TableRow key={patient._id}>
                                                    <TableCell className="font-medium">{patient.name}</TableCell>
                                                    <TableCell>{patient.email}</TableCell>
                                                    <TableCell>
                                                        {new Date(request?.requestDate).toLocaleDateString()}
                                                    </TableCell>
                                                    <TableCell className="text-right">
                                                        <div className="flex justify-end space-x-2">
                                                            <Button
                                                                variant="outline"
                                                                size="sm"
                                                                className="bg-red-50 hover:bg-red-100 text-red-600 border-red-200"
                                                                onClick={() => handleRequest(patient._id, 'decline')}
                                                                disabled={processingRequest === patient._id}
                                                            >
                                                                {processingRequest === patient._id ? '...' : t('decline')}
                                                            </Button>
                                                            <Button
                                                                variant="default"
                                                                size="sm"
                                                                onClick={() => handleRequest(patient._id, 'accept')}
                                                                disabled={processingRequest === patient._id}
                                                            >
                                                                {processingRequest === patient._id ? '...' : t('accept')}
                                                            </Button>
                                                        </div>
                                                    </TableCell>
                                                </TableRow>
                                            );
                                        })}
                                    </TableBody>
                                </Table>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
}
