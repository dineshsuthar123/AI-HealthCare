/**
 * Enhanced Socket Server for Real-time Communication
 * Supports video/audio calls, text chat, and consultation management
 */

import { Server as NetServer } from 'http';
import { Server as SocketIOServer, Socket } from 'socket.io';

let io: SocketIOServer | null = null;

// Room management
interface RoomParticipant {
    socketId: string;
    userId: string;
    name: string;
    role: 'patient' | 'provider';
    callMode: 'video' | 'audio' | 'text';
    joinedAt: Date;
}

interface Room {
    id: string;
    participants: Map<string, RoomParticipant>;
    messages: ChatMessage[];
    callActive: boolean;
    callStartedAt?: Date;
    createdAt: Date;
}

interface ChatMessage {
    id: string;
    sender: string;
    senderName: string;
    content: string;
    timestamp: Date;
    type: 'text' | 'file' | 'image' | 'system';
    fileUrl?: string;
    fileName?: string;
}

const rooms = new Map<string, Room>();

export function initSocketServer(server: NetServer) {
    if (!io) {
        console.log('Initializing enhanced socket.io server...');

        io = new SocketIOServer(server, {
            path: '/api/socket',
            addTrailingSlash: false,
            cors: {
                origin: '*',
                methods: ['GET', 'POST']
            },
            transports: ['websocket', 'polling']
        });

        io.on('connection', (socket: Socket) => {
            console.log(`User connected: ${socket.id}`);

            // Join a consultation room
            socket.on('join-room', (roomId: string, userId: string, userInfo: {
                name: string;
                role: 'patient' | 'provider';
                callMode: 'video' | 'audio' | 'text';
            }) => {
                console.log(`User ${userId} (${userInfo.name}) joining room ${roomId}`);
                
                // Create room if it doesn't exist
                if (!rooms.has(roomId)) {
                    rooms.set(roomId, {
                        id: roomId,
                        participants: new Map(),
                        messages: [],
                        callActive: false,
                        createdAt: new Date()
                    });
                }

                const room = rooms.get(roomId)!;
                
                // Add participant to room
                const participant: RoomParticipant = {
                    socketId: socket.id,
                    userId,
                    name: userInfo.name,
                    role: userInfo.role,
                    callMode: userInfo.callMode,
                    joinedAt: new Date()
                };
                room.participants.set(userId, participant);

                // Join socket room
                socket.join(roomId);

                // Notify other participants
                socket.to(roomId).emit('user-connected', userId, {
                    name: userInfo.name,
                    role: userInfo.role
                });

                // Send current room state to the joining user
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

                // Add system message for join
                const joinMessage: ChatMessage = {
                    id: `sys_${Date.now()}`,
                    sender: 'system',
                    senderName: 'System',
                    content: `${userInfo.name} joined the consultation`,
                    timestamp: new Date(),
                    type: 'system'
                };
                room.messages.push(joinMessage);
                io?.to(roomId).emit('receive-message', joinMessage);

                // Handle disconnection
                socket.on('disconnect', () => {
                    console.log(`User ${userId} disconnected from room ${roomId}`);
                    
                    if (rooms.has(roomId)) {
                        const room = rooms.get(roomId)!;
                        room.participants.delete(userId);
                        
                        // Notify other participants
                        socket.to(roomId).emit('user-disconnected', userId);

                        // Add system message for leave
                        const leaveMessage: ChatMessage = {
                            id: `sys_${Date.now()}`,
                            sender: 'system',
                            senderName: 'System',
                            content: `${userInfo.name} left the consultation`,
                            timestamp: new Date(),
                            type: 'system'
                        };
                        room.messages.push(leaveMessage);
                        io?.to(roomId).emit('receive-message', leaveMessage);

                        // Clean up empty rooms after a delay
                        if (room.participants.size === 0) {
                            setTimeout(() => {
                                if (rooms.has(roomId) && rooms.get(roomId)!.participants.size === 0) {
                                    rooms.delete(roomId);
                                    console.log(`Room ${roomId} cleaned up`);
                                }
                            }, 30000);
                        }
                    }
                });
            });

            // Leave room explicitly
            socket.on('leave-room', (roomId: string, userId: string) => {
                socket.leave(roomId);
                if (rooms.has(roomId)) {
                    const room = rooms.get(roomId)!;
                    const participant = room.participants.get(userId);
                    room.participants.delete(userId);
                    
                    socket.to(roomId).emit('user-disconnected', userId);
                    
                    if (participant) {
                        const leaveMessage: ChatMessage = {
                            id: `sys_${Date.now()}`,
                            sender: 'system',
                            senderName: 'System',
                            content: `${participant.name} left the consultation`,
                            timestamp: new Date(),
                            type: 'system'
                        };
                        room.messages.push(leaveMessage);
                        io?.to(roomId).emit('receive-message', leaveMessage);
                    }
                }
            });

            // WebRTC signaling
            socket.on('signal', (data: { userId: string; roomId: string; signal: unknown }) => {
                console.log(`Signal from ${data.userId} in room ${data.roomId}`);
                socket.to(data.roomId).emit('signal', { 
                    userId: data.userId, 
                    signal: data.signal 
                });
            });

            // Call request
            socket.on('call-request', (data: {
                roomId: string;
                from: string;
                fromName: string;
                to?: string;
                mode: 'video' | 'audio' | 'text';
            }) => {
                console.log(`Call request from ${data.from} in room ${data.roomId}`);
                
                if (rooms.has(data.roomId)) {
                    const room = rooms.get(data.roomId)!;
                    room.callActive = true;
                    room.callStartedAt = new Date();
                }

                socket.to(data.roomId).emit('call-request', {
                    from: data.from,
                    fromName: data.fromName,
                    mode: data.mode
                });
            });

            // Call accepted
            socket.on('call-accepted', (data: { roomId: string; from: string }) => {
                console.log(`Call accepted by ${data.from} in room ${data.roomId}`);
                socket.to(data.roomId).emit('call-accepted', { from: data.from });
            });

            // Call rejected
            socket.on('call-rejected', (data: { roomId: string; from: string }) => {
                console.log(`Call rejected by ${data.from} in room ${data.roomId}`);
                socket.to(data.roomId).emit('call-rejected', { from: data.from });
                
                if (rooms.has(data.roomId)) {
                    const room = rooms.get(data.roomId)!;
                    room.callActive = false;
                }
            });

            // Call ended
            socket.on('call-ended', (data: { roomId: string; from: string }) => {
                console.log(`Call ended by ${data.from} in room ${data.roomId}`);
                socket.to(data.roomId).emit('call-ended');
                
                if (rooms.has(data.roomId)) {
                    const room = rooms.get(data.roomId)!;
                    room.callActive = false;
                    
                    // Add system message
                    const endMessage: ChatMessage = {
                        id: `sys_${Date.now()}`,
                        sender: 'system',
                        senderName: 'System',
                        content: 'Call ended',
                        timestamp: new Date(),
                        type: 'system'
                    };
                    room.messages.push(endMessage);
                    io?.to(data.roomId).emit('receive-message', endMessage);
                }
            });

            // Chat messages
            socket.on('send-message', (data: { roomId: string; message: ChatMessage }) => {
                console.log(`Message in room ${data.roomId} from ${data.message.senderName}`);
                
                if (rooms.has(data.roomId)) {
                    const room = rooms.get(data.roomId)!;
                    room.messages.push(data.message);
                }
                
                io?.to(data.roomId).emit('receive-message', data.message);
            });

            // Typing indicator
            socket.on('typing-start', (data: { roomId: string; userId: string; userName: string }) => {
                socket.to(data.roomId).emit('user-typing', { 
                    userId: data.userId, 
                    userName: data.userName 
                });
            });

            socket.on('typing-stop', (data: { roomId: string; userId: string }) => {
                socket.to(data.roomId).emit('user-stopped-typing', { userId: data.userId });
            });

            // Get room info
            socket.on('get-room-info', (roomId: string, callback: (info: unknown) => void) => {
                if (rooms.has(roomId)) {
                    const room = rooms.get(roomId)!;
                    callback({
                        id: room.id,
                        participantCount: room.participants.size,
                        callActive: room.callActive,
                        createdAt: room.createdAt
                    });
                } else {
                    callback(null);
                }
            });
        });
    }

    return io;
}

export function getSocketServer() {
    return io;
}

export function getRoomInfo(roomId: string) {
    return rooms.get(roomId);
}

export function broadcastToRoom(roomId: string, event: string, data: unknown) {
    if (io) {
        io.to(roomId).emit(event, data);
    }
}
