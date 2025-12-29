import { FileHeart } from 'lucide-react';

export default function HealthRecordsLoading() {
    return (
        <div className="min-h-screen bg-[#01030f] text-white">
            <div className="fixed inset-0 pointer-events-none">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(87,120,255,0.15),_transparent_50%)]" />
            </div>

            <div className="relative z-10 mx-auto max-w-7xl px-4 py-12">
                {/* Header Skeleton */}
                <div className="mb-8 animate-pulse">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="w-12 h-12 rounded-2xl bg-slate-800/50" />
                        <div>
                            <div className="h-3 w-20 bg-slate-800/50 rounded mb-2" />
                            <div className="h-8 w-40 bg-slate-800/50 rounded" />
                        </div>
                    </div>
                    <div className="h-4 w-64 bg-slate-800/50 rounded" />
                </div>

                {/* Toolbar Skeleton */}
                <div className="flex flex-wrap gap-4 mb-6 animate-pulse">
                    <div className="h-10 w-64 bg-slate-800/50 rounded-lg" />
                    <div className="h-10 w-32 bg-slate-800/50 rounded-lg" />
                    <div className="ml-auto h-10 w-36 bg-slate-800/50 rounded-lg" />
                </div>

                {/* Records Grid Skeleton */}
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {[1, 2, 3, 4, 5, 6].map((i) => (
                        <div
                            key={i}
                            className="rounded-2xl bg-slate-900/50 border border-slate-700/30 animate-pulse p-6"
                            style={{ animationDelay: `${i * 100}ms` }}
                        >
                            <div className="flex items-start justify-between mb-4">
                                <div className="w-12 h-12 rounded-xl bg-slate-800/50" />
                                <div className="w-20 h-6 bg-slate-800/50 rounded-full" />
                            </div>
                            <div className="h-5 w-3/4 bg-slate-800/50 rounded mb-2" />
                            <div className="h-4 w-1/2 bg-slate-800/50 rounded mb-4" />
                            <div className="h-3 w-full bg-slate-800/50 rounded mb-2" />
                            <div className="h-3 w-2/3 bg-slate-800/50 rounded" />
                        </div>
                    ))}
                </div>

                {/* Loading Indicator */}
                <div className="fixed bottom-8 right-8 flex items-center gap-2 bg-slate-900/90 backdrop-blur-lg rounded-full px-4 py-2 border border-slate-700/50">
                    <FileHeart className="w-4 h-4 text-emerald-400 animate-pulse" />
                    <span className="text-sm text-slate-400">Loading records...</span>
                </div>
            </div>
        </div>
    );
}
