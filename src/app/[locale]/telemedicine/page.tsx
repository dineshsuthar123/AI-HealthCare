'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useTranslations } from 'next-intl';
import { Calendar, Clock, Video, Phone, MessageSquare, User, MapPin, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface Doctor {
  id: string;
  name: string;
  specialty: string;
  languages: string[];
  rating: number;
  availableSlots: string[];
  consultationFee: number;
  avatar?: string;
}

interface Appointment {
  id: string;
  doctorId: string;
  doctorName: string;
  specialty: string;
  appointmentDate: string;
  appointmentTime: string;
  status: 'scheduled' | 'completed' | 'cancelled' | 'in-progress';
  type: 'video' | 'phone' | 'chat';
  notes?: string;
}

export default function TelemedicinePage() {
  const { data: session, status } = useSession();
  const t = useTranslations('telemedicine');
  const [activeTab, setActiveTab] = useState<'book' | 'appointments'>('book');
  const [selectedDoctor, setSelectedDoctor] = useState<Doctor | null>(null);
  const [appointmentForm, setAppointmentForm] = useState({
    type: 'video' as 'video' | 'phone' | 'chat',
    date: '',
    time: '',
    symptoms: '',
    urgency: 'normal' as 'normal' | 'urgent' | 'emergency',
  });
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Mock doctors data (in real app, fetch from API)
  useEffect(() => {
    const mockDoctors: Doctor[] = [
      {
        id: '1',
        name: 'Dr. Sarah Johnson',
        specialty: 'Family Medicine',
        languages: ['English', 'Spanish'],
        rating: 4.8,
        availableSlots: ['09:00', '10:30', '14:00', '16:30'],
        consultationFee: 75,
      },
      {
        id: '2',
        name: 'Dr. Miguel Rodriguez',
        specialty: 'Internal Medicine',
        languages: ['English', 'Spanish', 'Portuguese'],
        rating: 4.9,
        availableSlots: ['08:00', '11:00', '15:00', '17:00'],
        consultationFee: 80,
      },
      {
        id: '3',
        name: 'Dr. Priya Patel',
        specialty: 'Pediatrics',
        languages: ['English', 'Hindi', 'Gujarati'],
        rating: 4.7,
        availableSlots: ['09:30', '13:00', '15:30'],
        consultationFee: 70,
      },
    ];
    setDoctors(mockDoctors);
  }, []);

  // Fetch user appointments
  useEffect(() => {
    if (session?.user?.id) {
      fetchAppointments();
    }
  }, [session]);

  const fetchAppointments = async () => {
    try {
      const response = await fetch('/api/telemedicine/appointments');
      if (response.ok) {
        const data = await response.json();
        setAppointments(data.appointments);
      }
    } catch (error) {
      console.error('Error fetching appointments:', error);
    }
  };

  const handleBookAppointment = async () => {
    if (!selectedDoctor || !appointmentForm.date || !appointmentForm.time) {
      setError(t('booking.validation'));
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/telemedicine/appointments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          doctorId: selectedDoctor.id,
          doctorName: selectedDoctor.name,
          specialty: selectedDoctor.specialty,
          appointmentDate: appointmentForm.date,
          appointmentTime: appointmentForm.time,
          type: appointmentForm.type,
          symptoms: appointmentForm.symptoms,
          urgency: appointmentForm.urgency,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setAppointments([data.appointment, ...appointments]);
        setActiveTab('appointments');
        setAppointmentForm({
          type: 'video',
          date: '',
          time: '',
          symptoms: '',
          urgency: 'normal',
        });
        setSelectedDoctor(null);
      } else {
        const error = await response.json();
        setError(error.message || t('booking.error'));
      }
    } catch (error) {
      setError(t('booking.error'));
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'scheduled':
        return 'bg-blue-100 text-blue-800';
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      case 'in-progress':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (status === 'loading') {
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

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">{t('title')}</h1>
          <p className="mt-2 text-gray-600">{t('subtitle')}</p>
        </div>

        {/* Tab Navigation */}
        <div className="mb-8">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8">
              <button
                onClick={() => setActiveTab('book')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'book'
                    ? 'border-primary text-primary'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                {t('tabs.book')}
              </button>
              <button
                onClick={() => setActiveTab('appointments')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'appointments'
                    ? 'border-primary text-primary'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                {t('tabs.appointments')}
              </button>
            </nav>
          </div>
        </div>

        {error && (
          <Alert className="mb-6 border-red-200 bg-red-50">
            <AlertCircle className="h-4 w-4 text-red-600" />
            <AlertDescription className="text-red-800">{error}</AlertDescription>
          </Alert>
        )}

        {/* Book Appointment Tab */}
        {activeTab === 'book' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Doctor Selection */}
            <div className="lg:col-span-2">
              <h2 className="text-xl font-semibold mb-4">{t('booking.selectDoctor')}</h2>
              <div className="grid gap-4">
                {doctors.map((doctor) => (
                  <Card
                    key={doctor.id}
                    className={`cursor-pointer transition-all hover:shadow-md ${
                      selectedDoctor?.id === doctor.id ? 'ring-2 ring-primary' : ''
                    }`}
                    onClick={() => setSelectedDoctor(doctor)}
                  >
                    <CardContent className="p-6">
                      <div className="flex items-center space-x-4">
                        <div className="w-16 h-16 bg-primary rounded-full flex items-center justify-center">
                          <User className="w-8 h-8 text-white" />
                        </div>
                        <div className="flex-1">
                          <h3 className="text-lg font-semibold">{doctor.name}</h3>
                          <p className="text-gray-600">{doctor.specialty}</p>
                          <div className="flex items-center space-x-4 mt-2">
                            <div className="flex items-center">
                              <span className="text-yellow-400">★</span>
                              <span className="ml-1 text-sm">{doctor.rating}</span>
                            </div>
                            <span className="text-sm text-gray-500">
                              ${doctor.consultationFee}
                            </span>
                          </div>
                          <div className="flex flex-wrap gap-1 mt-2">
                            {doctor.languages.map((lang) => (
                              <Badge key={lang} variant="secondary" className="text-xs">
                                {lang}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>

            {/* Booking Form */}
            <div>
              <Card>
                <CardHeader>
                  <CardTitle>{t('booking.details')}</CardTitle>
                  <CardDescription>
                    {selectedDoctor ? t('booking.selectedDoctor', { name: selectedDoctor.name }) : t('booking.selectFirst')}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Consultation Type */}
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      {t('booking.type')}
                    </label>
                    <div className="grid grid-cols-3 gap-2">
                      {[
                        { value: 'video', icon: Video, label: t('booking.types.video') },
                        { value: 'phone', icon: Phone, label: t('booking.types.phone') },
                        { value: 'chat', icon: MessageSquare, label: t('booking.types.chat') },
                      ].map(({ value, icon: Icon, label }) => (
                        <button
                          key={value}
                          type="button"
                          onClick={() => setAppointmentForm({ ...appointmentForm, type: value as any })}
                          className={`p-3 border rounded-lg flex flex-col items-center space-y-1 transition-colors ${
                            appointmentForm.type === value
                              ? 'border-primary bg-primary/5 text-primary'
                              : 'border-gray-200 hover:border-gray-300'
                          }`}
                        >
                          <Icon className="w-5 h-5" />
                          <span className="text-xs">{label}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Date Selection */}
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      {t('booking.date')}
                    </label>
                    <Input
                      type="date"
                      value={appointmentForm.date}
                      onChange={(e) => setAppointmentForm({ ...appointmentForm, date: e.target.value })}
                      min={new Date().toISOString().split('T')[0]}
                    />
                  </div>

                  {/* Time Selection */}
                  {selectedDoctor && (
                    <div>
                      <label className="block text-sm font-medium mb-2">
                        {t('booking.time')}
                      </label>
                      <div className="grid grid-cols-2 gap-2">
                        {selectedDoctor.availableSlots.map((time) => (
                          <button
                            key={time}
                            type="button"
                            onClick={() => setAppointmentForm({ ...appointmentForm, time })}
                            className={`p-2 border rounded text-sm transition-colors ${
                              appointmentForm.time === time
                                ? 'border-primary bg-primary text-white'
                                : 'border-gray-200 hover:border-gray-300'
                            }`}
                          >
                            {time}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Symptoms */}
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      {t('booking.symptoms')}
                    </label>
                    <Textarea
                      placeholder={t('booking.symptomsPlaceholder')}
                      value={appointmentForm.symptoms}
                      onChange={(e) => setAppointmentForm({ ...appointmentForm, symptoms: e.target.value })}
                      rows={3}
                    />
                  </div>

                  {/* Urgency */}
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      {t('booking.urgency')}
                    </label>
                    <select
                      value={appointmentForm.urgency}
                      onChange={(e) => setAppointmentForm({ ...appointmentForm, urgency: e.target.value as any })}
                      className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary focus:border-transparent"
                    >
                      <option value="normal">{t('booking.urgencyLevels.normal')}</option>
                      <option value="urgent">{t('booking.urgencyLevels.urgent')}</option>
                      <option value="emergency">{t('booking.urgencyLevels.emergency')}</option>
                    </select>
                  </div>

                  <Button
                    onClick={handleBookAppointment}
                    disabled={loading || !selectedDoctor}
                    className="w-full"
                  >
                    {loading ? t('booking.booking') : t('booking.book')}
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        )}

        {/* Appointments Tab */}
        {activeTab === 'appointments' && (
          <div>
            <h2 className="text-xl font-semibold mb-4">{t('appointments.title')}</h2>
            {appointments.length === 0 ? (
              <Card>
                <CardContent className="p-8 text-center">
                  <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    {t('appointments.noAppointments')}
                  </h3>
                  <p className="text-gray-600 mb-4">
                    {t('appointments.bookFirst')}
                  </p>
                  <Button onClick={() => setActiveTab('book')}>
                    {t('appointments.bookNow')}
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4">
                {appointments.map((appointment) => (
                  <Card key={appointment.id}>
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                          <div className="w-12 h-12 bg-primary rounded-full flex items-center justify-center">
                            <User className="w-6 h-6 text-white" />
                          </div>
                          <div>
                            <h3 className="text-lg font-semibold">{appointment.doctorName}</h3>
                            <p className="text-gray-600">{appointment.specialty}</p>
                            <div className="flex items-center space-x-4 mt-1">
                              <div className="flex items-center text-sm text-gray-500">
                                <Calendar className="w-4 h-4 mr-1" />
                                {new Date(appointment.appointmentDate).toLocaleDateString()}
                              </div>
                              <div className="flex items-center text-sm text-gray-500">
                                <Clock className="w-4 h-4 mr-1" />
                                {appointment.appointmentTime}
                              </div>
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <Badge className={getStatusColor(appointment.status)}>
                            {t(`appointments.status.${appointment.status}`)}
                          </Badge>
                          <div className="flex items-center mt-2">
                            {appointment.type === 'video' && <Video className="w-4 h-4 mr-1" />}
                            {appointment.type === 'phone' && <Phone className="w-4 h-4 mr-1" />}
                            {appointment.type === 'chat' && <MessageSquare className="w-4 h-4 mr-1" />}
                            <span className="text-sm text-gray-500">
                              {t(`booking.types.${appointment.type}`)}
                            </span>
                          </div>
                        </div>
                      </div>
                      {appointment.notes && (
                        <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                          <p className="text-sm text-gray-700">{appointment.notes}</p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
