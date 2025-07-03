import { render, screen } from '@testing-library/react';
import { VideoCall } from '@/components/consultations/video-call';
import * as socketio from 'socket.io-client';

// Mock socket.io-client
jest.mock('socket.io-client', () => {
    const mockSocket = {
        emit: jest.fn(),
        on: jest.fn(),
        disconnect: jest.fn(),
    };

    return {
        io: jest.fn(() => mockSocket),
    };
});

// Mock simple-peer
jest.mock('simple-peer', () => {
    return jest.fn().mockImplementation(() => ({
        on: jest.fn(),
        signal: jest.fn(),
        destroy: jest.fn(),
    }));
});

// Mock browser APIs
const mockMediaStream = {
    getTracks: jest.fn().mockReturnValue([{ stop: jest.fn() }]),
    getVideoTracks: jest.fn().mockReturnValue([{ enabled: true }]),
    getAudioTracks: jest.fn().mockReturnValue([{ enabled: true }]),
};

const mockMediaDevices = {
    getUserMedia: jest.fn().mockResolvedValue(mockMediaStream),
};

Object.defineProperty(global.navigator, 'mediaDevices', {
    writable: true,
    value: mockMediaDevices,
});

describe('VideoCall Component', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    test('renders the VideoCall component', () => {
        render(
            <VideoCall
                consultationId="test-consultation-id"
                userId="user-123"
                userName="Test User"
                isProvider={false}
            />
        );

        // Basic rendering tests
        expect(screen.getByText(/make call/i)).toBeTruthy();
        expect(screen.getByText(/mute/i)).toBeTruthy();
        expect(screen.getByText(/turn off video/i)).toBeTruthy();
        expect(screen.getByPlaceholderText(/type a message/i)).toBeTruthy();
        expect(screen.getByText(/send/i)).toBeTruthy();
    });

    test('socket.io is initialized with correct path', () => {
        render(
            <VideoCall
                consultationId="test-consultation-id"
                userId="user-123"
                userName="Test User"
                isProvider={false}
            />
        );

        expect(socketio.io).toHaveBeenCalledWith('', {
            path: '/api/socket',
            addTrailingSlash: false,
        });
    });
});
