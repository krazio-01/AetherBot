"use client";
import { useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import AuthForm from "@/components/forms/AuthForm";
import axios from "axios";
import { MdLockReset } from "react-icons/md";
import { FaLock } from "react-icons/fa";
import "../../auth.css";

const PageInner = () => {
    const [loading, setLoading] = useState(false);

    const newPasswordRef = useRef(null);
    const confirmNewPasswordRef = useRef(null);

    const formFields = [
        {
            name: "password",
            label: "New Password",
            type: "password",
            icon: <FaLock />,
        },
        {
            name: "confirm-password",
            label: "Password",
            type: "password",
            icon: <FaLock />,
        },
    ];
    const refs = [newPasswordRef, confirmNewPasswordRef];

    const searchParams = useSearchParams();
    const token = searchParams.get("token");

    const handleResetPassword = async () => {
        if (
            newPasswordRef.current.value !== confirmNewPasswordRef.current.value
        ) {
            throw "Passwords do not match";
        }

        try {
            setLoading(true);
            const { data } = await axios.post(
                "/api/auth/forgot-password/change",
                {
                    token,
                    newPassword: newPasswordRef.current.value,
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
                        Enter a new password below to reset your password
                    </p>
                </div>

                <AuthForm
                    formFields={formFields}
                    refs={refs}
                    loading={loading}
                    onSubmit={handleResetPassword}
                    loadingText="Updating password..."
                    redirectUrl="/login"
                    submitButtonText="Reset Password"
                />
            </div>
        </div>
    );
};

export default function Page() {
    return (
        <Suspense fallback={<div>Loading...</div>}>
            <PageInner />
        </Suspense>
    );
}
