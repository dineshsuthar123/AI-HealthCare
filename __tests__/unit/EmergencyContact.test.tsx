import { describe, it, expect, jest, beforeEach, afterEach } from '@jest/globals';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { EmergencyContact } from '@/components/symptom-checker/emergency-contact';
import '@testing-library/jest-dom';
import type { AIAnalysis } from '@/lib/ai/symptom-analyzer';

// Create a mock AIAnalysis object with appropriate types
const createMockAnalysis = (
    riskLevel: AIAnalysis['riskLevel'] = 'low',
    urgency: AIAnalysis['urgency'] = 'routine'
): AIAnalysis => ({
    riskLevel,
    urgency,
    recommendations: ['Test recommendation'],
    possibleConditions: [
        {
            condition: 'Test condition',
            probability: 50,
            description: 'Test description'
        }
    ]
});

// Mock next-intl's useTranslations hook
jest.mock('next-intl', () => ({
    useTranslations: () => (key) => {
        const translations = {
            'emergencyContact.title': 'Notify Emergency Contact',
            'emergencyContact.nameLabel': 'Contact Name',
            'emergencyContact.namePlaceholder': 'Enter contact name',
            'emergencyContact.phoneLabel': 'Phone Number (with country code)',
            'emergencyContact.phonePlaceholder': 'e.g. +1234567890',
            'emergencyContact.phoneHelp': 'Must include country code (e.g., +1 for US)',
            'emergencyContact.sendAlert': 'Send Alert',
            'emergencyContact.cancel': 'Cancel',
            'emergencyContact.successMessage': 'Emergency contact has been notified.',
            'emergencyContact.errorMessage': 'Failed to send emergency contact. Please try again or call emergency services directly.',
            'emergencyContact.validationError': 'Please provide both name and phone number for emergency contact'
        };
        return translations[key] || key;
    }
}));

// Mock the fetch function
global.fetch = jest.fn().mockImplementation(() =>
    Promise.resolve({
        ok: true,
        json: () => Promise.resolve({}),
    })
) as jest.Mock;

describe('EmergencyContact Component', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    afterEach(() => {
        jest.resetAllMocks();
    });

    it('should not render when risk level is not critical and urgency is not emergency', () => {
        const { container } = render(
            <EmergencyContact
                analysis={createMockAnalysis('medium', 'routine')}
                symptoms={['headache', 'fever']}
            />
        );

        expect(container.firstChild).toBeNull();
    });

    it('should render when risk level is critical', () => {
        render(
            <EmergencyContact
                analysis={createMockAnalysis('critical', 'urgent')}
                symptoms={['headache', 'fever']}
            />
        );

        expect(screen.getByText('Notify Emergency Contact')).toBeInTheDocument();
    });

    it('should render when urgency is emergency', () => {
        render(
            <EmergencyContact
                analysis={createMockAnalysis('high', 'emergency')}
                symptoms={['headache', 'fever']}
            />
        );

        expect(screen.getByText('Notify Emergency Contact')).toBeInTheDocument();
    });

    it('should show form when button is clicked', async () => {
        render(
            <EmergencyContact
                analysis={{ riskLevel: 'critical', urgency: 'urgent' } as any}
                symptoms={['headache', 'fever']}
            />
        );

        fireEvent.click(screen.getByText('Notify Emergency Contact'));

        expect(screen.getByText('Contact Name')).toBeInTheDocument();
        expect(screen.getByText('Phone Number (with country code)')).toBeInTheDocument();
    }); it('should show error when form is submitted with empty fields', async () => {
        render(
            <EmergencyContact
                analysis={createMockAnalysis('critical', 'urgent')}
                symptoms={['headache', 'fever']}
            />
        );

        // Show the form
        fireEvent.click(screen.getByText('Notify Emergency Contact'));

        // Get the form
        const form = screen.getByTestId('emergency-form');

        // Submit the empty form
        fireEvent.submit(form);

        // We need to explicitly set the error directly in our test
        await waitFor(() => {
            expect(screen.getByRole('alert')).toBeInTheDocument();
        });
    });

    it('should send alert when form is submitted with valid data', async () => {
        // Mock a successful fetch response
        (global.fetch as jest.Mock).mockResolvedValueOnce({
            ok: true,
            json: async () => ({ success: true })
        });

        render(
            <EmergencyContact
                analysis={createMockAnalysis('critical', 'urgent')}
                symptoms={['headache', 'fever']}
            />
        );

        // Open the form
        fireEvent.click(screen.getByText('Notify Emergency Contact'));

        // Fill in the form
        fireEvent.change(screen.getByPlaceholderText('Enter contact name'), {
            target: { value: 'John Doe' }
        });

        fireEvent.change(screen.getByPlaceholderText('e.g. +1234567890'), {
            target: { value: '+1234567890' }
        });

        // Submit the form
        fireEvent.click(screen.getByText('Send Alert'));

        // Wait for the API call to complete
        await waitFor(() => {
            expect(global.fetch).toHaveBeenCalledWith('/api/sms', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    messageType: 'alert',
                    phoneNumber: '+1234567890',
                    recipientName: 'John Doe',
                    content: 'MEDICAL ALERT: headache, fever. Please seek medical attention immediately.'
                }),
            });
        });

        // Success message should be shown
        await waitFor(() => {
            expect(screen.getByText('Emergency contact has been notified.')).toBeInTheDocument();
        });
    });

    it('should show error when API call fails', async () => {
        // Mock a failed fetch response
        (global.fetch as jest.Mock).mockResolvedValueOnce({
            ok: false,
            json: async () => ({ error: 'Service unavailable' })
        });

        render(
            <EmergencyContact
                analysis={createMockAnalysis('critical', 'urgent')}
                symptoms={['headache', 'fever']}
            />
        );

        // Open the form
        fireEvent.click(screen.getByText('Notify Emergency Contact'));

        // Fill in the form
        fireEvent.change(screen.getByPlaceholderText('Enter contact name'), {
            target: { value: 'John Doe' }
        });

        fireEvent.change(screen.getByPlaceholderText('e.g. +1234567890'), {
            target: { value: '+1234567890' }
        });

        // Submit the form
        fireEvent.click(screen.getByText('Send Alert'));

        // Wait for the API call to complete
        await waitFor(() => {
            expect(screen.getByText('Failed to send emergency contact. Please try again or call emergency services directly.')).toBeInTheDocument();
        });
    });
});
