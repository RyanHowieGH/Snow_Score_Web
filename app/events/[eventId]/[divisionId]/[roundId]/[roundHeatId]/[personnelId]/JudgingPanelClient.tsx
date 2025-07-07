'use client';

import { useState } from 'react';

type JudgingPanelClientProps = {
  judgingPanelPasscode: string;
  eventId: number;
  divisionId: number;
  roundId: number;
  roundHeatId: number;
  personnelId: number;
};

export default function JudgingPanelClient({
  judgingPanelPasscode,
  eventId,
  divisionId,
  roundId,
  roundHeatId,
  personnelId,
}: JudgingPanelClientProps) {
  const [inputCode, setInputCode] = useState('');
  const [verified, setVerified] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputCode === judgingPanelPasscode) {
      setVerified(true);
    } else {
      alert('Invalid passcode');
    }
  };

  if (!verified) {
    return (
      <form onSubmit={handleSubmit} className="p-4 max-w-md mx-auto">
        <label className="block mb-2 text-lg font-semibold">
          Enter Passcode:
        </label>
        <input
          type="password"
          value={inputCode}
          onChange={(e) => setInputCode(e.target.value)}
          className="border px-3 py-2 w-full rounded"
        />
        <button type="submit" className="mt-3 bg-blue-600 text-white px-4 py-2 rounded">
          Verify
        </button>
      </form>
    );
  }

  return (
    <div className="ml-10">
      <h1 className="text-2xl font-bold mt-10 mb-5">
        Data required to make the panel unique:
      </h1>
      <div className="text-xl">
        <div>event_id: {eventId}</div>
        <div>division_id: {divisionId}</div>
        <div>round_id: {roundId}</div>
        <div>round_heat_id: {roundHeatId}</div>
        <div>personnel_id: {personnelId}</div>
      </div>
    </div>
  );
}