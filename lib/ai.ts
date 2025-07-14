import { GoogleGenerativeAI } from "@google/generative-ai";
import type { ArticleData } from "./definitions";

export async function* generateArticleFromData(data: ArticleData): AsyncGenerator<string> {
    const apiKey = process.env.GOOGLE_GEMINI_API_KEY;
    if (!apiKey) throw new Error("API Key not set.");

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemma-3n-e2b-it" });

    // --- THIS IS THE FIX: More robust data formatting ---
    
    // Create a clean, readable summary of the winners.
    const winnerSummary = data.results.map(result => {
        const winner = result.podium.find(p => p.rank === 1);
        if (winner) {
            return `${winner.first_name} ${winner.last_name || ''} in the ${result.division_name} division`;
        }
        return `the winner of the ${result.division_name} division`; // Fallback
    }).join(', ');

    // Create a clean list of Canadian performers.
    const canadianPerformers = data.top_canadians.map(can => `${can.first_name} ${can.last_name}`).join(', ');

    const simplePrompt = `
        You are a sports journalist for the Alberta Snowboard Association. 
        Write an exciting, 3-paragraph summary article for the "${data.name}" event that took place in${data.location}.

        Key highlights to include:
        - The event was a huge success with great weather.
        - Announce the winners:${winnerSummary}.
        - Give a special mention to the strong performance by Canadian athletes, including${canadianPerformers}.

        Keep the tone enthusiastic and professional. Do not use placeholder text like "[Insert...]" and write a complete article.
        Do not mention any specific tricks or technical details, focus on the overall event and athlete achievements.
        The article should be engaging and suitable for publication on the Alberta Snowboard Association's website.
    `;
    
    try {
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