'use client';

import { useState, useEffect } from 'react';
import { Shield, Wifi, WifiOff, Wallet, Activity, RefreshCcw, ExternalLink } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface BlockchainStatus {
    isAvailable: boolean;
    network: {
        name: string;
        chainId: bigint | number;
    } | null;
    walletAddress: string | null;
    balance: string | null;
    userWalletAddress: string;
}

interface BlockchainStatusDashboardProps {
    className?: string;
}

export function BlockchainStatusDashboard({ className }: BlockchainStatusDashboardProps) {
    const [status, setStatus] = useState<BlockchainStatus | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchStatus = async () => {
        setIsLoading(true);
        setError(null);

        try {
            const response = await fetch('/api/blockchain?action=status');
            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Failed to fetch status');
            }

            setStatus(data.data);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to fetch status');
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchStatus();
    }, []);

    const networkName = status?.network?.name || 'Unknown';
    const chainId = status?.network?.chainId?.toString() || 'N/A';

    return (
        <Card className={cn('border-white/10 bg-white/5 backdrop-blur', className)}>
            <CardHeader>
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <Shield className="h-5 w-5 text-cyan-400" />
                        <CardTitle className="text-lg">Blockchain Status</CardTitle>
                    </div>
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={fetchStatus}
                        disabled={isLoading}
                        className="h-8 w-8"
                    >
                        <RefreshCcw className={cn('h-4 w-4', isLoading && 'animate-spin')} />
                    </Button>
                </div>
                <CardDescription className="text-slate-400">
                    Ethereum network connection and wallet status
                </CardDescription>
            </CardHeader>

            <CardContent className="space-y-4">
                {error ? (
                    <div className="rounded-xl border border-rose-400/40 bg-rose-500/10 p-4 text-center">
                        <p className="text-sm text-rose-300">{error}</p>
                    </div>
                ) : isLoading ? (
                    <div className="space-y-3">
                        {[1, 2, 3].map((i) => (
                            <div
                                key={i}
                                className="h-16 animate-pulse rounded-xl bg-white/10"
                            />
                        ))}
                    </div>
                ) : status ? (
                    <>
                        {/* Connection Status */}
                        <div className="flex items-center justify-between rounded-xl border border-white/10 bg-white/5 p-4">
                            <div className="flex items-center gap-3">
                                {status.isAvailable ? (
                                    <Wifi className="h-5 w-5 text-emerald-400" />
                                ) : (
                                    <WifiOff className="h-5 w-5 text-rose-400" />
                                )}
                                <div>
                                    <p className="text-sm font-medium text-white">Connection</p>
                                    <p className="text-xs text-slate-400">
                                        {status.isAvailable ? 'Connected to network' : 'Disconnected'}
                                    </p>
                                </div>
                            </div>
                            <Badge
                                className={cn(
                                    'px-3 py-1',
                                    status.isAvailable
                                        ? 'border-emerald-400/40 bg-emerald-500/10 text-emerald-300'
                                        : 'border-rose-400/40 bg-rose-500/10 text-rose-300'
                                )}
                            >
                                {status.isAvailable ? 'Online' : 'Offline'}
                            </Badge>
                        </div>

                        {/* Network Info */}
                        {status.isAvailable && status.network && (
                            <div className="flex items-center justify-between rounded-xl border border-white/10 bg-white/5 p-4">
                                <div className="flex items-center gap-3">
                                    <Activity className="h-5 w-5 text-purple-400" />
                                    <div>
                                        <p className="text-sm font-medium text-white">Network</p>
                                        <p className="text-xs text-slate-400">
                                            {networkName} (Chain ID: {chainId})
                                        </p>
                                    </div>
                                </div>
                                <a
                                    href="https://sepolia.etherscan.io"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex items-center gap-1 text-xs text-cyan-400 hover:text-cyan-300"
                                >
                                    Explorer
                                    <ExternalLink className="h-3 w-3" />
                                </a>
                            </div>
                        )}

                        {/* Wallet Info */}
                        {status.isAvailable && status.walletAddress && (
                            <div className="rounded-xl border border-white/10 bg-white/5 p-4">
                                <div className="flex items-center gap-3">
                                    <Wallet className="h-5 w-5 text-amber-400" />
                                    <div className="flex-1 overflow-hidden">
                                        <p className="text-sm font-medium text-white">Service Wallet</p>
                                        <code className="block truncate text-xs text-slate-400">
                                            {status.walletAddress}
                                        </code>
                                    </div>
                                </div>
                                {status.balance && (
                                    <div className="mt-3 flex items-center justify-between border-t border-white/10 pt-3">
                                        <span className="text-xs text-slate-400">Balance</span>
                                        <span className="font-mono text-sm text-white">
                                            {parseFloat(status.balance).toFixed(4)} ETH
                                        </span>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* User Wallet */}
                        {status.userWalletAddress && (
                            <div className="rounded-xl border border-cyan-400/20 bg-cyan-500/5 p-4">
                                <div className="flex items-center gap-3">
                                    <Shield className="h-5 w-5 text-cyan-400" />
                                    <div className="flex-1 overflow-hidden">
                                        <p className="text-sm font-medium text-white">Your Health Wallet</p>
                                        <code className="block truncate text-xs text-slate-400">
                                            {status.userWalletAddress}
                                        </code>
                                    </div>
                                </div>
                                <p className="mt-2 text-xs text-slate-500">
                                    This address is derived from your account and used to verify your health records.
                                </p>
                            </div>
                        )}
                    </>
                ) : null}

                <div className="rounded-xl border border-white/5 bg-white/[0.02] p-3">
                    <p className="text-center text-xs text-slate-500">
                        Blockchain verification ensures your health records are tamper-proof and 
                        gives you full control over who can access them.
                    </p>
                </div>
            </CardContent>
        </Card>
    );
}

export default BlockchainStatusDashboard;
