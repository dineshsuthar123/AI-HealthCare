'use client';

import { useState, useEffect } from 'react';
import { useSession, signOut } from 'next-auth/react';
import { useTranslations } from 'next-intl';
import { Link } from '@/navigation';
import { Menu, X, Heart, User, LogOut, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { motion, AnimatePresence } from '@/lib/framer-motion';
import NotificationsDropdown from '@/components/ui/notifications-dropdown';
import SettingsModal from '@/components/ui/settings-modal';
import ReliableLanguageSwitcher from '@/components/ui/reliable-language-switcher';

export default function Header() {
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
    const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);
    const { data: session } = useSession();
    const t = useTranslations('Header');
    const [isClient, setIsClient] = useState(false);
    const [scrolled, setScrolled] = useState(false);

    // This helps prevent hydration errors by ensuring rendering happens only client-side
    useEffect(() => {
        setIsClient(true);

        const handleScroll = () => {
            if (window.scrollY > 10) {
                setScrolled(true);
            } else {
                setScrolled(false);
            }
        };

        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    // Base navigation for all users
    const baseNavigation = [
        { name: t('home'), href: '/' },
        { name: t('symptomChecker'), href: '/symptom-checker' },
    ];

    // Role-specific navigation items
    const roleBasedNavigation = {
        patient: [
            { name: t('consultations'), href: '/consultations' },
            { name: t('dashboard'), href: '/dashboard' },
            { name: t('healthRecords'), href: '/health-records' },
        ],
        provider: [
            { name: t('myPatients'), href: '/provider/patients' },
            { name: t('consultations'), href: '/provider/consultations' },
            { name: t('dashboard'), href: '/provider/dashboard' },
        ],
        admin: [
            { name: t('dashboard'), href: '/admin/dashboard' },
            { name: t('providerAssignment'), href: '/admin/provider-assignment' },
            { name: t('management'), href: '/admin/management' },
        ]
    };

    // Determine which navigation items to show based on user role
    const getUserNavigation = () => {
        if (!session?.user) return baseNavigation;

        const userRole = ((session.user as { role?: string })?.role) || 'patient';
        return [...baseNavigation, ...(roleBasedNavigation[userRole as keyof typeof roleBasedNavigation] || roleBasedNavigation.patient)];
    };

    const navigation = getUserNavigation();

    // Render a simplified header skeleton during SSR to prevent hydration mismatch
    if (!isClient) {
        return (
            <header className="bg-white shadow-sm border-b">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center h-16">
                        <div className="flex items-center">
                            <div className="flex items-center space-x-2">
                                <Heart className="h-8 w-8 text-blue-600" />
                                <span className="font-bold text-xl text-gray-900">
                                    AI Healthcare
                                </span>
                            </div>
                        </div>
                        <div className="hidden md:block w-auto bg-gray-100 h-8 rounded-md"></div>
                        <div className="md:hidden">
                            <div className="w-6 h-6 bg-gray-100 rounded-md"></div>
                        </div>
                    </div>
                </div>
            </header>
        );
    }

    return (
        <header className={`fixed w-full z-50 transition-all duration-300 ${scrolled ? 'bg-white/90 backdrop-blur-md shadow-md' : 'bg-transparent'}`}>
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between items-center h-20">
                    {/* Logo */}
                    <motion.div
                        className="flex items-center"
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.5 }}
                    >
                        <Link href="/" className="flex items-center space-x-2 group">
                            <div className="relative">
                                <Heart className={`h-8 w-8 ${scrolled ? 'text-blue-600' : 'text-blue-500'} transition-all group-hover:scale-110`} />
                                <div className="absolute inset-0 bg-blue-500 rounded-full filter blur-md opacity-30 group-hover:opacity-60 transition-opacity"></div>
                            </div>
                            <span className={`font-bold text-xl ${scrolled ? 'text-gray-900' : 'text-gray-800'} group-hover:text-blue-600 transition-colors`}>
                                AI Healthcare
                            </span>
                        </Link>
                    </motion.div>

                    {/* Desktop Navigation */}
                    <motion.nav
                        className="hidden md:flex space-x-1"
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, delay: 0.1 }}
                    >
                        {navigation.map((item, index) => (
                            <Link
                                key={item.name}
                                href={item.href}
                            >
                                <motion.div
                                    className={`px-4 py-2 text-sm font-medium rounded-full hover:bg-blue-50 ${scrolled ? 'text-gray-700' : 'text-gray-800'} hover:text-blue-600 transition-all`}
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                    initial={{ opacity: 0, y: -20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{
                                        duration: 0.3,
                                        delay: 0.1 + index * 0.05,
                                        type: "spring",
                                        stiffness: 100
                                    }}
                                >
                                    {item.name}
                                </motion.div>
                            </Link>
                        ))}
                    </motion.nav>

                    {/* User Menu */}
                    <motion.div
                        className="hidden md:flex items-center space-x-4"
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.5, delay: 0.2 }}
                    >
                        {session ? (
                            <div className="flex items-center space-x-4">
                                {/* Notification and Settings */}
                                <div className="flex items-center space-x-2">
                                    <ReliableLanguageSwitcher />
                                    <NotificationsDropdown
                                        isOpen={isNotificationsOpen}
                                        onToggle={() => setIsNotificationsOpen(!isNotificationsOpen)}
                                        onClose={() => setIsNotificationsOpen(false)}
                                    />
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="glass rounded-full"
                                        onClick={() => setIsSettingsOpen(true)}
                                    >
                                        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                        </svg>
                                    </Button>
                                </div>

                                <div className="relative">
                                    <motion.div
                                        className="glass cursor-pointer rounded-full px-4 py-2 flex items-center space-x-2"
                                        onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                                        whileHover={{ scale: 1.03 }}
                                        whileTap={{ scale: 0.97 }}
                                    >
                                        <div className="h-8 w-8 rounded-full bg-gradient-to-r from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold text-sm">
                                            {session.user?.name?.charAt(0) || 'U'}
                                        </div>
                                        <span className="text-sm text-gray-700 font-medium">
                                            {session.user?.name}
                                        </span>
                                        <ChevronDown className="h-4 w-4 text-gray-400" />
                                    </motion.div>

                                    <AnimatePresence>
                                        {isUserMenuOpen && (
                                            <motion.div
                                                className="absolute right-0 mt-2 w-48 glass shadow-lg rounded-xl py-1 z-50"
                                                initial={{ opacity: 0, y: 10 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                exit={{ opacity: 0, y: 10 }}
                                                transition={{ duration: 0.2 }}
                                            >
                                                <Link href="/dashboard" className="block px-4 py-2 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-600">
                                                    Dashboard
                                                </Link>
                                                <Link href="/health-records" className="block px-4 py-2 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-600">
                                                    Health Records
                                                </Link>
                                                <div className="border-t border-gray-100 my-1"></div>
                                                <button
                                                    onClick={() => signOut()}
                                                    className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                                                >
                                                    Sign out
                                                </button>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </div>
                            </div>
                        ) : (
                            <div className="flex items-center space-x-2">
                                <ReliableLanguageSwitcher />
                                <Link href="/auth/signin">
                                    <Button
                                        variant="glassmorphism"
                                        size="sm"
                                        className="px-5 rounded-full hover:bg-blue-50 transition-all duration-300 shadow-md"
                                        animated
                                    >
                                        <User className="w-4 h-4 mr-1" /> {t('signIn')}
                                    </Button>
                                </Link>
                                <Link href="/auth/signup">
                                    <Button
                                        variant="gradient"
                                        size="sm"
                                        className="px-5 rounded-full hover:scale-105 transition-all duration-300 shadow-lg"
                                        glow
                                        animated
                                    >
                                        {t('signUp')}
                                    </Button>
                                </Link>
                            </div>
                        )}
                    </motion.div>

                    {/* Mobile menu button */}
                    <motion.div
                        className="md:hidden"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 0.5 }}
                    >
                        <motion.button
                            onClick={() => setIsMenuOpen(!isMenuOpen)}
                            className="glass p-2 rounded-full"
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                        >
                            {isMenuOpen ? (
                                <X className="h-6 w-6 text-gray-700" />
                            ) : (
                                <Menu className="h-6 w-6 text-gray-700" />
                            )}
                        </motion.button>
                    </motion.div>
                </div>
            </div>

            {/* Mobile Navigation */}
            <AnimatePresence>
                {isMenuOpen && (
                    <motion.div
                        className="md:hidden glass shadow-lg"
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.3 }}
                    >
                        <div className="px-2 py-4 space-y-1 sm:px-3">
                            {navigation.map((item, index) => (
                                <motion.div
                                    key={item.name}
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ duration: 0.3, delay: index * 0.05 }}
                                >
                                    <Link
                                        href={item.href}
                                        className="text-gray-700 hover:text-blue-600 hover:bg-blue-50 block px-3 py-2 rounded-lg text-base font-medium"
                                        onClick={() => setIsMenuOpen(false)}
                                    >
                                        {item.name}
                                    </Link>
                                </motion.div>
                            ))}

                            <motion.div
                                className="border-t border-gray-200 pt-4 mt-4"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ duration: 0.3, delay: navigation.length * 0.05 }}
                            >
                                <div className="px-3 py-2 mb-4">
                                    <ReliableLanguageSwitcher variant="select" />
                                </div>
                                {session ? (
                                    <div className="px-3 py-2">
                                        <div className="flex items-center space-x-2 mb-3">
                                            <div className="h-8 w-8 rounded-full bg-gradient-to-r from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold">
                                                {session.user?.name?.charAt(0) || 'U'}
                                            </div>
                                            <span className="text-sm font-medium text-gray-700">
                                                {session.user?.name}
                                            </span>
                                        </div>
                                        <Button
                                            variant="gradient"
                                            size="sm"
                                            onClick={() => signOut()}
                                            className="w-full rounded-lg flex items-center justify-center space-x-2"
                                        >
                                            <LogOut className="h-4 w-4" />
                                            <span>{t('signOut')}</span>
                                        </Button>
                                    </div>
                                ) : (
                                    <div className="px-3 py-2 space-y-3">
                                        <Link href="/auth/signin" className="block">
                                            <Button
                                                variant="glassmorphism"
                                                size="sm"
                                                className="w-full rounded-lg flex items-center justify-center shadow-md"
                                            >
                                                <User className="w-4 h-4 mr-2" /> {t('signIn')}
                                            </Button>
                                        </Link>
                                        <Link href="/auth/signup" className="block">
                                            <Button
                                                variant="gradient"
                                                size="sm"
                                                className="w-full rounded-lg shadow-lg"
                                                glow
                                            >
                                                {t('signUp')}
                                            </Button>
                                        </Link>
                                    </div>
                                )}
                            </motion.div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Settings Modal */}
            <SettingsModal
                isOpen={isSettingsOpen}
                onClose={() => setIsSettingsOpen(false)}
            />
        </header>
    );
}