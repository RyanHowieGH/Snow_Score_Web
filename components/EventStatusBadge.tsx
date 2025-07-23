// components/EventStatusBadge.tsx
import React from 'react';
import { getEventState } from '@/lib/utils';
import { ClockIcon, CheckCircleIcon, CalendarIcon } from '@heroicons/react/24/outline';

interface EventStatusBadgeProps {
  startDate: Date;
  endDate: Date;
  size?: 'xs' | 'sm' | 'md' | 'lg'; // Add the optional size prop

  // You can add size props for flexibility later, e.g., size: 'sm' | 'md'
}

export default function EventStatusBadge({ startDate, endDate, size = 'md' }: EventStatusBadgeProps) {
  const eventState = getEventState(startDate, endDate);

  const getBadgeProps = () => {
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