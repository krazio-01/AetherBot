'use client';
import React, { useState, useCallback, useEffect, memo, useRef, RefObject } from 'react';
import { useRequest } from '@/hooks/useRequest';
import { Oval } from 'react-loader-spinner';
import { toast } from 'sonner';
import { LuVolume2, LuSquare } from 'react-icons/lu';
import { ITTsResponse } from '@/types/chat';

const audioCache = new Map<string, string>();
const MAX_CACHE_SIZE = 10;

const getBestVoice = (): SpeechSynthesisVoice | null => {
    const voices = window.speechSynthesis.getVoices();
    if (!voices.length) return null;

    const isEnglish = (v: SpeechSynthesisVoice) => v.lang.startsWith('en');
    const isNotRobotic = (v: SpeechSynthesisVoice) => {
        const lowerName = v.name.toLowerCase();
        const lowerURI = v.voiceURI.toLowerCase();
        return !lowerName.includes('espeak') && !lowerURI.includes('speechd') && !lowerName.includes('festival');
    };

    const goodVoices = voices.filter((v) => isEnglish(v) && isNotRobotic(v));

    return (
        goodVoices.find((v) => v.name.includes('Natural')) ||
        goodVoices.find((v) => v.name === 'Alex' || v.name.includes('Enhanced') || v.name.includes('Premium')) ||
        goodVoices.find((v) => v.name.includes('Samantha') || v.name.includes('Daniel')) ||
        goodVoices.find((v) => v.name.includes('Google')) ||
        goodVoices.find((v) => v.name.includes('Microsoft')) ||
        goodVoices[0] ||
        null
    );
};

const stopAllAudio = (audioRef: RefObject<HTMLAudioElement | null>) => {
    if (window.speechSynthesis?.speaking) window.speechSynthesis.cancel();

    if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
        audioRef.current = null;
    }
};

interface IPlayAudioButtonProps {
    text: string;
}

const PlayAudioButton = ({ text }: IPlayAudioButtonProps) => {
    const [isPlaying, setIsPlaying] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    const audioRef = useRef<HTMLAudioElement | null>(null);
    const isMounted = useRef(true);

    const { postRequest } = useRequest();

    useEffect(() => {
        isMounted.current = true;
        return () => {
            isMounted.current = false;
            stopAllAudio(audioRef);
        };
    }, []);

    const playFallbackSpeech = useCallback((fallbackText: string) => {
        stopAllAudio(audioRef);

        const playSpeech = () => {
            if (!isMounted.current) return;
            const bestVoice = getBestVoice();

            if (!bestVoice) {
                setIsPlaying(false);
                toast.error(
                    'Daily AI voice limit reached. Please use Chrome, Edge, Safari, or Windows for native audio support.',
                    { duration: 7000 },
                );
                return;
            }

            const utterance = new SpeechSynthesisUtterance(fallbackText);
            utterance.voice = bestVoice;
            utterance.rate = 0.95;

            utterance.onstart = () => isMounted.current && setIsPlaying(true);
            utterance.onend = () => isMounted.current && setIsPlaying(false);

            utterance.onerror = (e) => {
                if (isMounted.current && e.error !== 'canceled' && e.error !== 'interrupted') {
                    setIsPlaying(false);
                    toast.error('Failed to play native audio.');
                }
            };

            (window as any).currentUtterance = utterance;

            setIsPlaying(true);
            window.speechSynthesis.speak(utterance);
        };

        if (window.speechSynthesis.getVoices().length === 0) {
            setIsPlaying(true);
            window.speechSynthesis.addEventListener('voiceschanged', playSpeech, { once: true });
        } else {
            playSpeech();
        }
    }, []);

    const handlePlay = useCallback(async () => {
        if (isPlaying) {
            stopAllAudio(audioRef);
            setIsPlaying(false);
            return;
        }

        if (isLoading) return;
        setIsLoading(true);

        try {
            let base64Audio = audioCache.get(text);

            if (!base64Audio) {
                const res = await postRequest<ITTsResponse>('/tts', { text });

                if (!isMounted.current) return;

                if (!res.success || !res.data?.audio) throw new Error('API TTS Failed');

                base64Audio = res.data.audio;

                if (audioCache.size >= MAX_CACHE_SIZE) {
                    const oldestKey = audioCache.keys().next().value;
                    if (oldestKey) audioCache.delete(oldestKey);
                }
                audioCache.set(text, base64Audio);
            }

            if (!isMounted.current) return;

            const audio = new Audio(`data:audio/wav;base64,${base64Audio}`);
            audioRef.current = audio;

            audio.onplay = () => isMounted.current && setIsPlaying(true);
            audio.onended = () => isMounted.current && setIsPlaying(false);

            audio.onerror = () => {
                if (isMounted.current) playFallbackSpeech(text);
            };

            await audio.play();
        } catch (error) {
            console.warn('Gemini TTS failed, falling back to browser TTS...', error);
            if (isMounted.current) playFallbackSpeech(text);
        } finally {
            if (isMounted.current) setIsLoading(false);
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
            ) : isPlaying ? (
                <LuSquare style={{ color: 'var(--blue)' }} />
            ) : (
                <LuVolume2 style={{ color: 'inherit' }} />
            )}
        </button>
    );
};

export default memo(PlayAudioButton);
