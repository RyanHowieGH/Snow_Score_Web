import { GoogleGenerativeAI } from "@google/generative-ai";
import type { ArticleData } from "./definitions";

// This function takes the structured data and generates the article using Google Gemini
export async function* streamArticleFromData(data: ArticleData): AsyncGenerator<string, void, undefined> {
    const apiKey = process.env.GOOGLE_GEMINI_API_KEY;
    if (!apiKey) throw new Error("Google Gemini API key not set.");

    // --- PROMPT ENGINEERING (Remains the same) ---
    // We give the AI a role, context, and a clear task.
    // The prompt is slightly adjusted for clarity, but the core request is identical.
    const prompt = `
        You are an enthusiastic and professional sports journalist for the Alberta Snowboard Association.
        Your task is to write an engaging summary article about the "${data.name}" snowboarding event.

        **Event Details:**
        - **Event Name:** ${data.name}
        - **Location:** ${data.location}
        - **Dates:** ${data.start_date.toLocaleDateString()} to ${data.end_date.toLocaleDateString()}
        - **Discipline:** ${data.discipline_name}

        **Article Requirements:**
        1. Start with an exciting introduction that captures the energy of the event.
        2. Provide a breakdown of the results for each division, announcing the podium winners (1st, 2nd, 3rd).
        3. Conclude with a celebratory shout-out to the top-performing Canadian athletes.
        4. Maintain a professional, celebratory, and engaging tone throughout.

        **Results Data:**
        ${data.results.map(res => `
        - **${res.division_name} Division:**
          - 1st Place: ${res.podium.find(p => p.rank === 1)?.first_name} ${res.podium.find(p => p.rank === 1)?.last_name || ''}
          - 2nd Place: ${res.podium.find(p => p.rank === 2)?.first_name} ${res.podium.find(p => p.rank === 2)?.last_name || ''}
          - 3rd Place: ${res.podium.find(p => p.rank === 3)?.first_name} ${res.podium.find(p => p.rank === 3)?.last_name || ''}
        `).join('')}

        **Top Canadian Performers to Highlight:**
        ${data.top_canadians.map(can => `- ${can.first_name} ${can.last_name}`).join('\n')}

        Now, please generate the full article based on this information.
    `;

    try {
        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({ model: "gemma-3n-e2b-it" });

        // Use generateContentStream instead of generateContent
        const result = await model.generateContentStream(prompt);

        // Yield each chunk of text as it arrives from the stream
        for await (const chunk of result.stream) {
            yield chunk.text();
        }
    } catch (error) {
        console.error("Error calling Google Gemini Streaming Service:", error);
        throw new Error("Failed to communicate with the Google AI service for streaming.");
    }
}