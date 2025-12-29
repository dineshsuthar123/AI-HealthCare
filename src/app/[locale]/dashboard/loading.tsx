import { Activity } from 'lucide-react';

export default function DashboardLoading() {
    return (
        <div className="min-h-screen bg-[#01030f] text-white">
            {/* Background */}
            <div className="fixed inset-0 pointer-events-none">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(87,120,255,0.15),_transparent_50%)]" />
            </div>

            <div className="relative z-10 mx-auto max-w-7xl px-4 py-12">
                {/* Header Skeleton */}
                <div className="mb-10 animate-pulse">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="w-12 h-12 rounded-2xl bg-slate-800/50" />
                        <div>
                            <div className="h-3 w-24 bg-slate-800/50 rounded mb-2" />
                            <div className="h-8 w-48 bg-slate-800/50 rounded" />
                        </div>
                    </div>
                </div>

                {/* Stats Grid Skeleton */}
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-8">
                    {[1, 2, 3, 4].map((i) => (
                        <div
                            key={i}
                            className="h-36 rounded-2xl bg-slate-900/50 border border-slate-700/30 animate-pulse"
                        >
                            <div className="p-6">
                                <div className="flex justify-between">
                                    <div>
                                        <div className="h-4 w-24 bg-slate-800/50 rounded mb-3" />
                                        <div className="h-8 w-16 bg-slate-800/50 rounded" />
                                    </div>
                                    <div className="w-12 h-12 rounded-xl bg-slate-800/50" />
                                </div>
                                <div className="h-4 w-32 bg-slate-800/50 rounded mt-4" />
                            </div>
                        </div>
                    ))}
                </div>

                {/* Content Grid Skeleton */}
                <div className="grid gap-6 lg:grid-cols-3">
                    <div className="lg:col-span-2 rounded-2xl bg-slate-900/50 border border-slate-700/30 animate-pulse p-6">
                        <div className="h-6 w-40 bg-slate-800/50 rounded mb-4" />
                        <div className="space-y-4">
                            {[1, 2, 3].map((i) => (
                                <div key={i} className="h-20 bg-slate-800/30 rounded-xl" />
                            ))}
                        </div>
                    </div>
                    <div className="rounded-2xl bg-slate-900/50 border border-slate-700/30 animate-pulse p-6">
                        <div className="h-6 w-32 bg-slate-800/50 rounded mb-4" />
                        <div className="space-y-3">
                            {[1, 2, 3, 4].map((i) => (
                                <div key={i} className="h-12 bg-slate-800/30 rounded-lg" />
                            ))}
                        </div>
                    </div>
                </div>

                {/* Loading Indicator */}
                <div className="fixed bottom-8 right-8 flex items-center gap-2 bg-slate-900/90 backdrop-blur-lg rounded-full px-4 py-2 border border-slate-700/50">
                    <Activity className="w-4 h-4 text-blue-400 animate-pulse" />
                    <span className="text-sm text-slate-400">Loading dashboard...</span>
                </div>
            </div>
        </div>
    );
}
