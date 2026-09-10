const TRANSIENT_STATUSES = [502, 503, 504];
const DEFAULT_MAX_ATTEMPTS = 4;
const DEFAULT_DELAY_MS = 1_000;

// Absorbs brief 5xx blips (e.g. an ALB target draining mid-deploy) within a
// single test, without masking a genuinely broken or missing endpoint.
export async function retryOnTransientStatus(
  attempt,
  {
    maxAttempts = DEFAULT_MAX_ATTEMPTS,
    delayMs = DEFAULT_DELAY_MS,
    transientStatuses = TRANSIENT_STATUSES,
  } = {},
) {
  for (let attemptNumber = 1; attemptNumber <= maxAttempts; attemptNumber++) {
    try {
      return await attempt();
    } catch (err) {
      const isTransient = transientStatuses.includes(err.status);
      const attemptsRemaining = attemptNumber < maxAttempts;

      if (!isTransient || !attemptsRemaining) {
        throw err;
      }

      await new Promise((resolve) => setTimeout(resolve, delayMs));
    }
  }
}
