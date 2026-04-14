'use client';
import React, { useState, useCallback, useEffect, memo } from 'react';
import { useRequest } from '@/hooks/useRequest';
import { Oval } from 'react-loader-spinner';
import { toast } from 'sonner';
import { LuVolume2 } from 'react-icons/lu';
import { ITTsResponse } from '@/types/chat';

interface IPlayAudioButtonProps {
    text: string;
}

const PlayAudioButton = ({ text }: IPlayAudioButtonProps) => {
    const [isPlaying, setIsPlaying] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    const { postRequest } = useRequest();

    useEffect(() => {
        return () => {
            if (window.speechSynthesis.speaking) window.speechSynthesis.cancel();
        };
    }, []);

    const playFallbackSpeech = useCallback((fallbackText: string) => {
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(fallbackText);

        const playSpeech = () => {
            const voices = window.speechSynthesis.getVoices();
            const bestVoice =
                voices.find((v) => v.name.includes('Google US English')) ||
                voices.find((v) => v.name.includes('Samantha')) ||
                voices.find((v) => v.lang === 'en-US' && !v.localService) ||
                voices.find((v) => v.lang.startsWith('en')) ||
                voices[0];

            utterance.voice = bestVoice || null;
            utterance.rate = 0.95;

            utterance.onstart = () => setIsPlaying(true);
            utterance.onend = () => setIsPlaying(false);
            utterance.onerror = () => {
                setIsPlaying(false);
                toast.error('Failed to play native audio.');
            };

            (window as any).currentUtterance = utterance;
            window.speechSynthesis.speak(utterance);
        };

        if (window.speechSynthesis.getVoices().length === 0) {
            window.speechSynthesis.addEventListener('voiceschanged', playSpeech, { once: true });
        } else {
            playSpeech();
        }
    }, []);

    const handlePlay = useCallback(async () => {
        if (isPlaying) {
            window.speechSynthesis.cancel();
            setIsPlaying(false);
            return;
        }

        if (isLoading) return;
        setIsLoading(true);

        try {
            const res = await postRequest<ITTsResponse>('/tts', { text });

            if (!res.success || !res.data?.audio) throw new Error('API TTS Failed');

            const audio = new Audio(`data:audio/wav;base64,${res.data.audio}`);

            audio.onplay = () => setIsPlaying(true);
            audio.onended = () => setIsPlaying(false);

            audio.onerror = () => {
                throw new Error('Audio format error');
            };

            await audio.play();
        } catch (error) {
            console.warn('Gemini TTS failed, falling back to browser TTS...', error);
            playFallbackSpeech(text);
        } finally {
            setIsLoading(false);
        }
    }, [text, isPlaying, isLoading, postRequest, playFallbackSpeech]);

    return (
        <button
            onClick={handlePlay}
            title={isPlaying ? 'Stop reading' : 'Read aloud'}
            disabled={isLoading}
            style={{ opacity: isLoading ? 0.7 : 1 }}
            type="button"
        >
            {isLoading ? (
                <Oval visible={true} height="14" width="14" color="currentColor" secondaryColor="currentColor" />
            ) : (
                <LuVolume2 style={{ color: isPlaying ? 'var(--blue)' : 'inherit' }} />
            )}
        </button>
    );
};

export default memo(PlayAudioButton);
