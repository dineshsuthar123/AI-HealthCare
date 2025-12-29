/**
 * WebRTC Signaling Service
 * Handles peer-to-peer connection establishment for video/audio/text communication
 */

import { io, Socket } from 'socket.io-client';
import Peer from 'simple-peer';

export interface SignalingMessage {
    type: 'offer' | 'answer' | 'ice-candidate' | 'call-request' | 'call-accepted' | 'call-rejected' | 'call-ended';
    from: string;
    to: string;
    roomId: string;
    data?: unknown;
}

export interface ChatMessage {
    id: string;
    sender: string;
    senderName: string;
    content: string;
    timestamp: Date;
    type: 'text' | 'file' | 'image' | 'system';
    fileUrl?: string;
    fileName?: string;
}

export interface Participant {
    id: string;
    name: string;
    role: 'patient' | 'provider';
    isConnected: boolean;
    isMuted: boolean;
    isVideoOff: boolean;
    stream?: MediaStream;
}

export type CallMode = 'video' | 'audio' | 'text';

interface SignalingServiceEvents {
    onParticipantJoined: (participant: Participant) => void;
    onParticipantLeft: (participantId: string) => void;
    onRemoteStream: (stream: MediaStream, participantId: string) => void;
    onChatMessage: (message: ChatMessage) => void;
    onCallRequest: (fromId: string, fromName: string, mode: CallMode) => void;
    onCallAccepted: (participantId: string) => void;
    onCallRejected: (participantId: string) => void;
    onCallEnded: () => void;
    onConnectionStateChange: (state: 'connecting' | 'connected' | 'disconnected' | 'failed') => void;
    onError: (error: Error) => void;
}

export class SignalingService {
    private socket: Socket | null = null;
    private peer: Peer.Instance | null = null;
    private localStream: MediaStream | null = null;
    private roomId: string;
    private userId: string;
    private userName: string;
    private userRole: 'patient' | 'provider';
    private callMode: CallMode = 'video';
    private events: Partial<SignalingServiceEvents> = {};
    private reconnectAttempts = 0;
    private maxReconnectAttempts = 5;
    private isConnected = false;
    private participants: Map<string, Participant> = new Map();
    private pendingIceCandidates: RTCIceCandidateInit[] = [];

    constructor(
        roomId: string,
        userId: string,
        userName: string,
        userRole: 'patient' | 'provider'
    ) {
        this.roomId = roomId;
        this.userId = userId;
        this.userName = userName;
        this.userRole = userRole;
    }

    /**
     * Register event handlers
     */
    on<K extends keyof SignalingServiceEvents>(
        event: K,
        handler: SignalingServiceEvents[K]
    ): void {
        this.events[event] = handler;
    }

    /**
     * Initialize the signaling service
     */
    async initialize(mode: CallMode = 'video'): Promise<void> {
        this.callMode = mode;
        await this.connectSocket();
        
        if (mode !== 'text') {
            await this.setupLocalMedia();
        }
    }

