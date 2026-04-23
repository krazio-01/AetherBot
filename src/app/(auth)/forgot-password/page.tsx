'use client';
import { useRef } from 'react';
import AuthForm from '@/components/forms/AuthForm';
import { MdLockReset, MdEmail } from 'react-icons/md';
import { IAuthField } from '@/types';
import { useRequest } from '@/hooks/useRequest';
import { IPasswordResetRequest } from '@/types/auth';
import { DotLottieReact } from '@lottiefiles/dotlottie-react';
import '../auth.css';

const Page = () => {
    const { postRequest, isPending } = useRequest();

    const emailRef = useRef<HTMLInputElement>(null);
    const refs = [emailRef];

    const formFields: IAuthField[] = [{ name: 'email', label: 'Email', type: 'email', icon: <MdEmail /> }];

    const handleChangeRequest = async () => {
        const res = await postRequest<void, IPasswordResetRequest>('/auth/forgot-password', {
            email: emailRef.current?.value || '',
        });

        return res.message;
    };

    return (
        <div className="auth-layout">
            <div className="auth-visual">
                <div className="lottie-wrapper">
                    <DotLottieReact
                        src="/animations/thinking.lottie"
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
                            Enter your email address and we will send you instructions to reset your password.
                        </p>
                    </div>

                    <AuthForm
                        formFields={formFields}
                        refs={refs}
                        loading={isPending}
                        onSubmit={handleChangeRequest}
                        loadingText="Sending email..."
                        redirectUrl="/forgot-password"
                        submitButtonText="Continue"
                    />
                </div>
            </div>
        </div>
    );
};

export default Page;
