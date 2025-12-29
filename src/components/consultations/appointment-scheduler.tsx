'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { FadeIn, ScaleIn, SlideInFromBottom, StaggerContainer, StaggerItem } from '@/components/animations/motion-effects';

interface Provider {
    _id: string;
    name: string;
    specialty: string;
    profileImage?: string;
    availability?: AvailabilitySlot[];
    rating?: number;
    consultationFee?: number;
}

interface AvailabilitySlot {
    date: string;
    slots: TimeSlot[];
}

interface TimeSlot {
    time: string;
    available: boolean;
}

interface AppointmentSchedulerProps {
    onScheduled?: (appointment: ScheduledAppointment) => void;
    providerId?: string;
    variant?: 'standalone' | 'embedded';
}

interface ScheduledAppointment {
    providerId: string;
    providerName: string;
    date: string;
    time: string;
    type: 'video' | 'audio' | 'message';
    reason: string;
    duration: number;
}

export const AppointmentScheduler = ({
    onScheduled,
    providerId: initialProviderId,
    variant = 'standalone'
}: AppointmentSchedulerProps) => {
    const [step, setStep] = useState(1);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);

    // Provider selection
    const [providers, setProviders] = useState<Provider[]>([]);
    const [selectedProvider, setSelectedProvider] = useState<Provider | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [specialtyFilter, setSpecialtyFilter] = useState<string>('all');

    // Date/Time selection
    const [selectedDate, setSelectedDate] = useState<string>('');
    const [selectedTime, setSelectedTime] = useState<string>('');
    const [availableSlots, setAvailableSlots] = useState<TimeSlot[]>([]);

    // Appointment details
    const [consultationType, setConsultationType] = useState<'video' | 'audio' | 'message'>('video');
    const [reason, setReason] = useState('');
    const [symptoms, setSymptoms] = useState<string[]>([]);
    const [duration, setDuration] = useState(30);
    const [notes, setNotes] = useState('');

    // Fetch providers
    useEffect(() => {
        const fetchProviders = async () => {
            try {
                const response = await fetch('/api/providers/available');
                if (response.ok) {
                    const data = await response.json();
                    setProviders(data);
                    
                    if (initialProviderId) {
                        const provider = data.find((p: Provider) => p._id === initialProviderId);
                        if (provider) {
                            setSelectedProvider(provider);
                            setStep(2);
                        }
                    }
                }
            } catch (err) {
                console.error('Error fetching providers:', err);
            }
        };

        fetchProviders();
    }, [initialProviderId]);

    // Generate available dates for next 14 days
    const getAvailableDates = () => {
        const dates = [];
        const today = new Date();
        for (let i = 1; i <= 14; i++) {
            const date = new Date(today);
            date.setDate(today.getDate() + i);
            if (date.getDay() !== 0) { // Exclude Sundays
                dates.push({
                    date: date.toISOString().split('T')[0],
                    dayName: date.toLocaleDateString('en-US', { weekday: 'short' }),
                    dayNumber: date.getDate(),
                    month: date.toLocaleDateString('en-US', { month: 'short' })
                });
            }
        }
        return dates;
    };

    // Generate time slots for selected date
    useEffect(() => {
        if (selectedDate) {
            const slots: TimeSlot[] = [];
            const startHour = 9; // 9 AM
            const endHour = 17; // 5 PM
            
            for (let hour = startHour; hour < endHour; hour++) {
                for (let minute = 0; minute < 60; minute += 30) {
                    const time = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
                    // Simulate availability (in real app, fetch from backend)
                    const available = Math.random() > 0.3;
                    slots.push({ time, available });
                }
            }
            setAvailableSlots(slots);
        }
    }, [selectedDate]);

    const filteredProviders = providers.filter(provider => {
        const matchesSearch = provider.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            provider.specialty.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesSpecialty = specialtyFilter === 'all' || provider.specialty === specialtyFilter;
        return matchesSearch && matchesSpecialty;
    });

    const specialties = [...new Set(providers.map(p => p.specialty))];

    const handleSchedule = async () => {
        if (!selectedProvider || !selectedDate || !selectedTime || !reason) {
            setError('Please fill in all required fields');
            return;
        }

        setLoading(true);
        setError(null);

        try {
            const response = await fetch('/api/consultations', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({
                    providerId: selectedProvider._id,
                    date: selectedDate,
                    time: selectedTime,
                    type: consultationType,
                    reason,
                    symptoms,
                    duration,
                    notes
                })
            });

            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.error || 'Failed to schedule appointment');
            }

            setSuccess(true);
            onScheduled?.({
                providerId: selectedProvider._id,
                providerName: selectedProvider.name,
                date: selectedDate,
                time: selectedTime,
                type: consultationType,
                reason,
                duration
            });
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to schedule appointment');
        } finally {
            setLoading(false);
        }
    };

    if (success) {
        return (
            <div className="min-h-[500px] flex items-center justify-center">
                <ScaleIn>
                    <div className="text-center max-w-md p-8 rounded-3xl bg-gradient-to-br from-green-500/10 to-emerald-500/10 border border-green-500/20">
                        <div className="w-20 h-20 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full mx-auto mb-6 flex items-center justify-center">
                            <svg className="w-10 h-10 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                        </div>
                        <h2 className="text-2xl font-bold text-white mb-2">Appointment Scheduled!</h2>
                        <p className="text-slate-400 mb-4">
                            Your {consultationType} consultation with {selectedProvider?.name} is confirmed for{' '}
                            {new Date(selectedDate).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })} at {selectedTime}
                        </p>
                        <div className="space-y-2 text-sm text-slate-500 mb-6">
                            <p>📧 Confirmation email sent</p>
                            <p>📱 Reminder will be sent 30 minutes before</p>
                        </div>
                        <Button 
                            onClick={() => window.location.href = '/consultations'}
                            className="bg-gradient-to-r from-blue-500 to-purple-500"
                        >
                            View My Appointments
                        </Button>
                    </div>
                </ScaleIn>
            </div>
        );
    }

    const containerClass = variant === 'standalone' 
        ? 'min-h-screen bg-[#030613] text-white p-6'
        : 'text-white';

    return (
        <div className={containerClass}>
            <div className="max-w-6xl mx-auto">
                {/* Progress Steps */}
                <FadeIn>
                    <div className="flex items-center justify-center mb-8">
                        {[
                            { num: 1, label: 'Select Doctor' },
                            { num: 2, label: 'Choose Time' },
                            { num: 3, label: 'Details' },
                            { num: 4, label: 'Confirm' }
                        ].map((s, i) => (
                            <div key={s.num} className="flex items-center">
                                <div className={`flex flex-col items-center ${step >= s.num ? 'text-blue-400' : 'text-slate-600'}`}>
                                    <div className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold ${
                                        step > s.num ? 'bg-green-500 text-white' :
                                        step === s.num ? 'bg-blue-500 text-white' :
                                        'bg-slate-800 text-slate-500'
                                    }`}>
                                        {step > s.num ? '✓' : s.num}
                                    </div>
                                    <span className="text-xs mt-1">{s.label}</span>
                                </div>
                                {i < 3 && (
                                    <div className={`w-16 h-1 mx-2 rounded ${
                                        step > s.num ? 'bg-green-500' : 'bg-slate-800'
                                    }`} />
                                )}
                            </div>
                        ))}
                    </div>
                </FadeIn>

                {error && (
                    <div className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400">
                        ⚠️ {error}
                    </div>
                )}

                {/* Step 1: Select Provider */}
                {step === 1 && (
                    <FadeIn>
                        <div className="space-y-6">
                            <div className="text-center mb-8">
                                <h2 className="text-3xl font-bold">Choose Your Doctor</h2>
                                <p className="text-slate-400 mt-2">Select a healthcare provider for your consultation</p>
                            </div>

                            <div className="flex flex-wrap gap-4 mb-6">
                                <Input
                                    placeholder="Search by name or specialty..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="flex-1 min-w-[200px] bg-slate-800 border-slate-700 text-white"
                                />
                                <select
                                    value={specialtyFilter}
                                    onChange={(e) => setSpecialtyFilter(e.target.value)}
                                    className="px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white"
                                >
                                    <option value="all">All Specialties</option>
                                    {specialties.map(s => (
                                        <option key={s} value={s}>{s}</option>
                                    ))}
                                </select>
                            </div>

                            <StaggerContainer className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                                {filteredProviders.map((provider) => (
                                    <StaggerItem key={provider._id}>
                                        <div
                                            onClick={() => {
                                                setSelectedProvider(provider);
                                                setStep(2);
                                            }}
                                            className={`p-6 rounded-2xl border cursor-pointer transition-all hover:scale-[1.02] ${
                                                selectedProvider?._id === provider._id
                                                    ? 'border-blue-500 bg-blue-500/10'
                                                    : 'border-slate-700 bg-slate-800/50 hover:border-slate-600'
                                            }`}
                                        >
                                            <div className="flex items-center space-x-4">
                                                <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-2xl">
                                                    {provider.profileImage ? (
                                                        <img src={provider.profileImage} alt={provider.name} className="w-full h-full rounded-full object-cover" />
                                                    ) : (
                                                        provider.name.charAt(0)
                                                    )}
                                                </div>
                                                <div className="flex-1">
                                                    <h3 className="font-semibold text-white">{provider.name}</h3>
                                                    <p className="text-slate-400 text-sm">{provider.specialty}</p>
                                                    {provider.rating && (
                                                        <div className="flex items-center mt-1">
                                                            <span className="text-yellow-500">★</span>
                                                            <span className="text-sm text-slate-400 ml-1">{provider.rating.toFixed(1)}</span>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                            {provider.consultationFee && (
                                                <p className="mt-4 text-right text-emerald-400 font-medium">
                                                    ${provider.consultationFee} / session
                                                </p>
                                            )}
                                        </div>
                                    </StaggerItem>
                                ))}
                            </StaggerContainer>

                            {filteredProviders.length === 0 && (
                                <div className="text-center py-12 text-slate-500">
                                    <p className="text-4xl mb-4">🔍</p>
                                    <p>No providers found matching your criteria</p>
                                </div>
                            )}
                        </div>
                    </FadeIn>
                )}

                {/* Step 2: Select Date & Time */}
                {step === 2 && (
                    <FadeIn>
                        <div className="space-y-6">
                            <div className="flex items-center justify-between mb-8">
                                <button onClick={() => setStep(1)} className="text-slate-400 hover:text-white">
                                    ← Back
                                </button>
                                <h2 className="text-2xl font-bold">Select Date & Time</h2>
                                <div />
                            </div>

                            {selectedProvider && (
                                <div className="flex items-center space-x-4 p-4 bg-slate-800/50 rounded-xl mb-6">
                                    <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
                                        {selectedProvider.name.charAt(0)}
                                    </div>
                                    <div>
                                        <p className="font-semibold">{selectedProvider.name}</p>
                                        <p className="text-slate-400 text-sm">{selectedProvider.specialty}</p>
                                    </div>
                                </div>
                            )}

                            <div className="grid gap-6 lg:grid-cols-2">
                                {/* Date Selection */}
                                <div>
                                    <h3 className="font-semibold mb-4">Select Date</h3>
                                    <div className="grid grid-cols-4 gap-2">
                                        {getAvailableDates().map((d) => (
                                            <button
                                                key={d.date}
                                                onClick={() => setSelectedDate(d.date)}
                                                className={`p-3 rounded-xl text-center transition-all ${
                                                    selectedDate === d.date
                                                        ? 'bg-blue-500 text-white'
                                                        : 'bg-slate-800 hover:bg-slate-700'
                                                }`}
                                            >
                                                <p className="text-xs text-slate-400">{d.dayName}</p>
                                                <p className="text-xl font-bold">{d.dayNumber}</p>
                                                <p className="text-xs">{d.month}</p>
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Time Selection */}
                                <div>
                                    <h3 className="font-semibold mb-4">Select Time</h3>
                                    {selectedDate ? (
                                        <div className="grid grid-cols-4 gap-2 max-h-80 overflow-y-auto">
                                            {availableSlots.map((slot) => (
                                                <button
                                                    key={slot.time}
                                                    onClick={() => slot.available && setSelectedTime(slot.time)}
                                                    disabled={!slot.available}
                                                    className={`p-3 rounded-xl text-center transition-all ${
                                                        selectedTime === slot.time
                                                            ? 'bg-blue-500 text-white'
                                                            : slot.available
                                                                ? 'bg-slate-800 hover:bg-slate-700'
                                                                : 'bg-slate-900 text-slate-600 cursor-not-allowed line-through'
                                                    }`}
                                                >
                                                    {slot.time}
                                                </button>
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="h-40 flex items-center justify-center text-slate-500">
                                            Please select a date first
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="flex justify-end">
                                <Button
                                    onClick={() => setStep(3)}
                                    disabled={!selectedDate || !selectedTime}
                                    className="bg-gradient-to-r from-blue-500 to-purple-500"
                                >
                                    Continue →
                                </Button>
                            </div>
                        </div>
                    </FadeIn>
                )}

                {/* Step 3: Appointment Details */}
                {step === 3 && (
                    <FadeIn>
                        <div className="space-y-6 max-w-2xl mx-auto">
                            <div className="flex items-center justify-between mb-8">
                                <button onClick={() => setStep(2)} className="text-slate-400 hover:text-white">
                                    ← Back
                                </button>
                                <h2 className="text-2xl font-bold">Appointment Details</h2>
                                <div />
                            </div>

                            <div className="space-y-6">
                                <div>
                                    <label className="block text-sm font-medium mb-2">Consultation Type</label>
                                    <div className="grid grid-cols-3 gap-4">
                                        {[
                                            { type: 'video', icon: '🎥', label: 'Video Call' },
                                            { type: 'audio', icon: '📞', label: 'Voice Call' },
                                            { type: 'message', icon: '💬', label: 'Text Chat' }
                                        ].map(({ type, icon, label }) => (
                                            <button
                                                key={type}
                                                onClick={() => setConsultationType(type as 'video' | 'audio' | 'message')}
                                                className={`p-4 rounded-xl text-center transition-all ${
                                                    consultationType === type
                                                        ? 'bg-blue-500 text-white'
                                                        : 'bg-slate-800 hover:bg-slate-700'
                                                }`}
                                            >
                                                <span className="text-2xl">{icon}</span>
                                                <p className="mt-2 text-sm">{label}</p>
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium mb-2">Reason for Visit *</label>
                                    <textarea
                                        value={reason}
                                        onChange={(e) => setReason(e.target.value)}
                                        placeholder="Describe your symptoms or reason for consultation..."
                                        className="w-full h-32 p-4 bg-slate-800 border border-slate-700 rounded-xl text-white placeholder:text-slate-500 focus:border-blue-500 focus:outline-none"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium mb-2">Common Symptoms</label>
                                    <div className="flex flex-wrap gap-2">
                                        {['Headache', 'Fever', 'Cough', 'Fatigue', 'Pain', 'Dizziness', 'Nausea', 'Anxiety'].map(symptom => (
                                            <button
                                                key={symptom}
                                                onClick={() => setSymptoms(prev => 
                                                    prev.includes(symptom) 
                                                        ? prev.filter(s => s !== symptom) 
                                                        : [...prev, symptom]
                                                )}
                                                className={`px-4 py-2 rounded-full text-sm transition-all ${
                                                    symptoms.includes(symptom)
                                                        ? 'bg-blue-500 text-white'
                                                        : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                                                }`}
                                            >
                                                {symptom}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium mb-2">Duration</label>
                                    <div className="flex space-x-4">
                                        {[15, 30, 45, 60].map(d => (
                                            <button
                                                key={d}
                                                onClick={() => setDuration(d)}
                                                className={`px-6 py-3 rounded-xl transition-all ${
                                                    duration === d
                                                        ? 'bg-blue-500 text-white'
                                                        : 'bg-slate-800 hover:bg-slate-700'
                                                }`}
                                            >
                                                {d} min
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium mb-2">Additional Notes (Optional)</label>
                                    <textarea
                                        value={notes}
                                        onChange={(e) => setNotes(e.target.value)}
                                        placeholder="Any additional information for the doctor..."
                                        className="w-full h-24 p-4 bg-slate-800 border border-slate-700 rounded-xl text-white placeholder:text-slate-500 focus:border-blue-500 focus:outline-none"
                                    />
                                </div>
                            </div>

                            <div className="flex justify-end">
                                <Button
                                    onClick={() => setStep(4)}
                                    disabled={!reason}
                                    className="bg-gradient-to-r from-blue-500 to-purple-500"
                                >
                                    Review Appointment →
                                </Button>
                            </div>
                        </div>
                    </FadeIn>
                )}

                {/* Step 4: Confirmation */}
                {step === 4 && (
                    <FadeIn>
                        <div className="max-w-2xl mx-auto">
                            <div className="flex items-center justify-between mb-8">
                                <button onClick={() => setStep(3)} className="text-slate-400 hover:text-white">
                                    ← Back
                                </button>
                                <h2 className="text-2xl font-bold">Confirm Appointment</h2>
                                <div />
                            </div>

                            <div className="bg-slate-800/50 rounded-2xl p-6 border border-slate-700 space-y-6">
                                <div className="flex items-center space-x-4 pb-6 border-b border-slate-700">
                                    <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-2xl">
                                        {selectedProvider?.name.charAt(0)}
                                    </div>
                                    <div>
                                        <h3 className="text-xl font-semibold">{selectedProvider?.name}</h3>
                                        <p className="text-slate-400">{selectedProvider?.specialty}</p>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <p className="text-slate-400 text-sm">Date</p>
                                        <p className="font-semibold">
                                            {selectedDate && new Date(selectedDate).toLocaleDateString('en-US', { 
                                                weekday: 'long', month: 'long', day: 'numeric' 
                                            })}
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-slate-400 text-sm">Time</p>
                                        <p className="font-semibold">{selectedTime}</p>
                                    </div>
                                    <div>
                                        <p className="text-slate-400 text-sm">Type</p>
                                        <p className="font-semibold capitalize">{consultationType} Call</p>
                                    </div>
                                    <div>
                                        <p className="text-slate-400 text-sm">Duration</p>
                                        <p className="font-semibold">{duration} minutes</p>
                                    </div>
                                </div>

                                <div className="pt-4 border-t border-slate-700">
                                    <p className="text-slate-400 text-sm">Reason for Visit</p>
                                    <p className="mt-1">{reason}</p>
                                </div>

                                {symptoms.length > 0 && (
                                    <div>
                                        <p className="text-slate-400 text-sm">Symptoms</p>
                                        <div className="flex flex-wrap gap-2 mt-2">
                                            {symptoms.map(s => (
                                                <span key={s} className="px-3 py-1 bg-blue-500/20 text-blue-400 rounded-full text-sm">
                                                    {s}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                <div className="flex items-center justify-between pt-6 border-t border-slate-700">
                                    <div>
                                        <p className="text-slate-400 text-sm">Consultation Fee</p>
                                        <p className="text-2xl font-bold text-emerald-400">
                                            ${selectedProvider?.consultationFee || 50}
                                        </p>
                                    </div>
                                    <Button
                                        onClick={handleSchedule}
                                        disabled={loading}
                                        className="bg-gradient-to-r from-green-500 to-emerald-500 px-8"
                                    >
                                        {loading ? 'Scheduling...' : 'Confirm Booking'}
                                    </Button>
                                </div>
                            </div>

                            <p className="text-center text-slate-500 text-sm mt-4">
                                By confirming, you agree to our cancellation policy and terms of service
                            </p>
                        </div>
                    </FadeIn>
                )}
            </div>
        </div>
    );
};

export default AppointmentScheduler;
