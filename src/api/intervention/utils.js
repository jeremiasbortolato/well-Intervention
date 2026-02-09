/**
 * Normalizes Corva client responses.
 * Some clients return JSON:API payload directly, others wrap it in `{ data: payload }` (axios-like).
 */
export function unwrapCorvaResponse(response) {
  const wrapped = response?.data;
  // If the payload is wrapped, it should look like: { data: [...], included: [...] }
  if (wrapped && (Array.isArray(wrapped?.data) || Array.isArray(wrapped?.included))) {
    return wrapped;
  }
  return response;
}

/**
 * Extracts results array from various response formats.
 */
export function extractResults(response) {
  if (Array.isArray(response?.results)) return response.results;
  if (Array.isArray(response?.data)) return response.data;
  return Array.isArray(response) ? response : [];
}

/**
 * Converts various timestamp formats to Date object.
 */
export function toDate(value) {
  if (!value) return null;
  if (value instanceof Date) return value;
  if (typeof value === 'string') {
    const parsedMs = Date.parse(value);
    if (!Number.isNaN(parsedMs)) return new Date(parsedMs);
    const asNumber = Number(value);
    if (Number.isFinite(asNumber)) {
      return new Date(asNumber > 1e12 ? asNumber : asNumber * 1000);
    }
    return null;
  }
  if (typeof value === 'number') {
    return new Date(value > 1e12 ? value : value * 1000);
  }
  return null;
}

/**
 * Converts Date to Unix timestamp in seconds.
 */
export function toUnixSeconds(date) {
  if (!(date instanceof Date)) return null;
  const ms = date.getTime();
  return Number.isFinite(ms) ? Math.floor(ms / 1000) : null;
}

