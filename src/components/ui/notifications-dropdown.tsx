'use client';

import { useState, useEffect, useRef } from 'react';
import { useTranslations } from 'next-intl';
import { Bell, X, Check, Clock, AlertCircle, Calendar, Stethoscope, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { motion, AnimatePresence } from '@/lib/framer-motion';
import { cn } from '@/lib/utils';

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

interface NotificationsDropdownProps {
    isOpen: boolean;
    onToggle: () => void;
    onClose: () => void;
}

// Mock notifications for demonstration
const mockNotifications: Notification[] = [
    {
        id: '1',
        type: 'appointment',
        title: 'Upcoming Appointment',
        message: 'Your video consultation with Dr. Smith is scheduled for tomorrow at 2:00 PM',
        timestamp: new Date(Date.now() - 1000 * 60 * 30), // 30 minutes ago
        isRead: false,
        action: {
            label: 'View Details',
            href: '/consultations'
        }
    },
    {
        id: '2',
        type: 'reminder',
        title: 'Medication Reminder',
        message: 'Time to take your evening medication',
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2), // 2 hours ago
        isRead: false,
        action: {
            label: 'Mark Taken',
            href: '/health-records'
        }
    },
    {
        id: '3',
        type: 'alert',
        title: 'Health Alert',
        message: 'Your recent symptom check suggests monitoring your blood pressure',
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24), // 1 day ago
        isRead: true,
        action: {
            label: 'View Report',
            href: '/symptom-checker'
        }
    },
    {
        id: '4',
        type: 'update',
        title: 'New Health Record',
        message: 'Your lab results have been uploaded to your health records',
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2), // 2 days ago
        isRead: true,
        action: {
            label: 'View Records',
            href: '/health-records'
        }
    }
];

