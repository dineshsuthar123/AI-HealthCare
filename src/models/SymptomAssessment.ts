import mongoose from 'mongoose';

const symptomAssessmentSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  sessionId: {
    type: String,
    required: true,
    unique: true,
  },
  symptoms: [{
    name: String,
    severity: {
      type: Number,
      min: 1,
      max: 10,
    },
    duration: String,
    location: String,
    description: String,
  }],
  vitalSigns: {
    temperature: Number,
    heartRate: Number,
    bloodPressure: {
      systolic: Number,
      diastolic: Number,
    },
    respiratoryRate: Number,
    oxygenSaturation: Number,
  },
  riskAssessment: {
    level: {
      type: String,
      enum: ['low', 'moderate', 'high', 'critical'],
      required: true,
    },
    score: {
      type: Number,
      min: 0,
      max: 100,
    },
    factors: [String],
    recommendations: [String],
  },
  aiResponse: {
    possibleConditions: [{
      condition: String,
      probability: Number,
      description: String,
    }],
    questions: [String],
    recommendations: [String],
    urgency: {
      type: String,
      enum: ['immediate', 'urgent', 'semi_urgent', 'non_urgent'],
    },
    referralNeeded: Boolean,
    model: String,
    confidence: Number,
  },
  followUpRequired: {
    type: Boolean,
    default: false,
  },
  followUpDate: Date,
  status: {
    type: String,
    enum: ['active', 'completed', 'escalated', 'closed'],
    default: 'active',
  },
  language: {
    type: String,
    default: 'en',
  },
  metadata: {
    userAgent: String,
    ipAddress: String,
    platform: String,
    source: {
      type: String,
      enum: ['web', 'mobile', 'sms', 'whatsapp'],
      default: 'web',
    },
  },
}, {
  timestamps: true,
});

export const SymptomAssessment = mongoose.models.SymptomAssessment || 
  mongoose.model('SymptomAssessment', symptomAssessmentSchema);
