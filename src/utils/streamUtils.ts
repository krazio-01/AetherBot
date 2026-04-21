import { finalizeInteraction } from '@/services/chatService';

export const buildInteractionStream = (stream: any, signal: AbortSignal, interactionId?: string): ReadableStream => {
    const encoder = new TextEncoder();
    let fullModelText = '';

    return new ReadableStream({
        async start(controller) {
            try {
                for await (const chunk of stream) {
                    if (signal.aborted) {
                        console.log('Client aborted connection. Halting stream.');
                        break;
                    }
                    if (chunk.text) {
                        fullModelText += chunk.text;
                        controller.enqueue(encoder.encode(chunk.text));
                    }
                }
            } catch (streamError) {
                if (!signal.aborted) controller.error(streamError);
            } finally {
                if (interactionId) {
                    try {
                        await finalizeInteraction(interactionId, fullModelText);
                    } catch (dbError) {
                        console.error('Failed to finalize interaction in DB:', dbError);
                    }
                }
                try {
                    controller.close();
                } catch (closeError) { }
            }
        },
    });
};
