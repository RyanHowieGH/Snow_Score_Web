import { GoogleGenerativeAI } from "@google/generative-ai";
import type { ArticleData } from "./definitions";

// --- THIS IS THE NEW HELPER FUNCTION ---
// It returns a Promise that resolves after a specified number of milliseconds.
const delay = (ms: number) => new Promise(res => setTimeout(res, ms));


// Helper function for a single AI call (unchanged)
async function* callGeminiStream(prompt: string): AsyncGenerator<string> {
    const apiKey = process.env.GOOGLE_GEMINI_API_KEY;
    if (!apiKey) throw new Error("API Key not set.");
    
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemma-3n-e2b-it" });
    const result = await model.generateContentStream(prompt);

    for await (const chunk of result.stream) {
        yield chunk.text();
    }
}

// The main function that orchestrates multiple, smaller calls
export async function* generateArticleInSections(data: ArticleData): AsyncGenerator<string> {
    try {
        // --- CALL 1: Generate the Introduction ---
        const introPrompt = `You are a sports journalist. Write an exciting, 1-paragraph introduction for an article about the "${data.name}" event which took place in ${data.location}. Mention it was a great day for snowboarding.`;
        for await (const chunk of callGeminiStream(introPrompt)) {
            yield chunk;
        }
        yield '\n\n';

        // --- ADD A DELAY TO AVOID HITTING RATE LIMITS ---
        await delay(1000); // Wait for 1 second

        // --- CALL 2: Generate the Results Section ---
        const resultsPrompt = `...`; // Your results prompt
        for await (const chunk of callGeminiStream(resultsPrompt)) {
            yield chunk;
        }
        yield '\n\n';

        // --- ADD ANOTHER DELAY ---
        await delay(1000); // Wait for 1 second

        // --- CALL 3: Generate the Conclusion ---
        const conclusionPrompt = `...`; // Your conclusion prompt
        for await (const chunk of callGeminiStream(conclusionPrompt)) {
            yield chunk;
        }

    } catch (error) {
        console.error("Error in generateArticleInSections:", error);
        // We throw the error so the action can catch the specific message
        throw new Error("An error occurred while generating the article."); 
    }
}