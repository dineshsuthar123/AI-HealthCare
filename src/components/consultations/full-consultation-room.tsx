'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { SignalingService, ChatMessage, Participant, CallMode } from '@/lib/webrtc';
import { FadeIn, ScaleIn, SlideInFromBottom } from '@/components/animations/motion-effects';

interface FullConsultationRoomProps {
    consultationId: string;
    userId: string;
    userName: string;
    userRole: 'patient' | 'provider';
    consultationType: CallMode;
    onEndCall?: () => void;
}

export const FullConsultationRoom = ({
    consultationId,
    userId,
    userName,
    userRole,
    consultationType,
    onEndCall
}: FullConsultationRoomProps) => {
    // State
    const [isInitialized, setIsInitialized] = useState(false);
    const [connectionState, setConnectionState] = useState<'connecting' | 'connected' | 'disconnected' | 'failed'>('connecting');
    const [localStream, setLocalStream] = useState<MediaStream | null>(null);
    const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
    const [participants, setParticipants] = useState<Participant[]>([]);
    const [isMuted, setIsMuted] = useState(false);
    const [isVideoOff, setIsVideoOff] = useState(false);
    const [isScreenSharing, setIsScreenSharing] = useState(false);
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [messageInput, setMessageInput] = useState('');
    const [showChat, setShowChat] = useState(consultationType === 'text');
    const [isTyping, setIsTyping] = useState<string | null>(null);
    const [callDuration, setCallDuration] = useState(0);
    const [incomingCall, setIncomingCall] = useState<{ from: string; name: string; mode: CallMode } | null>(null);
    const [isCallActive, setIsCallActive] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Refs
    const signalingRef = useRef<SignalingService | null>(null);
    const localVideoRef = useRef<HTMLVideoElement>(null);
    const remoteVideoRef = useRef<HTMLVideoElement>(null);
    const chatContainerRef = useRef<HTMLDivElement>(null);
    const durationIntervalRef = useRef<NodeJS.Timeout | null>(null);

    // Initialize signaling service
    useEffect(() => {
        const initializeCall = async () => {
            try {
                const signaling = new SignalingService(
                    consultationId,
                    userId,
                    userName,
                    userRole
                );

                // Set up event handlers
                signaling.on('onConnectionStateChange', (state) => {
                    setConnectionState(state);
                });

                signaling.on('onParticipantJoined', (participant) => {
                    setParticipants(prev => [...prev.filter(p => p.id !== participant.id), participant]);
                });

                signaling.on('onParticipantLeft', (participantId) => {
                    setParticipants(prev => prev.filter(p => p.id !== participantId));
                });

                signaling.on('onRemoteStream', (stream) => {
                    setRemoteStream(stream);
                    if (remoteVideoRef.current) {
                        remoteVideoRef.current.srcObject = stream;
                    }
                });

                signaling.on('onChatMessage', (message) => {
                    setMessages(prev => [...prev, message]);
                });

                signaling.on('onCallRequest', (fromId, fromName, mode) => {
                    setIncomingCall({ from: fromId, name: fromName, mode });
                });

                signaling.on('onCallAccepted', () => {
                    setIsCallActive(true);
                    startDurationTimer();
                });

                signaling.on('onCallRejected', () => {
                    setIncomingCall(null);
                    setError('Call was rejected');
                });

                signaling.on('onCallEnded', () => {
                    handleEndCall();
                });

                signaling.on('onError', (err) => {
                    setError(err.message);
                });

                // Initialize the service
                await signaling.initialize(consultationType);
                
                const stream = signaling.getLocalStream();
                if (stream) {
                    setLocalStream(stream);
                    if (localVideoRef.current) {
                        localVideoRef.current.srcObject = stream;
                    }
                }

                signalingRef.current = signaling;
                setIsInitialized(true);
            } catch (err) {
                setError(err instanceof Error ? err.message : 'Failed to initialize call');
            }
        };

        initializeCall();

        return () => {
            if (signalingRef.current) {
                signalingRef.current.disconnect();
            }
            if (durationIntervalRef.current) {
                clearInterval(durationIntervalRef.current);
            }
        };
    }, [consultationId, userId, userName, userRole, consultationType]);

    // Auto-scroll chat
    useEffect(() => {
        if (chatContainerRef.current) {
            chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
        }
    }, [messages]);

    const startDurationTimer = () => {
        durationIntervalRef.current = setInterval(() => {
            setCallDuration(prev => prev + 1);
        }, 1000);
    };

    const formatDuration = (seconds: number) => {
        const hrs = Math.floor(seconds / 3600);
        const mins = Math.floor((seconds % 3600) / 60);
        const secs = seconds % 60;
        if (hrs > 0) {
            return `${hrs}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
        }
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    const handleStartCall = useCallback(() => {
        if (signalingRef.current) {
            signalingRef.current.initiateCall();
            setIsCallActive(true);
            startDurationTimer();
        }
    }, []);

    const handleAcceptCall = useCallback(() => {
        if (signalingRef.current && incomingCall) {
            signalingRef.current.acceptCall();
            setIncomingCall(null);
            setIsCallActive(true);
            startDurationTimer();
        }
    }, [incomingCall]);

    const handleRejectCall = useCallback(() => {
        if (signalingRef.current) {
            signalingRef.current.rejectCall();
            setIncomingCall(null);
        }
    }, []);

    const handleEndCall = useCallback(() => {
        if (signalingRef.current) {
            signalingRef.current.endCall();
        }
        if (durationIntervalRef.current) {
            clearInterval(durationIntervalRef.current);
        }
        setIsCallActive(false);
        setRemoteStream(null);
        onEndCall?.();
    }, [onEndCall]);

    const handleToggleMute = useCallback(() => {
        if (signalingRef.current) {
            const muted = signalingRef.current.toggleAudio();
            setIsMuted(muted);
        }
    }, []);

    const handleToggleVideo = useCallback(() => {
        if (signalingRef.current) {
            const videoOff = signalingRef.current.toggleVideo();
            setIsVideoOff(videoOff);
        }
    }, []);

    const handleToggleScreenShare = useCallback(async () => {
        if (signalingRef.current) {
            if (isScreenSharing) {
                signalingRef.current.stopScreenShare();
                setIsScreenSharing(false);
            } else {
                const screenStream = await signalingRef.current.startScreenShare();
                if (screenStream) {
                    setIsScreenSharing(true);
                }
            }
        }
    }, [isScreenSharing]);

    const handleSendMessage = useCallback(() => {
        if (signalingRef.current && messageInput.trim()) {
            signalingRef.current.sendMessage(messageInput.trim());
            setMessageInput('');
        }
    }, [messageInput]);

    if (error) {
        return (
            <div className="h-full flex items-center justify-center bg-gradient-to-br from-red-50 to-red-100 dark:from-red-950 dark:to-red-900 p-8">
                <ScaleIn>
                    <div className="text-center max-w-md">
                        <div className="text-6xl mb-4">⚠️</div>
                        <h2 className="text-2xl font-bold text-red-600 dark:text-red-400 mb-4">Connection Error</h2>
                        <p className="text-gray-600 dark:text-gray-400 mb-6">{error}</p>
                        <div className="space-x-4">
                            <Button onClick={() => window.location.reload()}>
                                Try Again
                            </Button>
                            <Button variant="outline" onClick={() => window.history.back()}>
                                Go Back
                            </Button>
                        </div>
                    </div>
                </ScaleIn>
            </div>
        );
    }

    return (
        <div className="h-full flex flex-col bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
            {/* Header */}
            <FadeIn>
                <div className="bg-slate-800/80 backdrop-blur-sm border-b border-slate-700 px-6 py-3">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                            <div className={`w-3 h-3 rounded-full ${
                                connectionState === 'connected' ? 'bg-green-500 animate-pulse' :
                                connectionState === 'connecting' ? 'bg-yellow-500 animate-pulse' :
                                'bg-red-500'
                            }`} />
                            <span className="text-white font-medium capitalize">{connectionState}</span>
                            {isCallActive && (
                                <span className="text-emerald-400 font-mono">{formatDuration(callDuration)}</span>
                            )}
                        </div>
                        <div className="flex items-center space-x-3">
                            <span className="text-slate-400">Room: {consultationId.slice(-8).toUpperCase()}</span>
                            <div className="flex items-center space-x-2">
                                {participants.map(p => (
                                    <div key={p.id} className="flex items-center space-x-1 bg-slate-700 px-2 py-1 rounded-full">
                                        <div className="w-2 h-2 bg-green-500 rounded-full" />
                                        <span className="text-white text-sm">{p.name}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </FadeIn>

            {/* Main Content */}
            <div className="flex-1 flex overflow-hidden">
                {/* Video/Audio Area */}
                {consultationType !== 'text' && (
                    <div className="flex-1 relative p-4">
                        {/* Remote Video (Main) */}
                        <div className="w-full h-full bg-slate-800 rounded-2xl overflow-hidden relative">
                            {remoteStream ? (
                                <video
                                    ref={remoteVideoRef}
                                    autoPlay
                                    playsInline
                                    className="w-full h-full object-cover"
                                />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center">
                                    {incomingCall ? (
                                        <ScaleIn>
                                            <div className="text-center">
                                                <div className="w-24 h-24 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full mx-auto mb-6 flex items-center justify-center animate-pulse">
                                                    <span className="text-4xl">📞</span>
                                                </div>
                                                <h3 className="text-white text-2xl font-bold mb-2">Incoming Call</h3>
                                                <p className="text-slate-400 mb-6">{incomingCall.name} is calling...</p>
                                                <div className="flex space-x-4 justify-center">
                                                    <Button 
                                                        onClick={handleAcceptCall}
                                                        className="bg-green-500 hover:bg-green-600"
                                                    >
                                                        ✓ Accept
                                                    </Button>
                                                    <Button 
                                                        onClick={handleRejectCall}
                                                        variant="destructive"
                                                    >
                                                        ✕ Decline
                                                    </Button>
                                                </div>
                                            </div>
                                        </ScaleIn>
                                    ) : !isCallActive ? (
                                        <ScaleIn>
                                            <div className="text-center">
                                                <div className="w-24 h-24 bg-gradient-to-r from-blue-500 to-green-500 rounded-full mx-auto mb-6 flex items-center justify-center">
                                                    {consultationType === 'video' ? (
                                                        <svg className="w-12 h-12 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                                                        </svg>
                                                    ) : (
                                                        <svg className="w-12 h-12 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                                                        </svg>
                                                    )}
                                                </div>
                                                <h3 className="text-white text-2xl font-bold mb-2">Ready to Connect</h3>
                                                <p className="text-slate-400 mb-6">
                                                    {participants.length > 0 
                                                        ? `${participants[0].name} is waiting` 
                                                        : 'Waiting for participant to join...'}
                                                </p>
                                                <Button 
                                                    onClick={handleStartCall}
                                                    className="bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 px-8 py-3 text-lg"
                                                    disabled={participants.length === 0}
                                                >
                                                    Start {consultationType === 'video' ? 'Video' : 'Audio'} Call
                                                </Button>
                                            </div>
                                        </ScaleIn>
                                    ) : (
                                        <div className="text-center">
                                            <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                                            <p className="text-white">Connecting...</p>
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Local Video (PiP) */}
                            {localStream && consultationType === 'video' && (
                                <div className="absolute bottom-4 right-4 w-48 h-36 bg-slate-900 rounded-xl overflow-hidden border-2 border-white/20 shadow-xl">
                                    <video
                                        ref={localVideoRef}
                                        autoPlay
                                        playsInline
                                        muted
                                        className="w-full h-full object-cover"
                                    />
                                    {isVideoOff && (
                                        <div className="absolute inset-0 bg-slate-800 flex items-center justify-center">
                                            <div className="text-center">
                                                <div className="w-10 h-10 bg-slate-700 rounded-full mx-auto mb-1 flex items-center justify-center text-white font-bold">
                                                    {userName.charAt(0).toUpperCase()}
                                                </div>
                                                <p className="text-slate-400 text-xs">Camera Off</p>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>

                        {/* Controls */}
                        <SlideInFromBottom>
                            <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 flex items-center space-x-4 bg-slate-800/90 backdrop-blur-sm rounded-full px-6 py-3 shadow-2xl">
                                <button
                                    onClick={handleToggleMute}
                                    className={`p-4 rounded-full transition-all ${
                                        isMuted ? 'bg-red-500 text-white' : 'bg-slate-700 text-white hover:bg-slate-600'
                                    }`}
                                    title={isMuted ? 'Unmute' : 'Mute'}
                                >
                                    {isMuted ? (
                                        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2" />
                                        </svg>
                                    ) : (
                                        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                                        </svg>
                                    )}
                                </button>

                                {consultationType === 'video' && (
                                    <button
                                        onClick={handleToggleVideo}
                                        className={`p-4 rounded-full transition-all ${
                                            isVideoOff ? 'bg-red-500 text-white' : 'bg-slate-700 text-white hover:bg-slate-600'
                                        }`}
                                        title={isVideoOff ? 'Turn on camera' : 'Turn off camera'}
                                    >
                                        {isVideoOff ? (
                                            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                                            </svg>
                                        ) : (
                                            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                                            </svg>
                                        )}
                                    </button>
                                )}

                                {consultationType === 'video' && (
                                    <button
                                        onClick={handleToggleScreenShare}
                                        className={`p-4 rounded-full transition-all ${
                                            isScreenSharing ? 'bg-blue-500 text-white' : 'bg-slate-700 text-white hover:bg-slate-600'
                                        }`}
                                        title={isScreenSharing ? 'Stop sharing' : 'Share screen'}
                                    >
                                        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                        </svg>
                                    </button>
                                )}

                                <button
                                    onClick={() => setShowChat(!showChat)}
                                    className={`p-4 rounded-full transition-all ${
                                        showChat ? 'bg-blue-500 text-white' : 'bg-slate-700 text-white hover:bg-slate-600'
                                    }`}
                                    title="Toggle chat"
                                >
                                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                                    </svg>
                                </button>

                                <button
                                    onClick={handleEndCall}
                                    className="p-4 rounded-full bg-red-500 text-white hover:bg-red-600 transition-all"
                                    title="End call"
                                >
                                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 8l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2M5 3a2 2 0 00-2 2v1c0 8.284 6.716 15 15 15h1a2 2 0 002-2v-3.28a1 1 0 00-.684-.948l-4.493-1.498a1 1 0 00-1.21.502l-1.13 2.257a11.042 11.042 0 01-5.516-5.517l2.257-1.128a1 1 0 00.502-1.21L9.228 3.683A1 1 0 008.279 3H5z" />
                                    </svg>
                                </button>
                            </div>
                        </SlideInFromBottom>
                    </div>
                )}

                {/* Chat Panel */}
                {(showChat || consultationType === 'text') && (
                    <div className={`${consultationType === 'text' ? 'flex-1' : 'w-96'} bg-slate-800 border-l border-slate-700 flex flex-col`}>
                        <div className="p-4 border-b border-slate-700">
                            <h3 className="text-white font-semibold">Chat</h3>
                            {isTyping && (
                                <p className="text-slate-400 text-sm">{isTyping} is typing...</p>
                            )}
                        </div>

                        <div 
                            ref={chatContainerRef}
                            className="flex-1 overflow-y-auto p-4 space-y-4"
                        >
                            {messages.map((msg) => (
                                <div
                                    key={msg.id}
                                    className={`${
                                        msg.type === 'system' 
                                            ? 'text-center' 
                                            : msg.senderId === userId 
                                                ? 'flex justify-end' 
                                                : 'flex justify-start'
                                    }`}
                                >
                                    {msg.type === 'system' ? (
                                        <span className="text-slate-500 text-sm italic">{msg.content}</span>
                                    ) : (
                                        <div className={`max-w-xs ${
                                            msg.senderId === userId 
                                                ? 'bg-blue-600 text-white' 
                                                : 'bg-slate-700 text-white'
                                        } rounded-2xl px-4 py-2`}>
                                            {msg.senderId !== userId && (
                                                <p className="text-xs text-slate-400 mb-1">{msg.senderName}</p>
                                            )}
                                            <p>{msg.content}</p>
                                            <p className="text-xs opacity-60 text-right mt-1">
                                                {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            </p>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>

                        <div className="p-4 border-t border-slate-700">
                            <div className="flex space-x-2">
                                <input
                                    type="text"
                                    value={messageInput}
                                    onChange={(e) => setMessageInput(e.target.value)}
                                    onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                                    placeholder="Type a message..."
                                    className="flex-1 bg-slate-700 text-white rounded-full px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                                <button
                                    onClick={handleSendMessage}
                                    disabled={!messageInput.trim()}
                                    className="p-2 bg-blue-500 text-white rounded-full hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                                    </svg>
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default FullConsultationRoom;
