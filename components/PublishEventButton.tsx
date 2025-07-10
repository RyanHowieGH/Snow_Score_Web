'use client';

import { useTransition } from 'react';
import { publishEventAction } from '@/app/admin/(detail)/events/[eventId]/actions';

export default function PublishEventButton({ eventId }: { eventId: number }) {
  const [isPending, startTransition] = useTransition();

  const handlePublish = () => {
    if (confirm("Are you sure you want to publish this event? This will make it visible to the public.")) {
      startTransition(async () => {
        const result = await publishEventAction(eventId);
        if (result.success) {
          alert(result.message); // Or use a more sophisticated toast notification
        } else {
          alert(`Error: ${result.message}`);
        }
      });
    }
  };

  return (
    <button
      onClick={handlePublish}
      className="btn btn-success btn-lg"
      disabled={isPending}
    >
      {isPending ? (
        <>
          <span className="loading loading-spinner"></span>
          Publishing...
        </>
      ) : (
        'Publish Event'
      )}
    </button>
  );
}