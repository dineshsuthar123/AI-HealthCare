import mongoose from 'mongoose';

const telemedicineAppointmentSchema = new mongoose.Schema({
  patientId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  doctorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  appointmentDate: {
    type: Date,
    required: true,
  },
  duration: {
    type: Number,
    default: 30, // minutes
  },
  status: {
    type: String,
    enum: ['scheduled', 'in_progress', 'completed', 'cancelled', 'no_show'],
    default: 'scheduled',
  },
  type: {
    type: String,
    enum: ['consultation', 'follow_up', 'emergency', 'mental_health'],
    required: true,
  },
  symptoms: [String],
  chiefComplaint: String,
  diagnosis: String,
  treatment: String,
  prescriptions: [{
    medication: String,
    dosage: String,
    frequency: String,
    duration: String,
    instructions: String,
  }],
  notes: String,
  vitals: {
    temperature: Number,
    heartRate: Number,
    bloodPressure: {
      systolic: Number,
      diastolic: Number,
    },
    weight: Number,
    height: Number,
  },
  followUpRequired: Boolean,
  followUpDate: Date,
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'urgent'],
    default: 'medium',
  },
  meetingUrl: String,
  meetingId: String,
  recordingUrl: String,
  cost: {
    amount: Number,
    currency: String,
    paid: { type: Boolean, default: false },
    paymentMethod: String,
  },
  feedback: {
    patientRating: {
      type: Number,
      min: 1,
      max: 5,
    },
    patientComments: String,
    doctorRating: {
      type: Number,
      min: 1,
      max: 5,
    },
    doctorComments: String,
  },
}, {
  timestamps: true,
});

export const TelemedicineAppointment = mongoose.models.TelemedicineAppointment || 
  mongoose.model('TelemedicineAppointment', telemedicineAppointmentSchema);
