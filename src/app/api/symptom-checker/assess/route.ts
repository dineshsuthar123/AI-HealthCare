import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { symptomChecker, SymptomInput } from '@/lib/ai/symptomChecker';
import { SymptomAssessment } from '@/models/SymptomAssessment';
import connectDB from '@/lib/mongodb';
import { z } from 'zod';
import { v4 as uuidv4 } from 'uuid';

const symptomSchema = z.object({
  name: z.string().min(1, 'Symptom name is required'),
  severity: z.number().min(1).max(10),
  duration: z.string(),
  location: z.string().optional(),
  description: z.string().optional(),
});

const vitalSignsSchema = z.object({
  temperature: z.number().optional(),
  heartRate: z.number().optional(),
  bloodPressure: z.object({
    systolic: z.number(),
    diastolic: z.number(),
  }).optional(),
  respiratoryRate: z.number().optional(),
  oxygenSaturation: z.number().optional(),
});

const assessmentSchema = z.object({
  symptoms: z.array(symptomSchema).min(1, 'At least one symptom is required'),
  vitalSigns: vitalSignsSchema.optional(),
  age: z.number().optional(),
  gender: z.string().optional(),
  medicalHistory: z.array(z.string()).optional(),
  medications: z.array(z.string()).optional(),
  language: z.string().default('en'),
});

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const validatedData = assessmentSchema.parse(body);

    await connectDB();

    // Prepare symptom input for AI analysis
    const symptomInput: SymptomInput = {
      symptoms: validatedData.symptoms,
      age: validatedData.age,
      gender: validatedData.gender,
      medicalHistory: validatedData.medicalHistory,
      medications: validatedData.medications,
      vitalSigns: validatedData.vitalSigns,
    };

    // Get AI assessment
    const aiResponse = await symptomChecker.analyzeSymptoms(
      symptomInput,
      validatedData.language
    );

    // Calculate risk score
    const riskScore = calculateRiskScore(aiResponse);

    // Create assessment record
    const assessment = new SymptomAssessment({
      userId: session.user.id,
      sessionId: uuidv4(),
      symptoms: validatedData.symptoms,
      vitalSigns: validatedData.vitalSigns,
      riskAssessment: {
        level: aiResponse.riskLevel,
        score: riskScore,
        factors: extractRiskFactors(validatedData.symptoms, aiResponse),
        recommendations: aiResponse.recommendations,
      },
      aiResponse: {
        possibleConditions: aiResponse.possibleConditions,
        questions: aiResponse.questions,
        recommendations: aiResponse.recommendations,
        urgency: aiResponse.urgency,
        referralNeeded: aiResponse.referralNeeded,
        model: 'gpt-4-turbo-preview',
        confidence: aiResponse.confidence,
      },
      followUpRequired: aiResponse.urgency === 'immediate' || aiResponse.urgency === 'urgent',
      followUpDate: aiResponse.urgency === 'immediate' 
        ? new Date() 
        : aiResponse.urgency === 'urgent' 
        ? new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours
        : undefined,
      language: validatedData.language,
      metadata: {
        userAgent: request.headers.get('user-agent') || '',
        ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || '',
        platform: 'web',
        source: 'web',
      },
    });

    await assessment.save();

    // Send emergency alert if critical
    if (aiResponse.riskLevel === 'critical' || aiResponse.urgency === 'immediate') {
      // TODO: Implement emergency alert system
      console.log('CRITICAL ALERT:', {
        userId: session.user.id,
        riskLevel: aiResponse.riskLevel,
        urgency: aiResponse.urgency,
      });
    }

    return NextResponse.json({
      assessmentId: assessment._id,
      riskAssessment: assessment.riskAssessment,
      aiResponse: assessment.aiResponse,
      followUpRequired: assessment.followUpRequired,
      followUpDate: assessment.followUpDate,
    });
  } catch (error) {
    console.error('Symptom assessment error:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to process symptom assessment' },
      { status: 500 }
    );
  }
}

function calculateRiskScore(aiResponse: any): number {
  let baseScore = 30; // Base score

  // Risk level multiplier
  const riskMultipliers = {
    low: 1,
    moderate: 1.5,
    high: 2.5,
    critical: 4,
  };

  // Urgency multiplier
  const urgencyMultipliers = {
    non_urgent: 1,
    semi_urgent: 1.3,
    urgent: 2,
    immediate: 3,
  };

  baseScore *= riskMultipliers[aiResponse.riskLevel as keyof typeof riskMultipliers] || 1;
  baseScore *= urgencyMultipliers[aiResponse.urgency as keyof typeof urgencyMultipliers] || 1;

  // Confidence factor
  baseScore *= (aiResponse.confidence / 100);

  return Math.min(Math.round(baseScore), 100);
}

function extractRiskFactors(symptoms: any[], aiResponse: any): string[] {
  const factors = [];
  
  // High severity symptoms
  const highSeveritySymptoms = symptoms.filter(s => s.severity >= 8);
  if (highSeveritySymptoms.length > 0) {
    factors.push(`High severity symptoms: ${highSeveritySymptoms.map(s => s.name).join(', ')}`);
  }

  // Multiple symptoms
  if (symptoms.length >= 3) {
    factors.push('Multiple symptoms present');
  }

  // AI-identified risk factors
  if (aiResponse.possibleConditions) {
    const seriousConditions = aiResponse.possibleConditions
      .filter((c: any) => c.probability > 30)
      .map((c: any) => c.condition);
    
    if (seriousConditions.length > 0) {
      factors.push(`Possible serious conditions: ${seriousConditions.join(', ')}`);
    }
  }

  return factors;
}
