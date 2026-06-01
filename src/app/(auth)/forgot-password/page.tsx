'use client';
import { useRef, useState } from 'react';
import AuthForm from '@/components/forms/AuthForm';
import { MdLockReset, MdEmail, MdMarkEmailRead } from 'react-icons/md';
import { IAuthField } from '@/types';
import { useRequest } from '@/hooks/useRequest';
import { IPasswordResetRequest } from '@/types/auth';
import { DotLottieReact } from '@lottiefiles/dotlottie-react';
import Link from 'next/link';
import '../auth.css';

const Page = () => {
    const { postRequest, isPending } = useRequest();

    const [isSubmitted, setIsSubmitted] = useState(false);

    const emailRef = useRef<HTMLInputElement>(null);
    const refs = [emailRef];

    const formFields: IAuthField[] = [{ name: 'email', label: 'Email', type: 'email', icon: <MdEmail /> }];

    const handleChangeRequest = async () => {
        const res = await postRequest<void, IPasswordResetRequest>('/auth/forgot-password', {
            email: emailRef.current?.value || '',
        });

        setIsSubmitted(true);

        return res.message;
    };

    return (
        <div className="auth-layout">
            <div className="auth-visual">
                <div className="lottie-wrapper">
                    <DotLottieReact src="/animations/thinking.lottie" loop autoplay />
                </div>
            </div>

            <div className="auth-container">
                <div className="form-container login">
                    {isSubmitted ? (
                        <div className="auth-form-header success-state">
                            <MdMarkEmailRead className="success-icon" />
                            <h2>Check your inbox</h2>

                            <p className="success-message">
                                <span>We&apos;ve sent a password reset link to</span>
                                <span className="email-highlight">{emailRef.current?.value}</span>
                            </p>

                            <p className="spam-notice">Didn&apos;t receive it? Check your spam folder.</p>

                            <div className="auth-form-footer success-footer">
                                <Link href="/login">Return to login</Link>
                            </div>
                        </div>
                    ) : (
                        <>
                            <div className="auth-form-header">
                                <MdLockReset />
                                <h2>Reset your password</h2>
                                <p>
                                    Enter your email address and we will send you instructions to reset your password.
                                </p>
                            </div>

                            <AuthForm
                                formFields={formFields}
                                refs={refs}
                                loading={isPending}
                                onSubmit={handleChangeRequest}
                                loadingText="Sending email..."
                                submitButtonText="Continue"
                            />

                            <div className="auth-form-footer return-footer">
                                <Link href="/login">Back to login</Link>
                            </div>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Page;
