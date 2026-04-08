'use client';
import { DotLottieReact } from '@lottiefiles/dotlottie-react';

interface LottieAnimationProps {
    path: string;
    width?: string;
    maxWidth?: string;
    loop?: boolean;
    autoplay?: boolean;
}

const LottieAnimation = ({
    path,
    width = '100%',
    maxWidth = '400px',
    loop = true,
    autoplay = true,
}: LottieAnimationProps) => {
    return (
        <div style={{ width, maxWidth, margin: '0 auto' }}>
            <DotLottieReact src={path} autoplay={autoplay} loop={loop} />
        </div>
    );
};

export default LottieAnimation;
