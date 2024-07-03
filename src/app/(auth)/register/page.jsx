"use client";
import React, { useRef, useState } from "react";
import Link from "next/link";
import { signIn } from "next-auth/react";
import { toast } from "sonner";
import { MdEmail } from "react-icons/md";
import { FaUser, FaUserCircle, FaLock, FaGithub } from "react-icons/fa";
import axios from "axios";
import AuthForm from "@/components/forms/AuthForm";
import { FcGoogle } from "react-icons/fc";
import Avatar1 from "../../../../public/images/avatar1.jpeg";
import Avatar2 from "../../../../public/images/avatar2.jpeg";
import Avatar3 from "../../../../public/images/avatar3.jpeg";
import Avatar4 from "../../../../public/images/avatar4.jpeg";
import "../auth.css";

const Page = () => {
    const [loading, setLoading] = useState(false);

    const nameRef = useRef();
    const emailRef = useRef();
    const passwordRef = useRef();

    const formFields = [
        { name: "name", label: "Name", type: "text", icon: <FaUser /> },
        { name: "email", label: "Email", type: "email", icon: <MdEmail /> },
        {
            name: "password",
            label: "Password",
            type: "password",
            icon: <FaLock />,
        },
    ];
    const refs = [nameRef, emailRef, passwordRef];

    const handleRegistration = async () => {
        try {
            setLoading(true);

            const avatars = [Avatar1, Avatar2, Avatar3, Avatar4];
            const randomAvatar =
                avatars[Math.floor(Math.random() * avatars.length)];

            const { data } = await axios.post("/api/auth/signup", {
                name: nameRef.current.value,
                email: emailRef.current.value,
                password: passwordRef.current.value,
                avatar: randomAvatar.src,
            });

            return data.message;
        } catch (error) {
            throw error.response.data.message;
        } finally {
            setLoading(false);
        }
    };

    const additionalToast = () => {
        toast("A verification email has been sent.", {
            duration: Infinity,
            closeButton: true,
        });
    };

    return (
        <div className="auth-container">
            <div className="form-container register">
                <div className="auth-form-header">
                    <FaUserCircle />
                    <h2>Create Account!</h2>
                </div>

                <AuthForm
                    formFields={formFields}
                    refs={refs}
                    loading={loading}
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
                        <button
                            type="button"
                            className="google-login-button"
                            onClick={() => signIn("google")}
                            disabled={loading}
                        >
                            <FcGoogle />
                            <span>Google</span>
                        </button>

                        <button
                            type="button"
                            className="github-login-button"
                            onClick={() => signIn("github")}
                            disabled={loading}
                        >
                            <FaGithub />
                            <span>GitHub</span>
                        </button>
                    </div>
                </div>

                <p className="auth-form-footer">
                    Already have an account? <Link href="/login">Sign In</Link>
                </p>
            </div>
        </div>
    );
};

export default Page;
