import { corvaAPI } from '@corva/ui/clients';
import { fetchTimelogData } from '../fetchers/timelog';
import { unwrapCorvaResponse } from '../utils';

/**
 * Parses a duration string in various formats and returns the value in hours.
 *
 * Supported formats:
 *   - "2", "8.5", "3.25"          → plain number (already in hours)
 *   - "3,25", "1,75"              → comma as decimal separator
 *   - "00:45 hs", "01:30 hs"     → HH:MM (with optional suffix like "hs")
 *   - "00:45", "1:30"             → HH:MM without suffix
 *   - "5.25HS", "2,5 HS"         → number with trailing text
 *
 * @param {string} raw - The raw duration string
 * @returns {number} Duration in hours (NaN if unparseable)
 */
function parseDurationToHours(raw) {
  if (!raw) return NaN;
  const trimmed = raw.trim();

  // Detect HH:MM format (e.g. "00:45 hs", "1:30", "02:15hs")
  const hhmmMatch = trimmed.match(/^(\d{1,2}):(\d{2})\s*(?:hs)?\.?\s*$/i);
  if (hhmmMatch) {
    const hours = parseInt(hhmmMatch[1], 10);
    const minutes = parseInt(hhmmMatch[2], 10);
    return hours + minutes / 60;
  }

  // Otherwise treat as a decimal number:
  // Replace comma with dot, strip non-numeric chars except dot
  const cleaned = trimmed.replace(',', '.').replace(/[^\d.]/g, '');
  return parseFloat(cleaned);
}

/**
 * Gets TNP (Tiempo No Productivo) events grouped by op_subcode with total duration for each.
 * Returns array sorted by duration (highest first), limited to topN.
 * Uses timelog data filtered by sub_code_5 === "TNP".
 *
 * @async
 * @param {Object} params
 * @param {number} params.assetId
 * @param {string} params.eventId
 * @param {number} params.topN - Number of top items to return (default: 5)
 * @returns {Promise<Array<{name: string, value: number}>>} Array of {name, value} for treemap
 */
export async function getTNPByOpSubcode({ assetId, eventId, topN = 5 }) {
  if (!assetId || !eventId) {
    return [];
  }

  try {
    const timelogData = await fetchTimelogData({ assetId, eventId });

    // Filter for TNP records only
    const tnpRecords = timelogData.filter((rec) => rec.data?.sub_code_5 === 'TNP');

    // Group by op_subcode and sum durations
    const subcodeMap = {};
    tnpRecords.forEach((rec) => {
      const opSubcode = rec.data?.op_subcode;
      const opSubcodeDesc = rec.data?.op_subcode_desc;
      const duration = rec.data?.duration || 0;

      if (!opSubcode || !duration) {
        return;
      }

      // Use description as the key, fallback to code if no description
      const key = opSubcodeDesc || opSubcode;

      if (!subcodeMap[key]) {
        subcodeMap[key] = 0;
      }
      subcodeMap[key] += duration;
    });

    // Convert to array and sort by duration (highest first)
    const result = Object.entries(subcodeMap)
      .map(([name, value]) => ({
        name,
        value: Number(value.toFixed(2)),
      }))
      .sort((a, b) => b.value - a.value)
      .slice(0, topN);

    return result;
  } catch (error) {
    console.error('Error getting TNP by op_subcode:', error);
    return [];
  }
}

/**
 * Gets operational lost time (Tiempo perdido Operativo) grouped by "Valor" (type.title)
 * with mainType "Operativo".
 * Returns top N entries sorted by duration (highest first).
 * Fetches ALL activities for the asset without date filtering, matching DvA app behavior.
 *
 * @async
 * @param {Object} params
 * @param {number} params.assetId
 * @param {number} params.topN - Number of top items to return (default: 5)
 * @returns {Promise<Array<{name: string, value: number}>>} Array of {name, value} for treemap
 */
export async function getOperationalLostTime({ assetId, topN = 5 }) {
  if (!assetId) {
    return [];
  }

  try {
    // Fetch activities/comments from /v2/activities endpoint
    // Include both 'post' and 'traces_memo' types to match DvA app behavior
    const response = await corvaAPI.get('/v2/activities', {
      page: 0,
      per_page: 10000,
      assets: [assetId],
      type: ['post', 'traces_memo'],
      segment: 'drilling',
    });

    const responseData = unwrapCorvaResponse(response);
    const activities = Array.isArray(responseData?.data)
      ? responseData.data
      : Array.isArray(responseData)
      ? responseData
      : [];

    /**
     * Extracts the post/memo data payload from an activity, regardless of type.
     * - For "post" activities: context.post
     * - For "traces_memo" activities: context.traces_memo
     * Returns { payload, data } where payload is the top-level context entry
     * and data is the nested .data object with mainType, duration, type, etc.
     */
    const getActivityPayload = (activity) => {
      const activityType = activity?.attributes?.type;
      const context = activity?.attributes?.context;

      if (activityType === 'post' && context?.post) {
        return { payload: context.post, data: context.post.data };
      }
      if (activityType === 'traces_memo' && context?.traces_memo) {
        return { payload: context.traces_memo, data: context.traces_memo.data };
      }
      return { payload: null, data: null };
    };

    // Filter for activities with mainType "Operativo"
    const operationalComments = activities.filter((activity) => {
      const { payload, data } = getActivityPayload(activity);
      if (!payload || !data) return false;

      // Filter by asset_id to match the specific asset
      if (payload.asset_id && Number(payload.asset_id) !== Number(assetId)) {
        return false;
      }

      // Check if mainType is "Operativo"
      if (data.mainType !== 'Operativo') {
        return false;
      }

      return true;
    });

    // Group by type.title (Valor) and sum durations
    const groupedByValor = {};

    operationalComments.forEach((activity) => {
      const { data: postData } = getActivityPayload(activity);
      if (!postData) return;

      // Extract "Valor" (type.title or type.id if title not available)
      const type = postData.type;
      const valor = type?.title || type?.id;
      if (!valor) return;

      // Extract duration and convert to number (in hours)
      const durationStr = postData.duration;
      if (!durationStr) return;

      const duration = parseDurationToHours(String(durationStr));
      if (isNaN(duration) || duration <= 0) return;

      // Sum durations by valor
      if (!groupedByValor[valor]) {
        groupedByValor[valor] = 0;
      }
      groupedByValor[valor] += duration;
    });

    // Convert to array and sort by duration (highest first)
    const result = Object.entries(groupedByValor)
      .map(([name, value]) => ({
        name,
        value: Number(value.toFixed(2)),
      }))
      .sort((a, b) => b.value - a.value)
      .slice(0, topN);

    return result;
  } catch (error) {
    console.error('Error getting operational lost time:', error);
    return [];
  }
}

