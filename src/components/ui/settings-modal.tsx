'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { Settings, X, Moon, Sun, Globe, Bell, Shield, User, Palette, Volume2, Monitor } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { motion, AnimatePresence } from '@/lib/framer-motion';
import { cn } from '@/lib/utils';
import ReliableLanguageSwitcher from '@/components/ui/reliable-language-switcher';

interface SettingsModalProps {
    isOpen: boolean;
    onClose: () => void;
}

interface UserSettings {
    theme: 'light' | 'dark' | 'system';
    language: string;
    notifications: {
        email: boolean;
        push: boolean;
        sms: boolean;
        appointments: boolean;
        reminders: boolean;
        updates: boolean;
    };
    privacy: {
        shareHealthData: boolean;
        allowAnalytics: boolean;
        showOnlineStatus: boolean;
    };
    profile: {
        name: string;
        email: string;
        phone: string;
        timezone: string;
    };
    accessibility: {
        fontSize: 'small' | 'medium' | 'large';
        highContrast: boolean;
        reducedMotion: boolean;
        soundEffects: boolean;
    };
}

const defaultSettings: UserSettings = {
    theme: 'system',
    language: 'en',
    notifications: {
        email: true,
        push: true,
        sms: false,
        appointments: true,
        reminders: true,
        updates: false,
    },
    privacy: {
        shareHealthData: false,
        allowAnalytics: true,
        showOnlineStatus: true,
    },
    profile: {
        name: 'John Doe',
        email: 'john.doe@example.com',
        phone: '+1 (555) 123-4567',
        timezone: 'America/New_York',
    },
    accessibility: {
        fontSize: 'medium',
        highContrast: false,
        reducedMotion: false,
        soundEffects: true,
    },
};

