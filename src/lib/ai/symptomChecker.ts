import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export interface SymptomInput {
  symptoms: Array<{
    name: string;
    severity: number;
    duration: string;
    location?: string;
    description?: string;
  }>;
  age?: number;
  gender?: string;
  medicalHistory?: string[];
  medications?: string[];
  vitalSigns?: {
    temperature?: number;
    heartRate?: number;
    bloodPressure?: { systolic: number; diastolic: number };
  };
}

export interface AIResponse {
  possibleConditions: Array<{
    condition: string;
    probability: number;
    description: string;
  }>;
  riskLevel: 'low' | 'moderate' | 'high' | 'critical';
  urgency: 'immediate' | 'urgent' | 'semi_urgent' | 'non_urgent';
  recommendations: string[];
  questions: string[];
  referralNeeded: boolean;
  confidence: number;
}

export class SymptomChecker {
  private static instance: SymptomChecker;

  static getInstance(): SymptomChecker {
    if (!SymptomChecker.instance) {
      SymptomChecker.instance = new SymptomChecker();
    }
    return SymptomChecker.instance;
  }

  async analyzeSymptoms(input: SymptomInput, language: string = 'en'): Promise<AIResponse> {
    try {
      const systemPrompt = this.getSystemPrompt(language);
      const userPrompt = this.buildUserPrompt(input);

      const completion = await openai.chat.completions.create({
        model: 'gpt-4-turbo-preview',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        temperature: 0.3,
        max_tokens: 2000,
        response_format: { type: 'json_object' },
      });

      const response = completion.choices[0]?.message?.content;
      if (!response) {
        throw new Error('No response from AI model');
      }

      const parsedResponse = JSON.parse(response);
      return this.validateAndNormalizeResponse(parsedResponse);
    } catch (error) {
      console.error('Error analyzing symptoms:', error);
      throw new Error('Failed to analyze symptoms');
    }
  }

  private getSystemPrompt(language: string): string {
    const basePrompt = `
You are an AI medical assistant designed to help users assess their symptoms and provide preliminary health guidance. Your role is to:

1. Analyze reported symptoms and patient information
2. Suggest possible conditions with probability estimates
3. Assess risk levels and urgency
4. Provide appropriate recommendations
5. Determine if professional medical attention is needed

CRITICAL GUIDELINES:
- Always emphasize this is NOT a medical diagnosis
- Encourage seeking professional medical help for serious symptoms
- Be conservative with risk assessments - err on the side of caution
- Consider local disease patterns and epidemiology
- Respect cultural sensitivities around health
- Maintain patient privacy and confidentiality

For HIGH-RISK symptoms (chest pain, difficulty breathing, severe abdominal pain, neurological symptoms, signs of stroke/heart attack):
- ALWAYS mark as 'critical' or 'high' risk
- ALWAYS recommend immediate medical attention
- Set urgency to 'immediate' or 'urgent'

Response format: JSON object with exact structure:
{
  "possibleConditions": [
    {
      "condition": "string",
      "probability": number (0-100),
      "description": "string"
    }
  ],
  "riskLevel": "low|moderate|high|critical",
  "urgency": "immediate|urgent|semi_urgent|non_urgent",
  "recommendations": ["string"],
  "questions": ["string"],
  "referralNeeded": boolean,
  "confidence": number (0-100)
}`;

    const languageSpecificAddons = {
      es: 'Respond in Spanish. Consider Latin American and Hispanic health patterns.',
      fr: 'Respond in French. Consider French-speaking regions health patterns.',
      pt: 'Respond in Portuguese. Consider Brazilian and Portuguese health patterns.',
      hi: 'Respond in Hindi. Consider South Asian health patterns and cultural practices.',
      ar: 'Respond in Arabic. Consider Middle Eastern and North African health patterns.',
      sw: 'Respond in Swahili. Consider East African health patterns and local diseases.',
    };

    return basePrompt + (languageSpecificAddons[language as keyof typeof languageSpecificAddons] || '');
  }

