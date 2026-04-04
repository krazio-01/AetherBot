import { Metadata } from 'next';
import Link from 'next/link';
import Header from '@/components/layout/header/Header';
import AetherHologram from '@/components/Ui/AetherHologram/AetherHologram';
import './index.css';

export default function Home() {
    return (
        <main className="home-main">
            <Header />

            <div className="home-hero-section">
                <div className="content-section">
                    <h1 className="hero-title">
                        Meet <span className="gradient-text">AetherBot</span>
                    </h1>

                    <div className="info-wrapper">
                        <p className="hero-subtitle">
                            Your next-generation AI assistant. Experience seamless, multimodal conversations powered by cutting-edge technology.
                        </p>

                        <div className="action-wrapper">
                            <Link className="try-link" href={'/chat'}>Try Without Account!</Link>
                        </div>
                    </div>
                </div>

                <div className="animation-section">
                    <AetherHologram />
                </div>
            </div>
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
