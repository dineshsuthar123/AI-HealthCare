import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
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
    required: true,
  },
  phone: {
    type: String,
    sparse: true,
  },
  role: {
    type: String,
    enum: ['patient', 'doctor', 'admin', 'health_worker'],
    default: 'patient',
  },
  profile: {
    dateOfBirth: Date,
    gender: {
      type: String,
      enum: ['male', 'female', 'other', 'prefer_not_to_say'],
    },
    location: {
      country: String,
      state: String,
      city: String,
      latitude: Number,
      longitude: Number,
    },
    emergencyContact: {
      name: String,
      phone: String,
      relationship: String,
    },
    medicalHistory: [{
      condition: String,
      diagnosedDate: Date,
      status: {
        type: String,
        enum: ['active', 'resolved', 'chronic'],
        default: 'active',
      },
    }],
    allergies: [String],
    medications: [{
      name: String,
      dosage: String,
      frequency: String,
      startDate: Date,
      endDate: Date,
    }],
    languages: [String],
    preferredLanguage: {
      type: String,
      default: 'en',
    },
  },
  settings: {
    notifications: {
      email: { type: Boolean, default: true },
      sms: { type: Boolean, default: false },
      push: { type: Boolean, default: true },
    },
    privacy: {
      shareDataForResearch: { type: Boolean, default: false },
      allowAnonymousAnalytics: { type: Boolean, default: true },
    },
  },
  isVerified: {
    type: Boolean,
    default: false,
  },
  verificationToken: String,
  resetPasswordToken: String,
  resetPasswordExpires: Date,
}, {
  timestamps: true,
});

export const User = mongoose.models.User || mongoose.model('User', userSchema);
