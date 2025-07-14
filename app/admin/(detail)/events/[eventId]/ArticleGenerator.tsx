'use client';

import React, { useState, useTransition } from 'react';
import { SparklesIcon } from '@heroicons/react/24/solid';
import { generateEventSummaryAction } from './generate-summary/actions';

export function ArticleGenerator({ eventId }: { eventId: number }) {
    const [article, setArticle] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [isPending, startTransition] = useTransition();

    const handleGenerate = () => {
        setError(null);
        setArticle(null);
        startTransition(async () => {
            const result = await generateEventSummaryAction(eventId);
            if (result.success && result.article) {
                setArticle(result.article);
            } else {
                setError(result.error || "An unknown error occurred.");
            }
        });
    };

    return (
        <div className="card bg-base-100 shadow-xl">
            <div className="card-body">
                <h2 className="card-title">AI Event Summary Generator</h2>
                <p className="text-sm opacity-70">
                    Use AI to generate a draft article summarizing the event's results. Review and edit the text before publishing.
                </p>
                <div className="card-actions justify-end mt-4">
                    <button className="btn btn-accent" onClick={handleGenerate} disabled={isPending}>
                        <SparklesIcon className="h-5 w-5 mr-2" />
                        {isPending ? "Generating..." : "Generate Summary"}
                    </button>
                </div>

                {isPending && <div className="text-center py-4"><span className="loading loading-spinner"></span></div>}
                
                {error && <div role="alert" className="alert alert-error mt-4 text-sm"><span>{error}</span></div>}

                {article && (
                    <div className="mt-4 space-y-4">
                        <textarea 
                            className="textarea textarea-bordered w-full h-96 text-base"
                            value={article}
                            onChange={(e) => setArticle(e.target.value)}
                        ></textarea>
                        <button 
                            className="btn btn-sm btn-outline"
                            onClick={() => navigator.clipboard.writeText(article)}
                        >
                            Copy to Clipboard
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}