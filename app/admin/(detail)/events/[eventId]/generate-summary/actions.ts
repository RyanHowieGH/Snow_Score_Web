'use server';

import { fetchEventResultsForArticle } from '@/lib/data';
import { generateArticleFromData } from '@/lib/ai';
import { getAuthenticatedUserWithRole } from '@/lib/auth/user';

export async function generateEventSummaryAction(eventId: number): Promise<{ success: boolean; article?: string; error?: string; }> {
    try {
        // 1. Authorization
        const user = await getAuthenticatedUserWithRole();
        if (!user || !['Executive Director', 'Administrator'].includes(user.roleName)) {
            return { success: false, error: "Unauthorized." };
        }

        // 2. Fetch Data
        const articleData = await fetchEventResultsForArticle(eventId);
        if (!articleData) {
            return { success: false, error: "Could not find event data or results." };
        }

        // 3. Generate Article
        const generatedArticle = await generateArticleFromData(articleData);

        return { success: true, article: generatedArticle };

    } catch (error) {
        const message = error instanceof Error ? error.message : "An unknown error occurred.";
        return { success: false, error: message };
    }
}