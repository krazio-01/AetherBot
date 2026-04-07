'use client';
import React, { useRef } from 'react';
import Link from 'next/link';
import { toast } from 'sonner';
import AuthProviderBtn from '@/components/Ui/AuthProviderBtn/AuthProviderBtn';
import { MdEmail } from 'react-icons/md';
import { FaUser, FaUserCircle, FaLock, FaGithub, FaDiscord } from 'react-icons/fa';
import { useRequest } from '@/hooks/useRequest';
import AuthForm from '@/components/forms/AuthForm';
import Avatar1 from '../../../../public/images/avatar1.jpeg';
import Avatar2 from '../../../../public/images/avatar2.jpeg';
import Avatar3 from '../../../../public/images/avatar3.jpeg';
import Avatar4 from '../../../../public/images/avatar4.jpeg';
import { IAuthField } from '@/types';
import { ISignupRequest } from '@/types/auth';
import { DotLottieReact } from '@lottiefiles/dotlottie-react';
import '../auth.css';

const Page = () => {
    const { postRequest, isPending } = useRequest();

    const nameRef = useRef<HTMLInputElement>(null);
    const emailRef = useRef<HTMLInputElement>(null);
    const passwordRef = useRef<HTMLInputElement>(null);

    const formFields: IAuthField[] = [
        { name: 'name', label: 'Name', type: 'text', icon: <FaUser /> },
        { name: 'email', label: 'Email', type: 'email', icon: <MdEmail /> },
        {
            name: 'password',
            label: 'Password',
            type: 'password',
            icon: <FaLock />,
        },
    ];
    const refs = [nameRef, emailRef, passwordRef];

    const handleRegistration = async () => {
        const avatars = [Avatar1, Avatar2, Avatar3, Avatar4];
        const randomAvatar = avatars[Math.floor(Math.random() * avatars.length)];

        const res = await postRequest<void, ISignupRequest>('/auth/signup', {
            name: nameRef.current?.value || '',
            email: emailRef.current?.value || '',
            password: passwordRef.current?.value || '',
            avatar: randomAvatar.src,
        });

        return res?.message;
    };

    const additionalToast = () => {
        toast('A verification email has been sent.', {
            duration: Infinity,
            closeButton: true,
        });
    };

    return (
        <div className="auth-layout">
            <div className="auth-visual">
                <div className="lottie-wrapper">
                    <DotLottieReact src="./animations/ghost.lottie" loop autoplay />
                </div>
            </div>

            <div className="auth-container">
                <div className="form-container register">
                    <div className="auth-form-header">
                        <FaUserCircle />
                        <h2>Create Account!</h2>
                        <p>Join the future of intelligent conversations</p>
                    </div>

                    <AuthForm
                        formFields={formFields}
                        refs={refs}
                        loading={isPending}
                        onSubmit={handleRegistration}
                        loadingText="Signing up..."
                        redirectUrl="/login"
                        additionalToast={additionalToast}
                        submitButtonText="Sign Up"
                    />

                    <div className="other-providers">
                        <div className="divider">
                            <span>or</span>
                        </div>

                        <div className="providers">
                            <AuthProviderBtn
                                loading={isPending}
                                provider="discord"
                                btnText="Discord"
                                icon={<FaDiscord />}
                            />
                            <AuthProviderBtn
                                loading={isPending}
                                provider="github"
                                btnText="Github"
                                icon={<FaGithub />}
                            />
                        </div>
                    </div>

                    <p className="auth-form-footer">
                        Already have an account? <Link href="/login">Sign In</Link>
                    </p>
                </div>
            </div>
        </div>
    );
};

export default Page;
