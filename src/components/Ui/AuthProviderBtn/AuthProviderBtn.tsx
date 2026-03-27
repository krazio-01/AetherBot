'use client';
import { signIn } from 'next-auth/react';
import { ReactNode } from 'react';
import './authProviderBtn.css';

interface AuthProviderBtnProps {
    loading: boolean;
    provider: string;
    btnText: string;
    icon: ReactNode;
}

const AuthProviderBtn = ({ loading, provider, btnText, icon }: AuthProviderBtnProps) => {
    return (
        <button type="button" className="auth-provider-btn" onClick={() => signIn(provider)} disabled={loading}>
            {icon}
            <span>{btnText}</span>
        </button>
    );
};

export default AuthProviderBtn;
