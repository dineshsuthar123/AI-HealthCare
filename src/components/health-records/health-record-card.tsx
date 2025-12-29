'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { formatDistanceToNow } from 'date-fns';
import {
    Edit,
    Trash,
    Calendar,
    User,
    Paperclip,
    Share2,
    ExternalLink
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/toast';

interface HealthRecordProps {
    record: {
        _id: string;
        title: string;
        type: 'allergy' | 'medication' | 'condition' | 'vaccination' | 'lab' | 'other';
        description: string;
        date: string;
        provider?: string;
        attachmentUrl?: string;
        isShared: boolean;
        notes?: string;
        createdAt: string;
        updatedAt: string;
    };
    onEdit: (id: string) => void;
    onDelete: (id: string) => void;
    onToggleShare: (id: string, isShared: boolean) => void;
}

const getTypeIcon = (type: string) => {
    switch (type) {
        case 'allergy':
            return '🤧';
        case 'medication':
            return '💊';
        case 'condition':
            return '🏥';
        case 'vaccination':
            return '💉';
        case 'lab':
            return '🧪';
        default:
            return '📋';
    }
};

const getTypeColor = (type: string) => {
    switch (type) {
        case 'allergy':
            return 'bg-gradient-to-r from-rose-500/20 to-orange-500/20 text-rose-200 border border-rose-500/40';
        case 'medication':
            return 'bg-gradient-to-r from-blue-500/20 to-cyan-400/20 text-blue-200 border border-blue-500/40';
        case 'condition':
            return 'bg-gradient-to-r from-amber-400/20 to-orange-500/20 text-amber-200 border border-amber-400/40';
        case 'vaccination':
            return 'bg-gradient-to-r from-emerald-400/20 to-teal-500/20 text-emerald-200 border border-emerald-400/40';
        case 'lab':
            return 'bg-gradient-to-r from-purple-500/20 to-indigo-500/20 text-purple-200 border border-purple-500/40';
        default:
            return 'bg-gradient-to-r from-slate-500/20 to-slate-400/20 text-slate-200 border border-slate-400/40';
    }
};

export const HealthRecordCard = ({ record, onEdit, onDelete, onToggleShare }: HealthRecordProps) => {
    const t = useTranslations('HealthRecords');
    const [isDeleting, setIsDeleting] = useState(false);
    const [isToggling, setIsToggling] = useState(false);
    const { success, error: showError } = useToast();

    const handleDelete = async () => {
        if (confirm(t('deleteConfirmation'))) {
            setIsDeleting(true);
            try {
                onDelete(record._id);
            } catch (err) {
                console.error('Error deleting record:', err);
                showError(t('deleteError'));
            } finally {
                setIsDeleting(false);
            }
        }
    };

    const handleToggleShare = async () => {
        setIsToggling(true);
        try {
            onToggleShare(record._id, !record.isShared);
            success(record.isShared ? t('unsharedSuccess') : t('sharedSuccess'));
        } catch (err) {
            console.error('Error toggling share status:', err);
            showError(t('shareError'));
        } finally {
            setIsToggling(false);
        }
    };

    return (
        <Card className="overflow-hidden border border-white/10 bg-[#0b1224] text-white">
            <CardHeader className="pb-3">
                <div className="flex justify-between items-start">
                    <div className="flex items-center">
                        <div className={`p-2 rounded-md mr-3 shadow-inner ${getTypeColor(record.type)}`}>
                            <span className="text-xl drop-shadow-sm">{getTypeIcon(record.type)}</span>
                        </div>
                        <div>
                            <CardTitle className="text-lg text-white">{record.title}</CardTitle>
                            <CardDescription className="text-slate-300">
                                {t(`recordType.${record.type}`)} • {formatDistanceToNow(new Date(record.date), { addSuffix: true })}
                            </CardDescription>
                        </div>
                    </div>
                    <div className="flex space-x-1">
                        <Button variant="ghost" size="sm" onClick={() => onEdit(record._id)}>
                            <Edit className="h-4 w-4" />
                            <span className="sr-only">{t('edit')}</span>
                        </Button>
                        <Button
                            variant="ghost"
                            size="sm"
                            disabled={isDeleting}
                            onClick={handleDelete}
                        >
                            <Trash className="h-4 w-4 text-red-500" />
                            <span className="sr-only">{t('delete')}</span>
                        </Button>
                    </div>
                </div>
            </CardHeader>
            <CardContent>
                <p className="text-sm text-gray-700 mb-4">{record.description}</p>

                {record.notes && (
                    <div className="text-sm text-gray-600 mb-4 bg-gray-50 p-3 rounded-md">
                        <p className="font-medium mb-1">{t('notes')}:</p>
                        <p>{record.notes}</p>
                    </div>
                )}

                <div className="grid grid-cols-2 gap-2 text-sm">
                    <div className="flex items-center text-gray-600">
                        <Calendar className="h-4 w-4 mr-2 flex-shrink-0" />
                        {new Date(record.date).toLocaleDateString()}
                    </div>

                    {record.provider && (
                        <div className="flex items-center text-gray-600">
                            <User className="h-4 w-4 mr-2 flex-shrink-0" />
                            {record.provider}
                        </div>
                    )}
                </div>
            </CardContent>

            <CardFooter className="pt-0 flex justify-between">
                {record.attachmentUrl ? (
                    <Button
                        variant="outline"
                        size="sm"
                        className="text-xs"
                        onClick={() => window.open(record.attachmentUrl, '_blank')}
                    >
                        <Paperclip className="h-3 w-3 mr-1" />
                        {t('viewAttachment')}
                        <ExternalLink className="h-3 w-3 ml-1" />
                    </Button>
                ) : (
                    <div></div>
                )}

                <Button
                    variant={record.isShared ? "secondary" : "outline"}
                    size="sm"
                    className={`text-xs ${record.isShared ? 'bg-green-50 text-green-700 hover:bg-green-100' : ''}`}
                    onClick={handleToggleShare}
                    disabled={isToggling}
                >
                    <Share2 className="h-3 w-3 mr-1" />
                    {record.isShared ? t('shared') : t('share')}
                </Button>
            </CardFooter>
        </Card>
    );
};
