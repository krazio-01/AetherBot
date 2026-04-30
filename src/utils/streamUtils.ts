import { finalizeInteraction } from '@/services/chatService';
import { FALLBACK_ERRORS, GENERAL_ERRORS } from '@/types/gemini';
import { getFriendlyErrorMessage } from '@/utils/GeminiUtils';

interface IStreamChunk {
    text?: string;
    candidates?: Array<{ finishReason?: string }>;
    [key: string]: any;
}

const ENCODER = new TextEncoder();

const safeEnqueue = (controller: ReadableStreamDefaultController, text: string) => {
    if (!text) return;
    try {
        controller.enqueue(ENCODER.encode(text));
    } catch { }
};

const safeClose = (controller: ReadableStreamDefaultController) => {
    try {
        controller.close();
    } catch { }
};

const formatErrorBlock = (message: string, hasPreviousText: boolean = false): string => {
    const prefix = hasPreviousText ? '\n\n' : '';
    return `${prefix}\`\`\`error\n${message}\n\`\`\``;
};

export const buildInteractionStream = (
    stream: AsyncIterable<IStreamChunk>,
    signal: AbortSignal,
    interactionId?: string,
): ReadableStream => {
    return new ReadableStream({
        async start(controller) {
            let fullModelText = '';
            let hasValidText = false;
            let errorPushed = false;

            const pushText = (text: string) => {
                fullModelText += text;
                safeEnqueue(controller, text);
            };

            const pushError = (message: string) => {
                const formattedErr = formatErrorBlock(message, fullModelText.trim().length > 0);
                pushText(formattedErr);
                errorPushed = true;
            };

            try {
                for await (const chunk of stream) {
                    if (signal.aborted) break;

                    if (chunk.text) {
                        if (chunk.text.trim() !== '') hasValidText = true;
                        pushText(chunk.text);
                    }

                    const finishReason = chunk.candidates?.[0]?.finishReason;

                    if (finishReason && finishReason !== 'STOP') {
                        console.warn(`Stream halted by API. Reason: ${finishReason}`);

                        let reasonMsg: string = FALLBACK_ERRORS.HALTED_GENERAL;
                        if (finishReason === 'SAFETY') reasonMsg = GENERAL_ERRORS.SAFETY;
                        else if (finishReason === 'MAX_TOKENS') reasonMsg = GENERAL_ERRORS.HALTED;
                        pushError(reasonMsg);
                        break;
                    }
                }
            } catch (streamError: unknown) {
                const isAbort = signal.aborted || (streamError instanceof Error && streamError.name === 'AbortError');

                if (isAbort) {
                    console.log('Stream stopped via AbortError.');
                } else {
                    console.error('Mid-stream error caught:', streamError);
                    pushError(getFriendlyErrorMessage(streamError));
                }
            } finally {
                if (!hasValidText && !errorPushed) pushError(FALLBACK_ERRORS.GENERAL);
                safeClose(controller);

                if (interactionId) await finalizeInteraction(interactionId, fullModelText, !hasValidText);
            }
        },
        cancel(reason) {
            console.log('ReadableStream canceled by consumer:', reason);
        },
    });
};
