import { ReactNode } from 'react';
import type { Metadata } from 'next';
import { ThemeProvider } from 'next-themes';
import AuthProvider from '@/context/AuthProvider';
import { Toaster } from 'sonner';
import './globals.css';

export const metadata: Metadata = {
    title: 'AetherBot',
    description:
        'Experience seamless conversations with AetherBot, the AI chatbot application designed to assist, engage, and enhance your digital interactions. Discover the future of communication powered by advanced AI technology.',
};

export default function RootLayout({ children }: { children: ReactNode }) {
    return (
        <html lang="en" suppressHydrationWarning>
            <head />
            <body>
                <AuthProvider>
                    <ThemeProvider>
                        {children}
                        <Toaster position="top-center" visibleToasts={2} expand={true} richColors duration={2000} />
                    </ThemeProvider>
                </AuthProvider>
            </body>
        </html>
    );
}
