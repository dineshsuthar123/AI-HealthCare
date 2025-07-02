import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import connectDB from '@/lib/mongodb';
import { SymptomAssessment } from '@/models/SymptomAssessment';
import { symptomChecker } from '@/lib/ai/symptomChecker';
import { v4 as uuidv4 } from 'uuid';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const { symptoms, vitalSigns, language = 'en' } = await request.json();

    if (!symptoms || !Array.isArray(symptoms) || symptoms.length === 0) {
      return NextResponse.json(
        { error: 'Symptoms are required' },
        { status: 400 }
      );
    }

    await connectDB();

    // Generate unique session ID
    const sessionId = uuidv4();

    // Analyze symptoms using AI
    const aiResponse = await symptomChecker.analyzeSymptoms(
      { symptoms, vitalSigns },
      language
    );

    // Create assessment record
    const assessment = await SymptomAssessment.create({
      userId: session.user.id,
      sessionId,
      symptoms,
      vitalSigns,
      riskAssessment: {
        level: aiResponse.riskLevel,
        score: aiResponse.confidence,
        factors: [], // Could be extracted from AI response
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
      language,
      metadata: {
        userAgent: request.headers.get('user-agent') || '',
        platform: 'web',
        source: 'web',
      },
    });

    return NextResponse.json({
      success: true,
      assessment: {
        id: assessment._id,
        sessionId: assessment.sessionId,
        riskLevel: aiResponse.riskLevel,
        urgency: aiResponse.urgency,
        possibleConditions: aiResponse.possibleConditions,
        recommendations: aiResponse.recommendations,
        referralNeeded: aiResponse.referralNeeded,
        confidence: aiResponse.confidence,
      },
    });
  } catch (error) {
    console.error('Symptom assessment error:', error);
    return NextResponse.json(
      { error: 'Failed to analyze symptoms' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '10');
    const offset = parseInt(searchParams.get('offset') || '0');

    await connectDB();

    const assessments = await SymptomAssessment.find({ userId: session.user.id })
      .sort({ createdAt: -1 })
      .limit(limit)
      .skip(offset)
      .select('-metadata -aiResponse.model');

    return NextResponse.json({
      assessments,
      total: await SymptomAssessment.countDocuments({ userId: session.user.id }),
    });
  } catch (error) {
    console.error('Get assessments error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch assessments' },
      { status: 500 }
    );
  }
}
