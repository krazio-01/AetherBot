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

const features = [
    {
        id: 'chat',
        class: 'bento-wide',
        icon: IoFlashOutline,
        title: 'Lightning-Fast Chat',
        experience: "Get answers instantly. The AI streams responses back to you in real-time, so you're never left staring at a loading spinner.",
        architecture:
            'Built with a custom local-state solution to handle high-frequency text streams smoothly, entirely bypassing expensive React re-renders.',
    },
    {
        id: 'voice',
        class: 'bento-narrow',
        icon: IoVolumeMediumOutline,
        title: 'Voice Synthesis',
        experience: 'Tired of reading long responses? Just hit play and let the AI read it back to you naturally.',
        architecture: 'Uses modern Web TTS APIs to instantly parse and convert Markdown text streams into clean audio playback.',
    },
    {
        id: 'vision',
        class: 'bento-narrow',
        icon: IoDocumentAttachOutline,
        title: 'Multimodal Vision',
        experience: 'Drop in a screenshot, PDF, or receipt, and ask questions about it just like you would with a colleague.',
        architecture: "Securely handles file blobs and uploads via Cloudinary, piping the visual data directly into Gemini's multimodal engine.",
    },
    {
        id: 'code',
        class: 'bento-wide',
        icon: IoTerminalOutline,
        title: 'Live Code Environment',
        experience: 'Why copy-paste? You can actually run the backend scripts or preview UI components right here in the chatbox.',
        architecture:
            'Leverages Sandpack for live React component rendering and JDoodle\'s isolated containers for secure backend execution.',
    },
    {
        id: 'visuals',
        class: 'bento-half',
        icon: IoColorPaletteOutline,
        title: 'Interactive Visuals',
        experience: "Information shouldn't just be a wall of text. See your data brought to life with clean, interactive charts.",
        architecture:
            'A custom UI layer intercepts incoming markdown on the fly to render beautiful, interactive Recharts visualizations.',
    },
    {
        id: 'security',
        class: 'bento-half',
        icon: IoShieldCheckmarkOutline,
        title: 'Secure & Private',
        experience: 'Try it out hassle-free as a guest, or safely log in with your GitHub or Discord account to save your history.',
        architecture: 'Locked down with NextAuth. Uses stateless JWTs and strict account-linking rules to prevent enumeration and takeovers.',
    },
];

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

                <div className="bento-grid">
                    {features.map((feature) => (
                        <div key={feature.id} className={`bento-card ${feature.class}`}>
                            <div className="card-header-wrapper">
                                <feature.icon />
                                <h3>{feature.title}</h3>
                            </div>


                            <div className="bento-details">
                                <div className="detail-block">
                                    <span className="badge badge-primary">Experience</span>
                                    <p>{feature.experience}</p>
                                </div>
                                <div className="detail-block">
                                    <span className="badge badge-secondary">Architecture</span>
                                    <p>{feature.architecture}</p>
                                </div>
                            </div>
                        </div>
                    ))}
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
