import { NextApiResponse } from 'next';
import { Server as NetServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';
// Removed unused import
// import { Socket } from 'net';

export interface ServerIO extends NetServer {
    io?: SocketIOServer;
}

export interface SocketWithIO {
    server: ServerIO;
}

export interface NextApiResponseServerIO extends NextApiResponse {
    socket: SocketWithIO;
}

export interface UserConnection {
    userId: string;
    socketId: string;
}

export interface ConsultationRoom {
    roomId: string;
    participants: UserConnection[];
}

export interface ChatMessage {
    roomId: string;
    message: string;
    sender: string;
    timestamp: Date;
}

export interface SignalData {
    userId: string;
    roomId: string;
    signal: unknown; // WebRTC signaling data
}
