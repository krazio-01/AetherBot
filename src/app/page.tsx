import { Metadata } from 'next';
import Link from 'next/link';
import Header from '@/components/layout/header/Header';
import AetherHologram from '@/components/Ui/AetherHologram/AetherHologram';
import { IoChatbubblesOutline, IoImageOutline, IoCloudUploadOutline, IoConstructOutline } from 'react-icons/io5';
import TryButton from '@/components/Ui/TryBtn/TryButton';
import './index.css';

export default function Home() {
    return (
        <main className="home-main">
            <Header />

            <section className="home-hero-section">
                <div className="content-section">
                    <h1 className="hero-title">
                        Chat with <span className="gradient-text">AetherBot</span>
                    </h1>

                    <div className="info-wrapper">
                        <p className="hero-subtitle">
                            A smart conversational assistant. Have natural, continuous chats and upload images for
                            instant visual analysis.
                        </p>

                        <div className="action-wrapper">
                            <TryButton />
                        </div>
                    </div>
                </div>

                <div className="animation-section">
                    <AetherHologram />
                </div>
            </section>

            <section className="features-section">
                <div className="features-header">
                    <h2 className="section-title">Current Features</h2>
                    <p className="section-subtitle">A transparent look at what's under the hood right now.</p>
                </div>

                <div className="features-grid">
                    <div className="feature-card">
                        <div className="icon-wrapper">
                            <IoChatbubblesOutline />
                        </div>
                        <h3>Multi-Turn Context</h3>
                        <p>
                            Maintains conversation history to allow for natural, continuous dialogue using standard
                            context window management.
                        </p>
                    </div>

                    <div className="feature-card">
                        <div className="icon-wrapper">
                            <IoImageOutline />
                        </div>
                        <h3>Image Analysis</h3>
                        <p>
                            Upload an image and the Gemini 2.5 Flash vision model will analyze it and respond based on
                            the visual context.
                        </p>
                    </div>

                    <div className="feature-card">
                        <div className="icon-wrapper">
                            <IoCloudUploadOutline />
                        </div>
                        <h3>Cloudinary Integration</h3>
                        <p>
                            For authenticated users, uploaded images are securely processed and hosted via Cloudinary
                            for persistent access.
                        </p>
                    </div>

                    <div className="feature-card">
                        <div className="icon-wrapper">
                            <IoConstructOutline />
                        </div>
                        <h3>Active Roadmap</h3>
                        <p>
                            Currently researching and developing integrations for native AI image and video generation
                            features.
                        </p>
                    </div>
                </div>
            </section>

            <section className="bottom-cta-section">
                <div className="cta-container">
                    <h2>Want to test the integration?</h2>
                    <p>Try it out as a guest or create an account to test the Cloudinary image uploads.</p>
                    <Link className="try-link-large" href={'/login'}>
                        Create Free Account
                    </Link>
                </div>
            </section>

            <footer className="home-footer">
                <div className="footer-content">
                    <div className="footer-logo">
                        <span className="gradient-text">AetherBot</span>
                        <p>© {new Date().getFullYear()} AetherBot. Open for feedback.</p>
                    </div>

                    <div className="footer-links">
                        <a href="https://github.com/krazio-01/AetherBot" target="_blank" rel="noopener noreferrer">
                            GitHub Repo
                        </a>

                        <a href="https://mdamman.netlify.app/" target="_blank" rel="noopener noreferrer">
                            Portfolio
                        </a>
                    </div>
                </div>
            </footer>
        </main>
    );
}

export function generateMetadata(): Metadata {
    return {
        title: 'AetherBot - Your AI Conversational Workspace',
        description:
            'Chat naturally with full context memory, upload complex images, and get instant visual analysis to speed up your workflow.',
    };
}
