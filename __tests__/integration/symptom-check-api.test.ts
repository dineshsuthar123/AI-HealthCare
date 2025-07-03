import { NextRequest } from 'next/server';
import { POST } from '@/app/api/symptom-check/route';
import * as auth from 'next-auth';
import * as mongodb from '@/lib/mongodb';
import * as symptomAnalyzer from '@/lib/ai/symptom-analyzer';

// Mock dependencies
jest.mock('next-auth', () => ({
    getServerSession: jest.fn(),
}));

jest.mock('@/lib/mongodb', () => ({
    __esModule: true,
    default: jest.fn().mockResolvedValue(true),
}));

jest.mock('@/models/SymptomCheck', () => {
    return {
        __esModule: true,
        default: jest.fn().mockImplementation(() => ({
            save: jest.fn().mockResolvedValue({ _id: 'mock-symptom-check-id' }),
        })),
    };
});

jest.mock('@/lib/ai/symptom-analyzer', () => ({
    analyzeSymptoms: jest.fn(),
}));

// Mock console methods to prevent test output noise
global.console.info = jest.fn();
global.console.error = jest.fn();

describe('Symptom Check API', () => {
    let req: NextRequest;
    const mockSymptoms = [
        {
            name: 'headache',
            severity: 'mild',
            duration: '1 week',
            description: 'happens quite regularly'
        },
        {
            name: 'fever',
            severity: 'moderate',
            duration: '2 days',
            description: 'started after headache'
        }
    ];

    beforeEach(() => {
        jest.clearAllMocks();

        // Create a mock request with headers for NextRequest
        req = {
            json: jest.fn().mockResolvedValue({ symptoms: mockSymptoms }),
            headers: {
                get: jest.fn().mockImplementation((name) => {
                    if (name === 'user-agent') return 'test-user-agent';
                    return null;
                })
            }
        } as unknown as NextRequest;

        // Mock auth session
        (auth.getServerSession as jest.Mock).mockResolvedValue({
            user: { id: 'user-123', name: 'Test User', email: 'test@example.com' }
        });

        // Mock symptom analyzer with updated return structure
        (symptomAnalyzer.analyzeSymptoms as jest.Mock).mockResolvedValue({
            riskLevel: 'medium',
            recommendations: ['Rest', 'Fluids', 'Monitor temperature'],
            possibleConditions: [
                {
                    condition: 'Common Cold',
                    probability: 70,
                    description: 'A viral infection of the upper respiratory tract'
                },
                {
                    condition: 'Flu',
                    probability: 30,
                    description: 'Influenza viral infection with more severe symptoms than a cold'
                }
            ],
            urgency: 'routine'
        });
    });

    test('successfully analyzes symptoms and saves to database', async () => {
        const response = await POST(req);
        const responseData = await response.json();

        // Verify AI analyzer was called with correct symptoms
        expect(symptomAnalyzer.analyzeSymptoms).toHaveBeenCalledWith(mockSymptoms);

        // Verify database connection was established
        expect(mongodb.default).toHaveBeenCalled();

        // Check response contains expected data
        expect(response.status).toBe(200);
        expect(responseData).toHaveProperty('message', 'Symptoms analyzed successfully');
        expect(responseData).toHaveProperty('analysis');
        expect(responseData.analysis).toHaveProperty('riskLevel', 'medium');
        expect(responseData.analysis).toHaveProperty('recommendations');
        expect(responseData.analysis).toHaveProperty('possibleConditions');
        expect(responseData.analysis).toHaveProperty('urgency', 'routine');
        expect(responseData).toHaveProperty('timestamp');
    });

    test('returns 400 for invalid symptom data', async () => {
        // Override the mock to return invalid data
        (req.json as jest.Mock).mockResolvedValueOnce({ symptoms: [] });

        const response = await POST(req);
        const responseData = await response.json();

        expect(response.status).toBe(400);
        expect(responseData).toHaveProperty('error');
        expect(responseData).toHaveProperty('code', 'INVALID_SYMPTOMS');

        // AI analyzer should not have been called
        expect(symptomAnalyzer.analyzeSymptoms).not.toHaveBeenCalled();
    });

    test('handles unauthenticated users without saving to database', async () => {
        // Override the mock to return no session
        (auth.getServerSession as jest.Mock).mockResolvedValueOnce(null);

        const response = await POST(req);
        const responseData = await response.json();

        // Should still analyze symptoms
        expect(symptomAnalyzer.analyzeSymptoms).toHaveBeenCalled();

        // Should not save to database (connectDB not called)
        expect(mongodb.default).not.toHaveBeenCalled();

        // Should return analysis
        expect(response.status).toBe(200);
        expect(responseData).toHaveProperty('analysis');
    });

    test('handles internal server errors', async () => {
        // Mock an error in the symptom analyzer
        (symptomAnalyzer.analyzeSymptoms as jest.Mock).mockRejectedValueOnce(new Error('AI service unavailable'));

        const response = await POST(req);
        const responseData = await response.json();

        expect(response.status).toBe(500);
        expect(responseData).toHaveProperty('error', 'Internal Server Error');
        expect(responseData).toHaveProperty('code', 'INTERNAL_ERROR');
    });
});
