import { finalizeInteraction } from '@/services/chatService';
import { FALLBACK_ERRORS } from '@/types/gemini';
import { getFriendlyErrorMessage } from '@/utils/GeminiUtils';

interface IStreamChunk {
    text?: string;
    [key: string]: any;
}

const ENCODER = new TextEncoder();

const injectErrorIntoStream = (
    error: unknown,
    currentText: string,
    controller: ReadableStreamDefaultController,
): string => {
    console.error('mid-stream error caught:', error);

    const friendlyMsg = getFriendlyErrorMessage(error);

    const prefix = currentText.length === 0 ? '' : '\n\n';
    const formattedErr = `${prefix}\`\`\`error\n${friendlyMsg}\n\`\`\``;

    controller.enqueue(ENCODER.encode(formattedErr));
    return currentText + formattedErr;
};

const finalizeAndClose = async (
    finalText: string,
    controller: ReadableStreamDefaultController,
    interactionId?: string,
) => {
    const textToSave = finalText.trim() === '' ? FALLBACK_ERRORS.GENERAL : finalText;

    if (textToSave === FALLBACK_ERRORS.GENERAL) controller.enqueue(ENCODER.encode(textToSave));

    try {
        controller.close();
    } catch { }

    if (interactionId) {
        try {
            await finalizeInteraction(interactionId, textToSave);
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
            if (signal.aborted) {
                controller.close();
                return;
            }

            let fullModelText = '';

            try {
                for await (const chunk of stream) {
                    if (signal.aborted) {
                        console.log('Client aborted connection. Halting stream.');
                        break;
                    }

                    if (chunk.text) {
                        fullModelText += chunk.text;
                        controller.enqueue(ENCODER.encode(chunk.text));
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
                await finalizeAndClose(fullModelText, controller, interactionId);
            }
        },
        cancel(reason) {
            console.log('ReadableStream canceled by consumer:', reason);
        },
    });
};
