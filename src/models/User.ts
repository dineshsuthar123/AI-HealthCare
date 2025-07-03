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
