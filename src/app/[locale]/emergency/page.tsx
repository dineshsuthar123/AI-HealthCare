'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Link } from '@/navigation';
import { 
    AlertTriangle, Phone, MapPin, Heart, Activity, 
    Mic, MicOff, Volume2, Shield, Clock, Users,
    Ambulance, Hospital, Brain, Zap, Radio,
    ChevronRight, Sparkles, HeartPulse, Siren,
    Navigation, ThermometerSun, Pill, FileHeart,
    MessageCircle, Video, PhoneCall, Send
} from 'lucide-react';
import { motion, AnimatePresence } from '@/lib/framer-motion';
import { cn } from '@/lib/utils';

// Web Speech API types
interface SpeechRecognitionEvent extends Event {
    results: SpeechRecognitionResultList;
}

interface SpeechRecognitionResultList {
    length: number;
    item(index: number): SpeechRecognitionResult;
    [index: number]: SpeechRecognitionResult;
}

interface SpeechRecognitionResult {
    isFinal: boolean;
    length: number;
    item(index: number): SpeechRecognitionAlternative;
    [index: number]: SpeechRecognitionAlternative;
}

interface SpeechRecognitionAlternative {
    transcript: string;
    confidence: number;
}

interface SpeechRecognition extends EventTarget {
    continuous: boolean;
    interimResults: boolean;
    lang: string;
    onresult: ((event: SpeechRecognitionEvent) => void) | null;
    onerror: ((event: Event) => void) | null;
    onend: (() => void) | null;
    start(): void;
    stop(): void;
    abort(): void;
}

declare global {
    interface Window {
        SpeechRecognition: new () => SpeechRecognition;
        webkitSpeechRecognition: new () => SpeechRecognition;
    }
}

interface EmergencyContact {
    id: string;
    name: string;
    phone: string;
    relationship: string;
    isPrimary: boolean;
}

interface NearbyFacility {
    id: string;
    name: string;
    type: 'hospital' | 'clinic' | 'pharmacy';
    distance: string;
    waitTime?: string;
    phone: string;
    address: string;
    hasEmergency: boolean;
}

interface VitalSign {
    type: 'heartRate' | 'bloodPressure' | 'oxygen' | 'temperature';
    value: string;
    unit: string;
    status: 'normal' | 'warning' | 'critical';
    timestamp: Date;
}

interface EmergencyState {
    isActive: boolean;
    type: 'medical' | 'mental' | 'accident' | null;
    countdown: number;
    location: GeolocationCoordinates | null;
    aiAssessment: string | null;
    severity: 'low' | 'medium' | 'high' | 'critical' | null;
}

