'use client';

import { io, Socket } from 'socket.io-client';

export type CallMode = 'video' | 'audio' | 'text' | 'in-person' | 'message';
export type ConnectionState = 'connecting' | 'connected' | 'disconnected' | 'failed';

export interface ChatMessage {
    id: string;
    senderId: string;
    senderName: string;
    content: string;
    timestamp: Date;
    type: 'text' | 'system';
}

export interface Participant {
    id: string;
    name: string;
    role: 'patient' | 'provider';
    isConnected: boolean;
    stream?: MediaStream;
}

// Define event types
export interface SignalingEventMap {
    onConnectionStateChange: [state: ConnectionState];
    onParticipantJoined: [participant: Participant];
    onParticipantLeft: [participantId: string];
    onRemoteStream: [stream: MediaStream];
    onChatMessage: [message: ChatMessage];
    onTyping: [userId: string];
    onCallRequest: [fromId: string, fromName: string, mode: CallMode];
    onCallAccepted: [];
    onCallRejected: [];
    onCallEnded: [];
    onError: [error: { message: string }];
}

type EventName = keyof SignalingEventMap;

export class SignalingService {
    private socket: Socket | null = null;
    private peerConnection: RTCPeerConnection | null = null;
    private consultationId: string;
    private userId: string;
    private userName: string;
    private userRole: 'patient' | 'provider';
    private localStream: MediaStream | null = null;
    private eventListeners: Map<string, ((...args: unknown[]) => void)[]> = new Map();
    private connectionState: ConnectionState = 'connecting';

    private readonly iceServers: RTCIceServer[] = [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' },
    ];

    constructor(
        consultationId: string,
        userId: string,
        userName: string,
        userRole: 'patient' | 'provider'
    ) {
        this.consultationId = consultationId;
        this.userId = userId;
        this.userName = userName;
        this.userRole = userRole;
    }

    on<E extends EventName>(event: E, callback: (...args: SignalingEventMap[E]) => void): void {
        const listeners = this.eventListeners.get(event) || [];
        listeners.push(callback as (...args: unknown[]) => void);
        this.eventListeners.set(event, listeners);
    }

    off<E extends EventName>(event: E, callback: (...args: SignalingEventMap[E]) => void): void {
        const listeners = this.eventListeners.get(event) || [];
        this.eventListeners.set(event, listeners.filter(l => l !== callback));
    }

    private emit<E extends EventName>(event: E, ...args: SignalingEventMap[E]): void {
        const listeners = this.eventListeners.get(event) || [];
        listeners.forEach(callback => callback(...args));
    }

    getLocalStream(): MediaStream | null {
        return this.localStream;
    }

    async initialize(mode: CallMode): Promise<void> {
        // Connect to Socket.IO server
        const socketUrl = process.env.NEXT_PUBLIC_SOCKET_URL || window.location.origin;
        
        this.socket = io(socketUrl, {
            path: '/api/socket',
            transports: ['websocket', 'polling'],
        });

        this.socket.on('connect', () => {
            console.log('Socket connected');
            this.connectionState = 'connected';
            this.emit('onConnectionStateChange', this.connectionState);
            this.joinRoom();
        });

        this.socket.on('disconnect', () => {
            this.connectionState = 'disconnected';
            this.emit('onConnectionStateChange', this.connectionState);
        });

        this.socket.on('user-joined', (data: { id: string; name: string; role: 'patient' | 'provider' }) => {
            const participant: Participant = {
                id: data.id,
                name: data.name,
                role: data.role,
                isConnected: true,
            };
            this.emit('onParticipantJoined', participant);
        });

        this.socket.on('user-left', (data: { id: string }) => {
            this.emit('onParticipantLeft', data.id);
        });

        this.socket.on('message', (message: ChatMessage) => {
            this.emit('onChatMessage', message);
        });

        this.socket.on('typing', (data: { userId: string }) => {
            this.emit('onTyping', data.userId);
        });

        this.socket.on('call-request', (data: { from: string; name: string; mode: CallMode }) => {
            this.emit('onCallRequest', data.from, data.name, data.mode);
        });

        this.socket.on('call-accepted', () => {
            this.emit('onCallAccepted');
        });

        this.socket.on('call-rejected', () => {
            this.emit('onCallRejected');
        });

        this.socket.on('call-ended', () => {
            this.emit('onCallEnded');
        });

        // WebRTC signaling
        this.socket.on('offer', async (data: { sdp: RTCSessionDescriptionInit }) => {
            await this.handleOffer(data.sdp);
        });

        this.socket.on('answer', async (data: { sdp: RTCSessionDescriptionInit }) => {
            await this.handleAnswer(data.sdp);
        });

        this.socket.on('ice-candidate', async (data: { candidate: RTCIceCandidateInit }) => {
            await this.handleIceCandidate(data.candidate);
        });

        this.socket.on('error', (error: string) => {
            this.connectionState = 'failed';
            this.emit('onConnectionStateChange', this.connectionState);
            this.emit('onError', { message: error });
        });

        // Get local media stream if needed
        if (mode === 'video' || mode === 'audio') {
            await this.getLocalMedia(mode);
        }
    }

