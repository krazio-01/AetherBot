"use client";
import { signIn } from "next-auth/react";
import "./authProviderBtn.css";

const AuthProviderBtn = ({ loading, provider, btnText, icon }) => {
    return (
        <button
            type="button"
            className="auth-provider-btn"
            onClick={() => signIn(provider)}
            disabled={loading}
        >
            {icon}
            <span>{btnText}</span>
        </button>
    );
};

export default AuthProviderBtn;
