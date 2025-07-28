// components/EventStatusBadge.tsx
import React from 'react';
import { getEventState } from '@/lib/utils';
import { ClockIcon, CheckCircleIcon, CalendarIcon, XCircleIcon } from '@heroicons/react/24/outline';

interface EventStatusBadgeProps {
  startDate: Date;
  endDate: Date;
  status?: string; // Database status field
  size?: 'xs' | 'sm' | 'md' | 'lg';
}

export default function EventStatusBadge({ startDate, endDate, status, size = 'md' }: EventStatusBadgeProps) {
  const eventState = getEventState(startDate, endDate);

  const getBadgeProps = () => {
    // If the event is Inactive in the database, show that regardless of date
    if (status === 'Inactive') {
      return {
        text: 'Inactive',
        className: 'badge-error',
        icon: <XCircleIcon className="h-4 w-4 mr-1.5" />
      };
    }

    // For Active events, show date-based status
    switch (eventState) {
      case 'ONGOING':
        return {
          text: 'Live Now',
          className: 'badge-success',
          icon: <ClockIcon className="h-4 w-4 mr-1.5" />
        };
      case 'COMPLETE':
        return {
          text: 'Complete',
          className: 'badge-primary',
          icon: <CheckCircleIcon className="h-4 w-4 mr-1.5" />
        };
      case 'UPCOMING':
      default:
        return {
          text: 'Upcoming',
          className: 'badge-info',
          icon: <CalendarIcon className="h-4 w-4 mr-1.5" />
        };
    }
  };

  const badge = getBadgeProps();

  return (
    <div className={`badge ${badge.className} badge-lg gap-2`}>
      {badge.icon}
      {badge.text}
    </div>
  );
}