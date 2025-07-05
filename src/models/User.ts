import mongoose from 'mongoose';

const UserSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
    },
    email: {
        type: String,
        required: true,
        unique: true,
    },
    password: {
        type: String,
        required: false, // Not required for OAuth users
    },
    role: {
        type: String,
        enum: ['patient', 'provider', 'admin'],
        default: 'patient',
    },
    profile: {
        age: Number,
        gender: String,
        phone: String,
        location: String,
        emergencyContact: {
            name: String,
            phone: String,
            relationship: String,
        },
    },
    medicalHistory: [{
        condition: String,
        diagnosis: String,
        date: Date,
        severity: String,
    }],
    recentActivities: [{
        type: {
            type: String,
            enum: ['symptom_check', 'consultation', 'prescription', 'report', 'emergency'],
        },
        title: String,
        description: String,
        date: {
            type: Date,
            default: Date.now,
        },
        status: {
            type: String,
            enum: ['completed', 'pending', 'active', 'cancelled'],
        },
        referenceId: {
            type: mongoose.Schema.Types.ObjectId,
            refPath: 'recentActivities.referenceModel'
        },
        referenceModel: {
            type: String,
            enum: ['SymptomCheck', 'Consultation'],
            default: 'SymptomCheck'
        }
    }],
    preferences: {
        language: {
            type: String,
            default: 'en',
        },
        notifications: {
            email: { type: Boolean, default: true },
            sms: { type: Boolean, default: false },
        },
    },
}, {
    timestamps: true,
});

export default mongoose.models.User || mongoose.model('User', UserSchema);
