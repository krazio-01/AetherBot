type StreamListener = (text: string, isDone: boolean) => void;

interface StreamState {
    bufferedText: string;
    renderedText: string;
    isStreamComplete: boolean;
    characterAccumulator: number;
}

class StreamingService {
    private listeners = new Map<string, Set<StreamListener>>();
    private streams = new Map<string, StreamState>();
    private animationFrameRef: number | null = null;
    private lastDrawTime = performance.now();

    subscribe(messageId: string, listener: StreamListener) {
        if (!this.listeners.has(messageId)) this.listeners.set(messageId, new Set());

        this.listeners.get(messageId)!.add(listener);

        const state = this.streams.get(messageId);
        if (state?.renderedText) listener(state.renderedText, false);

        return () => {
            this.listeners.get(messageId)?.delete(listener);
        };
    }

    private getStreamState(messageId: string): StreamState {
        if (!this.streams.has(messageId)) {
            this.streams.set(messageId, {
                bufferedText: '',
                renderedText: '',
                isStreamComplete: false,
                characterAccumulator: 0,
            });
        }
        return this.streams.get(messageId)!;
    }

    queueIncomingText(messageId: string, textChunk: string) {
        this.getStreamState(messageId).bufferedText = textChunk;
        this.startLoopIfNeeded();
    }

    markStreamDone(messageId: string) {
        this.getStreamState(messageId).isStreamComplete = true;
        this.startLoopIfNeeded();
    }

    stopStream(messageId: string) {
        this.streams.delete(messageId);
    }

    getDisplayedText(messageId: string): string {
        return this.streams.get(messageId)?.renderedText || '';
    }

    private emit(messageId: string, text: string, isDone: boolean) {
        this.listeners.get(messageId)?.forEach((listener) => listener(text, isDone));
    }

    private startLoopIfNeeded() {
        if (!this.animationFrameRef) {
            this.lastDrawTime = performance.now();
            this.runTypingAnimationLoop();
        }
    }

    private calculateTypingSpeed(remaining: number, isStreamComplete: boolean): number {
        if (isStreamComplete) return 500;
        if (remaining > 150) return 300;
        if (remaining > 50) return 110;
        if (remaining < 15) return 30;
        return 60;
    }

    private runTypingAnimationLoop() {
        const tick = (now: number) => {
            const dt = now - this.lastDrawTime;
            this.lastDrawTime = now;
            let isAnimating = false;

            for (const [messageId, state] of this.streams.entries()) {
                const remaining = state.bufferedText.length - state.renderedText.length;

                if (remaining > 0) {
                    isAnimating = true;

                    const currentCPS = this.calculateTypingSpeed(remaining, state.isStreamComplete);
                    state.characterAccumulator += (currentCPS * dt) / 1000;
                    const charsToAdd = Math.min(Math.floor(state.characterAccumulator), remaining);

                    if (charsToAdd > 0) {
                        state.renderedText = state.bufferedText.slice(0, state.renderedText.length + charsToAdd);
                        state.characterAccumulator -= charsToAdd;
                        this.emit(messageId, state.renderedText, false);
                    }
                } else if (state.isStreamComplete) {
                    this.emit(messageId, state.renderedText, true);
                    this.stopStream(messageId);
                }
            }

            this.animationFrameRef = isAnimating ? requestAnimationFrame(tick) : null;
        };

        this.animationFrameRef = requestAnimationFrame(tick);
    }
}

export const streamingService = new StreamingService();
