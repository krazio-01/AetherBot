import Link from 'next/link';
import LottieAnimation from '@/components/Ui/LottieAnimation/LottieAnimation';
import './not-found.css';

export default function NotFound() {
    return (
        <div className="not-found-container">
            <div className="not-found-content">
                <LottieAnimation
                    path="/animations/404.lottie"
                    maxWidth="1000px"
                />

                <div className="not-found-actions">
                    <Link href="/chat" className="btn-primary">
                        Back to Safety
                    </Link>
                    <Link href="/" className="btn-secondary">
                        Go Home
                    </Link>
                </div>
            </div>
        </div>
    );
}
