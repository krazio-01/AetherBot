"use client";
import { useRef, useState } from "react";
import axios from "axios";
import AuthForm from "@/components/forms/AuthForm";
import { MdLockReset } from "react-icons/md";
import { MdEmail } from "react-icons/md";
import "../../auth.css";

const Page = () => {
    const [loading, setLoading] = useState(false);

    const emailRef = useRef(null);
    const refs = [emailRef];

    const formFields = [
        { name: "email", label: "Email", type: "email", icon: <MdEmail /> },
    ];

    const handleChangeRequest = async () => {
        try {
            setLoading(true);
            const { data } = await axios.post(
                "/api/auth/forgot-password/request",
                {
                    email: emailRef.current.value,
                }
            );
            return data.message;
        } catch (error) {
            throw error.response.data.message;
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
                            fontSize: "var(--fz-sm)",
                            textAlign: "center",
                        }}
                    >
                        Enter your email address and we will send you
                        instructions to reset your password.
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
