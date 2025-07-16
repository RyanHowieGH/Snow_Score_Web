// tests/spectator-read-test-secret-header.js

import http from 'k6/http';
import { sleep, check } from 'k6';

// This is the secret string from your .env.local file
const testSecret = "a-very-secret-string-that-is-hard-to-guess";

// ... (setup your test data, e.g., roundHeatIds, personnelIds)
const roundHeatIds = [2, 3, 4, 5, 7, 8, 9, 10, 11, 12];
const defaultJudgeId = 1001;

export const options = {
  vus: 100,
  duration: '1m',
};

export default function () {
  // Define the headers for the request
  const params = {
    headers: {
      // [K6-TEST] This is the special header your middleware is looking for
      'X-K6-Test-Secret': testSecret,
    },
  };

  const randomHeatId = roundHeatIds[Math.floor(Math.random() * roundHeatIds.length)];
  const targetUrl = `http://localhost:3000/api/athletes-and-score?round_heat_id=${randomHeatId}&personnel_id=${defaultJudgeId}`;

  // Pass the headers object as the second argument to http.get
  const res = http.get(targetUrl, params);

  check(res, {
    'status is 200': (r) => r.status === 200,
  });

  sleep(Math.random() * 5 + 2);
}