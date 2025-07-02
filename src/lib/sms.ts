import twilio from 'twilio';
import { symptomChecker, SymptomInput } from './ai/symptomChecker';

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const twilioPhone = process.env.TWILIO_PHONE_NUMBER;

if (!accountSid || !authToken || !twilioPhone) {
  console.warn('Twilio credentials not configured');
}

const client = accountSid && authToken ? twilio(accountSid, authToken) : null;

export interface SMSSession {
  phoneNumber: string;
  step: 'greeting' | 'symptoms' | 'details' | 'assessment' | 'complete';
  symptoms: string[];
  currentSymptom?: string;
  language: string;
  userId?: string;
}

// In-memory session storage (in production, use Redis or database)
const activeSessions = new Map<string, SMSSession>();

export class SMSService {
  private static instance: SMSService;

  static getInstance(): SMSService {
    if (!SMSService.instance) {
      SMSService.instance = new SMSService();
    }
    return SMSService.instance;
  }

  async sendMessage(to: string, message: string): Promise<boolean> {
    if (!client || !twilioPhone) {
      console.error('Twilio not configured');
      return false;
    }

    try {
      await client.messages.create({
        body: message,
        from: twilioPhone,
        to: to,
      });
      return true;
    } catch (error) {
      console.error('Failed to send SMS:', error);
      return false;
    }
  }

  async handleIncomingMessage(from: string, message: string): Promise<string> {
    try {
      const session = activeSessions.get(from) || this.createNewSession(from, message);
      activeSessions.set(from, session);

      switch (session.step) {
        case 'greeting':
          return this.handleGreeting(session, message);
        case 'symptoms':
          return this.handleSymptoms(session, message);
        case 'details':
          return this.handleDetails(session, message);
        case 'assessment':
          return await this.handleAssessment(session, message);
        default:
          return this.getLocalizedMessage(session.language, 'error');
      }
    } catch (error) {
      console.error('Error handling SMS:', error);
      return this.getLocalizedMessage('en', 'error');
    }
  }

  private createNewSession(phoneNumber: string, initialMessage: string): SMSSession {
    // Detect language from initial message
    const language = this.detectLanguage(initialMessage);
    
    return {
      phoneNumber,
      step: 'greeting',
      symptoms: [],
      language,
    };
  }

  private handleGreeting(session: SMSSession, message: string): string {
    // Check if user wants to start symptom check
    const lowerMessage = message.toLowerCase();
    const triggerWords = ['help', 'sick', 'symptom', 'pain', 'fever', 'ayuda', 'enfermo', 'síntoma'];
    
    if (triggerWords.some(word => lowerMessage.includes(word))) {
      session.step = 'symptoms';
      return this.getLocalizedMessage(session.language, 'start_symptoms');
    }

    return this.getLocalizedMessage(session.language, 'welcome');
  }

  private handleSymptoms(session: SMSSession, message: string): string {
    const symptoms = this.extractSymptoms(message);
    session.symptoms.push(...symptoms);

    if (session.symptoms.length === 0) {
      return this.getLocalizedMessage(session.language, 'no_symptoms_detected');
    }

    session.step = 'details';
    return this.getLocalizedMessage(session.language, 'severity_question')
      .replace('{symptom}', session.symptoms[0]);
  }

  private handleDetails(session: SMSSession, message: string): string {
    // For simplicity, move to assessment after getting details
    session.step = 'assessment';
    return this.getLocalizedMessage(session.language, 'analyzing');
  }

  private async handleAssessment(session: SMSSession, message: string): Promise<string> {
    try {
      // Build symptom input
      const symptomInput: SymptomInput = {
        symptoms: session.symptoms.map(symptom => ({
          name: symptom,
          severity: 5, // Default severity
          duration: 'recent',
        })),
      };

      const assessment = await symptomChecker.analyzeSymptoms(symptomInput, session.language);
      
      // Format response for SMS
      let response = this.getLocalizedMessage(session.language, 'assessment_complete');
      
      if (assessment.riskLevel === 'critical' || assessment.urgency === 'immediate') {
        response += '\n\n🚨 ' + this.getLocalizedMessage(session.language, 'emergency_advice');
      } else if (assessment.riskLevel === 'high' || assessment.urgency === 'urgent') {
        response += '\n\n⚠️ ' + this.getLocalizedMessage(session.language, 'urgent_advice');
      }

      response += '\n\n' + assessment.recommendations.slice(0, 2).join('\n');

      session.step = 'complete';
      
      // Clean up session after delay
      setTimeout(() => {
        activeSessions.delete(session.phoneNumber);
      }, 300000); // 5 minutes

      return response;
    } catch (error) {
      console.error('Error in assessment:', error);
      return this.getLocalizedMessage(session.language, 'assessment_error');
    }
  }

