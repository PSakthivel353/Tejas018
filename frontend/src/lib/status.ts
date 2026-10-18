// Tracks, per endpoint, whether the last call hit the real backend or fell back to demo data.
// The navbar badge reads this, so the team can see which endpoints are not wired up yet.

type Source = "api" | "mock";

const endpoints = new Map<string, Source>();
const listeners = new Set<() => void>();
let version = 0;

export function markSource(endpoint: string, source: Source) {
  if (endpoints.get(endpoint) === source) return;
  endpoints.set(endpoint, source);
  version += 1;
  listeners.forEach((l) => l());
}

export function subscribeStatus(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

/** A primitive snapshot, so useSyncExternalStore does not re-render in a loop. */
export const getStatusVersion = () => version;

export function getStatus() {
  const mock: string[] = [];
  let api = 0;
  endpoints.forEach((source, endpoint) => {
    if (source === "mock") mock.push(endpoint);
    else api += 1;
  });
  return { api, mock };
}
