'use client';

import { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { AlertTriangle, RefreshCcw, Home, Bug } from 'lucide-react';
import { motion } from '@/lib/framer-motion';

export default function GlobalError({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    useEffect(() => {
        // Log error to monitoring service in production
        console.error('Global error:', error);
        
        // In production, send to error tracking service
        if (process.env.NODE_ENV === 'production') {
            // Example: Sentry.captureException(error);
        }
    }, [error]);

    return (
        <html>
            <body className="min-h-screen bg-[#01030f]">
                <div className="min-h-screen flex items-center justify-center px-4">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-center max-w-md"
                    >
                        {/* Error Icon */}
                        <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ type: 'spring', delay: 0.1 }}
                            className="mx-auto w-20 h-20 rounded-full bg-red-500/20 flex items-center justify-center mb-6"
                        >
                            <AlertTriangle className="w-10 h-10 text-red-400" />
                        </motion.div>

                        {/* Error Message */}
                        <h1 className="text-3xl font-bold text-white mb-4">
                            Something went wrong!
                        </h1>
                        <p className="text-slate-400 mb-6">
                            We encountered an unexpected error. Our team has been notified and is working on a fix.
                        </p>

                        {/* Error Details (Development Only) */}
                        {process.env.NODE_ENV === 'development' && (
                            <div className="mb-6 p-4 bg-slate-900/50 rounded-xl border border-red-500/20 text-left">
                                <div className="flex items-center gap-2 text-red-400 text-sm mb-2">
                                    <Bug className="w-4 h-4" />
                                    <span className="font-medium">Error Details</span>
                                </div>
                                <p className="text-xs text-slate-500 font-mono break-all">
                                    {error.message}
                                </p>
                                {error.digest && (
                                    <p className="text-xs text-slate-600 mt-2">
                                        Digest: {error.digest}
                                    </p>
                                )}
                            </div>
                        )}

                        {/* Action Buttons */}
                        <div className="flex gap-3 justify-center">
                            <Button
                                onClick={reset}
                                className="bg-blue-600 hover:bg-blue-700"
                            >
                                <RefreshCcw className="w-4 h-4 mr-2" />
                                Try Again
                            </Button>
                            <Button
                                onClick={() => window.location.href = '/'}
                                variant="outline"
                                className="border-slate-700 hover:bg-slate-800"
                            >
                                <Home className="w-4 h-4 mr-2" />
                                Go Home
                            </Button>
                        </div>

                        {/* Support Link */}
                        <p className="mt-8 text-sm text-slate-500">
                            If this problem persists, please{' '}
                            <a href="mailto:support@aihealthcare.com" className="text-blue-400 hover:underline">
                                contact support
                            </a>
                        </p>
                    </motion.div>
                </div>
            </body>
        </html>
    );
}
