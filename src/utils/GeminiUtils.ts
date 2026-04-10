import { GenerateContentConfig, GoogleGenAI, HarmBlockThreshold, HarmCategory, ApiError, Content } from '@google/genai';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

const config: GenerateContentConfig = {
    temperature: 1,
    topP: 0.95,
    topK: 64,
    maxOutputTokens: 2048,
    safetySettings: [
        {
            category: HarmCategory.HARM_CATEGORY_HARASSMENT,
            threshold: HarmBlockThreshold.BLOCK_LOW_AND_ABOVE,
        },
        {
            category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
            threshold: HarmBlockThreshold.BLOCK_LOW_AND_ABOVE,
        },
        {
            category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,
            threshold: HarmBlockThreshold.BLOCK_LOW_AND_ABOVE,
        },
        {
            category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
            threshold: HarmBlockThreshold.BLOCK_LOW_AND_ABOVE,
        },
    ],
};

const MODEL = 'gemini-3.1-flash-lite-preview';

const withRetry = async <T>(operation: () => Promise<T>, retries = 3): Promise<T> => {
    for (let i = 0; i < retries; i++) {
        try {
            return await operation();
        } catch (error: unknown) {
            if (error instanceof ApiError) {
                const is503Error = error?.message?.includes('503') || error?.status === 503;

                if (is503Error && i < retries - 1) {
                    const waitTime = (i + 1) * 1500;
                    await new Promise((resolve) => setTimeout(resolve, waitTime));
                    continue;
                }

                throw new Error(error instanceof Error ? error.message : 'Gemini API request failed');
            }

            throw error;
        }
    }
    throw new Error('Failed to reach Gemini API after multiple attempts.');
};

const multiTurnConversation = async (prompt: string, history: Content[] = []): Promise<string> => {
    return withRetry(async () => {
        const response = await ai.models.generateContent({
            model: MODEL,
            contents: [...history, { role: 'user', parts: [{ text: prompt }] }],
            config,
        });
        return response.text;
    });
};

const generateTextFromImageAndPrompt = async (prompt: string, image: File | Blob): Promise<string> => {
    if (!image) throw new Error('No image provided');
    const base64Data = Buffer.from(await image.arrayBuffer()).toString('base64');

    return withRetry(async () => {
        const response = await ai.models.generateContent({
            model: MODEL,
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
