import mongoose from 'mongoose';

const healthAnalyticsSchema = new mongoose.Schema({
  region: {
    country: String,
    state: String,
    city: String,
    coordinates: {
      latitude: Number,
      longitude: Number,
    },
  },
  timeframe: {
    start: Date,
    end: Date,
  },
  demographics: {
    totalUsers: Number,
    ageGroups: {
      under18: Number,
      age18to35: Number,
      age36to50: Number,
      age51to65: Number,
      over65: Number,
    },
    genderDistribution: {
      male: Number,
      female: Number,
      other: Number,
    },
  },
  healthMetrics: {
    commonSymptoms: [{
      symptom: String,
      count: Number,
      percentage: Number,
    }],
    commonConditions: [{
      condition: String,
      count: Number,
      percentage: Number,
    }],
    riskLevels: {
      low: Number,
      moderate: Number,
      high: Number,
      critical: Number,
    },
    urgencyDistribution: {
      immediate: Number,
      urgent: Number,
      semiUrgent: Number,
      nonUrgent: Number,
    },
  },
  serviceUsage: {
    totalAssessments: Number,
    telemedicineAppointments: Number,
    smsInteractions: Number,
    webInteractions: Number,
    mobileInteractions: Number,
    emergencyAlerts: Number,
  },
  trends: {
    weeklyGrowth: Number,
    monthlyGrowth: Number,
    seasonalPatterns: [{
      season: String,
      avgDailyUsers: Number,
      commonConditions: [String],
    }],
  },
  alerts: [{
    type: {
      type: String,
      enum: ['outbreak', 'unusual_pattern', 'resource_shortage', 'system_overload'],
    },
    severity: {
      type: String,
      enum: ['low', 'medium', 'high', 'critical'],
    },
    description: String,
    affectedAreas: [String],
    recommendation: String,
    status: {
      type: String,
      enum: ['active', 'resolved', 'investigating'],
      default: 'active',
    },
  }],
  qualityMetrics: {
    averageResponseTime: Number,
    userSatisfactionScore: Number,
    diagnosticAccuracy: Number,
    falsePositiveRate: Number,
    falseNegativeRate: Number,
  },
}, {
  timestamps: true,
});

export const HealthAnalytics = mongoose.models.HealthAnalytics || 
  mongoose.model('HealthAnalytics', healthAnalyticsSchema);
