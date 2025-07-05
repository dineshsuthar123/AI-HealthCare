import 'next-auth';

declare module 'next-auth' {
    interface Session {
        user: {
            id: string;
            email: string;
            name: string;
            role: string;
        };
    }

    interface User {
        id: string;
        email: string;
        name: string;
        role: string;
    }
}

declare module 'next-auth/jwt' {
    interface JWT {
        role: string;
    }
}

export interface UserProfile {
    age?: number;
    gender?: string;
    phone?: string;
    location?: string;
    emergencyContact?: {
        name: string;
        phone: string;
        relationship: string;
    };
}

export interface MedicalHistory {
    condition: string;
    diagnosis: string;
    date: Date;
    severity: string;
}

export interface RecentActivity {
    type: 'symptom_check' | 'consultation' | 'prescription' | 'report' | 'emergency';
    title: string;
    description: string;
    date: Date;
    status: 'completed' | 'pending' | 'active' | 'cancelled';
    referenceId?: string;
    referenceModel?: 'SymptomCheck' | 'Consultation';
}

export interface Symptom {
    name: string;
    severity: 'mild' | 'moderate' | 'severe';
    duration: string;
    description?: string;
}

export interface AIAnalysis {
    riskLevel: 'low' | 'medium' | 'high' | 'critical';
    recommendations: string[];
    possibleConditions: {
        condition: string;
        probability: number;
        description: string;
    }[];
    urgency: 'routine' | 'urgent' | 'emergency';
}

export interface Consultation {
    _id: string;
    patientId: string;
    providerId?: string;
    provider?: {
        name: string;
        specialty: string;
        profileImage?: string;
    };
    reason: string;
    type: 'video' | 'audio' | 'message';
    status: 'scheduled' | 'in-progress' | 'completed' | 'cancelled';
    scheduledFor: Date;
    duration: number;
    notes?: string;
    diagnosis?: string;
    prescriptions?: Prescription[];
    followUp?: {
        required: boolean;
        scheduledAt?: Date;
        notes?: string;
    };
    rating?: {
        score: number;
        feedback: string;
    };
}

export interface Prescription {
    medication: string;
    dosage: string;
    frequency: string;
    duration: string;
    instructions: string;
}
