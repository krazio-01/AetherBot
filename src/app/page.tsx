import { Metadata } from 'next';
import Link from 'next/link';
import Header from '@/components/layout/header/Header';
import AetherHologram from '@/components/Ui/AetherHologram/AetherHologram';
import {
    IoFlashOutline,
    IoDocumentAttachOutline,
    IoVolumeMediumOutline,
    IoColorPaletteOutline,
    IoTerminalOutline,
    IoShieldCheckmarkOutline,
} from 'react-icons/io5';
import TryButton from '@/components/Ui/TryBtn/TryButton';
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
                            Your intelligent, real-time AI companion. Analyze PDFs, execute code on the fly, listen to
                            voice responses, and visualize data instantly.
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
                    <h2 className="section-title">Built for users. Engineered for scale.</h2>
                    <p className="section-subtitle">
                        A seamless chat experience backed by serious technical infrastructure.
                    </p>
                </div>

                <div className="features-grid">
                    <div className="feature-card">
                        <div className="icon-wrapper">
                            <IoFlashOutline />
                        </div>
                        <h3>Lightning-Fast Chat</h3>
                        <p>
                            <strong>For you:</strong> No waiting. Watch the AI type its responses in real-time.
                            <br />
                            <strong>Under the hood:</strong> Custom React state architecture manages high-frequency text
                            streaming without triggering expensive browser re-renders.
                        </p>
                    </div>

                    <div className="feature-card">
                        <div className="icon-wrapper">
                            <IoDocumentAttachOutline />
                        </div>
                        <h3>Multimodal Analysis</h3>
                        <p>
                            <strong>For you:</strong> Upload complex images, invoices, or multi-page PDFs and get
                            instant answers.
                            <br />
                            <strong>Under the hood:</strong> Securely processes document blobs and visual assets via
                            Cloudinary, integrated directly with Gemini&apos;s vision engine.
                        </p>
                    </div>

                    <div className="feature-card">
                        <div className="icon-wrapper">
                            <IoTerminalOutline />
                        </div>
                        <h3>Live Code Environment</h3>
                        <p>
                            <strong>For you:</strong> Don&apos;t just read code—run it. View interactive UI components or
                            execute backend scripts right in the chat.
                            <br />
                            <strong>Under the hood:</strong> Integrates Sandpack for live frontend React rendering and
                            the JDoodle API for secure, containerized backend code execution.
                        </p>
                    </div>

                    <div className="feature-card">
                        <div className="icon-wrapper">
                            <IoColorPaletteOutline />
                        </div>
                        <h3>Interactive Visuals</h3>
                        <p>
                            <strong>For you:</strong> Plain text is boring. Get beautifully formatted syntax and live
                            data charts.
                            <br />
                            <strong>Under the hood:</strong> A dynamic UI layer that parses Markdown, highlights syntax,
                            and renders interactive Recharts data visualizations on the fly.
                        </p>
                    </div>

                    <div className="feature-card">
                        <div className="icon-wrapper">
                            <IoVolumeMediumOutline />
                        </div>
                        <h3>Text-to-Speech Voice</h3>
                        <p>
                            <strong>For you:</strong> Give your eyes a rest. Click play and listen to the AI&apos;s responses
                            in a natural voice.
                            <br />
                            <strong>Under the hood:</strong> Dynamically converts streamed markdown responses into
                            seamless audio playback using advanced TTS browser APIs.
                        </p>
                    </div>

                    <div className="feature-card">
                        <div className="icon-wrapper">
                            <IoShieldCheckmarkOutline />
                        </div>
                        <h3>Secure & Private</h3>
                        <p>
                            <strong>For you:</strong> Your data is safe. Jump in as a guest or securely link your social
                            accounts.
                            <br />
                            <strong>Under the hood:</strong> Protected by NextAuth with stateless JWT session management
                            and anti-enumeration security protocols.
                        </p>
                    </div>
                </div>
            </section>

            <section className="bottom-cta-section">
                <div className="cta-container">
                    <h2>Ready to test the architecture?</h2>
                    <p>
                        Try it out locally as a guest, or create a free account to unlock document uploads and live code
                        execution.
                    </p>
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
        title: 'AetherBot | Intelligent AI Workspace',
        description:
            'A seamless AI assistant featuring real-time streaming, PDF analysis, live code execution, and dynamic data visualization.',
    };
}
