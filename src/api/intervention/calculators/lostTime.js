import { corvaAPI } from '@corva/ui/clients';
import { fetchTimelogData } from '../fetchers/timelog';
import { unwrapCorvaResponse } from '../utils';

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
 *
 * @async
 * @param {Object} params
 * @param {number} params.assetId
 * @param {number} params.startTime - Start timestamp for filtering comments
 * @param {number} params.endTime - End timestamp for filtering comments
 * @param {number} params.topN - Number of top items to return (default: 5)
 * @returns {Promise<Array<{name: string, value: number}>>} Array of {name, value} for treemap
 */
export async function getOperationalLostTime({ assetId, startTime, endTime, topN = 5 }) {
  if (!assetId) {
    return [];
  }

  try {
    // Fetch activities/comments from /v2/activities endpoint
    const response = await corvaAPI.get('/v2/activities', {
      page: 0,
      per_page: 10000,
      assets: [assetId],
      type: ['post'],
      segment: 'drilling',
     
    });

    const responseData = unwrapCorvaResponse(response);
    const activities = Array.isArray(responseData?.data)
      ? responseData.data
      : Array.isArray(responseData)
      ? responseData
      : [];

    // Filter for comments with mainType "Operativo"
    const operationalComments = activities.filter((activity) => {
      const context = activity?.attributes?.context;
      const post = context?.post;
      
      // Filter by asset_id to match the specific asset
      if (post?.asset_id && Number(post.asset_id) !== Number(assetId)) {
        return false;
      }

      // Check if mainType is "Operativo"
      if (post?.data?.mainType !== 'Operativo') {
        return false;
      }

      // Filter by date range if provided
      if (startTime && endTime && post?.timestamp) {
        const commentTimestamp = new Date(post.timestamp).getTime() / 1000; // Convert to unix timestamp
        
        if (commentTimestamp < startTime || commentTimestamp > endTime) {
          return false;
        }
      }

      return true;
    });

    // Group by type.title (Valor) and sum durations
    const groupedByValor = {};

    operationalComments.forEach((activity) => {
      const postData = activity?.attributes?.context?.post?.data;
      if (!postData) return;

      // Extract "Valor" (type.title or type.id if title not available)
      const type = postData.type;
      const valor = type?.title || type?.id;
      if (!valor) return;

      // Extract duration and convert to number
      const durationStr = postData.duration;
      if (!durationStr) return;

      // Parse duration (can be string like "2.5", "0,25", "1,75", "5.25HS", etc.)
      // First, replace comma with dot and remove non-numeric characters except dot
      let cleanedDuration = String(durationStr).replace(',', '.').replace(/[^\d.]/g, '');
      const duration = parseFloat(cleanedDuration);
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

