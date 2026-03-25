'use client';
import { useRef, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import AuthForm from '@/components/forms/AuthForm';
import axios, { AxiosError } from 'axios';
import { MdLockReset } from 'react-icons/md';
import { FaLock } from 'react-icons/fa';
import { IAuthField } from '@/types';
import '../../auth.css';

const PageInner = () => {
    const [loading, setLoading] = useState(false);

    const newPasswordRef = useRef<HTMLInputElement>(null);
    const confirmNewPasswordRef = useRef<HTMLInputElement>(null);

    const formFields: IAuthField[] = [
        {
            name: 'password',
            label: 'New Password',
            type: 'password',
            icon: <FaLock />,
        },
        {
            name: 'confirm-password',
            label: 'Password',
            type: 'password',
            icon: <FaLock />,
        },
    ];
    const refs = [newPasswordRef, confirmNewPasswordRef];

    const searchParams = useSearchParams();
    const token = searchParams.get('token');

    const handleResetPassword = async () => {
        const newPassword = newPasswordRef.current?.value || '';
        const confirmPassword = confirmNewPasswordRef.current?.value || '';

        if (newPassword !== confirmPassword) throw 'Passwords do not match';

        try {
            setLoading(true);
            const { data } = await axios.post('/api/auth/forgot-password/change', { token, newPassword });
            return data.message;
        } catch (error) {
            if (error instanceof AxiosError) throw error.response?.data?.message || 'Failed to reset password.';
            throw 'An unexpected error occurred.';
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="auth-container">
            <div className="form-container login">
                <div className="auth-form-header">
                    <MdLockReset />
                    <h2>Reset your password</h2>
                    <p
                        style={{
                            fontSize: 'var(--fz-sm)',
                            textAlign: 'center',
                        }}
                    >
                        Enter a new password below to reset your password
                    </p>
                </div>

                <AuthForm
                    formFields={formFields}
                    refs={refs}
                    loading={loading}
                    onSubmit={handleResetPassword}
                    loadingText="Updating password..."
                    redirectUrl="/login"
                    submitButtonText="Reset Password"
                />
            </div>
        </div>
    );
};

export default function Page() {
    return (
        <Suspense fallback={<div>Loading...</div>}>
            <PageInner />
        </Suspense>
    );
}
