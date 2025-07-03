import { NextRequest } from 'next/server';
import { GET } from '@/app/api/health/route';

describe('Health Check API', () => {
    test('returns 200 status with health information', async () => {
        const response = await GET();
        const data = await response.json();

        // Check status code
        expect(response.status).toBe(200);

        // Check response structure
        expect(data).toHaveProperty('status', 'ok');
        expect(data).toHaveProperty('message', 'Service is healthy');
        expect(data).toHaveProperty('timestamp');
        expect(data).toHaveProperty('uptime');
        expect(data).toHaveProperty('memory');
        expect(data).toHaveProperty('node');

        // Validate timestamp format
        const timestamp = new Date(data.timestamp);
        expect(timestamp).toBeInstanceOf(Date);
        expect(timestamp.toString()).not.toBe('Invalid Date');
    });

    test('includes cache control headers', async () => {
        const response = await GET();

        // Check cache control headers
        expect(response.headers.get('Cache-Control')).toBe('no-store, max-age=0');
    });
});
