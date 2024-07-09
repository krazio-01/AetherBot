import {
    GoogleGenerativeAI,
    HarmCategory,
    HarmBlockThreshold,
} from "@google/generative-ai";

const apiKey = process.env.GEMINI_API_KEY;
const genAI = new GoogleGenerativeAI(apiKey);

const model = genAI.getGenerativeModel({
    model: "gemini-1.5-flash",
});

const generationConfig = {
    temperature: 1,
    topP: 0.95,
    topK: 64,
    maxOutputTokens: 2048,
    responseMimeType: "text/plain",
};

const safetySettings = [
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

const multiTurnConversation = async (prompt, history) => {
    try {
        const chatSession = model.startChat({
            generationConfig,
            safetySettings,
            history: history || [],
        });

        const { response } = await chatSession.sendMessage(prompt);

        return response.text();
    } catch (error) {
        throw new Error(error);
    }
};

const generateTextFromImageAndPrompt = async (prompt, image) => {
    try {
        if(!image) throw new Error("No image provided");
        
        const imageData = await image.arrayBuffer();
        const buffer = Buffer.from(imageData);

        // Convert the image data to base64
        const base64String = buffer.toString("base64");

        const imageObj = {
            inlineData: {
                data: base64String,
                mimeType: "image/jpg",
            },
        };

        const { response } = await model.generateContent([prompt, imageObj]);
        return response.text();
    } catch (error) {
        throw new Error(error);
    }
};

export { multiTurnConversation, generateTextFromImageAndPrompt };
