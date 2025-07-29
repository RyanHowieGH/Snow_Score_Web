'use client';

import React, { useState, useTransition } from 'react';
import { SparklesIcon } from '@heroicons/react/24/solid';
import { generateEventSummaryAction } from './generate-summary/actions';
import { readStreamableValue } from 'ai/rsc';

export function ArticleGenerator({ eventId }: { eventId: number }) {
    const [article, setArticle] = useState<string>('');
    const [error, setError] = useState<string | null>(null);
    const [isPending, startTransition] = useTransition();

    const handleGenerate = () => {
        setError(null);
        setArticle(''); // Reset to empty string
        
        startTransition(async () => {
            const { articleStream } = await generateEventSummaryAction(eventId);
            
            // Read from the stream and update the state chunk-by-chunk
            for await (const chunk of readStreamableValue(articleStream)) {
                setArticle(prevArticle => prevArticle + chunk);
            }
        });
    };

    return (
        <div className="card bg-base-100 shadow-xl">
            <div className="card-body">
                <h2 className="card-title">AI Event Summary Generator</h2>
                <p className="text-sm opacity-70">
                    Use AI to generate a draft article summarizing the event's results.
                </p>
                <div className="card-actions justify-end mt-4">
                    <button className="btn btn-accent" onClick={handleGenerate} disabled={isPending}>
                        <SparklesIcon className="h-5 w-5 mr-2" />
                        {isPending ? "Generating..." : "Generate Summary"}
                    </button>
                </div>

                {error && <div role="alert" className="alert alert-error mt-4 text-sm"><span>{error}</span></div>}

                {/* The textarea now updates in real-time as the stream comes in */}
                {(isPending || article) && (
                    <div className="mt-4 space-y-4">
                        <textarea 
                            className="textarea textarea-bordered w-full h-96 text-base"
                            value={article}
                            readOnly={isPending} // Make it read-only while generating
                            placeholder="AI is writing..."
                        ></textarea>
                        <button 
                            className="btn btn-sm btn-outline"
                            onClick={() => navigator.clipboard.writeText(article)}
                            disabled={isPending || !article}
                        >
                            Copy to Clipboard
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}