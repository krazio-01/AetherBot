'use client';
import { useRef, useState } from 'react';
import axios, { AxiosError } from 'axios';
import AuthForm from '@/components/forms/AuthForm';
import { MdLockReset, MdEmail } from 'react-icons/md';
import { IAuthField } from '@/types';
import '../../auth.css';

const Page = () => {
    const [loading, setLoading] = useState(false);

    const emailRef = useRef<HTMLInputElement>(null);
    const refs = [emailRef];

    const formFields: IAuthField[] = [{ name: 'email', label: 'Email', type: 'email', icon: <MdEmail /> }];

    const handleChangeRequest = async () => {
        try {
            setLoading(true);
            const { data } = await axios.post('/api/auth/forgot-password/request', {
                email: emailRef.current?.value || '',
            });
            return data.message;
        } catch (error) {
            if (error instanceof AxiosError) throw error.response?.data?.message || 'Failed to send reset email.';
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
                        Enter your email address and we will send you instructions to reset your password.
                    </p>
                </div>

                <AuthForm
                    formFields={formFields}
                    refs={refs}
                    loading={loading}
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