export default function NotificationsDropdown({ isOpen, onToggle, onClose }: NotificationsDropdownProps) {
    const t = useTranslations('Notifications');
    const [notifications, setNotifications] = useState<Notification[]>(mockNotifications);
    const [isClient, setIsClient] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    // Prevent hydration issues
    useEffect(() => {
        setIsClient(true);
    }, []);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                onClose();
            }
        };

        if (isOpen && isClient) {
            document.addEventListener('mousedown', handleClickOutside);
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [isOpen, onClose, isClient]);

    const getNotificationIcon = (type: Notification['type']) => {
        switch (type) {
            case 'appointment':
                return <Calendar className="h-4 w-4 text-blue-500" />;
            case 'reminder':
                return <Clock className="h-4 w-4 text-orange-500" />;
            case 'alert':
                return <AlertCircle className="h-4 w-4 text-red-500" />;
            case 'update':
                return <FileText className="h-4 w-4 text-green-500" />;
            default:
                return <Bell className="h-4 w-4 text-gray-500" />;
        }
    };

    const formatTimestamp = (timestamp: Date) => {
        const now = new Date();
        const diff = now.getTime() - timestamp.getTime();
        const minutes = Math.floor(diff / (1000 * 60));
        const hours = Math.floor(diff / (1000 * 60 * 60));
        const days = Math.floor(diff / (1000 * 60 * 60 * 24));

        if (minutes < 60) {
            return `${minutes}m ago`;
        } else if (hours < 24) {
            return `${hours}h ago`;
        } else {
            return `${days}d ago`;
        }
    };

    const markAsRead = (id: string) => {
        setNotifications(prev =>
            prev.map(notification =>
                notification.id === id
                    ? { ...notification, isRead: true }
                    : notification
            )
        );
    };

    const markAllAsRead = () => {
        setNotifications(prev =>
            prev.map(notification => ({ ...notification, isRead: true }))
        );
    };

    const removeNotification = (id: string) => {
        setNotifications(prev => prev.filter(notification => notification.id !== id));
    };

    const unreadCount = notifications.filter(n => !n.isRead).length;

    return (
        <div className="relative" ref={dropdownRef}>
            {/* Notification Button */}
            <Button
                variant="ghost"
                size="icon"
                className={cn(
                    "relative glass rounded-full transition-all duration-200",
                    isOpen && "bg-blue-50 text-blue-600"
                )}
                onClick={onToggle}
            >
                <Bell className="h-5 w-5" />
                {unreadCount > 0 && (
                    <motion.span
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="absolute -top-1 -right-1 h-5 w-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-medium"
                    >
                        {unreadCount > 9 ? '9+' : unreadCount}
                    </motion.span>
                )}
            </Button>

            {/* Dropdown */}
            <AnimatePresence>
                {isOpen && isClient && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: -10 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: -10 }}
                        transition={{ duration: 0.2 }}
                        className="absolute right-0 mt-2 w-96 z-50"
                    >
                        <Card className="glass border-0 shadow-2xl">
                            <CardContent className="p-0">
                                {/* Header */}
                                <div className="p-4 border-b border-gray-200/20">
                                    <div className="flex items-center justify-between">
                                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                                            Notifications
                                        </h3>
                                        {unreadCount > 0 && (
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={markAllAsRead}
                                                className="text-xs"
                                            >
                                                Mark all as read
                                            </Button>
                                        )}
                                    </div>
                                </div>

                                {/* Notifications List */}
                                <div className="max-h-96 overflow-y-auto">
                                    {notifications.length === 0 ? (
                                        <div className="p-8 text-center">
                                            <Bell className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                                            <p className="text-gray-500">No notifications</p>
                                        </div>
                                    ) : (
                                        <div className="space-y-1">
                                            {notifications.map((notification) => (
                                                <motion.div
                                                    key={notification.id}
                                                    initial={{ opacity: 0, x: -20 }}
                                                    animate={{ opacity: 1, x: 0 }}
                                                    className={cn(
                                                        "p-4 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors cursor-pointer",
                                                        !notification.isRead && "bg-blue-50/50 dark:bg-blue-900/20"
                                                    )}
                                                    onClick={() => markAsRead(notification.id)}
                                                >
                                                    <div className="flex items-start space-x-3">
                                                        <div className="flex-shrink-0 mt-1">
                                                            {getNotificationIcon(notification.type)}
                                                        </div>
                                                        <div className="flex-1 min-w-0">
                                                            <div className="flex items-center justify-between">
                                                                <p className={cn(
                                                                    "text-sm font-medium",
                                                                    notification.isRead ? "text-gray-700 dark:text-gray-300" : "text-gray-900 dark:text-white"
                                                                )}>
                                                                    {notification.title}
                                                                </p>
                                                                <div className="flex items-center space-x-2">
                                                                    <span className="text-xs text-gray-500">
                                                                        {formatTimestamp(notification.timestamp)}
                                                                    </span>
                                                                    <Button
                                                                        variant="ghost"
                                                                        size="icon"
                                                                        className="h-6 w-6 opacity-0 group-hover:opacity-100 hover:bg-red-100 hover:text-red-600"
                                                                        onClick={(e) => {
                                                                            e.stopPropagation();
                                                                            removeNotification(notification.id);
                                                                        }}
                                                                    >
                                                                        <X className="h-3 w-3" />
                                                                    </Button>
                                                                </div>
                                                            </div>
                                                            <p className={cn(
                                                                "text-sm mt-1",
                                                                notification.isRead ? "text-gray-500" : "text-gray-700 dark:text-gray-300"
                                                            )}>
                                                                {notification.message}
                                                            </p>
                                                            {notification.action && (
                                                                <Button
                                                                    variant="ghost"
                                                                    size="sm"
                                                                    className="mt-2 text-xs text-blue-600 hover:text-blue-700 p-0 h-auto"
                                                                    onClick={(e) => {
                                                                        e.stopPropagation();
                                                                        // Navigate to the action href
                                                                        window.location.href = notification.action!.href;
                                                                    }}
                                                                >
                                                                    {notification.action.label}
                                                                </Button>
                                                            )}
                                                        </div>
                                                        {!notification.isRead && (
                                                            <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0 mt-2"></div>
                                                        )}
                                                    </div>
                                                </motion.div>
                                            ))}
                                        </div>
                                    )}
                                </div>

                                {/* Footer */}
                                {notifications.length > 0 && (
                                    <div className="p-4 border-t border-gray-200/20">
                                        <Button
                                            variant="ghost"
                                            className="w-full text-sm text-blue-600 hover:text-blue-700"
                                            onClick={() => {
                                                // Navigate to notifications page
                                                window.location.href = '/notifications';
                                            }}
                                        >
                                            View all notifications
                                        </Button>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
