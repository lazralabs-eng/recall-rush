// Daily seed utilities for deterministic shuffle

/**
 * Get current UTC day as "YYYY-MM-DD"
 * Dev override: ?day=YYYY-MM-DD
 */
export function getUtcDayKey(): string {
  // Dev override from URL
  if (typeof window !== "undefined") {
    const params = new URLSearchParams(window.location.search);
    const override = params.get("day");
    if (override && /^\d{4}-\d{2}-\d{2}$/.test(override)) {
      return override;
    }
  }

  const now = new Date();
  const year = now.getUTCFullYear();
  const month = String(now.getUTCMonth() + 1).padStart(2, "0");
  const day = String(now.getUTCDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

/**
 * Simple hash function to convert string to seed number
 */
export function hashStringToSeed(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return Math.abs(hash);
}

/**
 * Get daily seed for a deck (deterministic per day)
 * Dev override: ?seed=NUMBER
 */
export function dailySeed(deckId: string): number {
  // Dev override from URL
  if (typeof window !== "undefined") {
    const params = new URLSearchParams(window.location.search);
    const override = params.get("seed");
    if (override) {
      const seedNum = parseInt(override, 10);
      if (!isNaN(seedNum)) {
        return seedNum;
      }
    }
  }

  const dayKey = getUtcDayKey();
  return hashStringToSeed(`${deckId}|${dayKey}`);
}

/**
 * Check if dev overrides are active
 */
export function hasDevOverrides(): boolean {
  if (typeof window === "undefined") return false;
  const params = new URLSearchParams(window.location.search);
  return params.has("day") || params.has("seed");
}

/**
 * Get dev override info for display
 */
export function getDevOverrideInfo(): string | null {
  if (!hasDevOverrides()) return null;
  const params = new URLSearchParams(window.location.search);
  const day = params.get("day");
  const seed = params.get("seed");

  const parts = [];
  if (day) parts.push(`day=${day}`);
  if (seed) parts.push(`seed=${seed}`);

  return parts.length > 0 ? `Dev: ${parts.join(", ")}` : null;
}

/**
 * Mulberry32 PRNG - fast and good enough for our use case
 * Returns a function that generates random numbers [0, 1)
 */
export function mulberry32(seed: number): () => number {
  return function () {
    let t = (seed += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * Shuffle array using seeded PRNG (Fisher-Yates)
 */
export function seededShuffle<T>(arr: T[], seed: number): T[] {
  const result = [...arr];
  const rng = mulberry32(seed);

  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }

  return result;
}