    /**
     * Connect to the signaling server
     */
    private async connectSocket(): Promise<void> {
        return new Promise((resolve, reject) => {
            try {
                this.socket = io('', {
                    path: '/api/socket',
                    addTrailingSlash: false,
                    transports: ['websocket', 'polling'],
                    reconnection: true,
                    reconnectionAttempts: this.maxReconnectAttempts,
                    reconnectionDelay: 1000,
                    timeout: 10000,
                });

                this.socket.on('connect', () => {
                    console.log('Socket connected:', this.socket?.id);
                    this.isConnected = true;
                    this.reconnectAttempts = 0;
                    this.events.onConnectionStateChange?.('connected');
                    
                    // Join the room
                    this.socket?.emit('join-room', this.roomId, this.userId, {
                        name: this.userName,
                        role: this.userRole,
                        callMode: this.callMode
                    });
                    
                    resolve();
                });

                this.socket.on('connect_error', (error) => {
                    console.error('Socket connection error:', error);
                    this.events.onError?.(new Error(`Connection failed: ${error.message}`));
                    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
                        reject(error);
                    }
                });

                this.socket.on('disconnect', (reason) => {
                    console.log('Socket disconnected:', reason);
                    this.isConnected = false;
                    this.events.onConnectionStateChange?.('disconnected');
                });

                this.setupSocketListeners();
            } catch (error) {
                reject(error);
            }
        });
    }

    /**
     * Set up socket event listeners
     */
    private setupSocketListeners(): void {
        if (!this.socket) return;

        // User connected to room
        this.socket.on('user-connected', (userId: string, userInfo: { name: string; role: string }) => {
            console.log('User connected:', userId, userInfo);
            const participant: Participant = {
                id: userId,
                name: userInfo.name,
                role: userInfo.role as 'patient' | 'provider',
                isConnected: true,
                isMuted: false,
                isVideoOff: false
            };
            this.participants.set(userId, participant);
            this.events.onParticipantJoined?.(participant);
        });

        // User disconnected from room
        this.socket.on('user-disconnected', (userId: string) => {
            console.log('User disconnected:', userId);
            this.participants.delete(userId);
            this.events.onParticipantLeft?.(userId);
        });

        // Signaling messages
        this.socket.on('signal', ({ userId, signal }) => {
            console.log('Received signal from:', userId);
            if (this.peer) {
                this.peer.signal(signal);
            }
        });

        // Call request
        this.socket.on('call-request', (from: string, fromName: string, mode: CallMode) => {
            this.events.onCallRequest?.(from, fromName, mode);
        });

        // Call accepted
        this.socket.on('call-accepted', (from: string) => {
            this.events.onCallAccepted?.(from);
        });

        // Call rejected
        this.socket.on('call-rejected', (from: string) => {
            this.events.onCallRejected?.(from);
        });

        // Call ended
        this.socket.on('call-ended', (fromId: string) => {
            this.endCall();
            this.events.onCallEnded?.();
        });

        // Chat messages (from server as 'chat-message')
        this.socket.on('chat-message', (message: ChatMessage) => {
            this.events.onChatMessage?.(message);
        });

        // Also support 'receive-message' for compatibility
        this.socket.on('receive-message', (message: ChatMessage) => {
            this.events.onChatMessage?.(message);
        });

        // Room state (existing participants)
        this.socket.on('room-state', (participants: Participant[]) => {
            participants.forEach(p => {
                if (p.id !== this.userId) {
                    this.participants.set(p.id, p);
                    this.events.onParticipantJoined?.(p);
                }
            });
        });
    }

    /**
     * Set up local media (camera/microphone)
     */
    async setupLocalMedia(): Promise<MediaStream> {
        try {
            const constraints: MediaStreamConstraints = {
                audio: {
                    echoCancellation: true,
                    noiseSuppression: true,
                    autoGainControl: true
                },
                video: this.callMode === 'video' ? {
                    width: { ideal: 1280 },
                    height: { ideal: 720 },
                    frameRate: { ideal: 30 }
                } : false
            };

            this.localStream = await navigator.mediaDevices.getUserMedia(constraints);
            return this.localStream;
        } catch (error) {
            console.error('Error accessing media devices:', error);
            throw new Error('Could not access camera/microphone. Please check permissions.');
        }
    }

    /**
     * Initiate a call
     */
    initiateCall(targetUserId?: string): void {
        if (!this.socket || !this.localStream) {
            console.error('Cannot initiate call: socket or stream not available');
            return;
        }

        // Notify other participants
        this.socket.emit('call-request', {
            roomId: this.roomId,
            from: this.userId,
            fromName: this.userName,
            to: targetUserId,
            mode: this.callMode
        });

        this.createPeer(true);
    }

    /**
     * Accept an incoming call
     */
    acceptCall(): void {
        if (!this.socket) return;

        this.socket.emit('call-accepted', {
            roomId: this.roomId,
            from: this.userId
        });

        this.createPeer(false);
    }

    /**
     * Reject an incoming call
     */
    rejectCall(): void {
        if (!this.socket) return;

        this.socket.emit('call-rejected', {
            roomId: this.roomId,
            from: this.userId
        });
    }

    /**
     * Create WebRTC peer connection
     */
    private createPeer(initiator: boolean): void {
        if (this.peer) {
            this.peer.destroy();
        }

        const config: Peer.Options = {
            initiator,
            trickle: true,
            stream: this.localStream || undefined,
            config: {
                iceServers: [
                    { urls: 'stun:stun.l.google.com:19302' },
                    { urls: 'stun:stun1.l.google.com:19302' },
                    { urls: 'stun:stun2.l.google.com:19302' },
                    {
                        urls: 'turn:numb.viagenie.ca',
                        username: 'webrtc@live.com',
                        credential: 'muazkh'
                    }
                ]
            }
        };

        this.peer = new Peer(config);

        this.peer.on('signal', (data) => {
            this.socket?.emit('signal', {
                userId: this.userId,
                roomId: this.roomId,
                signal: data
            });
        });

        this.peer.on('stream', (remoteStream) => {
            console.log('Received remote stream');
            const remoteParticipant = Array.from(this.participants.values())[0];
            if (remoteParticipant) {
                remoteParticipant.stream = remoteStream;
                this.events.onRemoteStream?.(remoteStream, remoteParticipant.id);
            }
        });

        this.peer.on('connect', () => {
            console.log('Peer connected');
            this.events.onConnectionStateChange?.('connected');
        });

        this.peer.on('close', () => {
            console.log('Peer connection closed');
            this.events.onConnectionStateChange?.('disconnected');
        });

        this.peer.on('error', (err) => {
            console.error('Peer error:', err);
            this.events.onError?.(err);
            this.events.onConnectionStateChange?.('failed');
        });
    }

    /**
     * End the current call
     */
    endCall(): void {
        if (this.peer) {
            this.peer.destroy();
            this.peer = null;
        }

        this.socket?.emit('call-ended', {
            roomId: this.roomId,
            from: this.userId
        });
    }

    /**
     * Toggle audio mute
     */
    toggleAudio(): boolean {
        if (this.localStream) {
            const audioTrack = this.localStream.getAudioTracks()[0];
            if (audioTrack) {
                audioTrack.enabled = !audioTrack.enabled;
                return !audioTrack.enabled; // Returns true if muted
            }
        }
        return false;
    }

    /**
     * Toggle video
     */
    toggleVideo(): boolean {
        if (this.localStream) {
            const videoTrack = this.localStream.getVideoTracks()[0];
            if (videoTrack) {
                videoTrack.enabled = !videoTrack.enabled;
                return !videoTrack.enabled; // Returns true if video is off
            }
        }
        return false;
    }

    /**
     * Send a chat message
     */
    sendMessage(content: string, type: 'text' | 'file' | 'image' = 'text', fileUrl?: string, fileName?: string): void {
        if (!this.socket) return;

        const message: ChatMessage = {
            id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            sender: this.userId,
            senderName: this.userName,
            content,
            timestamp: new Date(),
            type,
            fileUrl,
            fileName
        };

        this.socket.emit('send-message', this.roomId, content, {
            senderName: this.userName,
            type,
            fileUrl,
            fileName
        });
    }

    /**
     * Start screen sharing
     */
    async startScreenShare(): Promise<MediaStream | null> {
        try {
            const screenStream = await navigator.mediaDevices.getDisplayMedia({
                video: { cursor: 'always' } as MediaTrackConstraints,
                audio: true
            });

            // Replace video track in peer connection
            if (this.peer && this.localStream) {
                const videoTrack = screenStream.getVideoTracks()[0];
                const sender = (this.peer as unknown as { _pc: RTCPeerConnection })._pc
                    .getSenders()
                    .find((s: RTCRtpSender) => s.track?.kind === 'video');
                
                if (sender) {
                    sender.replaceTrack(videoTrack);
                }

                // Handle screen share stop
                videoTrack.onended = () => {
                    this.stopScreenShare();
                };
            }

            return screenStream;
        } catch (error) {
            console.error('Error starting screen share:', error);
            return null;
        }
    }

    /**
     * Stop screen sharing
     */
    stopScreenShare(): void {
        if (this.peer && this.localStream) {
            const videoTrack = this.localStream.getVideoTracks()[0];
            const sender = (this.peer as unknown as { _pc: RTCPeerConnection })._pc
                .getSenders()
                .find((s: RTCRtpSender) => s.track?.kind === 'video');
            
            if (sender && videoTrack) {
                sender.replaceTrack(videoTrack);
            }
        }
    }

    /**
     * Get local stream
     */
    getLocalStream(): MediaStream | null {
        return this.localStream;
    }

    /**
     * Get participants
     */
    getParticipants(): Participant[] {
        return Array.from(this.participants.values());
    }

    /**
     * Disconnect and cleanup
     */
    disconnect(): void {
        if (this.localStream) {
            this.localStream.getTracks().forEach(track => track.stop());
            this.localStream = null;
        }

        if (this.peer) {
            this.peer.destroy();
            this.peer = null;
        }

        if (this.socket) {
            this.socket.emit('leave-room', this.roomId, this.userId);
            this.socket.disconnect();
            this.socket = null;
        }

        this.participants.clear();
        this.isConnected = false;
    }
}

export default SignalingService;
