import './globals.css';

export const metadata = {
    title: 'AI-HealthCare',
    description: 'AI-powered healthcare platform',
};

export default function RootLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <html lang="en" suppressHydrationWarning>
            <body className="min-h-screen antialiased">{children}</body>
        </html>
    );
}
