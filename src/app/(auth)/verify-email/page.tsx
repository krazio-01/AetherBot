import Link from 'next/link';
import { IResponseWrapper } from '@/types';
import '../auth.css';

interface IVeifyEmailPageProps {
    searchParams: { [key: string]: string | string[] | undefined };
}

export default async function VerifyEmailPage({ searchParams }: IVeifyEmailPageProps) {
    const token = searchParams.token as string;

    if (!token) {
        return (
            <div className="verify-email-main">
                <h1 className="error-text">Invalid or missing verification token.</h1>
            </div>
        );
    }

    let isSuccess = false;
    let message = '';

    try {
        const res = await fetch(`${process.env.FRONTEND_URL}/api/auth/verify-email`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ token }),
            cache: 'no-store',
        });

        const responseData = (await res.json()) as IResponseWrapper;

        if (!responseData.success) throw new Error(responseData.message || 'Verification failed');

        isSuccess = true;
        message = responseData.message || 'Email verified successfully.';
    } catch (err: any) {
        isSuccess = false;
        message = err instanceof Error ? err.message : 'An unexpected error occurred';
    }

    return (
        <div className="verify-email-main">
            {isSuccess ? (
                <div>
                    <h1>{message}</h1>
                    <Link href="/login">Login</Link>
                </div>
            ) : (
                <div>
                    <h1 className="error-text">{message}</h1>
                </div>
            )}
        </div>
    );
}
