export type ScoreSubmission = {
  round_heat_id: number;
  run_num: number;
  personnel_id: number;
  score: number;
  athlete_id: number;
  bib: number;
};

const STORAGE_KEY = "scoreSubmissionQueue";

function readQueue(): ScoreSubmission[] {
  if (typeof window === "undefined") return [];
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? (JSON.parse(stored) as ScoreSubmission[]) : [];
  } catch (err) {
    console.error("Failed to read offline queue", err);
    return [];
  }
}

function writeQueue(queue: ScoreSubmission[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(queue));
  } catch (err) {
    console.error("Failed to write offline queue", err);
  }
}

export function enqueueScoreSubmission(action: ScoreSubmission) {
  const queue = readQueue();
  queue.push(action);
  writeQueue(queue);
}

// Flush queued submissions when online. Returns number of successfully processed actions.
export async function flushScoreQueue(): Promise<number> {
  if (typeof window === "undefined" || !navigator.onLine) return 0;

  const queue = readQueue();
  let processed = 0;

  while (queue.length > 0) {
    const action = queue[0];
    try {
      const response = await fetch("/api/scores-dj18dh12gpdi1yd89178tsadji1289", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(action),
      });
      
      if (response.ok){
        console.log(`CACHED SCORE SUBMISSION: score of ${action?.score} to the run ${action?.run_num} for the athlete (BIB) ${action?.bib}`);
      }

      if (!response.ok) {
        // Stop processing if server returns error
        break;
      }
      queue.shift();
      processed += 1;
    } catch (err) {
      console.error("Failed to submit queued score", err);
      break;
    }
  }

  writeQueue(queue);
  return processed;
}
