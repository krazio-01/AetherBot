"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { FaArrowRight } from "react-icons/fa";
import "./forms.css";

const AuthForm = ({
    formFields,
    refs,
    loading,
    onSubmit,
    loadingText,
    redirectUrl,
    additionalToast,
    submitButtonText,
    forgotPassword
}) => {
    const router = useRouter();

    const handleSubmit = (e) => {
        e.preventDefault();

        toast.promise(
            onSubmit().then((message) => {
                if (additionalToast) additionalToast();
                router.push(redirectUrl);
                return message;
            }),
            {
                loading: loadingText,
                success: (message) => message,
                error: (message) => message,
            }
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

                <button
                    type="submit"
                    disabled={loading}
                    className={loading ? "disabled" : ""}
                >
                    <span>{submitButtonText}</span>
                    <FaArrowRight />
                </button>
            </form>
        </div>
    );
};

export default AuthForm;
