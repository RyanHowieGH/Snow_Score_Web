import { GoogleGenerativeAI } from "@google/generative-ai";
import type { ArticleData } from "./definitions";

// Helper function for a single AI call
async function* callGeminiStream(prompt: string): AsyncGenerator<string> {
    const apiKey = process.env.GOOGLE_GEMINI_API_KEY;
    if (!apiKey) throw new Error("API Key not set.");
    
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemma-2b-it" });
    const result = await model.generateContentStream(prompt);

    for await (const chunk of result.stream) {
        yield chunk.text();
    }
}

// The new main function that orchestrates multiple, smaller calls
export async function* generateArticleInSections(data: ArticleData): AsyncGenerator<string> {
    try {
        // --- CALL 1: Generate the Introduction ---
        const introPrompt = `You are a sports journalist. Write an exciting, 1-paragraph introduction for an article about the "${data.name}" event which took place in ${data.location}. Mention it was a great day for snowboarding.`;
        for await (const chunk of callGeminiStream(introPrompt)) {
            yield chunk;
        }
        yield '\n\n'; // Add spacing

        // --- CALL 2: Generate the Results Section ---
        const resultsPrompt = `
            Continue the article by summarizing the results. Announce the podium winners for each division.
            Results Data:
            ${data.results.map(res => `
            - **${res.division_name} Division:**
              - 1st Place: ${res.podium.find(p => p.rank === 1)?.first_name} ${res.podium.find(p => p.rank === 1)?.last_name || ''}
              - 2nd Place: ${res.podium.find(p => p.rank === 2)?.first_name} ${res.podium.find(p => p.rank === 2)?.last_name || ''}
              - 3rd Place: ${res.podium.find(p => p.rank === 3)?.first_name} ${res.podium.find(p => p.rank === 3)?.last_name || ''}
            `).join('')}
        `;
        for await (const chunk of callGeminiStream(resultsPrompt)) {
            yield chunk;
        }
        yield '\n\n';

        // --- CALL 3: Generate the Conclusion ---
        const conclusionPrompt = `
            Conclude the article with a celebratory 1-paragraph shout-out to the top Canadian performers: 
            ${data.top_canadians.map(can => `- ${can.first_name} ${can.last_name}`).join('\n')}
            End on a high note about the future of snowboarding in Alberta.
        `;
        for await (const chunk of callGeminiStream(conclusionPrompt)) {
            yield chunk;
        }

    } catch (error) {
        console.error("Error in generateArticleInSections:", error);
        yield "An error occurred while generating the article.";
    }
}