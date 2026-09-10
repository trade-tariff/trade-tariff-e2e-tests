const DEFAULT_MAX_ATTEMPTS = 20;
const DEFAULT_INTERVAL_MS = 5_000;

function defaultSleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function waitUntilReady(
  url,
  {
    headers = {},
    maxAttempts = DEFAULT_MAX_ATTEMPTS,
    intervalMs = DEFAULT_INTERVAL_MS,
    fetchImpl = fetch,
    sleep = defaultSleep,
    onAttempt,
  } = {},
) {
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    const startedAt = Date.now();

    try {
      const res = await fetchImpl(url, { headers });

      onAttempt?.({
        attempt,
        maxAttempts,
        url,
        ok: res.ok,
        status: res.status,
        statusText: res.statusText,
        durationMs: Date.now() - startedAt,
        res,
      });

      if (res.ok) {
        return;
      }
    } catch (err) {
      onAttempt?.({
        attempt,
        maxAttempts,
        url,
        ok: false,
        durationMs: Date.now() - startedAt,
        error: err,
      });
    }

    if (attempt < maxAttempts) {
      await sleep(intervalMs);
    }
  }

  throw new Error(`Service at ${url} not ready after ${maxAttempts} attempts`);
}
