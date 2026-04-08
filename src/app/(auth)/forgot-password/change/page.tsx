'use client';
import { useRef, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import AuthForm from '@/components/forms/AuthForm';
import { useRequest } from '@/hooks/useRequest';
import { MdLockReset } from 'react-icons/md';
import { FaLock } from 'react-icons/fa';
import { IAuthField } from '@/types';
import { IPasswordChangeRequest } from '@/types/auth';
import { DotLottieReact } from '@lottiefiles/dotlottie-react';
import '../../auth.css';

const PageInner = () => {
    const { postRequest, isPending } = useRequest();

    const newPasswordRef = useRef<HTMLInputElement>(null);
    const confirmNewPasswordRef = useRef<HTMLInputElement>(null);

    const formFields: IAuthField[] = [
        { name: 'password', label: 'New Password', type: 'password', icon: <FaLock /> },
        { name: 'confirm-password', label: 'Confirm Password', type: 'password', icon: <FaLock /> },
    ];
    const refs = [newPasswordRef, confirmNewPasswordRef];

    const searchParams = useSearchParams();
    const token = searchParams.get('token');

    const handleResetPassword = async () => {
        const newPassword = newPasswordRef.current?.value || '';
        const confirmPassword = confirmNewPasswordRef.current?.value || '';

        if (newPassword !== confirmPassword) throw 'Passwords do not match';

        const res = await postRequest<void, IPasswordChangeRequest>('/auth/forgot-password/change', {
            token,
            newPassword,
        });

        return res.message;
    };

    return (
        <div className="auth-layout">
            <div className="auth-visual">
                <div className="lottie-wrapper">
                    <DotLottieReact
                        src="/animations/waiting.lottie"
                        loop
                        autoplay
                    />
                </div>
            </div>

            <div className="auth-container">
                <div className="form-container login">
                    <div className="auth-form-header">
                        <MdLockReset />
                        <h2>Reset your password</h2>
                        <p>
                            Enter a new password below to reset your password
                        </p>
                    </div>

                    <AuthForm
                        formFields={formFields}
                        refs={refs}
                        loading={isPending}
                        onSubmit={handleResetPassword}
                        loadingText="Updating password..."
                        redirectUrl="/login"
                        submitButtonText="Reset Password"
                    />
                </div>
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
