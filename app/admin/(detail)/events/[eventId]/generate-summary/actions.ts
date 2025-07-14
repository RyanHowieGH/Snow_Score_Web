'use server';

import { fetchEventResultsForArticle } from '@/lib/data';
import { getAuthenticatedUserWithRole } from '@/lib/auth/user';
import { createStreamableValue } from 'ai/rsc';
import { generateArticleInSections } from '@/lib/ai';

export async function generateEventSummaryAction(eventId: number) {
    // createStreamableValue is a utility from the Vercel AI SDK that helps manage the stream.
    const stream = createStreamableValue('');

    (async () => {
        try {
            await getAuthenticatedUserWithRole(); // Authorization
            const articleData = await fetchEventResultsForArticle(eventId);
            if (!articleData) throw new Error("Could not find event data.");

            // Get the stream from the AI service
            const articleStream = generateArticleInSections(articleData);

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