'use server';

import { generateArticleFromData } from '@/lib/ai'; // Correct import
import { fetchEventResultsForArticle } from '@/lib/data';
import { getAuthenticatedUserWithRole } from '@/lib/auth/user';
import { createStreamableValue } from 'ai/rsc';

export async function generateEventSummaryAction(eventId: number) {
    const stream = createStreamableValue('');

    (async () => {
        try {
            await getAuthenticatedUserWithRole();
            const articleData = await fetchEventResultsForArticle(eventId);
            if (!articleData) throw new Error("Could not find event data.");

            // Call the single, correct function
            const articleStream = generateArticleFromData(articleData);

            for await (const chunk of articleStream) {
                stream.update(chunk);
            }
        } catch (error) {
            const message = error instanceof Error ? error.message : "An unknown error occurred.";
            stream.error(message);
        } finally {
            stream.done();
        }
    })();

    return { articleStream: stream.value };
}