'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { Bell, Calendar, Clock, AlertCircle, FileText, Check, CheckCheck, Trash2, Filter, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { motion, AnimatePresence } from '@/lib/framer-motion';
import { cn } from '@/lib/utils';
import { Link } from '@/navigation';

interface Notification {
    id: string;
    type: 'appointment' | 'reminder' | 'alert' | 'update';
    title: string;
    message: string;
    timestamp: Date;
    isRead: boolean;
    action?: {
        label: string;
        href: string;
    };
}

type NotificationPayload = Omit<Notification, 'timestamp' | 'isRead'> & {
    timestamp: string | number | Date;
    isRead?: boolean;
};

const READ_KEY = 'readNotifications';

export default function NotificationsPage() {
    const { data: session, status } = useSession();
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState<'all' | 'unread' | 'appointment' | 'reminder' | 'alert' | 'update'>('all');
    const [searchQuery, setSearchQuery] = useState('');
    const [readIds, setReadIds] = useState<string[]>([]);

    const isAuthenticated = status === 'authenticated' && !!session?.user;

    useEffect(() => {
        try {
            const stored = JSON.parse(localStorage.getItem(READ_KEY) || '[]');
            if (Array.isArray(stored)) {
                setReadIds(stored);
            }
        } catch {
            setReadIds([]);
        }
    }, []);

    const normalizeNotifications = useCallback((payload: NotificationPayload[] = []) => {
        const readSet = new Set(readIds);
        return payload
            .map((n) => ({
                id: n.id,
                type: n.type,
                title: n.title,
                message: n.message,
                timestamp: new Date(n.timestamp),
                isRead: n.isRead ?? readSet.has(n.id),
                action: n.action,
            }))
            .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
    }, [readIds]);

    useEffect(() => {
        if (!isAuthenticated) {
            setLoading(false);
            return;
        }

        const fetchNotifications = async () => {
            try {
                const res = await fetch('/api/notifications', { credentials: 'include' });
                if (!res.ok) {
                    setNotifications([]);
                    return;
                }
                const data = await res.json();
                setNotifications(normalizeNotifications(data.notifications || []));
            } catch {
                setNotifications([]);
            } finally {
                setLoading(false);
            }
        };

        fetchNotifications();
    }, [isAuthenticated, normalizeNotifications]);

    const markAsRead = (id: string) => {
        const newReadIds = [...readIds, id];
        setReadIds(newReadIds);
        localStorage.setItem(READ_KEY, JSON.stringify(newReadIds));
        setNotifications(prev =>
            prev.map(n => n.id === id ? { ...n, isRead: true } : n)
        );
    };

    const markAllAsRead = () => {
        const allIds = notifications.map(n => n.id);
        const newReadIds = [...new Set([...readIds, ...allIds])];
        setReadIds(newReadIds);
        localStorage.setItem(READ_KEY, JSON.stringify(newReadIds));
        setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
    };

    const deleteNotification = (id: string) => {
        setNotifications(prev => prev.filter(n => n.id !== id));
    };

    const getNotificationIcon = (type: Notification['type']) => {
        switch (type) {
            case 'appointment':
                return <Calendar className="h-5 w-5 text-blue-400" />;
            case 'reminder':
                return <Clock className="h-5 w-5 text-amber-400" />;
            case 'alert':
                return <AlertCircle className="h-5 w-5 text-red-400" />;
            case 'update':
                return <FileText className="h-5 w-5 text-emerald-400" />;
            default:
                return <Bell className="h-5 w-5 text-slate-400" />;
        }
    };

    const formatTimestamp = (timestamp: Date) => {
        const now = new Date();
        const diff = now.getTime() - timestamp.getTime();
        const minutes = Math.floor(diff / (1000 * 60));
        const hours = Math.floor(diff / (1000 * 60 * 60));
        const days = Math.floor(diff / (1000 * 60 * 60 * 24));

        if (minutes < 1) return 'Just now';
        if (minutes < 60) return `${minutes}m ago`;
        if (hours < 24) return `${hours}h ago`;
        if (days < 7) return `${days}d ago`;
        return timestamp.toLocaleDateString();
    };

    const filteredNotifications = notifications.filter(n => {
        if (filter === 'unread' && n.isRead) return false;
        if (['appointment', 'reminder', 'alert', 'update'].includes(filter) && n.type !== filter) return false;
        if (searchQuery && !n.title.toLowerCase().includes(searchQuery.toLowerCase()) && 
            !n.message.toLowerCase().includes(searchQuery.toLowerCase())) return false;
        return true;
    });

    const unreadCount = notifications.filter(n => !n.isRead).length;

    if (!isAuthenticated) {
        return (
            <div className="min-h-screen bg-[#01030f] flex items-center justify-center">
                <Card className="bg-slate-900/50 border-slate-700/50 p-8 text-center">
                    <Bell className="h-12 w-12 mx-auto mb-4 text-slate-500" />
                    <h2 className="text-xl font-semibold text-white mb-2">Sign in to view notifications</h2>
                    <p className="text-slate-400 mb-4">Get real-time updates about your health journey</p>
                    <Button asChild>
                        <Link href="/auth/signin">Sign In</Link>
                    </Button>
                </Card>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#01030f] text-white">
            {/* Background effects */}
            <div className="fixed inset-0 pointer-events-none">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(87,120,255,0.15),_transparent_50%)]" />
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_20%,_rgba(139,92,246,0.1),_transparent_40%)]" />
            </div>

            <div className="relative z-10 mx-auto max-w-4xl px-4 py-12">
                {/* Header */}
                <div className="mb-8">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-3 rounded-2xl bg-gradient-to-br from-blue-500/20 to-purple-500/20 border border-white/10">
                            <Bell className="h-6 w-6 text-blue-400" />
                        </div>
                        <div>
                            <p className="text-xs uppercase tracking-[0.3em] text-slate-500">Notification Center</p>
                            <h1 className="text-3xl font-bold bg-gradient-to-r from-white to-slate-300 bg-clip-text text-transparent">
                                Your Updates
                            </h1>
                        </div>
                    </div>
                    <p className="text-slate-400 mt-2">
                        Stay informed about consultations, health records, and important reminders.
                    </p>
                </div>

                {/* Controls */}
                <div className="flex flex-wrap items-center gap-4 mb-6">
                    <div className="relative flex-1 min-w-[200px]">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                        <Input
                            type="text"
                            placeholder="Search notifications..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-10 bg-slate-900/50 border-slate-700/50 text-white placeholder:text-slate-500"
                        />
                    </div>
                    <div className="flex items-center gap-2 flex-wrap">
                        <Filter className="h-4 w-4 text-slate-500" />
                        {(['all', 'unread', 'appointment', 'reminder', 'alert', 'update'] as const).map((f) => (
                            <Button
                                key={f}
                                variant={filter === f ? 'default' : 'outline'}
                                size="sm"
                                onClick={() => setFilter(f)}
                                className={cn(
                                    "capitalize",
                                    filter === f 
                                        ? "bg-blue-600 hover:bg-blue-700" 
                                        : "bg-slate-900/50 border-slate-700/50 text-slate-300 hover:bg-slate-800"
                                )}
                            >
                                {f}
                                {f === 'unread' && unreadCount > 0 && (
                                    <span className="ml-1.5 px-1.5 py-0.5 text-xs bg-red-500 rounded-full">{unreadCount}</span>
                                )}
                            </Button>
                        ))}
                    </div>
                </div>

                {/* Mark all as read */}
                {unreadCount > 0 && (
                    <div className="flex justify-end mb-4">
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={markAllAsRead}
                            className="text-blue-400 hover:text-blue-300 hover:bg-blue-500/10"
                        >
                            <CheckCheck className="h-4 w-4 mr-2" />
                            Mark all as read
                        </Button>
                    </div>
                )}

                {/* Notifications list */}
                {loading ? (
                    <div className="space-y-4">
                        {[1, 2, 3].map(i => (
                            <div key={i} className="h-24 rounded-2xl bg-slate-900/50 animate-pulse" />
                        ))}
                    </div>
                ) : filteredNotifications.length === 0 ? (
                    <Card className="bg-slate-900/30 border-slate-700/30 p-12 text-center">
                        <Bell className="h-16 w-16 mx-auto mb-4 text-slate-600" />
                        <h3 className="text-xl font-semibold text-slate-300 mb-2">No notifications</h3>
                        <p className="text-slate-500">
                            {filter !== 'all' ? 'Try changing your filter' : 'You\'re all caught up!'}
                        </p>
                    </Card>
                ) : (
                    <AnimatePresence mode="popLayout">
                        <div className="space-y-3">
                            {filteredNotifications.map((notification, index) => (
                                <motion.div
                                    key={notification.id}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, x: -100 }}
                                    transition={{ delay: index * 0.05 }}
                                >
                                    <Card className={cn(
                                        "relative overflow-hidden transition-all duration-300 hover:scale-[1.01]",
                                        notification.isRead 
                                            ? "bg-slate-900/30 border-slate-800/50" 
                                            : "bg-gradient-to-r from-slate-900/80 to-slate-800/50 border-blue-500/30 shadow-lg shadow-blue-500/5"
                                    )}>
                                        {!notification.isRead && (
                                            <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-blue-500 to-purple-500" />
                                        )}
                                        <CardContent className="p-4 pl-5">
                                            <div className="flex items-start gap-4">
                                                <div className={cn(
                                                    "p-2.5 rounded-xl",
                                                    notification.type === 'appointment' && "bg-blue-500/20",
                                                    notification.type === 'reminder' && "bg-amber-500/20",
                                                    notification.type === 'alert' && "bg-red-500/20",
                                                    notification.type === 'update' && "bg-emerald-500/20"
                                                )}>
                                                    {getNotificationIcon(notification.type)}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center justify-between gap-2">
                                                        <h3 className={cn(
                                                            "font-medium truncate",
                                                            notification.isRead ? "text-slate-300" : "text-white"
                                                        )}>
                                                            {notification.title}
                                                        </h3>
                                                        <span className="text-xs text-slate-500 whitespace-nowrap">
                                                            {formatTimestamp(notification.timestamp)}
                                                        </span>
                                                    </div>
                                                    <p className="text-sm text-slate-400 mt-1 line-clamp-2">
                                                        {notification.message}
                                                    </p>
                                                    <div className="flex items-center gap-2 mt-3">
                                                        {notification.action && (
                                                            <Button asChild size="sm" variant="outline" className="h-7 text-xs bg-transparent border-slate-700 hover:bg-slate-800">
                                                                <Link href={notification.action.href}>{notification.action.label}</Link>
                                                            </Button>
                                                        )}
                                                        {!notification.isRead && (
                                                            <Button
                                                                size="sm"
                                                                variant="ghost"
                                                                onClick={() => markAsRead(notification.id)}
                                                                className="h-7 text-xs text-blue-400 hover:text-blue-300 hover:bg-blue-500/10"
                                                            >
                                                                <Check className="h-3 w-3 mr-1" />
                                                                Mark read
                                                            </Button>
                                                        )}
                                                        <Button
                                                            size="sm"
                                                            variant="ghost"
                                                            onClick={() => deleteNotification(notification.id)}
                                                            className="h-7 text-xs text-slate-500 hover:text-red-400 hover:bg-red-500/10"
                                                        >
                                                            <Trash2 className="h-3 w-3" />
                                                        </Button>
                                                    </div>
                                                </div>
                                            </div>
                                        </CardContent>
                                    </Card>
                                </motion.div>
                            ))}
                        </div>
                    </AnimatePresence>
                )}
            </div>
        </div>
    );
}
