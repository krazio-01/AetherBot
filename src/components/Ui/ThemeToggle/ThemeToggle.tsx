'use client';
import { useTheme } from 'next-themes';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { MdDarkMode, MdLightMode } from 'react-icons/md';
import './themeToggle.css';

interface IThemeToggleProps {
    variant?: 'button' | 'switch';
}

const ThemeToggle = ({ variant = 'button' }: IThemeToggleProps) => {
    const { setTheme, resolvedTheme } = useTheme();
    const [mounted, setMounted] = useState(false);

    const pathname = usePathname();

    useEffect(() => {
        setMounted(true);
    }, []);

    if (variant === 'button' && pathname !== '/') return null;

    if (!mounted) {
        if (variant === 'switch') {
            return (
                <div>
                    <span>Dark Mode</span>
                    <input type="checkbox" disabled />
                </div>
            );
        }
        return <div className="theme-toggle-btn placeholder" />;
    }

    const isDark = resolvedTheme === 'dark';

    if (variant === 'switch') {
        return (
            <div>
                <span>Dark Mode</span>
                <input
                    type="checkbox"
                    onChange={(e) => setTheme(e.target.checked ? 'dark' : 'light')}
                    checked={isDark}
                />
            </div>
        );
    }

    return (
        <button
            className="theme-toggle-btn"
            onClick={() => setTheme(isDark ? 'light' : 'dark')}
            aria-label="Toggle Dark Mode"
        >
            {isDark ? <MdLightMode /> : <MdDarkMode />}
        </button>
    );
};

export default ThemeToggle;
