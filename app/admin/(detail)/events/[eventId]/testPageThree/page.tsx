"use client"

import { useEffect, useState } from 'react';

export default function HomePage() {
  const [time, setTime] = useState<Date | null>(null);

  useEffect(() => {
    // this runs only in the browser
    const now = new Date();
    setTime(now);
  }, []);

  return (
    <div>
      <h1>Current Time (client-side):</h1>
      {time ? (
        <p>{time.toLocaleTimeString()}</p>
      ) : (
        <p>Loading…</p>
      )}
    </div>
  );
}