  private buildUserPrompt(input: SymptomInput): string {
    let prompt = 'Patient Information:\n';
    
    if (input.age) prompt += `Age: ${input.age}\n`;
    if (input.gender) prompt += `Gender: ${input.gender}\n`;
    
    prompt += '\nSymptoms:\n';
    input.symptoms.forEach((symptom, index) => {
      prompt += `${index + 1}. ${symptom.name}\n`;
      prompt += `   - Severity: ${symptom.severity}/10\n`;
      prompt += `   - Duration: ${symptom.duration}\n`;
      if (symptom.location) prompt += `   - Location: ${symptom.location}\n`;
      if (symptom.description) prompt += `   - Description: ${symptom.description}\n`;
    });

    if (input.vitalSigns) {
      prompt += '\nVital Signs:\n';
      if (input.vitalSigns.temperature) prompt += `Temperature: ${input.vitalSigns.temperature}°C\n`;
      if (input.vitalSigns.heartRate) prompt += `Heart Rate: ${input.vitalSigns.heartRate} bpm\n`;
      if (input.vitalSigns.bloodPressure) {
        prompt += `Blood Pressure: ${input.vitalSigns.bloodPressure.systolic}/${input.vitalSigns.bloodPressure.diastolic} mmHg\n`;
      }
    }

    if (input.medicalHistory?.length) {
      prompt += `\nMedical History: ${input.medicalHistory.join(', ')}\n`;
    }

    if (input.medications?.length) {
      prompt += `\nCurrent Medications: ${input.medications.join(', ')}\n`;
    }

    prompt += '\nPlease analyze these symptoms and provide a comprehensive assessment.';
    
    return prompt;
  }

  private validateAndNormalizeResponse(response: any): AIResponse {
    // Validate required fields and set defaults
    const validated: AIResponse = {
      possibleConditions: response.possibleConditions || [],
      riskLevel: ['low', 'moderate', 'high', 'critical'].includes(response.riskLevel) 
        ? response.riskLevel : 'moderate',
      urgency: ['immediate', 'urgent', 'semi_urgent', 'non_urgent'].includes(response.urgency)
        ? response.urgency : 'semi_urgent',
      recommendations: Array.isArray(response.recommendations) ? response.recommendations : [],
      questions: Array.isArray(response.questions) ? response.questions : [],
      referralNeeded: Boolean(response.referralNeeded),
      confidence: Math.min(Math.max(response.confidence || 70, 0), 100),
    };

    // Ensure probability values are valid
    validated.possibleConditions = validated.possibleConditions.map(condition => ({
      ...condition,
      probability: Math.min(Math.max(condition.probability || 0, 0), 100),
    }));

    return validated;
  }

  async askFollowUpQuestion(
    sessionId: string, 
    question: string, 
    context: any,
    language: string = 'en'
  ): Promise<string> {
    try {
      const prompt = `
Based on the ongoing symptom assessment session, the user asked: "${question}"

Previous context: ${JSON.stringify(context)}

Provide a helpful, medically-informed response. Keep it concise and encourage professional medical consultation when appropriate.
${language !== 'en' ? `Respond in ${this.getLanguageName(language)}.` : ''}
`;

      const completion = await openai.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.5,
        max_tokens: 500,
      });

      return completion.choices[0]?.message?.content || 'I apologize, but I could not process your question. Please try again.';
    } catch (error) {
      console.error('Error with follow-up question:', error);
      throw new Error('Failed to process follow-up question');
    }
  }

  private getLanguageName(code: string): string {
    const languages: { [key: string]: string } = {
      es: 'Spanish',
      fr: 'French',
      pt: 'Portuguese',
      hi: 'Hindi',
      ar: 'Arabic',
      sw: 'Swahili',
      en: 'English',
    };
    return languages[code] || 'English';
  }
}

export const symptomChecker = SymptomChecker.getInstance();
