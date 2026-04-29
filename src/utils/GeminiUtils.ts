import { GenerateContentConfig, GoogleGenAI, HarmBlockThreshold, HarmCategory, ApiError, Content } from '@google/genai';
import { GEMINI_ERROR_MESSAGES, FALLBACK_ERRORS, GENERAL_ERRORS, GeminiVoice } from '../types/gemini';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

const MODEL_PRIORITY_LIST = (process.env.GEMINI_MODELS || 'gemini-2.5-flash')
    .split('|')
    .map((model) => model.trim())
    .filter(Boolean);

const TTS_MODEL_PRIORITY_LIST = (process.env.GEMINI_TTS_MODELS || 'gemini-2.5-flash-tts')
    .split('|')
    .map((model) => model.trim())
    .filter(Boolean);

const config: GenerateContentConfig = {
    temperature: 1,
    topP: 0.95,
    topK: 64,
    safetySettings: [
        HarmCategory.HARM_CATEGORY_HARASSMENT,
        HarmCategory.HARM_CATEGORY_HATE_SPEECH,
        HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,
        HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
    ].map((category) => ({
        category,
        threshold: HarmBlockThreshold.BLOCK_LOW_AND_ABOVE,
    })),
};

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const getFriendlyErrorMessage = (err: unknown): string => {
    if (err instanceof ApiError) return GEMINI_ERROR_MESSAGES[err.status] || FALLBACK_ERRORS.API_UNKNOWN;
    if (err instanceof Error) return FALLBACK_ERRORS.NETWORK;
    return FALLBACK_ERRORS.GENERAL;
};

const addWavHeader = (
    pcmData: Buffer,
    sampleRate: number = 24000,
    numChannels: number = 1,
    bitsPerSample: number = 16,
): Buffer => {
    const byteRate = (sampleRate * numChannels * bitsPerSample) / 8;
    const blockAlign = (numChannels * bitsPerSample) / 8;
    const dataSize = pcmData.length;
    const header = Buffer.alloc(44);

    header.write('RIFF', 0);
    header.writeUInt32LE(36 + dataSize, 4);
    header.write('WAVE', 8);
    header.write('fmt ', 12);
    header.writeUInt32LE(16, 16);
    header.writeUInt16LE(1, 20);
    header.writeUInt16LE(numChannels, 22);
    header.writeUInt32LE(sampleRate, 24);
    header.writeUInt32LE(byteRate, 28);
    header.writeUInt16LE(blockAlign, 32);
    header.writeUInt16LE(bitsPerSample, 34);
    header.write('data', 36);
    header.writeUInt32LE(dataSize, 40);

    return Buffer.concat([header, pcmData]);
};

const executeWithFailover = async <T>(
    operation: (modelId: string) => Promise<T>,
    modelList: string[] = MODEL_PRIORITY_LIST,
    retries = 2,
): Promise<T> => {
    let lastError: unknown = null;

    for (const currentModelId of modelList) {
        for (let attempt = 0; attempt < retries; attempt++) {
            try {
                return await operation(currentModelId);
            } catch (err: unknown) {
                lastError = err;

                if (!(err instanceof ApiError)) {
                    console.error(`[${currentModelId}] Network/System Error:`, (err as Error).message);
                    break;
                }

                const { status, message, cause } = err;
                console.error(`[${currentModelId}] API Error (${status}): ${message}`, { cause });

                if (status === 503 && attempt < retries - 1) {
                    const waitTime = (attempt + 1) * 1500;
                    console.warn(`[${currentModelId}] Busy (503). Retrying in ${waitTime}ms...`);
                    await delay(waitTime);
                    continue;
                }

                if (status === 404 || status === 429) {
                    console.warn(`[${currentModelId}] Status ${status}. Jumping to next tier...`);
                    break;
                }

                break;
            }
        }
    }

    throw new Error(getFriendlyErrorMessage(lastError));
};

const multiTurnConversationStream = async (prompt: string, history: Content[] = []) => {
    return executeWithFailover(async (model) => {
        const chat = ai.chats.create({
            model,
            history,
            config,
        });

        const responseStream = await chat.sendMessageStream({
            message: prompt,
        });

        return responseStream;
    });
};

const generateTextFromFileAndPromptStream = async (prompt: string, file: File | Blob, history: Content[] = []) => {
    if (!file) throw new Error(GENERAL_ERRORS.MISSING_FILE);

    const base64Data = Buffer.from(await file.arrayBuffer()).toString('base64');

    return executeWithFailover(async (model) => {
        const chat = ai.chats.create({
            model,
            history,
            config,
        });

        const responseStream = await chat.sendMessageStream({
            message: [{ text: prompt }, { inlineData: { data: base64Data, mimeType: file.type } }],
        });

        return responseStream;
    });
};

const generateAudioFromText = async (text: string, voiceName: GeminiVoice = GeminiVoice.KORE): Promise<string> => {
    return executeWithFailover(async (model) => {
        const response = await ai.models.generateContent({
            model,
            contents: text,
            config: {
                responseModalities: ['AUDIO'],
                speechConfig: {
                    voiceConfig: {
                        prebuiltVoiceConfig: {
                            voiceName,
                        },
                    },
                },
            },
        });

        const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;

        if (!base64Audio) throw new Error(GENERAL_ERRORS.NO_AUDIO);

        const pcmBuffer = Buffer.from(base64Audio, 'base64');
        const wavBuffer = addWavHeader(pcmBuffer);

        return wavBuffer.toString('base64');
    }, TTS_MODEL_PRIORITY_LIST);
};

export { multiTurnConversationStream, generateTextFromFileAndPromptStream, generateAudioFromText };
