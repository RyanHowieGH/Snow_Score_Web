import { GoogleGenerativeAI } from "@google/generative-ai";
import type { ArticleData } from "./definitions";

// This is the only function needed in this file.
export async function* generateArticleFromData(data: ArticleData): AsyncGenerator<string> {
    const apiKey = process.env.GOOGLE_GEMINI_API_KEY;
    if (!apiKey) {
        throw new Error("API Key not set in environment variables.");
    }

    try {
        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({ model: "gemma-2b-it" }); // Using your specified model

        // A single, concise prompt that is less likely to hit model limits
        const simplePrompt = `
            You are a sports journalist for the Alberta Snowboard Association. 
            Write an exciting, 3-paragraph summary article for the "${data.name}" event that took place in ${data.location}.

            Key highlights to include:
            - The event was a huge success with great weather.
            - The winners were: ${data.results.map(res => `${res.podium.find(p => p.rank === 1)?.first_name} ${res.podium.find(p => p.rank === 1)?.last_name || ''} in the ${res.division_name} division`).join(', ')}.
            - Give a special mention to the strong performance by Canadian athletes, including ${data.top_canadians.map(can => can.first_name + ' ' + can.last_name).join(', ')}.

            Keep the tone enthusiastic and professional.
        `;
        
        const result = await model.generateContentStream(simplePrompt);

        for await (const chunk of result.stream) {
            yield chunk.text();
        }

    } catch (error) {
        console.error("Error in generateArticleFromData:", error);
        if (error instanceof Error) {
            throw new Error(`AI Service Error: ${error.message}`);
        }
        throw new Error("An unknown error occurred while generating the article.");
    }
}