import { finalizeInteraction } from '@/services/chatService';
import { FALLBACK_ERRORS } from '@/types/gemini';
import { getFriendlyErrorMessage } from '@/utils/GeminiUtils';

interface StreamChunk {
    text?: string;
    [key: string]: any;
}

export const buildInteractionStream = (
    stream: AsyncIterable<StreamChunk>,
    signal: AbortSignal,
    interactionId?: string,
): ReadableStream => {
    const encoder = new TextEncoder();

    return new ReadableStream({
        async start(controller) {
            let fullModelText = '';

            try {
                if (signal.aborted) return;

                for await (const chunk of stream) {
                    if (signal.aborted) {
                        console.log('Client aborted connection. Halting stream.');
                        break;
                    }

                    const text = chunk.text || '';
                    if (text) {
                        fullModelText += text;
                        controller.enqueue(encoder.encode(text));
                    }
                }
            } catch (streamError: any) {
                if (streamError.name === 'AbortError' || signal.aborted) {
                    console.log('Stream stopped via AbortError.');
                } else {
                    console.error('Mid-stream error caught:', streamError);

                    const friendlyMsg = getFriendlyErrorMessage(streamError);
                    const formattedErr =
                        fullModelText.length === 0
                            ? `\`\`\`error\n${friendlyMsg}\n\`\`\``
                            : `\n\n\`\`\`error\n${friendlyMsg}\n\`\`\``;

                    fullModelText += formattedErr;
                    controller.enqueue(encoder.encode(formattedErr));
                }
            } finally {
                if (fullModelText.trim() === '') {
                    fullModelText = FALLBACK_ERRORS.GENERAL;
                    controller.enqueue(encoder.encode(fullModelText));
                }

                try {
                    controller.close();
                } catch (closeError) { }

                if (interactionId) {
                    try {
                        await finalizeInteraction(interactionId, fullModelText);
                    } catch (dbError) {
                        console.error('Failed to finalize interaction in DB:', dbError);
                    }
                }
            }
        },
        cancel(reason) {
            console.log('ReadableStream canceled by consumer:', reason);
        },
    });
};
