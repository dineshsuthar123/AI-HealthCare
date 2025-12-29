'use client';

import { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { AlertTriangle, RefreshCcw, Home, ArrowLeft } from 'lucide-react';
import { motion } from '@/lib/framer-motion';
import { Link, useRouter } from '@/navigation';

export default function Error({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    const router = useRouter();

    useEffect(() => {
        // Log error for debugging
        console.error('Page error:', error);
    }, [error]);

    return (
        <div className="min-h-screen bg-[#01030f] flex items-center justify-center px-4">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-center max-w-md"
            >
                {/* Error Icon with Pulse */}
                <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: 'spring', delay: 0.1 }}
                    className="relative mx-auto w-20 h-20 mb-6"
                >
                    <div className="absolute inset-0 rounded-full bg-red-500/20 animate-ping" />
                    <div className="relative w-full h-full rounded-full bg-gradient-to-br from-red-500/20 to-orange-500/20 border border-red-500/30 flex items-center justify-center">
                        <AlertTriangle className="w-10 h-10 text-red-400" />
                    </div>
                </motion.div>

                {/* Error Message */}
                <h1 className="text-3xl font-bold text-white mb-3">
                    Oops! Something went wrong
                </h1>
                <p className="text-slate-400 mb-8">
                    We hit an unexpected error while loading this page. 
                    Don&apos;t worry, your data is safe.
                </p>

                {/* Action Buttons */}
                <div className="flex flex-col sm:flex-row gap-3 justify-center mb-6">
                    <Button
                        onClick={() => reset()}
                        className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800"
                    >
                        <RefreshCcw className="w-4 h-4 mr-2" />
                        Try Again
                    </Button>
                    <Button
                        onClick={() => router.back()}
                        variant="outline"
                        className="border-slate-700 hover:bg-slate-800"
                    >
                        <ArrowLeft className="w-4 h-4 mr-2" />
                        Go Back
                    </Button>
                    <Button
                        asChild
                        variant="ghost"
                        className="text-slate-400 hover:text-white"
                    >
                        <Link href="/dashboard">
                            <Home className="w-4 h-4 mr-2" />
                            Dashboard
                        </Link>
                    </Button>
                </div>

                {/* Error Digest */}
                {error.digest && (
                    <p className="text-xs text-slate-600">
                        Error ID: {error.digest}
                    </p>
                )}
            </motion.div>
        </div>
    );
}
