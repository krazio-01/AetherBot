'use client';
import { useRef } from 'react';
import AuthForm from '@/components/forms/AuthForm';
import { MdLockReset, MdEmail } from 'react-icons/md';
import { IAuthField } from '@/types';
import { useRequest } from '@/hooks/useRequest';
import { IPasswordResetRequest } from '@/types/auth';
import '../../auth.css';

const Page = () => {
    const { postRequest, isPending } = useRequest();

    const emailRef = useRef<HTMLInputElement>(null);
    const refs = [emailRef];

    const formFields: IAuthField[] = [{ name: 'email', label: 'Email', type: 'email', icon: <MdEmail /> }];

    const handleChangeRequest = async () => {
        const res = await postRequest<void, IPasswordResetRequest>('/auth/forgot-password/request', {
            email: emailRef.current?.value || '',
        });

        return res.message;
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
                        Enter your email address and we will send you instructions to reset your password.
                    </p>
                </div>

                <AuthForm
                    formFields={formFields}
                    refs={refs}
                    loading={isPending}
                    onSubmit={handleChangeRequest}
                    loadingText="Sending email..."
                    redirectUrl="/forgot-password/request"
                    submitButtonText="Continue"
                />
            </div>
        </div>
    );
};

export default Page;
