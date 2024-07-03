import Link from "next/link";
import Image from "next/image";
import "./index.css";

export default function Home() {
    return (
        <main className="main">
            <div className="container">
                <div className="home-logo">
                    <Image
                        src="/images/logo.png"
                        alt="AetherBot"
                        width={400}
                        height={400}
                    />
                </div>
                <h2>Welcome to AetherBot</h2>
                <div className="home-links">
                    <Link href="/login">Sign In</Link>
                    <Link href="/register">Sign Up</Link>
                </div>
            </div>
        </main>
    );
}

export function generateMetadata() {
    return {
        title: "AetherBot - SignIn or SignUp",
        description:
            "Join AetherBot to experience seamless AI-powered conversations. Login or register to access personalized assistance, 24/7 support, and cutting-edge AI technology designed to enhance your digital interactions.",
    };
}