    private async getLocalMedia(mode: CallMode): Promise<void> {
        try {
            const constraints: MediaStreamConstraints = {
                audio: true,
                video: mode === 'video',
            };

            this.localStream = await navigator.mediaDevices.getUserMedia(constraints);
        } catch (error) {
            console.error('Error getting local media:', error);
            this.emit('onError', { message: 'Failed to access camera/microphone' });
        }
    }

    private joinRoom(): void {
        this.socket?.emit('join-room', {
            roomId: this.consultationId,
            userId: this.userId,
            userName: this.userName,
            userRole: this.userRole,
        });
    }

    async startCall(mode: CallMode): Promise<MediaStream | null> {
        if (mode === 'text' || mode === 'in-person' || mode === 'message') {
            this.socket?.emit('start-call', {
                roomId: this.consultationId,
                mode,
            });
            return null;
        }

        try {
            const constraints: MediaStreamConstraints = {
                audio: true,
                video: mode === 'video',
            };

            this.localStream = await navigator.mediaDevices.getUserMedia(constraints);
            
            // Initialize peer connection
            await this.initPeerConnection();

            // Add local tracks to peer connection
            this.localStream.getTracks().forEach(track => {
                if (this.peerConnection && this.localStream) {
                    this.peerConnection.addTrack(track, this.localStream);
                }
            });

            // Create and send offer
            const offer = await this.peerConnection!.createOffer();
            await this.peerConnection!.setLocalDescription(offer);

            this.socket?.emit('offer', {
                roomId: this.consultationId,
                sdp: offer,
            });

            return this.localStream;
        } catch (error) {
            console.error('Error starting call:', error);
            this.emit('onError', { message: 'Failed to start call' });
            return null;
        }
    }

    private async initPeerConnection(): Promise<void> {
        this.peerConnection = new RTCPeerConnection({
            iceServers: this.iceServers,
        });

        this.peerConnection.onicecandidate = (event) => {
            if (event.candidate) {
                this.socket?.emit('ice-candidate', {
                    roomId: this.consultationId,
                    candidate: event.candidate,
                });
            }
        };

        this.peerConnection.ontrack = (event) => {
            if (event.streams[0]) {
                this.emit('onRemoteStream', event.streams[0]);
            }
        };

        this.peerConnection.onconnectionstatechange = () => {
            const state = this.peerConnection?.connectionState;
            console.log('Connection state:', state);
            if (state === 'connected') {
                this.connectionState = 'connected';
            } else if (state === 'failed' || state === 'closed') {
                this.connectionState = 'failed';
            } else if (state === 'disconnected') {
                this.connectionState = 'disconnected';
            }
            this.emit('onConnectionStateChange', this.connectionState);
        };
    }

