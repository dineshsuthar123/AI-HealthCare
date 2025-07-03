import {
    ApiError,
    BadRequestError,
    UnauthorizedError,
    ForbiddenError,
    NotFoundError,
    ValidationError,
    InternalServerError,
    handleApiError,
    validateSession,
    HttpStatusCode
} from '@/lib/api-error';
import { NextResponse } from 'next/server';

// Mock NextResponse.json
jest.mock('next/server', () => ({
    NextResponse: {
        json: jest.fn().mockImplementation((body, options) => ({
            body,
            options
        }))
    }
}));

describe('API Error Handling Utilities', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        console.error = jest.fn(); // Mock console.error to avoid cluttering test output
    });

    describe('Error Classes', () => {
        test('ApiError creates a proper error object with default values', () => {
            const error = new ApiError('Something went wrong');

            expect(error).toBeInstanceOf(Error);
            expect(error.name).toBe('ApiError');
            expect(error.message).toBe('Something went wrong');
            expect(error.statusCode).toBe(HttpStatusCode.INTERNAL_SERVER_ERROR);
            expect(error.code).toBe('API_ERROR');
            expect(error.details).toBeUndefined();
        });

        test('ApiError accepts custom status code, code and details', () => {
            const details = { field: 'username', issue: 'already taken' };
            const error = new ApiError(
                'Custom error message',
                HttpStatusCode.BAD_REQUEST,
                'CUSTOM_CODE',
                details
            );

            expect(error.message).toBe('Custom error message');
            expect(error.statusCode).toBe(HttpStatusCode.BAD_REQUEST);
            expect(error.code).toBe('CUSTOM_CODE');
            expect(error.details).toEqual(details);
        });

        test('ApiError.toJSON returns the correct format', () => {
            const error = new ApiError('Test error', HttpStatusCode.NOT_FOUND, 'TEST_ERROR', { id: 'missing' });
            const json = error.toJSON();

            expect(json).toEqual({
                error: 'Test error',
                code: 'TEST_ERROR',
                details: { id: 'missing' }
            });
        });

        test('Specific error classes are properly configured', () => {
            const badRequest = new BadRequestError();
            expect(badRequest.statusCode).toBe(HttpStatusCode.BAD_REQUEST);
            expect(badRequest.name).toBe('BadRequestError');

            const unauthorized = new UnauthorizedError();
            expect(unauthorized.statusCode).toBe(HttpStatusCode.UNAUTHORIZED);
            expect(unauthorized.name).toBe('UnauthorizedError');

            const forbidden = new ForbiddenError();
            expect(forbidden.statusCode).toBe(HttpStatusCode.FORBIDDEN);
            expect(forbidden.name).toBe('ForbiddenError');

            const notFound = new NotFoundError();
            expect(notFound.statusCode).toBe(HttpStatusCode.NOT_FOUND);
            expect(notFound.name).toBe('NotFoundError');

            const validation = new ValidationError({ field: 'error' });
            expect(validation.statusCode).toBe(HttpStatusCode.BAD_REQUEST);
            expect(validation.name).toBe('ValidationError');
            expect(validation.code).toBe('VALIDATION_ERROR');
            expect(validation.details).toEqual({ field: 'error' });

            const internal = new InternalServerError();
            expect(internal.statusCode).toBe(HttpStatusCode.INTERNAL_SERVER_ERROR);
            expect(internal.name).toBe('InternalServerError');
        });
    });

    describe('handleApiError function', () => {
        test('handles ApiError instances correctly', () => {
            const error = new BadRequestError('Invalid input', 'INVALID_INPUT', { field: 'email' });
            handleApiError(error);

            expect(NextResponse.json).toHaveBeenCalledWith(
                {
                    error: 'Invalid input',
                    code: 'INVALID_INPUT'
                },
                { status: HttpStatusCode.BAD_REQUEST }
            );
        });

        test('includes details when includeDetails is true', () => {
            const error = new BadRequestError('Invalid input', 'INVALID_INPUT', { field: 'email' });
            handleApiError(error, true);

            expect(NextResponse.json).toHaveBeenCalledWith(
                {
                    error: 'Invalid input',
                    code: 'INVALID_INPUT',
                    details: { field: 'email' }
                },
                { status: HttpStatusCode.BAD_REQUEST }
            );
        });

        test('handles generic Error instances as internal server errors', () => {
            const error = new Error('Something went wrong');
            handleApiError(error);

            expect(NextResponse.json).toHaveBeenCalledWith(
                {
                    error: 'Internal Server Error',
                    code: 'INTERNAL_ERROR'
                },
                { status: HttpStatusCode.INTERNAL_SERVER_ERROR }
            );
        });

        test('handles non-Error values', () => {
            handleApiError('string error');

            expect(NextResponse.json).toHaveBeenCalledWith(
                {
                    error: 'Internal Server Error',
                    code: 'INTERNAL_ERROR'
                },
                { status: HttpStatusCode.INTERNAL_SERVER_ERROR }
            );
        });

        test('handles MongoDB duplicate key errors', () => {
            const mongoError = new Error('Duplicate key error');
            mongoError.name = 'MongoServerError';
            (mongoError as unknown as { code: number }).code = 11000;

            handleApiError(mongoError);

            expect(NextResponse.json).toHaveBeenCalledWith(
                {
                    error: 'Duplicate entry',
                    code: 'DUPLICATE_ENTITY'
                },
                { status: HttpStatusCode.CONFLICT }
            );
        });
    });

    describe('validateSession function', () => {
        test('throws UnauthorizedError for null session', () => {
            expect(() => validateSession(null)).toThrow(UnauthorizedError);
        });

        test('returns valid session when no role is required', () => {
            const session = { user: { id: '123', role: 'patient' }, expires: '2023-12-31' };
            expect(validateSession(session)).toBe(session);
        });

        test('throws ForbiddenError when user lacks required role', () => {
            const session = { user: { id: '123', role: 'patient' }, expires: '2023-12-31' };
            expect(() => validateSession(session, 'admin')).toThrow(ForbiddenError);
        });

        test('returns session when user has required role (string)', () => {
            const session = { user: { id: '123', role: 'provider' }, expires: '2023-12-31' };
            expect(validateSession(session, 'provider')).toBe(session);
        });

        test('returns session when user has one of required roles (array)', () => {
            const session = { user: { id: '123', role: 'admin' }, expires: '2023-12-31' };
            expect(validateSession(session, ['provider', 'admin'])).toBe(session);
        });
    });
});