export default function EmergencyPage() {
    const { data: session, status } = useSession();
    const [emergencyState, setEmergencyState] = useState<EmergencyState>({
        isActive: false,
        type: null,
        countdown: 10,
        location: null,
        aiAssessment: null,
        severity: null
    });
    const [isListening, setIsListening] = useState(false);
    const [voiceCommand, setVoiceCommand] = useState('');
    const [contacts, setContacts] = useState<EmergencyContact[]>([
        { id: '1', name: 'Emergency Services', phone: '911', relationship: 'Emergency', isPrimary: true },
        { id: '2', name: 'Dr. Smith', phone: '+1-555-0123', relationship: 'Primary Doctor', isPrimary: false },
    ]);
    const [facilities, setFacilities] = useState<NearbyFacility[]>([
        { id: '1', name: 'City General Hospital', type: 'hospital', distance: '2.3 km', waitTime: '15 min', phone: '+1-555-1000', address: '123 Medical Ave', hasEmergency: true },
        { id: '2', name: 'QuickCare Clinic', type: 'clinic', distance: '0.8 km', waitTime: '5 min', phone: '+1-555-2000', address: '456 Health St', hasEmergency: false },
        { id: '3', name: 'MedPlus Pharmacy', type: 'pharmacy', distance: '0.3 km', phone: '+1-555-3000', address: '789 Care Blvd', hasEmergency: false },
    ]);
    const [vitals, setVitals] = useState<VitalSign[]>([
        { type: 'heartRate', value: '72', unit: 'bpm', status: 'normal', timestamp: new Date() },
        { type: 'bloodPressure', value: '120/80', unit: 'mmHg', status: 'normal', timestamp: new Date() },
        { type: 'oxygen', value: '98', unit: '%', status: 'normal', timestamp: new Date() },
        { type: 'temperature', value: '98.6', unit: '°F', status: 'normal', timestamp: new Date() },
    ]);
    const [chatMessages, setChatMessages] = useState<{text: string; isAI: boolean; timestamp: Date}[]>([]);
    const [chatInput, setChatInput] = useState('');
    const [isAiTyping, setIsAiTyping] = useState(false);
    const countdownRef = useRef<NodeJS.Timeout | null>(null);
    const recognitionRef = useRef<SpeechRecognition | null>(null);

    const isAuthenticated = status === 'authenticated' && !!session?.user;

    // Get user location
    useEffect(() => {
        if ('geolocation' in navigator) {
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    setEmergencyState(prev => ({ ...prev, location: position.coords }));
                },
                (error) => console.log('Location not available:', error)
            );
        }
    }, []);

    // Emergency countdown
    useEffect(() => {
        if (emergencyState.isActive && emergencyState.countdown > 0) {
            countdownRef.current = setTimeout(() => {
                setEmergencyState(prev => ({ ...prev, countdown: prev.countdown - 1 }));
            }, 1000);
        } else if (emergencyState.isActive && emergencyState.countdown === 0) {
            // Trigger emergency services
            triggerEmergency();
        }
        return () => {
            if (countdownRef.current) clearTimeout(countdownRef.current);
        };
    }, [emergencyState.isActive, emergencyState.countdown]);

    // Voice recognition setup
    useEffect(() => {
        if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
            const SpeechRecognition = window.webkitSpeechRecognition || window.SpeechRecognition;
            recognitionRef.current = new SpeechRecognition();
            recognitionRef.current.continuous = true;
            recognitionRef.current.interimResults = true;
            recognitionRef.current.onresult = (event: SpeechRecognitionEvent) => {
                const transcript = Array.from(event.results)
                    .map(result => result[0].transcript)
                    .join('');
                setVoiceCommand(transcript);
                processVoiceCommand(transcript.toLowerCase());
            };
        }
    }, []);

    const processVoiceCommand = (command: string) => {
        if (command.includes('help') || command.includes('emergency')) {
            startEmergency('medical');
        } else if (command.includes('cancel') || command.includes('stop')) {
            cancelEmergency();
        } else if (command.includes('call') || command.includes('ambulance')) {
            triggerEmergency();
        }
    };

    const startEmergency = (type: 'medical' | 'mental' | 'accident') => {
        setEmergencyState({
            isActive: true,
            type,
            countdown: 10,
            location: emergencyState.location,
            aiAssessment: getAiAssessment(type),
            severity: 'high'
        });
        // Speak alert
        if ('speechSynthesis' in window) {
            const utterance = new SpeechSynthesisUtterance('Emergency activated. Help is being dispatched in 10 seconds. Say cancel to abort.');
            speechSynthesis.speak(utterance);
        }
    };

    const cancelEmergency = () => {
        setEmergencyState({
            isActive: false,
            type: null,
            countdown: 10,
            location: emergencyState.location,
            aiAssessment: null,
            severity: null
        });
        if ('speechSynthesis' in window) {
            speechSynthesis.cancel();
            const utterance = new SpeechSynthesisUtterance('Emergency cancelled.');
            speechSynthesis.speak(utterance);
        }
    };

    const triggerEmergency = () => {
        // In a real app, this would call emergency services API
        console.log('Emergency triggered!', {
            type: emergencyState.type,
            location: emergencyState.location,
            vitals,
            contacts
        });
        if ('speechSynthesis' in window) {
            const utterance = new SpeechSynthesisUtterance('Emergency services have been notified. Help is on the way. Stay calm.');
            speechSynthesis.speak(utterance);
        }
    };

    const getAiAssessment = (type: string): string => {
        const assessments: Record<string, string> = {
            medical: 'Based on your health profile and symptoms, this appears to be a medical emergency. First responders have been notified with your location and medical history.',
            mental: 'A mental health crisis counselor will be connected shortly. Remember: you are not alone. Help is available and on the way.',
            accident: 'Accident response team notified. If safe to do so, please stay still and keep this screen visible for first responders.'
        };
        return assessments[type] || 'Emergency services are being contacted.';
    };

    const toggleVoiceRecognition = () => {
        if (!recognitionRef.current) return;
        if (isListening) {
            recognitionRef.current.stop();
            setIsListening(false);
        } else {
            recognitionRef.current.start();
            setIsListening(true);
        }
    };

    const getVitalIcon = (type: string) => {
        switch (type) {
            case 'heartRate': return HeartPulse;
            case 'bloodPressure': return Activity;
            case 'oxygen': return Wind;
            case 'temperature': return ThermometerSun;
            default: return Heart;
        }
    };

    const getVitalColor = (status: string) => {
        switch (status) {
            case 'normal': return 'text-emerald-400 bg-emerald-500/20';
            case 'warning': return 'text-amber-400 bg-amber-500/20';
            case 'critical': return 'text-red-400 bg-red-500/20';
            default: return 'text-slate-400 bg-slate-500/20';
        }
    };

    const sendAiMessage = async () => {
        if (!chatInput.trim()) return;
        const userMessage = { text: chatInput, isAI: false, timestamp: new Date() };
        setChatMessages(prev => [...prev, userMessage]);
        setChatInput('');
        setIsAiTyping(true);
        
        // Simulate AI response
        setTimeout(() => {
            const aiResponses = [
                "I understand you're concerned. Can you describe your symptoms in more detail?",
                "Based on what you've described, I recommend monitoring your condition. If symptoms worsen, use the emergency button above.",
                "Your symptoms don't appear immediately life-threatening, but I recommend scheduling a consultation with a healthcare provider.",
                "I'm here to help. Take slow, deep breaths. Can you tell me when these symptoms started?",
            ];
            const aiMessage = { 
                text: aiResponses[Math.floor(Math.random() * aiResponses.length)], 
                isAI: true, 
                timestamp: new Date() 
            };
            setChatMessages(prev => [...prev, aiMessage]);
            setIsAiTyping(false);
        }, 1500);
    };

    const Wind = Activity; // Fallback for oxygen icon

    return (
        <div className="min-h-screen bg-[#01030f] text-white">
            {/* Animated Background */}
            <div className="fixed inset-0 pointer-events-none">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_rgba(220,38,38,0.1),_transparent_50%)]" />
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_20%,_rgba(87,120,255,0.1),_transparent_40%)]" />
                {emergencyState.isActive && (
                    <motion.div 
                        className="absolute inset-0 bg-red-500/5"
                        animate={{ opacity: [0.1, 0.3, 0.1] }}
                        transition={{ duration: 1, repeat: Infinity }}
                    />
                )}
            </div>

            {/* Emergency Active Overlay */}
            <AnimatePresence>
                {emergencyState.isActive && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-lg"
                    >
                        <motion.div 
                            className="text-center p-12"
                            initial={{ scale: 0.8 }}
                            animate={{ scale: 1 }}
                        >
                            <motion.div
                                animate={{ scale: [1, 1.2, 1] }}
                                transition={{ duration: 1, repeat: Infinity }}
                                className="inline-block mb-8"
                            >
                                <div className="w-40 h-40 rounded-full bg-gradient-to-br from-red-500 to-red-700 flex items-center justify-center shadow-[0_0_60px_rgba(239,68,68,0.5)]">
                                    <Siren className="w-20 h-20 text-white" />
                                </div>
                            </motion.div>

                            <h1 className="text-5xl font-bold text-red-500 mb-4">EMERGENCY ACTIVE</h1>
                            
                            <div className="text-8xl font-bold text-white mb-6 font-mono">
                                {emergencyState.countdown}
                            </div>
                            
                            <p className="text-xl text-slate-300 mb-8 max-w-md mx-auto">
                                {emergencyState.aiAssessment}
                            </p>

                            <div className="flex gap-4 justify-center">
                                <Button 
                                    onClick={cancelEmergency}
                                    className="bg-slate-700 hover:bg-slate-600 text-white px-8 py-6 text-xl"
                                >
                                    Cancel
                                </Button>
                                <Button 
                                    onClick={triggerEmergency}
                                    className="bg-red-600 hover:bg-red-700 text-white px-8 py-6 text-xl"
                                >
                                    <Phone className="mr-2" /> Call Now
                                </Button>
                            </div>

                            {emergencyState.location && (
                                <p className="mt-8 text-sm text-slate-500">
                                    <MapPin className="inline w-4 h-4 mr-1" />
                                    Location: {emergencyState.location.latitude.toFixed(4)}, {emergencyState.location.longitude.toFixed(4)}
                                </p>
                            )}
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            <div className="relative z-10 mx-auto max-w-7xl px-4 py-12">
                {/* Header */}
                <motion.div 
                    className="mb-10"
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                >
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-3 rounded-2xl bg-gradient-to-br from-red-500/20 to-orange-500/20 border border-red-500/30">
                            <AlertTriangle className="h-6 w-6 text-red-400" />
                        </div>
                        <div>
                            <p className="text-xs uppercase tracking-[0.3em] text-slate-500">Emergency Response</p>
                            <h1 className="text-3xl font-bold bg-gradient-to-r from-red-400 to-orange-400 bg-clip-text text-transparent">
                                AI Emergency Center
                            </h1>
                        </div>
                    </div>
                    <p className="text-slate-400 mt-2 max-w-2xl">
                        Voice-activated emergency response with AI triage, real-time vitals, and instant access to help.
                    </p>
                </motion.div>

                {/* Emergency Buttons */}
                <motion.div 
                    className="grid gap-4 md:grid-cols-3 mb-8"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                >
                    {[
                        { type: 'medical' as const, icon: Heart, label: 'Medical Emergency', color: 'red', description: 'Chest pain, difficulty breathing, severe injury' },
                        { type: 'mental' as const, icon: Brain, label: 'Mental Health Crisis', color: 'purple', description: 'Anxiety attack, depression crisis, suicidal thoughts' },
                        { type: 'accident' as const, icon: Zap, label: 'Accident/Injury', color: 'amber', description: 'Falls, burns, car accidents, workplace injury' },
                    ].map((emergency) => (
                        <motion.button
                            key={emergency.type}
                            onClick={() => startEmergency(emergency.type)}
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            className={cn(
                                "relative overflow-hidden p-6 rounded-2xl text-left transition-all",
                                "bg-gradient-to-br border backdrop-blur-xl",
                                emergency.color === 'red' && "from-red-500/20 to-red-900/20 border-red-500/30 hover:border-red-400/50",
                                emergency.color === 'purple' && "from-purple-500/20 to-purple-900/20 border-purple-500/30 hover:border-purple-400/50",
                                emergency.color === 'amber' && "from-amber-500/20 to-amber-900/20 border-amber-500/30 hover:border-amber-400/50",
                            )}
                        >
                            <emergency.icon className={cn(
                                "h-8 w-8 mb-3",
                                emergency.color === 'red' && "text-red-400",
                                emergency.color === 'purple' && "text-purple-400",
                                emergency.color === 'amber' && "text-amber-400",
                            )} />
                            <h3 className="text-lg font-semibold text-white mb-1">{emergency.label}</h3>
                            <p className="text-sm text-slate-400">{emergency.description}</p>
                        </motion.button>
                    ))}
                </motion.div>

                {/* Voice Control & Quick Actions */}
                <div className="grid gap-6 lg:grid-cols-2 mb-8">
                    {/* Voice Control */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.2 }}
                    >
                        <Card className="bg-gradient-to-br from-slate-900/80 to-slate-800/50 border-slate-700/50 h-full">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2 text-lg">
                                    <Radio className="h-5 w-5 text-blue-400" />
                                    Voice Emergency Control
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="text-center py-8">
                                    <motion.button
                                        onClick={toggleVoiceRecognition}
                                        whileHover={{ scale: 1.05 }}
                                        whileTap={{ scale: 0.95 }}
                                        className={cn(
                                            "w-24 h-24 rounded-full flex items-center justify-center mx-auto transition-all",
                                            isListening 
                                                ? "bg-red-500 shadow-[0_0_30px_rgba(239,68,68,0.5)]" 
                                                : "bg-slate-700 hover:bg-slate-600"
                                        )}
                                    >
                                        {isListening ? (
                                            <motion.div
                                                animate={{ scale: [1, 1.2, 1] }}
                                                transition={{ duration: 1, repeat: Infinity }}
                                            >
                                                <Mic className="w-10 h-10 text-white" />
                                            </motion.div>
                                        ) : (
                                            <MicOff className="w-10 h-10 text-slate-400" />
                                        )}
                                    </motion.button>
                                    <p className="mt-4 text-slate-400">
                                        {isListening ? 'Listening... Say "HELP" or "EMERGENCY"' : 'Tap to activate voice control'}
                                    </p>
                                    {voiceCommand && (
                                        <p className="mt-2 text-sm text-blue-400">Heard: &quot;{voiceCommand}&quot;</p>
                                    )}
                                </div>
                                <div className="grid grid-cols-3 gap-2 text-xs">
                                    {['Help', 'Emergency', 'Call Ambulance', 'Cancel', 'Stop', 'Doctor'].map((cmd) => (
                                        <div key={cmd} className="bg-slate-800/50 rounded-lg p-2 text-center text-slate-400">
                                            &quot;{cmd}&quot;
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                    </motion.div>

                    {/* Quick Actions */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.3 }}
                    >
                        <Card className="bg-gradient-to-br from-slate-900/80 to-slate-800/50 border-slate-700/50 h-full">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2 text-lg">
                                    <Zap className="h-5 w-5 text-amber-400" />
                                    Quick Actions
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="grid grid-cols-2 gap-3">
                                {[
                                    { icon: Phone, label: 'Call 911', action: () => {}, color: 'red' },
                                    { icon: Ambulance, label: 'Request Ambulance', action: () => {}, color: 'blue' },
                                    { icon: Hospital, label: 'Find Hospital', action: () => {}, color: 'green' },
                                    { icon: FileHeart, label: 'Share Medical ID', action: () => {}, color: 'purple' },
                                    { icon: Video, label: 'Video Consult', action: () => {}, color: 'cyan' },
                                    { icon: Users, label: 'Alert Contacts', action: () => {}, color: 'pink' },
                                ].map((action) => (
                                    <motion.button
                                        key={action.label}
                                        whileHover={{ scale: 1.02 }}
                                        whileTap={{ scale: 0.98 }}
                                        onClick={action.action}
                                        className={cn(
                                            "flex items-center gap-3 p-4 rounded-xl transition-all",
                                            "bg-slate-800/50 hover:bg-slate-700/50 border border-slate-700/50"
                                        )}
                                    >
                                        <action.icon className={cn(
                                            "w-5 h-5",
                                            action.color === 'red' && 'text-red-400',
                                            action.color === 'blue' && 'text-blue-400',
                                            action.color === 'green' && 'text-emerald-400',
                                            action.color === 'purple' && 'text-purple-400',
                                            action.color === 'cyan' && 'text-cyan-400',
                                            action.color === 'pink' && 'text-pink-400',
                                        )} />
                                        <span className="text-sm text-white">{action.label}</span>
                                    </motion.button>
                                ))}
                            </CardContent>
                        </Card>
                    </motion.div>
                </div>

                {/* Vitals Monitor */}
                <motion.div
                    className="mb-8"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                >
                    <Card className="bg-gradient-to-br from-slate-900/80 to-slate-800/50 border-slate-700/50">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-lg">
                                <HeartPulse className="h-5 w-5 text-pink-400" />
                                Real-Time Vitals Monitor
                                <span className="ml-auto text-xs text-slate-500 font-normal">Simulated Data</span>
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                {vitals.map((vital) => {
                                    const VitalIcon = getVitalIcon(vital.type);
                                    return (
                                        <div key={vital.type} className={cn(
                                            "p-4 rounded-xl border",
                                            vital.status === 'normal' && "bg-emerald-500/5 border-emerald-500/20",
                                            vital.status === 'warning' && "bg-amber-500/5 border-amber-500/20",
                                            vital.status === 'critical' && "bg-red-500/5 border-red-500/20",
                                        )}>
                                            <div className="flex items-center gap-2 mb-2">
                                                <div className={cn("p-2 rounded-lg", getVitalColor(vital.status))}>
                                                    <VitalIcon className="w-4 h-4" />
                                                </div>
                                                <span className="text-sm text-slate-400 capitalize">
                                                    {vital.type.replace(/([A-Z])/g, ' $1').trim()}
                                                </span>
                                            </div>
                                            <p className="text-2xl font-bold text-white">
                                                {vital.value}
                                                <span className="text-sm text-slate-500 ml-1">{vital.unit}</span>
                                            </p>
                                        </div>
                                    );
                                })}
                            </div>
                        </CardContent>
                    </Card>
                </motion.div>

                {/* AI Triage Chat & Nearby Facilities */}
                <div className="grid gap-6 lg:grid-cols-2 mb-8">
                    {/* AI Triage Chat */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.5 }}
                    >
                        <Card className="bg-gradient-to-br from-slate-900/80 to-slate-800/50 border-slate-700/50 h-full flex flex-col">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2 text-lg">
                                    <Sparkles className="h-5 w-5 text-purple-400" />
                                    AI Emergency Triage
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="flex-1 flex flex-col">
                                <div className="flex-1 min-h-[200px] max-h-[300px] overflow-y-auto space-y-3 mb-4">
                                    {chatMessages.length === 0 && (
                                        <div className="text-center text-slate-500 py-8">
                                            <Brain className="w-12 h-12 mx-auto mb-3 opacity-50" />
                                            <p>Describe your symptoms or concerns...</p>
                                            <p className="text-xs mt-2">AI will assess severity and recommend actions</p>
                                        </div>
                                    )}
                                    {chatMessages.map((msg, i) => (
                                        <div key={i} className={cn(
                                            "p-3 rounded-xl max-w-[80%]",
                                            msg.isAI 
                                                ? "bg-purple-500/10 border border-purple-500/20 mr-auto" 
                                                : "bg-blue-500/10 border border-blue-500/20 ml-auto"
                                        )}>
                                            <p className="text-sm text-white">{msg.text}</p>
                                            <p className="text-xs text-slate-500 mt-1">
                                                {msg.timestamp.toLocaleTimeString()}
                                            </p>
                                        </div>
                                    ))}
                                    {isAiTyping && (
                                        <div className="bg-purple-500/10 border border-purple-500/20 p-3 rounded-xl max-w-[80%]">
                                            <motion.div 
                                                className="flex gap-1"
                                                animate={{ opacity: [0.5, 1, 0.5] }}
                                                transition={{ duration: 1.5, repeat: Infinity }}
                                            >
                                                <span className="w-2 h-2 bg-purple-400 rounded-full" />
                                                <span className="w-2 h-2 bg-purple-400 rounded-full" />
                                                <span className="w-2 h-2 bg-purple-400 rounded-full" />
                                            </motion.div>
                                        </div>
                                    )}
                                </div>
                                <div className="flex gap-2">
                                    <Input
                                        value={chatInput}
                                        onChange={(e) => setChatInput(e.target.value)}
                                        placeholder="Describe your symptoms..."
                                        className="bg-slate-800/50 border-slate-700/50"
                                        onKeyDown={(e) => e.key === 'Enter' && sendAiMessage()}
                                    />
                                    <Button onClick={sendAiMessage} className="bg-purple-600 hover:bg-purple-700">
                                        <Send className="w-4 h-4" />
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    </motion.div>

                    {/* Nearby Facilities */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.6 }}
                    >
                        <Card className="bg-gradient-to-br from-slate-900/80 to-slate-800/50 border-slate-700/50 h-full">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2 text-lg">
                                    <Navigation className="h-5 w-5 text-emerald-400" />
                                    Nearby Healthcare Facilities
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-3">
                                {facilities.map((facility) => (
                                    <div 
                                        key={facility.id}
                                        className="p-4 rounded-xl bg-slate-800/30 border border-slate-700/30 hover:border-slate-600/50 transition-all"
                                    >
                                        <div className="flex items-start justify-between">
                                            <div>
                                                <div className="flex items-center gap-2">
                                                    {facility.type === 'hospital' && <Hospital className="w-4 h-4 text-red-400" />}
                                                    {facility.type === 'clinic' && <Pill className="w-4 h-4 text-blue-400" />}
                                                    {facility.type === 'pharmacy' && <Pill className="w-4 h-4 text-green-400" />}
                                                    <h4 className="font-medium text-white">{facility.name}</h4>
                                                    {facility.hasEmergency && (
                                                        <span className="text-xs bg-red-500/20 text-red-400 px-2 py-0.5 rounded-full">ER</span>
                                                    )}
                                                </div>
                                                <p className="text-sm text-slate-400 mt-1">{facility.address}</p>
                                                <div className="flex items-center gap-4 mt-2 text-xs text-slate-500">
                                                    <span className="flex items-center gap-1">
                                                        <MapPin className="w-3 h-3" /> {facility.distance}
                                                    </span>
                                                    {facility.waitTime && (
                                                        <span className="flex items-center gap-1">
                                                            <Clock className="w-3 h-3" /> Wait: {facility.waitTime}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                            <Button size="sm" variant="outline" className="bg-slate-800/50">
                                                <PhoneCall className="w-4 h-4" />
                                            </Button>
                                        </div>
                                    </div>
                                ))}
                            </CardContent>
                        </Card>
                    </motion.div>
                </div>

                {/* Emergency Contacts */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.7 }}
                >
                    <Card className="bg-gradient-to-br from-slate-900/80 to-slate-800/50 border-slate-700/50">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-lg">
                                <Users className="h-5 w-5 text-blue-400" />
                                Emergency Contacts
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                                {contacts.map((contact) => (
                                    <div 
                                        key={contact.id}
                                        className={cn(
                                            "p-4 rounded-xl border transition-all",
                                            contact.isPrimary 
                                                ? "bg-red-500/10 border-red-500/30" 
                                                : "bg-slate-800/30 border-slate-700/30"
                                        )}
                                    >
                                        <div className="flex items-center justify-between mb-2">
                                            <h4 className="font-medium text-white">{contact.name}</h4>
                                            {contact.isPrimary && (
                                                <span className="text-xs bg-red-500/20 text-red-400 px-2 py-0.5 rounded-full">Primary</span>
                                            )}
                                        </div>
                                        <p className="text-sm text-slate-400">{contact.relationship}</p>
                                        <p className="text-sm text-blue-400 mt-2">{contact.phone}</p>
                                    </div>
                                ))}
                                <button className="p-4 rounded-xl border-2 border-dashed border-slate-700 hover:border-slate-500 transition-all flex flex-col items-center justify-center text-slate-500 hover:text-slate-300">
                                    <Users className="w-6 h-6 mb-2" />
                                    <span className="text-sm">Add Contact</span>
                                </button>
                            </div>
                        </CardContent>
                    </Card>
                </motion.div>

                {/* Footer Info */}
                <motion.div 
                    className="mt-8 text-center"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.8 }}
                >
                    <p className="text-sm text-slate-500">
                        <Shield className="inline w-4 h-4 mr-1" />
                        Your medical data is secured with blockchain verification
                    </p>
                </motion.div>
            </div>
        </div>
    );
}
