import OpenAI from 'openai';

// Initialize OpenAI with better error checking
let openai: OpenAI;
try {
    if (!process.env.OPENAI_API_KEY) {
        console.warn('OPENAI_API_KEY is not defined. AI features may not work properly.');
    }

    openai = new OpenAI({
        apiKey: process.env.OPENAI_API_KEY || 'dummy-key-for-fallback',
    });
} catch (error) {
    console.error('Failed to initialize OpenAI client:', error);
    // Create a dummy client that will throw controlled errors
    openai = {
        chat: {
            completions: {
                create: async () => {
                    throw new Error('OpenAI client not properly initialized');
                }
            }
        }
    } as unknown as OpenAI;
}

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
3. Possible conditions with probability percentages (provide at least 3 possible conditions)
4. Urgency level (routine/urgent/emergency)

IMPORTANT: This is for informational purposes only and should not replace professional medical advice. Always recommend consulting a healthcare provider.

CRITICAL: Return ONLY valid JSON with NO explanations or text before or after. Ensure exactly this structure with no missing fields:
{
  "riskLevel": "low|medium|high|critical",
  "recommendations": ["recommendation1", "recommendation2", ...],
  "possibleConditions": [
    {
      "condition": "condition name",
      "probability": number_between_0_and_100,
      "description": "brief description"
    },
    {
      "condition": "another condition",
      "probability": number_between_0_and_100,
      "description": "brief description"
    }
  ],
  "urgency": "routine|urgent|emergency"
}`;

        // Try with gpt-4 first, fall back to gpt-3.5-turbo if gpt-4 is not available
        let completion;
        try {
            completion = await openai.chat.completions.create({
                model: "gpt-4", // Attempt with GPT-4 first
                messages: [
                    {
                        role: "system",
                        content: "You are a medical AI assistant that provides symptom analysis in VALID JSON format only. Always remind users to consult healthcare professionals. Your response MUST be valid JSON with the structure specified, with no text before or after the JSON object."
                    },
                    {
                        role: "user",
                        content: prompt
                    }
                ],
                temperature: 0.2, // Lower temperature for more predictable outputs
                max_tokens: 1000,
                response_format: { type: "json_object" } // Request JSON format explicitly
            });
        } catch (error) {
            console.log("Failed to use GPT-4, falling back to GPT-3.5-turbo:", error instanceof Error ? error.message : String(error));

            // Fall back to GPT-3.5-turbo
            completion = await openai.chat.completions.create({
                model: "gpt-3.5-turbo", // Fallback model
                messages: [
                    {
                        role: "system",
                        content: "You are a medical AI assistant that provides symptom analysis in VALID JSON format only. Always remind users to consult healthcare professionals. Your response MUST be valid JSON with the structure specified, with no text before or after the JSON object."
                    },
                    {
                        role: "user",
                        content: prompt
                    }
                ],
                temperature: 0.3,
                max_tokens: 1000,
                response_format: { type: "json_object" }
            });
        }

        const response = completion.choices[0]?.message?.content;
        if (!response) {
            throw new Error('No response from AI');
        }

        // Parse the JSON response with better error handling
        let analysis: AIAnalysis;
        try {
            // First, clean up the response if it's not proper JSON
            const cleanJson = response.replace(/```json|```/g, '').trim();
            analysis = JSON.parse(cleanJson) as AIAnalysis;
        } catch (jsonError) {
            console.error('Error parsing OpenAI JSON response:', jsonError);
            console.log('Raw response:', response);
            throw new Error('Failed to parse AI response');
        }

        // Validate the response structure with detailed feedback
        if (!analysis.riskLevel) {
            console.error('Missing riskLevel in AI response');
            throw new Error('Invalid AI response: missing risk level');
        }
        if (!analysis.recommendations || !Array.isArray(analysis.recommendations)) {
            console.error('Missing or invalid recommendations in AI response');
            throw new Error('Invalid AI response: missing recommendations');
        }
        if (!analysis.possibleConditions || !Array.isArray(analysis.possibleConditions)) {
            console.error('Missing or invalid possibleConditions in AI response');
            throw new Error('Invalid AI response: missing possible conditions');
        }
        if (!analysis.urgency) {
            console.error('Missing urgency in AI response');
            throw new Error('Invalid AI response: missing urgency level');
        }

        return analysis;
    } catch (error) {
        console.error('Error analyzing symptoms:', error);

        // Log more detail about the error
        if (error instanceof Error) {
            console.error(`Symptom analysis error: ${error.name} - ${error.message}`);
        }

        // Check if it's an OpenAI API error and log additional details
        if (error instanceof Error &&
            (error.message.includes('OpenAI') || error.name.includes('OpenAI'))) {
            console.error('OpenAI API error detected, using fallback response');
        }

        // Create a more personalized fallback response based on symptoms
        const symptomNames = symptoms.map(s => s.name.toLowerCase());
        const hasHeadache = symptomNames.some(s => s.includes('head') || s.includes('migraine'));
        const hasFever = symptomNames.some(s => s.includes('fever') || s.includes('temperature'));
        const hasCough = symptomNames.some(s => s.includes('cough'));
        const hasStomach = symptomNames.some(s => s.includes('stomach') || s.includes('nausea') || s.includes('vomit'));
        const hasJointPain = symptomNames.some(s => s.includes('joint') || s.includes('pain') || s.includes('ache'));

        // Determine risk level based on severity
        const highestSeverity = symptoms.reduce((highest, current) => {
            const severityMap = { 'mild': 1, 'moderate': 2, 'severe': 3 };
            return Math.max(highest, severityMap[current.severity] || 1);
        }, 1);

        const riskLevel = highestSeverity === 3 ? 'high' : highestSeverity === 2 ? 'medium' : 'low';

        // Generate relevant recommendations
        const recommendations = [
            'Consult with a healthcare professional for proper diagnosis',
            'Monitor your symptoms and note any changes'
        ];

        if (highestSeverity >= 2) {
            recommendations.push('Seek medical attention if symptoms worsen');
        }

        if (hasFever) {
            recommendations.push('Stay hydrated and monitor temperature');
        }

        if (hasHeadache) {
            recommendations.push('Rest in a quiet, dark room if experiencing headache');
        }

        // Generate contextual possible conditions
        const possibleConditions = [];

        if (hasHeadache) {
            possibleConditions.push({
                condition: 'Tension Headache',
                probability: 35,
                description: 'Common headache with mild to moderate pain, often described as a tight band around the head.'
            });
            possibleConditions.push({
                condition: 'Migraine',
                probability: 25,
                description: 'Recurring headache disorder causing moderate to severe pain, often with sensitivity to light and sound.'
            });
        }

        if (hasFever) {
            possibleConditions.push({
                condition: 'Common Viral Infection',
                probability: 40,
                description: 'Viral infection that causes fever, fatigue, and general discomfort.'
            });
        }

        if (hasCough) {
            possibleConditions.push({
                condition: 'Upper Respiratory Infection',
                probability: 30,
                description: 'Infection affecting the nasal passages, throat, and airways, causing cough and congestion.'
            });
        }

        if (hasStomach) {
            possibleConditions.push({
                condition: 'Gastroenteritis',
                probability: 25,
                description: 'Inflammation of the stomach and intestines, causing nausea, vomiting, and abdominal pain.'
            });
        }

        if (hasJointPain) {
            possibleConditions.push({
                condition: 'Musculoskeletal Strain',
                probability: 20,
                description: 'Injury to muscles or tendons causing pain and inflammation.'
            });
        }

        // Add general conditions if specific ones aren't identified
        if (possibleConditions.length === 0) {
            possibleConditions.push({
                condition: 'Common Cold',
                probability: 30,
                description: 'Viral infection causing nasal congestion, sore throat, and mild fever.'
            });
            possibleConditions.push({
                condition: 'Stress-Related Condition',
                probability: 25,
                description: 'Physical symptoms triggered by psychological stress, including headaches and fatigue.'
            });
            possibleConditions.push({
                condition: 'Seasonal Allergies',
                probability: 20,
                description: 'Immune response to environmental triggers causing various symptoms.'
            });
        }

        // Determine urgency based on severity and symptoms
        let urgency: 'routine' | 'urgent' | 'emergency' = 'routine';
        if (highestSeverity === 3) {
            urgency = 'urgent';
        }
        if (symptoms.some(s => s.duration.includes('week') || s.duration.includes('month'))) {
            urgency = 'urgent';
        }
        // Emergency conditions
        if (symptoms.some(s =>
            s.severity === 'severe' &&
            (s.name.toLowerCase().includes('breath') || s.name.toLowerCase().includes('chest pain'))
        )) {
            urgency = 'emergency';
        }

        return {
            riskLevel: riskLevel as 'low' | 'medium' | 'high' | 'critical',
            recommendations,
            possibleConditions,
            urgency
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
