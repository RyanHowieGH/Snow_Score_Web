'use client';

import { useTransition } from 'react';
import { toggleEventStatusAction } from '@/app/admin/(detail)/events/[eventId]/actions';

export default function PublishEventButton({
  eventId,
  currentStatus,
}: {
  eventId: number;
  currentStatus: 'Active' | 'Inactive';
}) {
  const [isPending, startTransition] = useTransition();
  const isActive = currentStatus === 'Active';

  const handleToggle = () => {
    const actionWord = isActive ? 'deactivate' : 'activate';
    const confirmMsg = `Are you sure you want to ${actionWord} this event?`;
    if (confirm(confirmMsg)) {
      startTransition(async () => {
        const result = await toggleEventStatusAction(eventId, currentStatus);
        if (result.success) {
          alert(result.message); // Replace with toast notification if desired
          // Optionally: window.location.reload();
        } else {
          alert(`Error: ${result.message}`);
        }
      });
    }
  };

  return (
    <button
      onClick={handleToggle}
      className={`btn ${isActive ? 'btn-warning' : 'btn-success'} btn-lg`}
      disabled={isPending}
    >
      {isPending ? (
        <>
          <span className="loading loading-spinner"></span>
          {isActive ? 'Deactivating...' : 'Activating...'}
        </>
      ) : (
        isActive ? 'Deactivate Event' : 'Activate Event'
      )}
    </button>
  );
}

// 'use client';

// import { useTransition } from 'react';
// import { toggleEventStatusAction } from '@/app/admin/(detail)/events/[eventId]/actions';

// export default function PublishEventButton({ eventId }: { eventId: number }) {
//   const [isPending, startTransition] = useTransition();

//   const handlePublish = () => {
//     if (confirm("Are you sure you want to publish this event? This will make it visible to the public.")) {
//       startTransition(async () => {
//         const result = await toggleEventStatusAction(eventId);
//         if (result.success) {
//           alert(result.message); // Or use a more sophisticated toast notification
//         } else {
//           alert(`Error: ${result.message}`);
//         }
//       });
//     }
//   };

//   return (
//     <button
//       onClick={handlePublish}
//       className="btn btn-success btn-lg"
//       disabled={isPending}
//     >
//       {isPending ? (
//         <>
//           <span className="loading loading-spinner"></span>
//           Publishing...
//         </>
//       ) : (
//         'Publish Event'
//       )}
//     </button>
//   );
// }