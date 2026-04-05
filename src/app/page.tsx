import { Metadata } from 'next';
import Link from 'next/link';
import Header from '@/components/layout/header/Header';
import AetherHologram from '@/components/Ui/AetherHologram/AetherHologram';
import { IoTrainOutline, IoEyeOutline, IoFlashOutline, IoShieldCheckmarkOutline } from 'react-icons/io5';
import './index.css';

export default function Home() {
    return (
        <main className="home-main">
            <Header />

            <section className="home-hero-section">
                <div className="content-section">
                    <h1 className="hero-title">
                        Meet <span className="gradient-text">AetherBot</span>
                    </h1>

                    <div className="info-wrapper">
                        <p className="hero-subtitle">
                            Your next-generation AI assistant. Experience seamless, multimodal conversations powered by
                            cutting-edge technology.
                        </p>

                        <div className="action-wrapper">
                            <Link className="try-link" href={'/chat'}>
                                Try Without Account!
                            </Link>
                        </div>
                    </div>
                </div>

                <div className="animation-section">
                    <AetherHologram />
                </div>
            </section>

            <section className="features-section">
                <div className="features-header">
                    <h2 className="section-title">Beyond Standard Chat</h2>
                    <p className="section-subtitle">Purpose-built tools designed to accelerate your workflow.</p>
                </div>

                <div className="features-grid">
                    <div className="feature-card">
                        <div className="icon-wrapper">
                            <IoTrainOutline />
                        </div>
                        <h3>Advanced Reasoning</h3>
                        <p>
                            Complex logic parsing and multi-step problem solving utilizing state-of-the-art neural
                            architecture.
                        </p>
                    </div>

                    <div className="feature-card">
                        <div className="icon-wrapper">
                            <IoEyeOutline />
                        </div>
                        <h3>Vision Context</h3>
                        <p>
                            Upload documents, diagrams, and images. AetherBot sees what you see and analyzes it
                            instantly.
                        </p>
                    </div>

                    <div className="feature-card">
                        <div className="icon-wrapper">
                            <IoFlashOutline />
                        </div>
                        <h3>Real-time Execution</h3>
                        <p>
                            Generate, refine, and execute code snippets securely within your isolated chat environment.
                        </p>
                    </div>

                    <div className="feature-card">
                        <div className="icon-wrapper">
                            <IoShieldCheckmarkOutline />
                        </div>
                        <h3>Zero-Trace Privacy</h3>
                        <p>Your conversations are ephemeral. We don't train on your proprietary data or source code.</p>
                    </div>
                </div>
            </section>

            <section className="bottom-cta-section">
                <div className="cta-container">
                    <h2>Ready to upgrade your intelligence?</h2>
                    <p>Join thousands of developers and creatives building the future with AetherBot.</p>
                    <Link className="try-link-large" href={'/login'}>
                        Create Free Account
                    </Link>
                </div>
            </section>

            <footer className="home-footer">
                <div className="footer-content">
                    <div className="footer-logo">
                        <span className="gradient-text">AetherBot</span>
                        <p>© {new Date().getFullYear()} AetherBot Inc. All rights reserved.</p>
                    </div>
                    <div className="footer-links">
                        <Link href="/">Privacy Policy</Link>
                        <Link href="/">Terms of Service</Link>
                    </div>
                </div>
            </footer>
        </main>
    );
}

export function generateMetadata(): Metadata {
    return {
        title: 'AetherBot - The Next-Gen AI Assistant',
        description:
            'Join AetherBot to experience seamless AI-powered conversations. Try it for free as a guest or create an account for personalized assistance.',
    };
}
