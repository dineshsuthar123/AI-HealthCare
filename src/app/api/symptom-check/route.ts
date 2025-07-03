import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import connectDB from '@/lib/mongodb';
import SymptomCheck from '@/models/SymptomCheck';
import { analyzeSymptoms } from '@/lib/ai/symptom-analyzer';

export async function POST(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);

        const { symptoms } = await request.json();

        if (!symptoms || !Array.isArray(symptoms) || symptoms.length === 0) {
            return NextResponse.json(
                { error: 'Invalid symptoms data' },
                { status: 400 }
            );
        }

        // Analyze symptoms using AI
        const analysis = await analyzeSymptoms(symptoms);

        // Save to database if user is logged in
        if (session?.user) {
            await connectDB();

            const symptomCheck = new SymptomCheck({
                userId: session.user.id,
                symptoms,
                aiAnalysis: analysis,
                status: 'pending',
            });

            await symptomCheck.save();
        }

        return NextResponse.json({
            analysis,
            message: 'Symptoms analyzed successfully',
        });

    } catch (error) {
        console.error('Error in symptom check API:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
