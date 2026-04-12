import { GenerateContentConfig, GoogleGenAI, HarmBlockThreshold, HarmCategory, ApiError, Content } from '@google/genai';
import { GEMINI_ERROR_MESSAGES, FALLBACK_ERRORS, VALIDATION_ERRORS } from '../types/gemini';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

const MODEL_PRIORITY_LIST = (process.env.GEMINI_MODELS || 'gemini-2.5-flash')
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

const executeWithFailover = async <T>(operation: (modelId: string) => Promise<T>, retries = 2): Promise<T> => {
    let lastError: unknown = null;

    for (const currentModelId of MODEL_PRIORITY_LIST) {
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

const multiTurnConversation = async (prompt: string, history: Content[] = []): Promise<string> => {
    return executeWithFailover(async (model) => {
        const response = await ai.models.generateContent({
            model,
            contents: [...history, { role: 'user', parts: [{ text: prompt }] }],
            config,
        });
        return response.text;
    });
};

const generateTextFromImageAndPrompt = async (prompt: string, image: File | Blob): Promise<string> => {
    if (!image) throw new Error(VALIDATION_ERRORS.MISSING_IMAGE);

    const base64Data = Buffer.from(await image.arrayBuffer()).toString('base64');

    return executeWithFailover(async (model) => {
        const response = await ai.models.generateContent({
            model,
            contents: [
                {
                    role: 'user',
                    parts: [{ text: prompt }, { inlineData: { data: base64Data, mimeType: image.type } }],
                },
            ],
            config,
        });
        return response.text;
    });
};

export { multiTurnConversation, generateTextFromImageAndPrompt };
