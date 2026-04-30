import { finalizeInteraction } from '@/services/chatService';
import { FALLBACK_ERRORS } from '@/types/gemini';
import { getFriendlyErrorMessage } from '@/utils/GeminiUtils';

interface IStreamChunk {
    text?: string;
    candidates?: Array<{ finishReason?: string }>;
    [key: string]: any;
}

const ENCODER = new TextEncoder();

const formatErrorBlock = (message: string, hasPreviousText: boolean = false): string => {
    const prefix = hasPreviousText ? '\n\n' : '';
    return `${prefix}\`\`\`error\n${message}\n\`\`\``;
};

const injectErrorIntoStream = (
    error: unknown,
    currentText: string,
    controller: ReadableStreamDefaultController,
): string => {
    console.error('mid-stream error caught:', error);

    const friendlyMsg = getFriendlyErrorMessage(error);
    const formattedErr = formatErrorBlock(friendlyMsg, currentText.length > 0);

    try {
        controller.enqueue(ENCODER.encode(formattedErr));
    } catch (e) { }

    return currentText + formattedErr;
};

const finalizeAndClose = async (
    finalText: string,
    controller: ReadableStreamDefaultController,
    interactionId?: string,
    hasValidText: boolean = false,
) => {
    let textToSave = finalText;
    const shouldDeleteGhost = !hasValidText;

    if (finalText.trim() === '') {
        textToSave = formatErrorBlock(FALLBACK_ERRORS.GENERAL);
        try {
            controller.enqueue(ENCODER.encode(textToSave));
        } catch (e) { }
    }

    try {
        controller.close();
    } catch { }

    if (interactionId) {
        try {
            await finalizeInteraction(interactionId, textToSave, shouldDeleteGhost);
        } catch (dbError) {
            console.error('Failed to finalize interaction in DB:', dbError);
        }
    }
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

            try {
                if (signal.aborted) return;

                for await (const chunk of stream) {
                    if (signal.aborted) {
                        console.log('Client aborted connection. Halting stream.');
                        break;
                    }

                    if (chunk.text) {
                        if (chunk.text.trim() !== '') hasValidText = true;

                        fullModelText += chunk.text;
                        try {
                            controller.enqueue(ENCODER.encode(chunk.text));
                        } catch (e) {
                            break;
                        }
                    }

                    const finishReason = chunk.candidates?.[0]?.finishReason;

                    if (finishReason && finishReason !== 'STOP') {
                        console.warn(`Stream halted by API. Reason: ${finishReason}`);

                        let reasonMsg = `${FALLBACK_ERRORS.HALTED} (Reason: ${finishReason}).`;
                        if (finishReason === 'SAFETY') reasonMsg = FALLBACK_ERRORS.SAFETY;

                        const formattedErr = formatErrorBlock(reasonMsg, hasValidText);

                        fullModelText += formattedErr;

                        try {
                            controller.enqueue(ENCODER.encode(formattedErr));
                        } catch (e) { }

                        break;
                    }
                }
            } catch (streamError: unknown) {
                const isAbortError =
                    signal.aborted || (streamError instanceof Error && streamError.name === 'AbortError');

                if (isAbortError) {
                    console.log('Stream stopped via AbortError.');
                } else {
                    fullModelText = injectErrorIntoStream(streamError, fullModelText, controller);
                }
            } finally {
                await finalizeAndClose(fullModelText, controller, interactionId, hasValidText);
            }
        },
        cancel(reason) {
            console.log('ReadableStream canceled by consumer:', reason);
        },
    });
};
