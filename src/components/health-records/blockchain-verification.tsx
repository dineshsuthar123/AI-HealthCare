'use client';

import { useState } from 'react';
import { Shield, CheckCircle, XCircle, Loader2, ExternalLink, Clock, Hash, FileCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface BlockchainMetadata {
    isOnChain: boolean;
    txHash?: string;
    blockNumber?: number;
    recordHash?: string;
    registeredAt?: string;
    isRevoked?: boolean;
}

interface BlockchainVerificationProps {
    recordId: string;
    blockchainMetadata?: BlockchainMetadata;
    onRegister?: () => void;
    className?: string;
}

interface VerificationResult {
    isValid: boolean;
    registeredAt: string | null;
    isRevoked: boolean;
    currentHash: string;
}

export function BlockchainVerification({
    recordId,
    blockchainMetadata,
    onRegister,
    className
}: BlockchainVerificationProps) {
    const [isVerifying, setIsVerifying] = useState(false);
    const [isRegistering, setIsRegistering] = useState(false);
    const [verificationResult, setVerificationResult] = useState<VerificationResult | null>(null);
    const [error, setError] = useState<string | null>(null);

    const handleVerify = async () => {
        setIsVerifying(true);
        setError(null);
        setVerificationResult(null);

        try {
            const response = await fetch(`/api/blockchain?action=verify&recordId=${recordId}`);
            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Verification failed');
            }

            setVerificationResult(data.data);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Verification failed');
        } finally {
            setIsVerifying(false);
        }
    };

    const handleRegister = async () => {
        setIsRegistering(true);
        setError(null);

        try {
            const response = await fetch('/api/blockchain', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'register', recordId })
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Registration failed');
            }

            onRegister?.();
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Registration failed');
        } finally {
            setIsRegistering(false);
        }
    };

    const isOnChain = blockchainMetadata?.isOnChain;
    const explorerUrl = blockchainMetadata?.txHash
        ? `https://sepolia.etherscan.io/tx/${blockchainMetadata.txHash}`
        : null;

    return (
        <Card className={cn('border-white/10 bg-white/5 backdrop-blur', className)}>
            <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <Shield className="h-5 w-5 text-cyan-400" />
                        <CardTitle className="text-lg">Blockchain Verification</CardTitle>
                    </div>
                    <Badge
                        className={cn(
                            'px-3 py-1',
                            isOnChain
                                ? 'border-emerald-400/40 bg-emerald-500/10 text-emerald-300'
                                : 'border-amber-400/40 bg-amber-500/10 text-amber-300'
                        )}
                    >
                        {isOnChain ? 'On-Chain' : 'Not Registered'}
                    </Badge>
                </div>
                <CardDescription className="text-slate-400">
                    {isOnChain
                        ? 'This record is secured on the Ethereum blockchain'
                        : 'Register this record on blockchain for tamper-proof verification'}
                </CardDescription>
            </CardHeader>

            <CardContent className="space-y-4">
                {isOnChain && blockchainMetadata && (
                    <div className="space-y-3 rounded-xl border border-white/10 bg-white/5 p-4">
                        <div className="flex items-center gap-3 text-sm">
                            <Hash className="h-4 w-4 text-slate-400" />
                            <span className="text-slate-400">Record Hash:</span>
                            <code className="flex-1 truncate rounded bg-black/20 px-2 py-1 font-mono text-xs text-slate-300">
                                {blockchainMetadata.recordHash}
                            </code>
                        </div>

                        {blockchainMetadata.txHash && (
                            <div className="flex items-center gap-3 text-sm">
                                <FileCheck className="h-4 w-4 text-slate-400" />
                                <span className="text-slate-400">Transaction:</span>
                                <a
                                    href={explorerUrl || '#'}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex items-center gap-1 text-cyan-400 hover:text-cyan-300"
                                >
                                    <code className="font-mono text-xs">
                                        {blockchainMetadata.txHash.slice(0, 10)}...{blockchainMetadata.txHash.slice(-8)}
                                    </code>
                                    <ExternalLink className="h-3 w-3" />
                                </a>
                            </div>
                        )}

                        {blockchainMetadata.registeredAt && (
                            <div className="flex items-center gap-3 text-sm">
                                <Clock className="h-4 w-4 text-slate-400" />
                                <span className="text-slate-400">Registered:</span>
                                <span className="text-slate-300">
                                    {new Date(blockchainMetadata.registeredAt).toLocaleString()}
                                </span>
                            </div>
                        )}

                        {blockchainMetadata.blockNumber && (
                            <div className="flex items-center gap-3 text-sm">
                                <Shield className="h-4 w-4 text-slate-400" />
                                <span className="text-slate-400">Block:</span>
                                <span className="text-slate-300">#{blockchainMetadata.blockNumber}</span>
                            </div>
                        )}
                    </div>
                )}

                {verificationResult && (
                    <div
                        className={cn(
                            'flex items-center gap-3 rounded-xl border p-4',
                            verificationResult.isValid
                                ? 'border-emerald-400/40 bg-emerald-500/10'
                                : 'border-rose-400/40 bg-rose-500/10'
                        )}
                    >
                        {verificationResult.isValid ? (
                            <>
                                <CheckCircle className="h-6 w-6 text-emerald-400" />
                                <div>
                                    <p className="font-medium text-emerald-300">Record Verified</p>
                                    <p className="text-sm text-emerald-200/70">
                                        This record matches the blockchain hash and has not been tampered with.
                                    </p>
                                </div>
                            </>
                        ) : (
                            <>
                                <XCircle className="h-6 w-6 text-rose-400" />
                                <div>
                                    <p className="font-medium text-rose-300">Verification Failed</p>
                                    <p className="text-sm text-rose-200/70">
                                        {verificationResult.isRevoked
                                            ? 'This record has been revoked.'
                                            : 'The record content does not match the blockchain hash.'}
                                    </p>
                                </div>
                            </>
                        )}
                    </div>
                )}

                {error && (
                    <div className="flex items-center gap-3 rounded-xl border border-rose-400/40 bg-rose-500/10 p-4">
                        <XCircle className="h-5 w-5 text-rose-400" />
                        <p className="text-sm text-rose-300">{error}</p>
                    </div>
                )}

                <div className="flex gap-3">
                    {isOnChain ? (
                        <Button
                            onClick={handleVerify}
                            disabled={isVerifying}
                            className="flex-1 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-500"
                        >
                            {isVerifying ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Verifying...
                                </>
                            ) : (
                                <>
                                    <Shield className="mr-2 h-4 w-4" />
                                    Verify Integrity
                                </>
                            )}
                        </Button>
                    ) : (
                        <Button
                            onClick={handleRegister}
                            disabled={isRegistering}
                            className="flex-1 rounded-xl bg-gradient-to-r from-emerald-500 to-cyan-500"
                        >
                            {isRegistering ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Registering...
                                </>
                            ) : (
                                <>
                                    <Shield className="mr-2 h-4 w-4" />
                                    Register on Blockchain
                                </>
                            )}
                        </Button>
                    )}
                </div>

                <p className="text-center text-xs text-slate-500">
                    Powered by Ethereum Sepolia Testnet
                </p>
            </CardContent>
        </Card>
    );
}

export default BlockchainVerification;
