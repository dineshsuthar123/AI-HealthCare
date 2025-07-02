'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useTranslations } from 'next-intl';
import { 
  User, 
  Mail, 
  Phone, 
  MapPin, 
  Calendar, 
  Edit, 
  Save, 
  X, 
  Shield, 
  Bell, 
  Globe, 
  Heart,
  FileText,
  Download,
  Trash2,
  AlertCircle,
  CheckCircle,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface UserProfile {
  id: string;
  name: string;
  email: string;
  phone?: string;
  dateOfBirth?: string;
  address?: string;
  emergencyContact?: {
    name: string;
    phone: string;
    relationship: string;
  };
  medicalInfo?: {
    allergies: string[];
    medications: string[];
    conditions: string[];
    bloodType?: string;
  };
  preferences: {
    language: string;
    notifications: {
      email: boolean;
      sms: boolean;
      emergency: boolean;
    };
    privacy: {
      shareData: boolean;
      analyticsOptIn: boolean;
    };
  };
}

interface HealthRecord {
  id: string;
  type: 'symptom-check' | 'appointment' | 'emergency' | 'medication';
  date: string;
  title: string;
  description: string;
  status: 'completed' | 'pending' | 'cancelled';
  doctor?: string;
}

export default function ProfilePage() {
  const { data: session, status, update } = useSession();
  const t = useTranslations('profile');
  const [activeTab, setActiveTab] = useState<'personal' | 'medical' | 'privacy' | 'records'>('personal');
  const [isEditing, setIsEditing] = useState(false);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [healthRecords, setHealthRecords] = useState<HealthRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Load user profile
  useEffect(() => {
    if (session?.user) {
      loadProfile();
      loadHealthRecords();
    }
  }, [session]);

  const loadProfile = async () => {
    setLoading(true);
    try {
      // In real app, fetch from API
      // For now, use mock data based on session
      const mockProfile: UserProfile = {
        id: session?.user?.id || '',
        name: session?.user?.name || '',
        email: session?.user?.email || '',
        phone: '+1234567890',
        dateOfBirth: '1990-01-01',
        address: '123 Health St, Medical City, MC 12345',
        emergencyContact: {
          name: 'Jane Doe',
          phone: '+1987654321',
          relationship: 'Sister',
        },
        medicalInfo: {
          allergies: ['Penicillin', 'Nuts'],
          medications: ['Vitamin D3', 'Multivitamin'],
          conditions: ['Hypertension'],
          bloodType: 'O+',
        },
        preferences: {
          language: 'en',
          notifications: {
            email: true,
            sms: true,
            emergency: true,
          },
          privacy: {
            shareData: false,
            analyticsOptIn: true,
          },
        },
      };
      setProfile(mockProfile);
    } catch (error) {
      setError(t('errors.loadProfile'));
    } finally {
      setLoading(false);
    }
  };

  const loadHealthRecords = async () => {
    try {
      // Mock health records
      const mockRecords: HealthRecord[] = [
        {
          id: '1',
          type: 'symptom-check',
          date: '2024-01-15',
          title: 'Fever and Cough Assessment',
          description: 'AI assessment indicated possible viral infection. Recommended rest and monitoring.',
          status: 'completed',
        },
        {
          id: '2',
          type: 'appointment',
          date: '2024-01-10',
          title: 'Telemedicine Consultation',
          description: 'Video consultation with Dr. Sarah Johnson regarding persistent headaches.',
          status: 'completed',
          doctor: 'Dr. Sarah Johnson',
        },
        {
          id: '3',
          type: 'emergency',
          date: '2024-01-05',
          title: 'Emergency Alert Triggered',
          description: 'High-risk symptoms detected. Emergency services contacted.',
          status: 'completed',
        },
        {
          id: '4',
          type: 'appointment',
          date: '2024-01-20',
          title: 'Follow-up Consultation',
          description: 'Scheduled follow-up with Dr. Miguel Rodriguez.',
          status: 'pending',
          doctor: 'Dr. Miguel Rodriguez',
        },
      ];
      setHealthRecords(mockRecords);
    } catch (error) {
      console.error('Error loading health records:', error);
    }
  };

  const handleSaveProfile = async () => {
    if (!profile) return;

    setSaving(true);
    setError(null);
    setSuccess(null);

    try {
      // In real app, make API call to update profile
      await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate API call
      
      // Update session if name or email changed
      if (profile.name !== session?.user?.name || profile.email !== session?.user?.email) {
        await update({
          name: profile.name,
          email: profile.email,
        });
      }

      setSuccess(t('success.profileUpdated'));
      setIsEditing(false);
    } catch (error) {
      setError(t('errors.saveProfile'));
    } finally {
      setSaving(false);
    }
  };

  const handleExportData = async () => {
    try {
      // In real app, call API to generate data export
      const dataToExport = {
        profile,
        healthRecords,
        exportDate: new Date().toISOString(),
      };
      
      const blob = new Blob([JSON.stringify(dataToExport, null, 2)], {
        type: 'application/json',
      });
      
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `health-data-export-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      setSuccess(t('success.dataExported'));
    } catch (error) {
      setError(t('errors.exportData'));
    }
  };

  const handleDeleteAccount = async () => {
    if (!confirm(t('confirmations.deleteAccount'))) return;

    try {
      // In real app, call API to delete account
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Sign out and redirect
      window.location.href = '/auth/signin';
    } catch (error) {
      setError(t('errors.deleteAccount'));
    }
  };

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-gray-600">{t('loading')}</p>
        </div>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-center">{t('auth.required')}</CardTitle>
            <CardDescription className="text-center">
              {t('auth.description')}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button className="w-full" onClick={() => window.location.href = '/auth/signin'}>
              {t('auth.signIn')}
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-600">{t('errors.noProfile')}</p>
      </div>
    );
  }

  const getRecordTypeIcon = (type: string) => {
    switch (type) {
      case 'symptom-check':
        return Heart;
      case 'appointment':
        return Calendar;
      case 'emergency':
        return AlertCircle;
      case 'medication':
        return FileText;
      default:
        return FileText;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">{t('title')}</h1>
              <p className="mt-2 text-gray-600">{t('subtitle')}</p>
            </div>
            <div className="mt-4 sm:mt-0 flex space-x-3">
              {!isEditing ? (
                <Button onClick={() => setIsEditing(true)} variant="outline">
                  <Edit className="w-4 h-4 mr-2" />
                  {t('actions.edit')}
                </Button>
              ) : (
                <div className="flex space-x-2">
                  <Button onClick={handleSaveProfile} disabled={saving}>
                    <Save className="w-4 h-4 mr-2" />
                    {saving ? t('actions.saving') : t('actions.save')}
                  </Button>
                  <Button
                    onClick={() => {
                      setIsEditing(false);
                      loadProfile(); // Reset changes
                    }}
                    variant="outline"
                  >
                    <X className="w-4 h-4 mr-2" />
                    {t('actions.cancel')}
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Alerts */}
        {error && (
          <Alert className="mb-6 border-red-200 bg-red-50">
            <AlertCircle className="h-4 w-4 text-red-600" />
            <AlertDescription className="text-red-800">{error}</AlertDescription>
          </Alert>
        )}

        {success && (
          <Alert className="mb-6 border-green-200 bg-green-50">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-800">{success}</AlertDescription>
          </Alert>
        )}

        {/* Tab Navigation */}
        <div className="mb-8">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8">
              {[
                { id: 'personal', label: t('tabs.personal'), icon: User },
                { id: 'medical', label: t('tabs.medical'), icon: Heart },
                { id: 'privacy', label: t('tabs.privacy'), icon: Shield },
                { id: 'records', label: t('tabs.records'), icon: FileText },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`py-2 px-1 border-b-2 font-medium text-sm flex items-center space-x-2 ${
                    activeTab === tab.id
                      ? 'border-primary text-primary'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <tab.icon className="w-4 h-4" />
                  <span>{tab.label}</span>
                </button>
              ))}
            </nav>
          </div>
        </div>

        {/* Tab Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2">
            {/* Personal Information */}
            {activeTab === 'personal' && (
              <Card>
                <CardHeader>
                  <CardTitle>{t('personal.title')}</CardTitle>
                  <CardDescription>{t('personal.description')}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-2">
                        {t('personal.name')}
                      </label>
                      <Input
                        value={profile.name}
                        onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                        disabled={!isEditing}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2">
                        {t('personal.email')}
                      </label>
                      <Input
                        type="email"
                        value={profile.email}
                        onChange={(e) => setProfile({ ...profile, email: e.target.value })}
                        disabled={!isEditing}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2">
                        {t('personal.phone')}
                      </label>
                      <Input
                        type="tel"
                        value={profile.phone || ''}
                        onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                        disabled={!isEditing}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2">
                        {t('personal.dateOfBirth')}
                      </label>
                      <Input
                        type="date"
                        value={profile.dateOfBirth || ''}
                        onChange={(e) => setProfile({ ...profile, dateOfBirth: e.target.value })}
                        disabled={!isEditing}
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      {t('personal.address')}
                    </label>
                    <Textarea
                      value={profile.address || ''}
                      onChange={(e) => setProfile({ ...profile, address: e.target.value })}
                      disabled={!isEditing}
                      rows={3}
                    />
                  </div>
                  
                  {/* Emergency Contact */}
                  <div className="border-t pt-6">
                    <h3 className="text-lg font-semibold mb-4">{t('personal.emergencyContact')}</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-sm font-medium mb-2">
                          {t('personal.emergencyName')}
                        </label>
                        <Input
                          value={profile.emergencyContact?.name || ''}
                          onChange={(e) => setProfile({
                            ...profile,
                            emergencyContact: {
                              ...profile.emergencyContact!,
                              name: e.target.value,
                            },
                          })}
                          disabled={!isEditing}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-2">
                          {t('personal.emergencyPhone')}
                        </label>
                        <Input
                          type="tel"
                          value={profile.emergencyContact?.phone || ''}
                          onChange={(e) => setProfile({
                            ...profile,
                            emergencyContact: {
                              ...profile.emergencyContact!,
                              phone: e.target.value,
                            },
                          })}
                          disabled={!isEditing}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-2">
                          {t('personal.relationship')}
                        </label>
                        <Input
                          value={profile.emergencyContact?.relationship || ''}
                          onChange={(e) => setProfile({
                            ...profile,
                            emergencyContact: {
                              ...profile.emergencyContact!,
                              relationship: e.target.value,
                            },
                          })}
                          disabled={!isEditing}
                        />
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Medical Information */}
            {activeTab === 'medical' && (
              <Card>
                <CardHeader>
                  <CardTitle>{t('medical.title')}</CardTitle>
                  <CardDescription>{t('medical.description')}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      {t('medical.bloodType')}
                    </label>
                    <select
                      value={profile.medicalInfo?.bloodType || ''}
                      onChange={(e) => setProfile({
                        ...profile,
                        medicalInfo: {
                          ...profile.medicalInfo!,
                          bloodType: e.target.value,
                        },
                      })}
                      disabled={!isEditing}
                      className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary focus:border-transparent disabled:bg-gray-50"
                    >
                      <option value="">{t('medical.selectBloodType')}</option>
                      <option value="A+">A+</option>
                      <option value="A-">A-</option>
                      <option value="B+">B+</option>
                      <option value="B-">B-</option>
                      <option value="AB+">AB+</option>
                      <option value="AB-">AB-</option>
                      <option value="O+">O+</option>
                      <option value="O-">O-</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">
                      {t('medical.allergies')}
                    </label>
                    <div className="flex flex-wrap gap-2 mb-2">
                      {profile.medicalInfo?.allergies?.map((allergy, index) => (
                        <Badge key={index} variant="destructive">
                          {allergy}
                          {isEditing && (
                            <button
                              onClick={() => {
                                const newAllergies = profile.medicalInfo!.allergies.filter((_, i) => i !== index);
                                setProfile({
                                  ...profile,
                                  medicalInfo: {
                                    ...profile.medicalInfo!,
                                    allergies: newAllergies,
                                  },
                                });
                              }}
                              className="ml-2 text-xs"
                            >
                              ×
                            </button>
                          )}
                        </Badge>
                      ))}
                    </div>
                    {isEditing && (
                      <Input
                        placeholder={t('medical.addAllergy')}
                        onKeyPress={(e) => {
                          if (e.key === 'Enter') {
                            const newAllergy = e.currentTarget.value.trim();
                            if (newAllergy && !profile.medicalInfo!.allergies.includes(newAllergy)) {
                              setProfile({
                                ...profile,
                                medicalInfo: {
                                  ...profile.medicalInfo!,
                                  allergies: [...profile.medicalInfo!.allergies, newAllergy],
                                },
                              });
                              e.currentTarget.value = '';
                            }
                          }
                        }}
                      />
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">
                      {t('medical.medications')}
                    </label>
                    <div className="flex flex-wrap gap-2 mb-2">
                      {profile.medicalInfo?.medications?.map((medication, index) => (
                        <Badge key={index} variant="secondary">
                          {medication}
                          {isEditing && (
                            <button
                              onClick={() => {
                                const newMedications = profile.medicalInfo!.medications.filter((_, i) => i !== index);
                                setProfile({
                                  ...profile,
                                  medicalInfo: {
                                    ...profile.medicalInfo!,
                                    medications: newMedications,
                                  },
                                });
                              }}
                              className="ml-2 text-xs"
                            >
                              ×
                            </button>
                          )}
                        </Badge>
                      ))}
                    </div>
                    {isEditing && (
                      <Input
                        placeholder={t('medical.addMedication')}
                        onKeyPress={(e) => {
                          if (e.key === 'Enter') {
                            const newMedication = e.currentTarget.value.trim();
                            if (newMedication && !profile.medicalInfo!.medications.includes(newMedication)) {
                              setProfile({
                                ...profile,
                                medicalInfo: {
                                  ...profile.medicalInfo!,
                                  medications: [...profile.medicalInfo!.medications, newMedication],
                                },
                              });
                              e.currentTarget.value = '';
                            }
                          }
                        }}
                      />
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">
                      {t('medical.conditions')}
                    </label>
                    <div className="flex flex-wrap gap-2 mb-2">
                      {profile.medicalInfo?.conditions?.map((condition, index) => (
                        <Badge key={index} variant="outline">
                          {condition}
                          {isEditing && (
                            <button
                              onClick={() => {
                                const newConditions = profile.medicalInfo!.conditions.filter((_, i) => i !== index);
                                setProfile({
                                  ...profile,
                                  medicalInfo: {
                                    ...profile.medicalInfo!,
                                    conditions: newConditions,
                                  },
                                });
                              }}
                              className="ml-2 text-xs"
                            >
                              ×
                            </button>
                          )}
                        </Badge>
                      ))}
                    </div>
                    {isEditing && (
                      <Input
                        placeholder={t('medical.addCondition')}
                        onKeyPress={(e) => {
                          if (e.key === 'Enter') {
                            const newCondition = e.currentTarget.value.trim();
                            if (newCondition && !profile.medicalInfo!.conditions.includes(newCondition)) {
                              setProfile({
                                ...profile,
                                medicalInfo: {
                                  ...profile.medicalInfo!,
                                  conditions: [...profile.medicalInfo!.conditions, newCondition],
                                },
                              });
                              e.currentTarget.value = '';
                            }
                          }
                        }}
                      />
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Privacy & Preferences */}
            {activeTab === 'privacy' && (
              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>{t('privacy.notifications.title')}</CardTitle>
                    <CardDescription>{t('privacy.notifications.description')}</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {[
                      { key: 'email', icon: Mail, label: t('privacy.notifications.email') },
                      { key: 'sms', icon: Phone, label: t('privacy.notifications.sms') },
                      { key: 'emergency', icon: AlertCircle, label: t('privacy.notifications.emergency') },
                    ].map((notification) => (
                      <div key={notification.key} className="flex items-center space-x-3">
                        <notification.icon className="w-5 h-5 text-gray-500" />
                        <span className="flex-1">{notification.label}</span>
                        <input
                          type="checkbox"
                          checked={profile.preferences.notifications[notification.key as keyof typeof profile.preferences.notifications]}
                          onChange={(e) => setProfile({
                            ...profile,
                            preferences: {
                              ...profile.preferences,
                              notifications: {
                                ...profile.preferences.notifications,
                                [notification.key]: e.target.checked,
                              },
                            },
                          })}
                          disabled={!isEditing}
                          className="h-4 w-4 text-primary border-gray-300 rounded focus:ring-primary"
                        />
                      </div>
                    ))}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>{t('privacy.data.title')}</CardTitle>
                    <CardDescription>{t('privacy.data.description')}</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center space-x-3">
                      <Globe className="w-5 h-5 text-gray-500" />
                      <span className="flex-1">{t('privacy.data.shareData')}</span>
                      <input
                        type="checkbox"
                        checked={profile.preferences.privacy.shareData}
                        onChange={(e) => setProfile({
                          ...profile,
                          preferences: {
                            ...profile.preferences,
                            privacy: {
                              ...profile.preferences.privacy,
                              shareData: e.target.checked,
                            },
                          },
                        })}
                        disabled={!isEditing}
                        className="h-4 w-4 text-primary border-gray-300 rounded focus:ring-primary"
                      />
                    </div>
                    <div className="flex items-center space-x-3">
                      <FileText className="w-5 h-5 text-gray-500" />
                      <span className="flex-1">{t('privacy.data.analyticsOptIn')}</span>
                      <input
                        type="checkbox"
                        checked={profile.preferences.privacy.analyticsOptIn}
                        onChange={(e) => setProfile({
                          ...profile,
                          preferences: {
                            ...profile.preferences,
                            privacy: {
                              ...profile.preferences.privacy,
                              analyticsOptIn: e.target.checked,
                            },
                          },
                        })}
                        disabled={!isEditing}
                        className="h-4 w-4 text-primary border-gray-300 rounded focus:ring-primary"
                      />
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>{t('privacy.language.title')}</CardTitle>
                    <CardDescription>{t('privacy.language.description')}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <select
                      value={profile.preferences.language}
                      onChange={(e) => setProfile({
                        ...profile,
                        preferences: {
                          ...profile.preferences,
                          language: e.target.value,
                        },
                      })}
                      disabled={!isEditing}
                      className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary focus:border-transparent disabled:bg-gray-50"
                    >
                      <option value="en">English</option>
                      <option value="es">Español</option>
                      <option value="fr">Français</option>
                      <option value="pt">Português</option>
                      <option value="hi">हिन्दी</option>
                      <option value="ar">العربية</option>
                      <option value="sw">Kiswahili</option>
                    </select>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Health Records */}
            {activeTab === 'records' && (
              <Card>
                <CardHeader>
                  <CardTitle>{t('records.title')}</CardTitle>
                  <CardDescription>{t('records.description')}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {healthRecords.map((record) => {
                      const IconComponent = getRecordTypeIcon(record.type);
                      return (
                        <div
                          key={record.id}
                          className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                        >
                          <div className="flex items-start space-x-4">
                            <div className="p-2 bg-primary/10 rounded-lg">
                              <IconComponent className="w-5 h-5 text-primary" />
                            </div>
                            <div className="flex-1">
                              <div className="flex items-center justify-between mb-2">
                                <h3 className="font-semibold text-gray-900">{record.title}</h3>
                                <div className="flex items-center space-x-2">
                                  <Badge className={getStatusColor(record.status)}>
                                    {t(`records.status.${record.status}`)}
                                  </Badge>
                                  <span className="text-sm text-gray-500">
                                    {new Date(record.date).toLocaleDateString()}
                                  </span>
                                </div>
                              </div>
                              <p className="text-gray-600 mb-2">{record.description}</p>
                              {record.doctor && (
                                <p className="text-sm text-gray-500">
                                  {t('records.doctor')}: {record.doctor}
                                </p>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Profile Summary */}
            <Card>
              <CardContent className="p-6">
                <div className="text-center">
                  <div className="w-20 h-20 bg-primary rounded-full flex items-center justify-center mx-auto mb-4">
                    <User className="w-10 h-10 text-white" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900">{profile.name}</h3>
                  <p className="text-gray-600">{profile.email}</p>
                  <Badge variant="secondary" className="mt-2">
                    {t('badges.member')}
                  </Badge>
                </div>
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle>{t('quickActions.title')}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button variant="outline" className="w-full justify-start" onClick={handleExportData}>
                  <Download className="w-4 h-4 mr-2" />
                  {t('quickActions.exportData')}
                </Button>
                <Button
                  variant="outline"
                  className="w-full justify-start text-red-600 hover:text-red-700"
                  onClick={handleDeleteAccount}
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  {t('quickActions.deleteAccount')}
                </Button>
              </CardContent>
            </Card>

            {/* Health Summary */}
            <Card>
              <CardHeader>
                <CardTitle>{t('healthSummary.title')}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">{t('healthSummary.totalRecords')}</span>
                    <span className="font-semibold">{healthRecords.length}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">{t('healthSummary.lastCheckup')}</span>
                    <span className="font-semibold">
                      {healthRecords[0] ? new Date(healthRecords[0].date).toLocaleDateString() : 'N/A'}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">{t('healthSummary.emergencyContact')}</span>
                    <span className="font-semibold">
                      {profile.emergencyContact?.name ? '✓' : '×'}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
