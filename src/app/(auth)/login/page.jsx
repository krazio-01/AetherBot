"use client";
import { useRef, useState } from "react";
import Link from "next/link";
import AuthForm from "@/components/forms/AuthForm";
import { signIn } from "next-auth/react";
import AuthProviderBtn from "@/components/Ui/AuthProviderBtn/AuthProviderBtn";
import { FaLock, FaGithub, FaDiscord } from "react-icons/fa";
import { FiLogIn } from "react-icons/fi";
import { MdEmail } from "react-icons/md";
import "../auth.css";

const Page = () => {
    const [loading, setLoading] = useState(false);

    const emailRef = useRef(null);
    const passwordRef = useRef(null);

    const formFields = [
        { name: "email", label: "Email", type: "email", icon: <MdEmail /> },
        {
            name: "password",
            label: "Password",
            type: "password",
            icon: <FaLock />,
        },
    ];
    const refs = [emailRef, passwordRef];

    const handleLogin = async () => {
        setLoading(true);

        const result = await signIn("credentials", {
            redirect: false,
            identifier: emailRef.current.value,
            password: passwordRef.current.value,
        });

        if (result?.error) {
            setLoading(false);
            throw result.error;
        }

        if (result?.url) return "Login successful";

        setLoading(false);
    };

    return (
        <div className="auth-container">
            <div className="form-container login">
                <div className="auth-form-header">
                    <FiLogIn />
                    <h2>Welcome!</h2>
                    <p>Sign in to your account</p>
                </div>

                <AuthForm
                    formFields={formFields}
                    refs={refs}
                    loading={loading}
                    onSubmit={handleLogin}
                    loadingText="Signing in..."
                    redirectUrl="/chat"
                    submitButtonText="Sign in"
                    forgotPassword={true}
                />

                <div className="other-providers">
                    <div className="divider">
                        <span>or</span>
                    </div>

                    <div className="providers">
                        <AuthProviderBtn
                            loading={loading}
                            provider="discord"
                            btnText="Discord"
                            icon={<FaDiscord  />}
                        />

                        <AuthProviderBtn
                            loading={loading}
                            provider="github"
                            btnText="Github"
                            icon={<FaGithub />}
                        />
                    </div>
                </div>

                <p className="auth-form-footer">
                    Don&apos;t have an account? <Link href="/register">Sign Up</Link>
                </p>
            </div>
        </div>
    );
};

export default Page;
