import OpenAI from 'openai';

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

export interface SymptomInput {
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

export async function analyzeSymptoms(symptoms: SymptomInput[]): Promise<AIAnalysis> {
    try {
        const symptomDescription = symptoms.map(s =>
            `${s.name} (${s.severity} severity, duration: ${s.duration})${s.description ? ': ' + s.description : ''}`
        ).join('; ');

        const prompt = `As a medical AI assistant, analyze the following symptoms and provide a structured assessment:

Symptoms: ${symptomDescription}

Please provide:
1. Risk level (low/medium/high/critical)
2. Specific recommendations for the patient
3. Possible conditions with probability percentages
4. Urgency level (routine/urgent/emergency)

IMPORTANT: This is for informational purposes only and should not replace professional medical advice. Always recommend consulting a healthcare provider.

Format your response as JSON with the following structure:
{
  "riskLevel": "low|medium|high|critical",
  "recommendations": ["recommendation1", "recommendation2", ...],
  "possibleConditions": [
    {
      "condition": "condition name",
      "probability": 0-100,
      "description": "brief description"
    }
  ],
  "urgency": "routine|urgent|emergency"
}`;

        const completion = await openai.chat.completions.create({
            model: "gpt-4",
            messages: [
                {
                    role: "system",
                    content: "You are a medical AI assistant that provides symptom analysis. Always remind users to consult healthcare professionals."
                },
                {
                    role: "user",
                    content: prompt
                }
            ],
            temperature: 0.3,
            max_tokens: 1000,
        });

        const response = completion.choices[0]?.message?.content;
        if (!response) {
            throw new Error('No response from AI');
        }

        // Parse the JSON response
        const analysis = JSON.parse(response) as AIAnalysis;

        // Validate the response structure
        if (!analysis.riskLevel || !analysis.recommendations || !analysis.possibleConditions || !analysis.urgency) {
            throw new Error('Invalid AI response structure');
        }

        return analysis;
    } catch (error) {
        console.error('Error analyzing symptoms:', error);

        // Return a safe fallback response
        return {
            riskLevel: 'medium',
            recommendations: [
                'Consult with a healthcare professional for proper diagnosis',
                'Monitor your symptoms and note any changes',
                'Seek immediate medical attention if symptoms worsen'
            ],
            possibleConditions: [
                {
                    condition: 'Multiple possible conditions',
                    probability: 50,
                    description: 'AI analysis unavailable. Please consult a healthcare provider.'
                }
            ],
            urgency: 'urgent'
        };
    }
}

export async function generateHealthAdvice(condition: string, language: string = 'en'): Promise<string> {
    try {
        const prompt = `Provide general health advice for someone with ${condition} in ${language}. 
    Keep it informative but emphasize the importance of professional medical care.
    Limit response to 200 words.`;

        const completion = await openai.chat.completions.create({
            model: "gpt-3.5-turbo",
            messages: [
                {
                    role: "system",
                    content: "You are a helpful health information assistant. Always remind users to consult healthcare professionals."
                },
                {
                    role: "user",
                    content: prompt
                }
            ],
            temperature: 0.5,
            max_tokens: 300,
        });

        return completion.choices[0]?.message?.content || 'Please consult a healthcare professional for personalized advice.';
    } catch (error) {
        console.error('Error generating health advice:', error);
        return 'Please consult a healthcare professional for personalized advice.';
    }
}