export default function SettingsModal({ isOpen, onClose }: SettingsModalProps) {
    const t = useTranslations('Settings');
    const [settings, setSettings] = useState<UserSettings>(defaultSettings);
    const [activeTab, setActiveTab] = useState<'general' | 'notifications' | 'privacy' | 'profile' | 'accessibility'>('general');
    const [hasChanges, setHasChanges] = useState(false);
    const [isClient, setIsClient] = useState(false);

    // Prevent hydration issues
    useEffect(() => {
        setIsClient(true);
    }, []);

    useEffect(() => {
        // Load settings from localStorage on mount
        const savedSettings = localStorage.getItem('userSettings');
        if (savedSettings) {
            try {
                setSettings(JSON.parse(savedSettings));
            } catch (error) {
                console.error('Failed to parse saved settings:', error);
            }
        }
    }, []);

    const updateSettings = (path: string, value: any) => {
        setSettings(prev => {
            const newSettings = { ...prev };
            const keys = path.split('.');
            let current: any = newSettings;

            for (let i = 0; i < keys.length - 1; i++) {
                current = current[keys[i]];
            }
            current[keys[keys.length - 1]] = value;

            return newSettings;
        });
        setHasChanges(true);
    };

    const saveSettings = async () => {
        try {
            localStorage.setItem('userSettings', JSON.stringify(settings));

            // Here you would typically save to your backend
            const response = await fetch('/api/user/settings', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(settings),
            });

            if (response.ok) {
                setHasChanges(false);
                // Show success toast or notification
            }
        } catch (error) {
            console.error('Failed to save settings:', error);
        }
    };

    const resetSettings = () => {
        setSettings(defaultSettings);
        setHasChanges(true);
    };

    const tabs = [
        { id: 'general', label: 'General', icon: Settings },
        { id: 'notifications', label: 'Notifications', icon: Bell },
        { id: 'privacy', label: 'Privacy', icon: Shield },
        { id: 'profile', label: 'Profile', icon: User },
        { id: 'accessibility', label: 'Accessibility', icon: Palette },
    ] as const;

    const languages = [
        { code: 'en', name: 'English' },
        { code: 'es', name: 'Español' },
        { code: 'fr', name: 'Français' },
        { code: 'pt', name: 'Português' },
        { code: 'ar', name: 'العربية' },
        { code: 'hi', name: 'हिन्दी' },
        { code: 'sw', name: 'Kiswahili' },
    ];

    const timezones = [
        'America/New_York',
        'America/Los_Angeles',
        'America/Chicago',
        'Europe/London',
        'Europe/Paris',
        'Asia/Tokyo',
        'Asia/Shanghai',
        'Australia/Sydney',
    ];

    if (!isOpen || !isClient) return null;

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
                onClick={onClose}
            >
                <motion.div
                    initial={{ scale: 0.95, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.95, opacity: 0 }}
                    className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-4xl max-h-[80vh] overflow-hidden"
                    onClick={(e) => e.stopPropagation()}
                >
                    {/* Header */}
                    <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
                        <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center">
                            <Settings className="h-6 w-6 mr-3" />
                            Settings
                        </h2>
                        <Button variant="ghost" size="icon" onClick={onClose}>
                            <X className="h-5 w-5" />
                        </Button>
                    </div>

                    <div className="flex h-[calc(80vh-theme(spacing.16))]">
                        {/* Sidebar */}
                        <div className="w-64 border-r border-gray-200 dark:border-gray-700 p-4">
                            <nav className="space-y-2">
                                {tabs.map((tab) => {
                                    const Icon = tab.icon;
                                    return (
                                        <button
                                            key={tab.id}
                                            onClick={() => setActiveTab(tab.id)}
                                            className={cn(
                                                "w-full flex items-center px-3 py-2 text-left rounded-lg transition-colors",
                                                activeTab === tab.id
                                                    ? "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300"
                                                    : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
                                            )}
                                        >
                                            <Icon className="h-4 w-4 mr-3" />
                                            {tab.label}
                                        </button>
                                    );
                                })}
                            </nav>
                        </div>

                        {/* Content */}
                        <div className="flex-1 overflow-y-auto">
                            <div className="p-6">
                                {activeTab === 'general' && (
                                    <div className="space-y-6">
                                        <div>
                                            <h3 className="text-lg font-semibold mb-4">Appearance</h3>
                                            <div className="space-y-4">
                                                <div>
                                                    <label className="block text-sm font-medium mb-2">Theme</label>
                                                    <div className="flex space-x-2">
                                                        {(['light', 'dark', 'system'] as const).map((theme) => (
                                                            <button
                                                                key={theme}
                                                                onClick={() => updateSettings('theme', theme)}
                                                                className={cn(
                                                                    "flex items-center px-4 py-2 rounded-lg border transition-colors",
                                                                    settings.theme === theme
                                                                        ? "border-blue-500 bg-blue-50 text-blue-700"
                                                                        : "border-gray-300 hover:border-gray-400"
                                                                )}
                                                            >
                                                                {theme === 'light' && <Sun className="h-4 w-4 mr-2" />}
                                                                {theme === 'dark' && <Moon className="h-4 w-4 mr-2" />}
                                                                {theme === 'system' && <Monitor className="h-4 w-4 mr-2" />}
                                                                {theme.charAt(0).toUpperCase() + theme.slice(1)}
                                                            </button>
                                                        ))}
                                                    </div>
                                                </div>
                                                <div>
                                                    <ReliableLanguageSwitcher variant="select" />
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {activeTab === 'notifications' && (
                                    <div className="space-y-6">
                                        <div>
                                            <h3 className="text-lg font-semibold mb-4">Notification Channels</h3>
                                            <div className="space-y-4">
                                                {Object.entries(settings.notifications).slice(0, 3).map(([key, value]) => (
                                                    <div key={key} className="flex items-center justify-between">
                                                        <label className="text-sm font-medium capitalize">{key}</label>
                                                        <input
                                                            type="checkbox"
                                                            checked={value}
                                                            onChange={(e) => updateSettings(`notifications.${key}`, e.target.checked)}
                                                            className="rounded"
                                                            aria-label={`Toggle ${key} notification`}
                                                        />
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                        <div>
                                            <h3 className="text-lg font-semibold mb-4">Notification Types</h3>
                                            <div className="space-y-4">
                                                {Object.entries(settings.notifications).slice(3).map(([key, value]) => (
                                                    <div key={key} className="flex items-center justify-between">
                                                        <label className="text-sm font-medium capitalize">{key}</label>
                                                        <input
                                                            type="checkbox"
                                                            checked={value}
                                                            onChange={(e) => updateSettings(`notifications.${key}`, e.target.checked)}
                                                            className="rounded"
                                                            aria-label={`Toggle ${key} notification`}
                                                        />
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {activeTab === 'privacy' && (
                                    <div className="space-y-6">
                                        <div>
                                            <h3 className="text-lg font-semibold mb-4">Data & Privacy</h3>
                                            <div className="space-y-4">
                                                {Object.entries(settings.privacy).map(([key, value]) => (
                                                    <div key={key} className="flex items-center justify-between">
                                                        <div>
                                                            <label className="text-sm font-medium capitalize">
                                                                {key.replace(/([A-Z])/g, ' $1').toLowerCase()}
                                                            </label>
                                                            <p className="text-xs text-gray-500 mt-1">
                                                                {key === 'shareHealthData' && 'Allow sharing anonymized health data for research'}
                                                                {key === 'allowAnalytics' && 'Help improve our service with usage analytics'}
                                                                {key === 'showOnlineStatus' && 'Show when you are online to healthcare providers'}
                                                            </p>
                                                        </div>
                                                        <input
                                                            type="checkbox"
                                                            checked={value}
                                                            onChange={(e) => updateSettings(`privacy.${key}`, e.target.checked)}
                                                            className="rounded"
                                                            aria-label={`Toggle ${key} privacy setting`}
                                                        />
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {activeTab === 'profile' && (
                                    <div className="space-y-6">
                                        <div>
                                            <h3 className="text-lg font-semibold mb-4">Profile Information</h3>
                                            <div className="space-y-4">
                                                <div>
                                                    <label className="block text-sm font-medium mb-2">Full Name</label>
                                                    <Input
                                                        value={settings.profile.name}
                                                        onChange={(e) => updateSettings('profile.name', e.target.value)}
                                                        placeholder="Enter your full name"
                                                        aria-label="Full Name"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-sm font-medium mb-2">Email</label>
                                                    <Input
                                                        type="email"
                                                        value={settings.profile.email}
                                                        onChange={(e) => updateSettings('profile.email', e.target.value)}
                                                        placeholder="Enter your email address"
                                                        aria-label="Email"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-sm font-medium mb-2">Phone</label>
                                                    <Input
                                                        value={settings.profile.phone}
                                                        onChange={(e) => updateSettings('profile.phone', e.target.value)}
                                                        placeholder="Enter your phone number"
                                                        aria-label="Phone"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-sm font-medium mb-2">Timezone</label>
                                                    <select
                                                        value={settings.profile.timezone}
                                                        onChange={(e) => updateSettings('profile.timezone', e.target.value)}
                                                        className="w-full p-2 border border-gray-300 rounded-lg"
                                                        aria-label="Select timezone"
                                                    >
                                                        {timezones.map((tz) => (
                                                            <option key={tz} value={tz}>
                                                                {tz.replace('_', ' ')}
                                                            </option>
                                                        ))}
                                                    </select>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {activeTab === 'accessibility' && (
                                    <div className="space-y-6">
                                        <div>
                                            <h3 className="text-lg font-semibold mb-4">Accessibility Options</h3>
                                            <div className="space-y-4">
                                                <div>
                                                    <label className="block text-sm font-medium mb-2">Font Size</label>
                                                    <div className="flex space-x-2">
                                                        {(['small', 'medium', 'large'] as const).map((size) => (
                                                            <button
                                                                key={size}
                                                                onClick={() => updateSettings('accessibility.fontSize', size)}
                                                                className={cn(
                                                                    "px-4 py-2 rounded-lg border transition-colors",
                                                                    settings.accessibility.fontSize === size
                                                                        ? "border-blue-500 bg-blue-50 text-blue-700"
                                                                        : "border-gray-300 hover:border-gray-400"
                                                                )}
                                                            >
                                                                {size.charAt(0).toUpperCase() + size.slice(1)}
                                                            </button>
                                                        ))}
                                                    </div>
                                                </div>
                                                <div className="space-y-4">
                                                    <div className="flex items-center justify-between">
                                                        <label className="text-sm font-medium">High Contrast</label>
                                                        <input
                                                            type="checkbox"
                                                            checked={settings.accessibility.highContrast}
                                                            onChange={(e) => updateSettings('accessibility.highContrast', e.target.checked)}
                                                            className="rounded"
                                                            aria-label="Toggle High Contrast Mode"
                                                        />
                                                    </div>
                                                    <div className="flex items-center justify-between">
                                                        <label className="text-sm font-medium">Reduced Motion</label>
                                                        <input
                                                            type="checkbox"
                                                            checked={settings.accessibility.reducedMotion}
                                                            onChange={(e) => updateSettings('accessibility.reducedMotion', e.target.checked)}
                                                            className="rounded"
                                                            aria-label="Toggle Reduced Motion"
                                                        />
                                                    </div>
                                                    <div className="flex items-center justify-between">
                                                        <label className="text-sm font-medium">Sound Effects</label>
                                                        <input
                                                            type="checkbox"
                                                            checked={settings.accessibility.soundEffects}
                                                            onChange={(e) => updateSettings('accessibility.soundEffects', e.target.checked)}
                                                            className="rounded"
                                                            aria-label="Toggle Sound Effects"
                                                        />
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Footer */}
                    <div className="flex items-center justify-between p-6 border-t border-gray-200 dark:border-gray-700">
                        <Button variant="outline" onClick={resetSettings}>
                            Reset to Defaults
                        </Button>
                        <div className="flex space-x-3">
                            <Button variant="outline" onClick={onClose}>
                                Cancel
                            </Button>
                            <Button
                                onClick={saveSettings}
                                disabled={!hasChanges}
                                variant="gradient"
                                size="lg"
                                className="w-full justify-center mt-4 shadow-lg hover:scale-105 transition-transform"
                            >
                                Save Changes
                            </Button>
                        </div>
                    </div>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
}
