'use client';

import { useState, useEffect, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import { FilePlus, Filter, Search, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { useToast } from '@/components/ui/toast';
import { HealthRecordCard } from '@/components/health-records/health-record-card';
import { HealthRecordForm } from '@/components/health-records/health-record-form';
import { IHealthRecord } from '@/models/HealthRecord';
import { ParticlesBackground } from '@/components/animations/particles-background';
import { FadeIn, ScaleIn, StaggerContainer } from '@/components/animations/motion-effects';

// Define a client-side type that includes MongoDB's _id
interface HealthRecord extends Omit<IHealthRecord, 'userId' | 'date' | 'createdAt' | 'updatedAt'> {
    _id: string;
    date: string; // Date is stored as string in the client
    createdAt: string;
    updatedAt: string;
}

export default function HealthRecordsPage() {
    const t = useTranslations('HealthRecords');
    const { success, error: showError } = useToast();

    const [records, setRecords] = useState<HealthRecord[]>([]);
    const [filteredRecords, setFilteredRecords] = useState<HealthRecord[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedType, setSelectedType] = useState<string>('');
    const [showForm, setShowForm] = useState(false);
    const [editingRecord, setEditingRecord] = useState<HealthRecord | null>(null);

    // Handle URL query parameters for direct editing
    useEffect(() => {
        // Check if we have a URL parameter for editing
        const params = new URLSearchParams(window.location.search);
        const editId = params.get('edit');

        if (editId && records.length > 0) {
            const record = records.find(r => r._id === editId);
            if (record) {
                setEditingRecord(record);
            }
        }
    }, [records]);

    // Fetch records on component mount
    const fetchRecords = useCallback(async () => {
        setIsLoading(true);
        try {
            const response = await fetch('/api/health-records');
            if (!response.ok) throw new Error('Failed to fetch records');

            const data = await response.json();
            setRecords(data.records);
        } catch (error) {
            console.error('Error fetching health records:', error);
            showError(t('fetchError'));
        } finally {
            setIsLoading(false);
        }
    }, [showError, t]);

    // Filter records when search or type filter changes
    const filterRecords = useCallback(() => {
        let filtered = [...records];

        // Apply type filter if selected
        if (selectedType) {
            filtered = filtered.filter(record => record.type === selectedType);
        }

        // Apply search filter if query exists
        if (searchQuery.trim()) {
            const query = searchQuery.toLowerCase();
            filtered = filtered.filter(record =>
                record.title.toLowerCase().includes(query) ||
                record.description.toLowerCase().includes(query) ||
                (record.notes && record.notes.toLowerCase().includes(query))
            );
        }

        setFilteredRecords(filtered);
    }, [records, searchQuery, selectedType]);

    const handleCreateRecord = async (data: Omit<IHealthRecord, 'userId' | 'createdAt' | 'updatedAt'>) => {
        try {
            const response = await fetch('/api/health-records', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });

            if (!response.ok) throw new Error('Failed to create record');

            const newRecord = await response.json();
            setRecords(prev => [newRecord, ...prev]);
            setShowForm(false);
            success(t('createSuccess'));
        } catch (error) {
            console.error('Error creating health record:', error);
            throw error; // Propagate to form for handling
        }
    };

    const handleUpdateRecord = async (data: Partial<Omit<IHealthRecord, 'userId' | 'createdAt' | 'updatedAt'>>) => {
        if (!editingRecord) return;

        try {
            const response = await fetch(`/api/health-records/${editingRecord._id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });

            if (!response.ok) throw new Error('Failed to update record');

            const updatedRecord = await response.json();
            setRecords(prev =>
                prev.map(record =>
                    record._id === updatedRecord._id ? updatedRecord : record
                )
            );

            setEditingRecord(null);
            success(t('updateSuccess'));
        } catch (error) {
            console.error('Error updating health record:', error);
            throw error; // Propagate to form for handling
        }
    };

    const handleDeleteRecord = async (id: string) => {
        try {
            const response = await fetch(`/api/health-records/${id}`, {
                method: 'DELETE'
            });

            if (!response.ok) throw new Error('Failed to delete record');

            setRecords(prev => prev.filter(record => record._id !== id));
            success(t('deleteSuccess'));
        } catch (error) {
            console.error('Error deleting health record:', error);
            showError(t('deleteError'));
        }
    };

    const handleToggleShare = async (id: string, isShared: boolean) => {
        try {
            const record = records.find(r => r._id === id);
            if (!record) return;

            const response = await fetch(`/api/health-records/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ...record, isShared })
            });

            if (!response.ok) throw new Error('Failed to update sharing settings');

            const updatedRecord = await response.json();
            setRecords(prev =>
                prev.map(record =>
                    record._id === updatedRecord._id ? updatedRecord : record
                )
            );

            success(isShared ? t('sharedSuccess') : t('unsharedSuccess'));
        } catch (error) {
            console.error('Error toggling share status:', error);
            throw error;
        }
    };

    const handleEditRecord = (id: string) => {
        const record = records.find(r => r._id === id);
        if (record) {
            setEditingRecord(record);
        }
    };

    const handleCancelForm = () => {
        setShowForm(false);
        setEditingRecord(null);
    };

    // Fetch records on component mount
    useEffect(() => {
        fetchRecords();
    }, [fetchRecords]);

    // Filter records when search or type filter changes
    useEffect(() => {
        filterRecords();
    }, [filterRecords]);

    if (showForm || editingRecord) {
        return (
            <div className="container py-8">
                <HealthRecordForm
                    initialData={editingRecord || undefined}
                    onSubmit={editingRecord ? handleUpdateRecord : handleCreateRecord}
                    onCancel={handleCancelForm}
                />
            </div>
        );
    }

    return (
        <div className="min-h-screen relative overflow-hidden">
            <ParticlesBackground variant="medical" />

            <div className="relative z-10 py-24 px-4 sm:px-6 lg:px-8">
                <div className="max-w-7xl mx-auto">
                    <StaggerContainer className="space-y-8">
                        {/* Header */}
                        <FadeIn className="text-center mb-12">
                            <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br from-green-500 to-emerald-600 mb-6 shadow-2xl">
                                <FilePlus className="h-10 w-10 text-white" />
                            </div>
                            <h1 className="text-4xl md:text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-green-600 to-emerald-600 mb-4">
                                {t('title')}
                            </h1>
                            <p className="text-xl text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
                                {t('subtitle')}
                            </p>
                        </FadeIn>

                        {/* Action Header */}
                        <FadeIn delay={0.2}>
                            <div className="flex flex-col md:flex-row justify-between items-start md:items-center">
                                <div className="flex-1">
                                    <Button
                                        onClick={() => setShowForm(true)}
                                        variant="gradient"
                                        size="lg"
                                        className="px-8"
                                        animated
                                    >
                                        <FilePlus className="h-5 w-5 mr-2" />
                                        {t('addRecord')}
                                    </Button>
                                </div>
                            </div>
                        </FadeIn>

                        {/* Filters */}
                        <div className="flex flex-col md:flex-row gap-4 mb-6">
                            <div className="relative flex-1">
                                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                                <Input
                                    className="pl-10"
                                    placeholder={t('searchPlaceholder')}
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                />
                            </div>

                            <div className="flex items-center gap-2">
                                <Filter className="text-gray-400 h-4 w-4" />
                                <select
                                    className="h-10 rounded-md border border-gray-300 px-3"
                                    value={selectedType}
                                    onChange={(e) => setSelectedType(e.target.value)}
                                    aria-label={t('filterByType')}
                                >
                                    <option value="">{t('allTypes')}</option>
                                    <option value="allergy">{t('recordType.allergy')}</option>
                                    <option value="medication">{t('recordType.medication')}</option>
                                    <option value="condition">{t('recordType.condition')}</option>
                                    <option value="vaccination">{t('recordType.vaccination')}</option>
                                    <option value="lab">{t('recordType.lab')}</option>
                                    <option value="other">{t('recordType.other')}</option>
                                </select>
                            </div>
                        </div>

                        {/* Records List */}
                        {isLoading ? (
                            <div className="flex justify-center items-center h-64">
                                <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
                            </div>
                        ) : filteredRecords.length > 0 ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {filteredRecords.map(record => (
                                    <HealthRecordCard
                                        key={record._id}
                                        record={record}
                                        onEdit={handleEditRecord}
                                        onDelete={handleDeleteRecord}
                                        onToggleShare={handleToggleShare}
                                    />
                                ))}
                            </div>
                        ) : (
                            <Card>
                                <CardContent className="flex flex-col items-center justify-center py-12">
                                    <div className="text-5xl mb-4">📋</div>
                                    <h3 className="text-xl font-semibold mb-2">
                                        {searchQuery || selectedType ? t('noMatchingRecords') : t('noRecords')}
                                    </h3>
                                    <p className="text-gray-500 text-center max-w-md mb-6">
                                        {searchQuery || selectedType
                                            ? t('tryDifferentFilters')
                                            : t('createFirstRecord')}
                                    </p>
                                    {!searchQuery && !selectedType && (
                                        <Button onClick={() => setShowForm(true)} variant="gradient" animated>
                                            <FilePlus className="h-4 w-4 mr-2" />
                                            {t('addRecord')}
                                        </Button>
                                    )}
                                </CardContent>
                            </Card>
                        )}
                    </StaggerContainer>
                </div>
            </div>
        </div>
    );
}
