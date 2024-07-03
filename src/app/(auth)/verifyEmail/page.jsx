"use client";
import React, { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import axios from "axios";
import Link from "next/link";
import "../auth.css";

const PageInner = () => {
    const [verified, setVerified] = useState("");
    const [error, setError] = useState("");

    const searchParams = useSearchParams();
    const token = searchParams.get("token");

    const verifyUserEmail = async () => {
        try {
            const { data } = await axios.post("/api/auth/verifyEmail", {
                token: token ? token : "",
            });
            setVerified(data.message);
        } catch (error) {
            setVerified("");
            setError(error.response?.data?.message);
        }
    };

    useEffect(() => {
        if (token?.length > 0) {
            verifyUserEmail();
        }
    }, [token, verifyUserEmail]);

    return (
        <div className="verify-email-main">
            {verified && (
                <div>
                    <h1 className="text-2xl">Email Verified Successfully</h1>
                    <Link href="/login">Login</Link>
                </div>
            )}
            {error && (
                <div>
                    <h1>{error}</h1>
                </div>
            )}
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
