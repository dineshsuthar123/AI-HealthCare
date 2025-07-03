import { createServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';
import { io as ioc } from 'socket.io-client';
import { initSocketServer, getSocketServer } from '@/lib/socket/socket-server';
import { Socket } from 'socket.io-client';

describe('Socket Server', () => {
    let httpServer: ReturnType<typeof createServer>;
    let ioServer: SocketIOServer;
    let clientSocket1: Socket;
    let clientSocket2: Socket;
    const PORT = 3001;

    beforeAll((done) => {
        // Create HTTP server
        httpServer = createServer();

        // Initialize our socket server with the HTTP server
        ioServer = initSocketServer(httpServer);

        // Start listening
        httpServer.listen(PORT, () => {
            // Create client sockets
            clientSocket1 = ioc(`http://localhost:${PORT}`, {
                path: '/api/socket',
                addTrailingSlash: false,
            });

            clientSocket2 = ioc(`http://localhost:${PORT}`, {
                path: '/api/socket',
                addTrailingSlash: false,
            });

            // Wait for sockets to connect before starting tests
            clientSocket1.on('connect', () => {
                clientSocket2.on('connect', done);
            });
        });
    });

    afterAll(() => {
        // Clean up
        ioServer.close();
        clientSocket1.disconnect();
        clientSocket2.disconnect();
        httpServer.close();
    });

    test('should initialize socket server correctly', () => {
        expect(getSocketServer()).toBe(ioServer);
    });

    test('should handle room joining and notify other users', (done) => {
        const roomId = 'test-room-123';
        const userId1 = 'user-1';
        const userId2 = 'user-2';

        // Set up listener for second client to receive user-connected event
        clientSocket2.on('user-connected', (userId) => {
            expect(userId).toBe(userId1);
            done();
        });

        // First client joins the room
        clientSocket1.emit('join-room', roomId, userId1);

        // Second client joins the same room
        clientSocket2.emit('join-room', roomId, userId2);
    });

    test('should relay signaling data between peers', (done) => {
        const roomId = 'test-room-123';
        const userId1 = 'user-1';
        const testSignal = { type: 'offer', sdp: 'test-sdp-data' };

        // Set up listener on second client to receive signal
        clientSocket2.on('signal', (data) => {
            expect(data.userId).toBe(userId1);
            expect(data.signal).toEqual(testSignal);
            done();
        });

        // First client sends signal
        clientSocket1.emit('signal', {
            userId: userId1,
            roomId,
            signal: testSignal
        });
    });

    test('should broadcast chat messages to all users in the room', (done) => {
        const roomId = 'test-room-123';
        const testMessage = 'Hello, this is a test message';
        const sender = 'user-1';

        // Set up listener for receiving messages
        clientSocket2.on('receive-message', (data) => {
            expect(data.message).toBe(testMessage);
            expect(data.sender).toBe(sender);
            expect(data.timestamp).toBeDefined();
            done();
        });

        // Send a test message
        clientSocket1.emit('send-message', {
            roomId,
            message: testMessage,
            sender
        });
    });
});
