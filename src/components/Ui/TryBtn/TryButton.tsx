'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import './tryBtn.css';

export default function TryButton() {
    const pathname = usePathname();

    if (pathname !== '/') return null;

    return (
        <Link href="/chat" className="try-btn-header">
            Try as Guest
        </Link>
    );
}
