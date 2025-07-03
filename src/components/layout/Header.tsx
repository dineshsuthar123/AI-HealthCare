'use client';

import { useState } from 'react';
import { useSession, signOut } from 'next-auth/react';
import { useTranslations } from 'next-intl';
import { Link } from '@/navigation';
import { Menu, X, Heart, User, LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function Header() {
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const { data: session } = useSession();
    const t = useTranslations('Header');

    const navigation = [
        { name: t('home'), href: '/' },
        { name: t('symptomChecker'), href: '/symptom-checker' },
        { name: t('consultations'), href: '/consultations' },
        { name: t('dashboard'), href: '/dashboard' },
    ];

    return (
        <header className="bg-white shadow-sm border-b">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between items-center h-16">
                    {/* Logo */}
                    <div className="flex items-center">
                        <Link href="/" className="flex items-center space-x-2">
                            <Heart className="h-8 w-8 text-blue-600" />
                            <span className="font-bold text-xl text-gray-900">
                                AI Healthcare
                            </span>
                        </Link>
                    </div>

                    {/* Desktop Navigation */}
                    <nav className="hidden md:flex space-x-8">
                        {navigation.map((item) => (
                            <Link
                                key={item.name}
                                href={item.href}
                                className="text-gray-500 hover:text-gray-900 px-3 py-2 text-sm font-medium transition-colors"
                            >
                                {item.name}
                            </Link>
                        ))}
                    </nav>

                    {/* User Menu */}
                    <div className="hidden md:flex items-center space-x-4">
                        {session ? (
                            <div className="flex items-center space-x-4">
                                <div className="flex items-center space-x-2">
                                    <User className="h-5 w-5 text-gray-400" />
                                    <span className="text-sm text-gray-700">
                                        {session.user?.name}
                                    </span>
                                </div>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => signOut()}
                                    className="flex items-center space-x-2"
                                >
                                    <LogOut className="h-4 w-4" />
                                    <span>{t('signOut')}</span>
                                </Button>
                            </div>
                        ) : (
                            <div className="flex items-center space-x-2">
                                <Link href="/auth/signin">
                                    <Button variant="outline" size="sm">
                                        {t('signIn')}
                                    </Button>
                                </Link>
                                <Link href="/auth/signup">
                                    <Button size="sm">
                                        {t('signUp')}
                                    </Button>
                                </Link>
                            </div>
                        )}
                    </div>

                    {/* Mobile menu button */}
                    <div className="md:hidden">
                        <button
                            onClick={() => setIsMenuOpen(!isMenuOpen)}
                            className="text-gray-400 hover:text-gray-500 focus:outline-none focus:text-gray-500"
                        >
                            {isMenuOpen ? (
                                <X className="h-6 w-6" />
                            ) : (
                                <Menu className="h-6 w-6" />
                            )}
                        </button>
                    </div>
                </div>
            </div>

            {/* Mobile Navigation */}
            {isMenuOpen && (
                <div className="md:hidden">
                    <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3 bg-gray-50">
                        {navigation.map((item) => (
                            <Link
                                key={item.name}
                                href={item.href}
                                className="text-gray-500 hover:text-gray-900 block px-3 py-2 text-base font-medium"
                                onClick={() => setIsMenuOpen(false)}
                            >
                                {item.name}
                            </Link>
                        ))}
                        <div className="border-t border-gray-200 pt-4">
                            {session ? (
                                <div className="px-3 py-2">
                                    <div className="flex items-center space-x-2 mb-2">
                                        <User className="h-5 w-5 text-gray-400" />
                                        <span className="text-sm text-gray-700">
                                            {session.user?.name}
                                        </span>
                                    </div>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => signOut()}
                                        className="w-full"
                                    >
                                        {t('signOut')}
                                    </Button>
                                </div>
                            ) : (
                                <div className="px-3 py-2 space-y-2">
                                    <Link href="/auth/signin" className="block">
                                        <Button variant="outline" size="sm" className="w-full">
                                            {t('signIn')}
                                        </Button>
                                    </Link>
                                    <Link href="/auth/signup" className="block">
                                        <Button size="sm" className="w-full">
                                            {t('signUp')}
                                        </Button>
                                    </Link>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </header>
    );
}