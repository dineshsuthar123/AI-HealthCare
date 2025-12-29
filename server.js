/**
 * Custom Next.js Server with Socket.IO Support
 * 
 * This server enables WebSocket connections for real-time consultations.
 * Run with: npm run dev:socket
 */

const { createServer } = require('http');
const { parse } = require('url');
const next = require('next');
const { Server: SocketIOServer } = require('socket.io');

const dev = process.env.NODE_ENV !== 'production';
const hostname = 'localhost';
const port = parseInt(process.env.PORT || '3000', 10);

// Initialize Next.js
const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

// Room management for consultations
const rooms = new Map();

function createRoom(roomId) {
    return {
        id: roomId,
        participants: new Map(),
        messages: [],
        callActive: false,
        createdAt: new Date()
    };
}

app.prepare().then(() => {
    const server = createServer((req, res) => {
        const parsedUrl = parse(req.url, true);
        handle(req, res, parsedUrl);
    });

    // Initialize Socket.IO
    const io = new SocketIOServer(server, {
        path: '/api/socket',
        addTrailingSlash: false,
        cors: {
            origin: '*',
            methods: ['GET', 'POST']
        },
        transports: ['websocket', 'polling']
    });

    console.log('Socket.IO server initialized');

    io.on('connection', (socket) => {
        console.log(`User connected: ${socket.id}`);
        let currentRoom = null;
        let currentUserId = null;

        // Join a consultation room
        socket.on('join-room', (roomId, userId, userInfo) => {
            console.log(`User ${userId} (${userInfo?.name}) joining room ${roomId}`);
            
            currentRoom = roomId;
            currentUserId = userId;

            // Create room if it doesn't exist
            if (!rooms.has(roomId)) {
                rooms.set(roomId, createRoom(roomId));
            }

            const room = rooms.get(roomId);
            
            // Add participant to room
            const participant = {
                socketId: socket.id,
                userId: userId,
                name: userInfo?.name || 'Unknown',
                role: userInfo?.role || 'patient',
                callMode: userInfo?.callMode || 'text',
                joinedAt: new Date()
            };
            room.participants.set(userId, participant);

            // Join socket room
            socket.join(roomId);

            // Notify other participants
            socket.to(roomId).emit('user-connected', userId, {
                name: userInfo?.name,
                role: userInfo?.role
            });

            // Send current participants list
            const participantsList = Array.from(room.participants.values()).map(p => ({
                id: p.userId,
                name: p.name,
                role: p.role,
                isConnected: true,
                isMuted: false,
                isVideoOff: false
            }));
            socket.emit('room-state', participantsList);

            // Send message history
            if (room.messages.length > 0) {
                socket.emit('message-history', room.messages);
            }

            // System message for joining
            const joinMessage = {
                id: `sys_${Date.now()}`,
                sender: 'system',
                senderName: 'System',
                content: `${userInfo?.name || 'Someone'} joined the consultation`,
                timestamp: new Date(),
                type: 'system'
            };
            room.messages.push(joinMessage);
            io.to(roomId).emit('chat-message', joinMessage);
        });

        // Handle WebRTC signaling
        socket.on('signal', (data) => {
            console.log(`Signal from ${data.userId} to ${data.targetId}`);
            // Find target's socket and send signal
            const room = rooms.get(data.roomId);
            if (room) {
                const targetParticipant = room.participants.get(data.targetId);
                if (targetParticipant) {
                    io.to(targetParticipant.socketId).emit('signal', {
                        userId: data.userId,
                        signal: data.signal
                    });
                }
            }
        });

        // Broadcast signal to room
        socket.on('signal-room', (data) => {
            socket.to(data.roomId).emit('signal', {
                userId: data.userId,
                signal: data.signal
            });
        });

        // Handle call requests
        socket.on('call-request', (targetId, fromName, mode) => {
            const room = rooms.get(currentRoom);
            if (room) {
                const target = room.participants.get(targetId);
                if (target) {
                    io.to(target.socketId).emit('call-request', currentUserId, fromName, mode);
                }
            }
        });

        socket.on('call-accepted', (targetId) => {
            const room = rooms.get(currentRoom);
            if (room) {
                const target = room.participants.get(targetId);
                if (target) {
                    room.callActive = true;
                    room.callStartedAt = new Date();
                    io.to(target.socketId).emit('call-accepted', currentUserId);
                }
            }
        });

        socket.on('call-rejected', (targetId) => {
            const room = rooms.get(currentRoom);
            if (room) {
                const target = room.participants.get(targetId);
                if (target) {
                    io.to(target.socketId).emit('call-rejected', currentUserId);
                }
            }
        });

        socket.on('end-call', () => {
            if (currentRoom) {
                const room = rooms.get(currentRoom);
                if (room) {
                    room.callActive = false;
                    io.to(currentRoom).emit('call-ended', currentUserId);
                }
            }
        });

        // Handle chat messages
        socket.on('send-message', (roomId, message, metadata) => {
            const room = rooms.get(roomId);
            if (room) {
                const chatMessage = {
                    id: `msg_${Date.now()}`,
                    sender: currentUserId,
                    senderName: metadata?.senderName || 'Unknown',
                    content: message,
                    timestamp: new Date(),
                    type: 'text'
                };
                room.messages.push(chatMessage);
                io.to(roomId).emit('chat-message', chatMessage);
            }
        });

        // Typing indicator
        socket.on('typing-start', (roomId) => {
            const room = rooms.get(roomId);
            if (room) {
                const participant = room.participants.get(currentUserId);
                socket.to(roomId).emit('typing', participant?.name || 'Someone');
            }
        });

        socket.on('typing-stop', (roomId) => {
            socket.to(roomId).emit('typing-stop');
        });

        // Media controls
        socket.on('toggle-audio', (roomId, isMuted) => {
            socket.to(roomId).emit('participant-audio-toggle', currentUserId, isMuted);
        });

        socket.on('toggle-video', (roomId, isVideoOff) => {
            socket.to(roomId).emit('participant-video-toggle', currentUserId, isVideoOff);
        });

        // Handle disconnection
        socket.on('disconnect', () => {
            console.log(`User disconnected: ${socket.id}`);
            
            if (currentRoom && currentUserId) {
                const room = rooms.get(currentRoom);
                if (room) {
                    const participant = room.participants.get(currentUserId);
                    
                    // Remove participant
                    room.participants.delete(currentUserId);
                    
                    // Notify others
                    socket.to(currentRoom).emit('user-disconnected', currentUserId);
                    
                    // System message
                    const leaveMessage = {
                        id: `sys_${Date.now()}`,
                        sender: 'system',
                        senderName: 'System',
                        content: `${participant?.name || 'Someone'} left the consultation`,
                        timestamp: new Date(),
                        type: 'system'
                    };
                    room.messages.push(leaveMessage);
                    io.to(currentRoom).emit('chat-message', leaveMessage);

                    // Clean up empty rooms
                    if (room.participants.size === 0) {
                        rooms.delete(currentRoom);
                        console.log(`Room ${currentRoom} deleted (empty)`);
                    }
                }
            }
        });
    });

    server.listen(port, () => {
        console.log(`
🏥 AI-HealthCare Server Ready!
   
   Local:        http://${hostname}:${port}
   Socket.IO:    ws://${hostname}:${port}/api/socket
   
   WebSocket support: ✓ Enabled
   Real-time calls:   ✓ Ready
        `);
    });
});
