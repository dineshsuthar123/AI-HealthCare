import { NextRequest } from 'next/server';
import { POST } from '@/app/api/sms/route';
import * as auth from 'next-auth';
import * as twilio from '@/lib/sms/twilio';

// Mock dependencies
jest.mock('next-auth', () => ({
    getServerSession: jest.fn(),
}));

jest.mock('@/lib/sms/twilio', () => ({
    isTwilioConfigured: jest.fn().mockReturnValue(true),
    sendSMS: jest.fn(),
    sendHealthReminder: jest.fn(),
}));

// Mock console methods to prevent test output noise
global.console.info = jest.fn();
global.console.warn = jest.fn();
global.console.error = jest.fn();

describe('SMS API', () => {
    let req: NextRequest;

    beforeEach(() => {
        jest.clearAllMocks();

        // Create a mock request
        req = {
            json: jest.fn(),
        } as unknown as NextRequest;

        // Default mock implementations
        (twilio.sendSMS as jest.Mock).mockResolvedValue({
            success: true,
            sid: 'SMS123456',
            status: 'sent'
        });

        (twilio.sendHealthReminder as jest.Mock).mockResolvedValue({
            success: true,
            sid: 'SMS789012',
            status: 'sent'
        });
    });

    describe('Authentication and Authorization', () => {
        test('returns 401 when not authenticated', async () => {
            // No session
            (auth.getServerSession as jest.Mock).mockResolvedValueOnce(null);

            // Check authentication errors
            const response = await POST(req);
            expect(response.status).toBe(401);
        });

        test('returns 403 when user is not admin or provider', async () => {
            // User is a patient
            (auth.getServerSession as jest.Mock).mockResolvedValueOnce({
                user: { id: 'user123', role: 'patient' }
            });

            // Check if the response is 403 Forbidden
            const response = await POST(req);
            expect(response.status).toBe(403);
        });
    });

    describe('Validation', () => {
        beforeEach(() => {
            // Set up valid session for these tests
            (auth.getServerSession as jest.Mock).mockResolvedValue({
                user: { id: 'provider123', role: 'provider' }
            });
        });

        test('returns 400 for missing required fields', async () => {
            (req.json as jest.Mock).mockResolvedValueOnce({
                // Missing phoneNumber and other required fields
                messageType: 'general'
            });

            const response = await POST(req);
            expect(response.status).toBe(400);
        });

        test('returns 400 for invalid phone number format', async () => {
            (req.json as jest.Mock).mockResolvedValueOnce({
                phoneNumber: '1234567890', // Missing + prefix
                messageType: 'general',
                content: 'Test message'
            });

            const response = await POST(req);
            expect(response.status).toBe(400);
        });
    });

    describe('SMS Sending', () => {
        beforeEach(() => {
            // Set up valid session for these tests
            (auth.getServerSession as jest.Mock).mockResolvedValue({
                user: { id: 'provider123', role: 'provider' }
            });
        });

        test('successfully sends a general SMS message', async () => {
            (req.json as jest.Mock).mockResolvedValueOnce({
                phoneNumber: '+1234567890',
                messageType: 'general',
                content: 'This is a test message'
            });

            const response = await POST(req);
            const data = await response.json();

            expect(twilio.sendSMS).toHaveBeenCalledWith('+1234567890', 'This is a test message');
            expect(response.status).toBe(200);
            expect(data).toHaveProperty('success', true);
            expect(data).toHaveProperty('messageId', 'SMS123456');
            expect(data).toHaveProperty('timestamp');
        });

        test('successfully sends a health reminder', async () => {
            (req.json as jest.Mock).mockResolvedValueOnce({
                phoneNumber: '+1234567890',
                messageType: 'reminder',
                recipientName: 'John Doe',
                content: {
                    reminderType: 'appointment',
                    details: 'Doctor visit on Monday at 2 PM'
                }
            });

            const response = await POST(req);
            const data = await response.json();

            expect(twilio.sendHealthReminder).toHaveBeenCalledWith(
                '+1234567890',
                'John Doe',
                'appointment',
                'Doctor visit on Monday at 2 PM'
            );

            expect(response.status).toBe(200);
            expect(data).toHaveProperty('success', true);
            expect(data).toHaveProperty('messageId', 'SMS789012');
        });

        test('returns 503 when Twilio is not configured', async () => {
            // Override the mock to indicate Twilio is not configured
            (twilio.isTwilioConfigured as jest.Mock).mockReturnValueOnce(false);

            (req.json as jest.Mock).mockResolvedValueOnce({
                phoneNumber: '+1234567890',
                messageType: 'general',
                content: 'Test message'
            });

            const response = await POST(req);
            const data = await response.json();

            expect(response.status).toBe(503);
            expect(data).toHaveProperty('code', 'TWILIO_NOT_CONFIGURED');
        });

        test('handles Twilio API errors', async () => {
            (req.json as jest.Mock).mockResolvedValueOnce({
                phoneNumber: '+1234567890',
                messageType: 'general',
                content: 'Test message'
            });

            // Simulate a Twilio error
            const twilioError = new Error('Invalid phone number') as unknown as { code: string };
            twilioError.code = 'TWILIO_INVALID_NUMBER';
            (twilio.sendSMS as jest.Mock).mockRejectedValueOnce(twilioError);

            const response = await POST(req);
            const data = await response.json();

            expect(response.status).toBe(400);
            expect(data).toHaveProperty('code', 'TWILIO_INVALID_NUMBER');
        });
    });
});
