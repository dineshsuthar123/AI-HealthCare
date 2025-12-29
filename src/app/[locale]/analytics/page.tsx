'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Link } from '@/navigation';
import { 
    Activity, TrendingUp, Calendar, Heart, Brain, 
    Stethoscope, AlertTriangle, CheckCircle, Clock, 
    ArrowUpRight, ArrowDownRight, Sparkles, Shield
} from 'lucide-react';
import { motion } from '@/lib/framer-motion';
import { cn } from '@/lib/utils';

interface AnalyticsData {
    consultations: { total: number; completed: number; upcoming: number; trend: number };
    symptoms: { total: number; highRisk: number };
    healthScore: number;
    healthTrend: number;
    recentActivities: number;
}

export default function AnalyticsPage() {
    const { data: session, status } = useSession();
    const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
    const [loading, setLoading] = useState(true);
    const isAuthenticated = status === 'authenticated' && !!session?.user;

    useEffect(() => {
        const fetchAnalytics = async () => {
            if (!isAuthenticated) { setLoading(false); return; }
            try {
                const [consultRes, activitiesRes] = await Promise.all([
                    fetch('/api/consultations', { credentials: 'include' }),
                    fetch('/api/user/activities', { credentials: 'include' })
                ]);
                const consultations = consultRes.ok ? await consultRes.json() : [];
                const activitiesData = activitiesRes.ok ? await activitiesRes.json() : { activities: [] };
                const now = new Date();
                const consultArray = Array.isArray(consultations) ? consultations : [];
                const activities = activitiesData.activities || [];
                const completedConsults = consultArray.filter((c: { status: string }) => c.status === 'completed').length;
                const upcomingConsults = consultArray.filter((c: { scheduledFor: string }) => new Date(c.scheduledFor) > now).length;
                const symptomChecks = activities.filter((a: { type: string }) => a.type === 'symptom_check');
                const highRiskSymptoms = symptomChecks.filter((s: { riskLevel?: string }) => s.riskLevel === 'high' || s.riskLevel === 'critical').length;
                const baseScore = 70;
                const activityBonus = Math.min(activities.length * 2, 15);
                const consultBonus = Math.min(completedConsults * 5, 15);
                setAnalytics({
                    consultations: { total: consultArray.length, completed: completedConsults, upcoming: upcomingConsults, trend: completedConsults > 0 ? 12 : 0 },
                    symptoms: { total: symptomChecks.length, highRisk: highRiskSymptoms },
                    healthScore: Math.min(baseScore + activityBonus + consultBonus, 100),
                    healthTrend: 5,
                    recentActivities: activities.length
                });
            } catch (e) { console.error('Error:', e); } finally { setLoading(false); }
        };
        fetchAnalytics();
    }, [isAuthenticated]);

    const StatCard = ({ title, value, subtitle, icon: Icon, trend, color = 'blue', delay = 0 }: { 
        title: string; value: string | number; subtitle?: string; icon: React.ElementType;
        trend?: number; color?: 'blue' | 'green' | 'purple' | 'amber'; delay?: number;
    }) => {
        const colors = {
            blue: { bg: 'from-blue-500/20 to-cyan-500/20', icon: 'text-blue-400', border: 'border-blue-500/30' },
            green: { bg: 'from-emerald-500/20 to-green-500/20', icon: 'text-emerald-400', border: 'border-emerald-500/30' },
            purple: { bg: 'from-purple-500/20 to-pink-500/20', icon: 'text-purple-400', border: 'border-purple-500/30' },
            amber: { bg: 'from-amber-500/20 to-orange-500/20', icon: 'text-amber-400', border: 'border-amber-500/30' }
        };
        return (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay }}>
                <Card className={cn("relative overflow-hidden bg-slate-900/50 backdrop-blur-xl border-slate-700/50 hover:scale-[1.02] transition-transform", colors[color].border)}>
                    <div className={cn("absolute inset-0 bg-gradient-to-br opacity-50", colors[color].bg)} />
                    <CardContent className="relative p-6">
                        <div className="flex items-start justify-between">
                            <div>
                                <p className="text-sm text-slate-400 mb-1">{title}</p>
                                <p className="text-3xl font-bold text-white">{value}</p>
                                {subtitle && <p className="text-xs text-slate-500 mt-1">{subtitle}</p>}
                            </div>
                            <div className={cn("p-3 rounded-xl bg-slate-800/50", colors[color].icon)}><Icon className="h-6 w-6" /></div>
                        </div>
                        {trend !== undefined && (
                            <div className={cn("flex items-center gap-1 mt-3 text-sm", trend >= 0 ? "text-emerald-400" : "text-red-400")}>
                                {trend >= 0 ? <ArrowUpRight className="h-4 w-4" /> : <ArrowDownRight className="h-4 w-4" />}
                                <span>{Math.abs(trend)}% from last month</span>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </motion.div>
        );
    };

    const ProgressRing = ({ value }: { value: number }) => {
        const size = 120, strokeWidth = 8, radius = (size - strokeWidth) / 2, circumference = radius * 2 * Math.PI;
        return (
            <div className="relative inline-flex items-center justify-center">
                <svg width={size} height={size} className="transform -rotate-90">
                    <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="rgba(100,116,139,0.2)" strokeWidth={strokeWidth} />
                    <motion.circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="url(#healthGrad)" strokeWidth={strokeWidth}
                        strokeDasharray={circumference} initial={{ strokeDashoffset: circumference }} 
                        animate={{ strokeDashoffset: circumference - (value / 100) * circumference }}
                        transition={{ duration: 1.5, ease: "easeOut" }} strokeLinecap="round" />
                    <defs><linearGradient id="healthGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#10B981" /><stop offset="50%" stopColor="#3B82F6" /><stop offset="100%" stopColor="#8B5CF6" />
                    </linearGradient></defs>
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-3xl font-bold text-white">{value}</span>
                    <span className="text-xs text-slate-400">Health Score</span>
                </div>
            </div>
        );
    };

    if (!isAuthenticated) {
        return (
            <div className="min-h-screen bg-[#01030f] flex items-center justify-center">
                <Card className="bg-slate-900/50 border-slate-700/50 p-8 text-center">
                    <Activity className="h-12 w-12 mx-auto mb-4 text-slate-500" />
                    <h2 className="text-xl font-semibold text-white mb-2">Sign in to view analytics</h2>
                    <p className="text-slate-400 mb-4">Track your health journey with personalized insights</p>
                    <Button asChild><Link href="/auth/signin">Sign In</Link></Button>
                </Card>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#01030f] text-white">
            <div className="fixed inset-0 pointer-events-none">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(87,120,255,0.15),_transparent_50%)]" />
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_80%,_rgba(139,92,246,0.1),_transparent_40%)]" />
            </div>
            <div className="relative z-10 mx-auto max-w-7xl px-4 py-12">
                <motion.div className="mb-10" initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-3 rounded-2xl bg-gradient-to-br from-purple-500/20 to-blue-500/20 border border-white/10">
                            <Activity className="h-6 w-6 text-purple-400" />
                        </div>
                        <div>
                            <p className="text-xs uppercase tracking-[0.3em] text-slate-500">Health Analytics</p>
                            <h1 className="text-3xl font-bold bg-gradient-to-r from-white to-slate-300 bg-clip-text text-transparent">Your Health Dashboard</h1>
                        </div>
                    </div>
                    <p className="text-slate-400 mt-2 max-w-2xl">Monitor your health trends, track consultations, and get AI-powered insights.</p>
                </motion.div>

                {loading ? (
                    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">{[1,2,3,4].map(i => <div key={i} className="h-36 rounded-2xl bg-slate-900/50 animate-pulse" />)}</div>
                ) : analytics ? (
                    <>
                        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-8">
                            <StatCard title="Total Consultations" value={analytics.consultations.total} subtitle={`${analytics.consultations.completed} completed`} icon={Calendar} trend={analytics.consultations.trend} color="blue" delay={0.1} />
                            <StatCard title="Upcoming" value={analytics.consultations.upcoming} subtitle="Next 30 days" icon={Clock} color="purple" delay={0.2} />
                            <StatCard title="Symptom Checks" value={analytics.symptoms.total} subtitle={analytics.symptoms.highRisk > 0 ? `${analytics.symptoms.highRisk} high risk` : 'All clear'} icon={Stethoscope} color={analytics.symptoms.highRisk > 0 ? 'amber' : 'green'} delay={0.3} />
                            <StatCard title="Activities" value={analytics.recentActivities} subtitle="Recent interactions" icon={Activity} trend={8} color="green" delay={0.4} />
                        </div>
                        <div className="grid gap-6 lg:grid-cols-3 mb-8">
                            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.5 }}>
                                <Card className="bg-gradient-to-br from-slate-900/80 to-slate-800/50 border-slate-700/50 h-full">
                                    <CardHeader><CardTitle className="flex items-center gap-2 text-lg"><Heart className="h-5 w-5 text-pink-400" />Health Score</CardTitle></CardHeader>
                                    <CardContent className="flex flex-col items-center">
                                        <ProgressRing value={analytics.healthScore} />
                                        <div className="flex items-center gap-1 mt-4 text-emerald-400"><TrendingUp className="h-4 w-4" /><span className="text-sm">+{analytics.healthTrend}% this month</span></div>
                                        <p className="text-center text-sm text-slate-400 mt-3">Based on activity and engagement</p>
                                    </CardContent>
                                </Card>
                            </motion.div>
                            <motion.div className="lg:col-span-2" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.6 }}>
                                <Card className="bg-gradient-to-br from-slate-900/80 to-slate-800/50 border-slate-700/50 h-full">
                                    <CardHeader><CardTitle className="flex items-center gap-2 text-lg"><Brain className="h-5 w-5 text-purple-400" />AI Insights</CardTitle></CardHeader>
                                    <CardContent className="space-y-4">
                                        <div className="flex items-start gap-3 p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
                                            <CheckCircle className="h-5 w-5 text-emerald-400 mt-0.5" />
                                            <div><p className="font-medium text-emerald-300">Great engagement!</p><p className="text-sm text-slate-400">{analytics.recentActivities} recent activities recorded.</p></div>
                                        </div>
                                        {analytics.consultations.upcoming > 0 && (
                                            <div className="flex items-start gap-3 p-4 rounded-xl bg-blue-500/10 border border-blue-500/20">
                                                <Calendar className="h-5 w-5 text-blue-400 mt-0.5" />
                                                <div><p className="font-medium text-blue-300">Upcoming care</p><p className="text-sm text-slate-400">{analytics.consultations.upcoming} scheduled.</p></div>
                                            </div>
                                        )}
                                        {analytics.symptoms.highRisk > 0 && (
                                            <div className="flex items-start gap-3 p-4 rounded-xl bg-amber-500/10 border border-amber-500/20">
                                                <AlertTriangle className="h-5 w-5 text-amber-400 mt-0.5" />
                                                <div><p className="font-medium text-amber-300">Attention needed</p><p className="text-sm text-slate-400">{analytics.symptoms.highRisk} high risk checks.</p></div>
                                            </div>
                                        )}
                                        <div className="flex items-start gap-3 p-4 rounded-xl bg-purple-500/10 border border-purple-500/20">
                                            <Sparkles className="h-5 w-5 text-purple-400 mt-0.5" />
                                            <div><p className="font-medium text-purple-300">Try AI Symptom Checker</p><p className="text-sm text-slate-400">Get instant AI-powered health guidance.</p></div>
                                        </div>
                                    </CardContent>
                                </Card>
                            </motion.div>
                        </div>
                        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.7 }}>
                            <Card className="bg-gradient-to-r from-slate-900/80 via-indigo-900/30 to-slate-900/80 border-indigo-500/30">
                                <CardContent className="p-6">
                                    <div className="flex items-center justify-between flex-wrap gap-4">
                                        <div className="flex items-center gap-4">
                                            <div className="p-3 rounded-xl bg-indigo-500/20"><Shield className="h-6 w-6 text-indigo-400" /></div>
                                            <div><h3 className="font-semibold text-white">Blockchain-Secured Records</h3><p className="text-sm text-slate-400">Cryptographically protected and tamper-proof</p></div>
                                        </div>
                                        <Button asChild variant="outline" className="bg-indigo-500/10 border-indigo-500/30 hover:bg-indigo-500/20"><Link href="/health-records">View Records</Link></Button>
                                    </div>
                                </CardContent>
                            </Card>
                        </motion.div>
                    </>
                ) : (
                    <Card className="bg-slate-900/30 border-slate-700/30 p-12 text-center">
                        <Activity className="h-16 w-16 mx-auto mb-4 text-slate-600" />
                        <h3 className="text-xl font-semibold text-slate-300 mb-2">No data available</h3>
                        <p className="text-slate-500">Start using the app to see your health analytics</p>
                    </Card>
                )}
            </div>
        </div>
    );
}
