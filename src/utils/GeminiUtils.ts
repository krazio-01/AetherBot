import {
    GoogleGenerativeAI,
    HarmCategory,
    HarmBlockThreshold,
    Content,
    GenerationConfig,
    SafetySetting,
} from '@google/generative-ai';

const apiKey: string = process.env.GEMINI_API_KEY;
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

const multiTurnConversation = async (prompt: string, history?: Content[]): Promise<string> => {
    try {
        const chatSession = model.startChat({
            generationConfig,
            safetySettings,
            history: history || [],
        });

        const { response } = await chatSession.sendMessage(prompt);

        return response.text();
    } catch (error) {
        throw new Error(error instanceof Error ? error.message : 'Failed to generate conversation');
    }
};

const generateTextFromImageAndPrompt = async (prompt: string, image: File | Blob): Promise<string> => {
    try {
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

        const { response } = await model.generateContent([prompt, imageObj]);
        return response.text();
    } catch (error) {
        throw new Error(error instanceof Error ? error.message : 'Failed to generate text from image');
    }
};

export { multiTurnConversation, generateTextFromImageAndPrompt };
