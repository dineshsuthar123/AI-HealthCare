import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import connectDB from '@/lib/mongodb';
import SymptomCheck from '@/models/SymptomCheck';
import { analyzeSymptoms } from '@/lib/ai/symptom-analyzer';
import { BadRequestError, handleApiError, logApiError } from '@/lib/api-error';
import { z } from 'zod';

// Validation schema for symptom check request
const SymptomInputSchema = z.object({
    name: z.string().min(1, 'Symptom name is required'),
    severity: z.enum(['mild', 'moderate', 'severe']),
    duration: z.string().min(1, 'Duration is required'),
    description: z.string().optional(),
});

const SymptomCheckSchema = z.object({
    symptoms: z.array(SymptomInputSchema).nonempty({
        message: 'At least one symptom is required',
    }),
});

/**
 * Symptom Check API Endpoint
 * 
 * This endpoint analyzes symptoms using AI and provides health recommendations.
 * If the user is authenticated, the analysis is saved to their health record.
 * 
 * @param {NextRequest} request - The incoming request with symptoms data
 * @returns {NextResponse} Analysis results and recommendations
 */
export async function POST(request: NextRequest) {
    try {
        // Get user session (optional - users can check symptoms without logging in)
        const session = await getServerSession(authOptions);

        // Parse and validate request body
        const requestData = await request.json().catch(() => ({}));
        const validationResult = SymptomCheckSchema.safeParse(requestData);

        if (!validationResult.success) {
            throw new BadRequestError(
                'Invalid symptom data',
                'INVALID_SYMPTOMS',
                validationResult.error.format()
            );
        }

        const { symptoms } = validationResult.data;

        // Log symptom check for analytics (privacy-preserving)
        console.info(`Symptom check requested with ${symptoms.length} symptoms${session?.user ? ' by authenticated user' : ''}`);

        // Analyze symptoms using AI
        const analysis = await analyzeSymptoms(symptoms);

        // Save to database if user is logged in
        if (session?.user) {
            await connectDB();

            const symptomCheck = new SymptomCheck({
                userId: session.user.id,
                symptoms,
                aiAnalysis: analysis,
                status: 'completed',
                createdAt: new Date()
            });

            await symptomCheck.save();

            // Log successful save for audit trail
            console.info(`Symptom check saved for user: ${session.user.id}`);
        }

        return NextResponse.json({
            analysis,
            message: 'Symptoms analyzed successfully',
            timestamp: new Date().toISOString()
        });

    } catch (error) {
        // Log the error with context
        logApiError(error, {
            endpoint: '/api/symptom-check',
            method: 'POST',
            userAgent: request.headers.get('user-agent') || 'unknown'
        });

        // Return standardized error response
        return handleApiError(error);
    }
}
