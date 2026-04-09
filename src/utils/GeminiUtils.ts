import {
    GoogleGenerativeAI,
    HarmCategory,
    HarmBlockThreshold,
    Content,
    GenerationConfig,
    SafetySetting,
} from '@google/generative-ai';

const apiKey: string = process.env.GEMINI_API_KEY as string;
const genAI = new GoogleGenerativeAI(apiKey);

const model = genAI.getGenerativeModel({
    model: 'gemini-2.5-flash',
});

const generationConfig: GenerationConfig = {
    temperature: 1,
    topP: 0.95,
    topK: 64,
    maxOutputTokens: 2048,
    responseMimeType: 'text/plain',
};

const safetySettings: SafetySetting[] = [
    {
        category: HarmCategory.HARM_CATEGORY_HARASSMENT,
        threshold: HarmBlockThreshold.BLOCK_LOW_AND_ABOVE,
    },
    {
        category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
        threshold: HarmBlockThreshold.BLOCK_LOW_AND_ABOVE,
    },
    {
        category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,
        threshold: HarmBlockThreshold.BLOCK_LOW_AND_ABOVE,
    },
];

const withRetry = async <T>(operation: () => Promise<T>, retries = 3): Promise<T> => {
    for (let i = 0; i < retries; i++) {
        try {
            return await operation();
        } catch (error: any) {
            const is503Error = error?.message?.includes('503') || error?.status === 503;

            if (is503Error && i < retries - 1) {
                const waitTime = (i + 1) * 1500;
                await new Promise((resolve) => setTimeout(resolve, waitTime));
                continue;
            }

            throw new Error(error instanceof Error ? error.message : 'Gemini API request failed');
        }
    }
    throw new Error('Failed to reach Gemini API after multiple attempts.');
};

const multiTurnConversation = async (prompt: string, history?: Content[]): Promise<string> => {
    const chatSession = model.startChat({
        generationConfig,
        safetySettings,
        history: history || [],
    });

    return withRetry(async () => {
        const { response } = await chatSession.sendMessage(prompt);
        return response.text();
    });
};

const generateTextFromImageAndPrompt = async (prompt: string, image: File | Blob): Promise<string> => {
    if (!image) throw new Error('No image provided');

    const imageData = await image.arrayBuffer();
    const buffer = Buffer.from(imageData);
    const base64String = buffer.toString('base64');

    const imageObj = {
        inlineData: {
            data: base64String,
            mimeType: image.type || 'image/jpeg',
        },
    };

    return withRetry(async () => {
        const { response } = await model.generateContent([prompt, imageObj]);
        return response.text();
    });
};

export { multiTurnConversation, generateTextFromImageAndPrompt };