    private async handleOffer(sdp: RTCSessionDescriptionInit): Promise<void> {
        if (!this.peerConnection) {
            await this.initPeerConnection();
        }

        await this.peerConnection!.setRemoteDescription(new RTCSessionDescription(sdp));
        const answer = await this.peerConnection!.createAnswer();
        await this.peerConnection!.setLocalDescription(answer);

        this.socket?.emit('answer', {
            roomId: this.consultationId,
            sdp: answer,
        });
    }

    private async handleAnswer(sdp: RTCSessionDescriptionInit): Promise<void> {
        if (this.peerConnection) {
            await this.peerConnection.setRemoteDescription(new RTCSessionDescription(sdp));
        }
    }

    private async handleIceCandidate(candidate: RTCIceCandidateInit): Promise<void> {
        if (this.peerConnection) {
            await this.peerConnection.addIceCandidate(new RTCIceCandidate(candidate));
        }
    }

    sendMessage(content: string): void {
        const message: ChatMessage = {
            id: `msg-${Date.now()}`,
            senderId: this.userId,
            senderName: this.userName,
            content,
            timestamp: new Date(),
            type: 'text',
        };

        this.socket?.emit('message', {
            roomId: this.consultationId,
            message,
        });
    }

    sendTyping(): void {
        this.socket?.emit('typing', {
            roomId: this.consultationId,
            userId: this.userId,
        });
    }

    initiateCall(): void {
        this.socket?.emit('call-request', {
            roomId: this.consultationId,
            from: this.userId,
            name: this.userName,
        });
    }

    toggleAudio(): boolean {
        if (this.localStream) {
            const audioTrack = this.localStream.getAudioTracks()[0];
            if (audioTrack) {
                audioTrack.enabled = !audioTrack.enabled;
                return !audioTrack.enabled;
            }
        }
        return false;
    }

    toggleMute(): boolean {
        return this.toggleAudio();
    }

    toggleVideo(): boolean {
        if (this.localStream) {
            const videoTrack = this.localStream.getVideoTracks()[0];
            if (videoTrack) {
                videoTrack.enabled = !videoTrack.enabled;
                return !videoTrack.enabled;
            }
        }
        return false;
    }

    private screenStream: MediaStream | null = null;

    async startScreenShare(): Promise<MediaStream | null> {
        try {
            this.screenStream = await navigator.mediaDevices.getDisplayMedia({
                video: true,
                audio: true,
            });

            // Replace video track in peer connection
            const videoTrack = this.screenStream.getVideoTracks()[0];
            const sender = this.peerConnection?.getSenders().find(s => s.track?.kind === 'video');
            if (sender) {
                await sender.replaceTrack(videoTrack);
            }

            return this.screenStream;
        } catch (error) {
            console.error('Error starting screen share:', error);
            return null;
        }
    }

    stopScreenShare(): void {
        if (this.screenStream) {
            this.screenStream.getTracks().forEach(track => track.stop());
            this.screenStream = null;
        }
        // Restore original video track
        if (this.localStream) {
            const videoTrack = this.localStream.getVideoTracks()[0];
            const sender = this.peerConnection?.getSenders().find(s => s.track?.kind === 'video');
            if (sender && videoTrack) {
                sender.replaceTrack(videoTrack);
            }
        }
    }

    acceptCall(): void {
        this.socket?.emit('accept-call', {
            roomId: this.consultationId,
        });
    }

    rejectCall(): void {
        this.socket?.emit('reject-call', {
            roomId: this.consultationId,
        });
    }

    endCall(): void {
        // Stop all tracks
        if (this.localStream) {
            this.localStream.getTracks().forEach(track => track.stop());
            this.localStream = null;
        }

        // Close peer connection
        if (this.peerConnection) {
            this.peerConnection.close();
            this.peerConnection = null;
        }

        this.socket?.emit('end-call', {
            roomId: this.consultationId,
        });
    }

    disconnect(): void {
        this.endCall();
        this.socket?.disconnect();
        this.socket = null;
    }
}

export default SignalingService;
