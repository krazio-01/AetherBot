import { NextRequest } from 'next/server';
import { ResponseWrapper, ErrorWrapper } from '@/lib/ResponseWrapper';
import { apiHandler } from '@/lib/apiHandler';
import { generateAudioFromText } from '@/utils/GeminiUtils';
import { GeminiVoice } from '@/types/gemini';
import { ITTsResponse } from '@/types/chat';

export const POST = apiHandler(async (request: NextRequest) => {
    const body = await request.json();
    const { text } = body;

    if (!text) throw new ErrorWrapper(400, 'Text is required to generate speech');

    try {
        const audioBase64 = await generateAudioFromText(text, GeminiVoice.KORE);

        return ResponseWrapper.successWithData<ITTsResponse>({ audio: audioBase64 });
    } catch (error: any) {
        throw new ErrorWrapper(500, error.message || 'Failed to generate audio');
    }
});
