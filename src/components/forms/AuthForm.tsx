'use client';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { FaArrowRight } from 'react-icons/fa';
import { SyntheticEvent, RefObject } from 'react';
import { IAuthField } from '@/types';
import './forms.css';

interface IAuthFormProps {
    formFields: IAuthField[];
    refs: RefObject<HTMLInputElement | null>[];
    loading: boolean;
    onSubmit: () => Promise<string>;
    loadingText: string;
    redirectUrl: string;
    additionalToast?: () => void;
    submitButtonText: string;
    forgotPassword?: boolean;
}

const AuthForm = ({
    formFields,
    refs,
    loading,
    onSubmit,
    loadingText,
    redirectUrl,
    additionalToast,
    submitButtonText,
    forgotPassword,
}: IAuthFormProps) => {
    const router = useRouter();

    const handleSubmit = (e: SyntheticEvent<HTMLFormElement>) => {
        e.preventDefault();

        toast.promise(
            onSubmit().then((message) => {
                if (additionalToast) additionalToast();
                if (redirectUrl.includes('chat')) {
                    router.refresh();
                    return;
                }
                router.push(redirectUrl);
                return message;
            }),
            {
                loading: loadingText,
                success: (message: string) => message,
                error: (message: string) => message,
            },
        );
    };

    return (
        <div className="auth-form-wrapper">
            <form onSubmit={handleSubmit}>
                {formFields.map((field, index) => (
                    <div className="form-input-container" key={field.name}>
                        <div>
                            <label>{field.label}</label>
                            <input type={field.type} ref={refs[index]} />
                        </div>
                        {field.icon}
                    </div>
                ))}

                {forgotPassword && (
                    <div className="forgot-password">
                        <Link href="/forgot-password/request">Forgot password?</Link>
                    </div>
                )}

                <button type="submit" disabled={loading} className={loading ? 'disabled' : ''}>
                    <span>{submitButtonText}</span>
                    <FaArrowRight />
                </button>
            </form>
        </div>
    );
};

export default AuthForm;