  private extractSymptoms(message: string): string[] {
    const commonSymptoms = [
      'fever', 'headache', 'cough', 'sore throat', 'nausea', 'vomiting',
      'diarrhea', 'fatigue', 'chest pain', 'shortness of breath',
      'abdominal pain', 'dizziness', 'rash', 'joint pain'
    ];

    const symptoms: string[] = [];
    const lowerMessage = message.toLowerCase();

    commonSymptoms.forEach(symptom => {
      if (lowerMessage.includes(symptom)) {
        symptoms.push(symptom);
      }
    });

    // If no common symptoms found, treat the entire message as a symptom description
    if (symptoms.length === 0 && message.trim().length > 0) {
      symptoms.push(message.trim());
    }

    return symptoms;
  }

  private detectLanguage(message: string): string {
    const spanishWords = ['hola', 'ayuda', 'dolor', 'enfermo', 'síntoma'];
    const frenchWords = ['bonjour', 'aide', 'douleur', 'malade', 'symptôme'];
    
    const lowerMessage = message.toLowerCase();
    
    if (spanishWords.some(word => lowerMessage.includes(word))) {
      return 'es';
    }
    if (frenchWords.some(word => lowerMessage.includes(word))) {
      return 'fr';
    }
    
    return 'en';
  }

  private getLocalizedMessage(language: string, key: string): string {
    const messages = {
      en: {
        welcome: '👋 Welcome to AI Health Assistant! Send me your symptoms and I\'ll help assess them. Type "help" to start.',
        start_symptoms: '🩺 Please describe your symptoms. For example: "I have fever and headache"',
        no_symptoms_detected: 'I couldn\'t identify specific symptoms. Please describe what you\'re feeling.',
        severity_question: 'On a scale of 1-10, how severe is your {symptom}?',
        analyzing: '🔍 Analyzing your symptoms... This may take a moment.',
        assessment_complete: '✅ Assessment complete:',
        emergency_advice: 'SEEK IMMEDIATE MEDICAL ATTENTION! Call emergency services or go to the nearest hospital.',
        urgent_advice: 'You should see a healthcare provider soon, ideally within 24 hours.',
        assessment_error: 'Sorry, I couldn\'t complete the assessment. Please try again or consult a healthcare provider.',
        error: 'Sorry, something went wrong. Please try again.',
      },
      es: {
        welcome: '👋 ¡Bienvenido al Asistente de Salud IA! Envíame tus síntomas y te ayudaré a evaluarlos.',
        start_symptoms: '🩺 Por favor describe tus síntomas. Por ejemplo: "Tengo fiebre y dolor de cabeza"',
        no_symptoms_detected: 'No pude identificar síntomas específicos. Por favor describe lo que sientes.',
        severity_question: 'En una escala del 1-10, ¿qué tan severo es tu {symptom}?',
        analyzing: '🔍 Analizando tus síntomas... Esto puede tomar un momento.',
        assessment_complete: '✅ Evaluación completa:',
        emergency_advice: '¡BUSCA ATENCIÓN MÉDICA INMEDIATA! Llama a servicios de emergencia.',
        urgent_advice: 'Deberías ver a un profesional de la salud pronto, idealmente en 24 horas.',
        assessment_error: 'No pude completar la evaluación. Intenta de nuevo o consulta un profesional.',
        error: 'Lo siento, algo salió mal. Por favor intenta de nuevo.',
      },
    };

    return messages[language as keyof typeof messages]?.[key as keyof typeof messages['en']] 
      || messages.en[key as keyof typeof messages['en']] 
      || 'Message not found';
  }

  async sendHealthAlert(phoneNumber: string, alertType: 'outbreak' | 'reminder' | 'emergency', data: any): Promise<boolean> {
    const messages = {
      outbreak: `🦠 Health Alert: There's been an increase in ${data.condition} cases in your area. Take precautions and monitor your health.`,
      reminder: `💊 Reminder: ${data.message}`,
      emergency: `🚨 Emergency Alert: ${data.message}. Seek immediate medical attention if you experience these symptoms.`,
    };

    return this.sendMessage(phoneNumber, messages[alertType]);
  }
}

export const smsService = SMSService.getInstance();
