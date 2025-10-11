/**
 * URL Search Parameters Utilities
 * Safe manipulation of URL query parameters
 */

/**
 * Safely patch URLSearchParams with new values
 * - Removes keys with null, undefined, empty string, or "all" values
 * - Sets other values
 */
export function patchSearchParams(
  sp: URLSearchParams,
  patch: Record<string, string | undefined | null>
): URLSearchParams {
  const next = new URLSearchParams(sp);
  
  for (const [key, value] of Object.entries(patch)) {
    if (value == null || value === "" || value === "all") {
      next.delete(key);
    } else {
      next.set(key, value);
    }
  }
  
  return next;
}

/**
 * Get filter value from search params with fallback
 */
export function getFilterParam(
  sp: URLSearchParams,
  key: string,
  defaultValue: string = ""
): string {
  return sp.get(key) || defaultValue;
}

/**
 * Parse age range from filter string
 * Examples: "18-25" -> [18, 25], "46+" -> [46, 999]
 */
export function parseAgeRange(range: string): [number, number] {
  if (range === "18-25") return [18, 25];
  if (range === "26-35") return [26, 35];
  if (range === "36-45") return [36, 45];
  if (range === "46+") return [46, 999];
  return [0, 999];
}

/**
 * Parse height range from filter string
 * Format: "150-160 cm" or "5'0\"-5'5\""
 */
export function parseHeightRange(range: string): [number, number] {
  const match = range.match(/(\d+)-(\d+)/);
  if (match) {
    return [parseInt(match[1]), parseInt(match[2])];
  }
  return [0, 999];
}

/**
 * Parse weight range from filter string
 * Format: "50-60 kg" or "110-130 lbs"
 */
export function parseWeightRange(range: string): [number, number] {
  const match = range.match(/(\d+)-(\d+)/);
  if (match) {
    return [parseInt(match[1]), parseInt(match[2])];
  }
  return [0, 999];
}
