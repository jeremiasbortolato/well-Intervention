import { corvaDataAPI } from '@corva/ui/clients';
import { extractResults } from '../utils';

/**
 * Fetches intervention type goals from Corva DATA API.
 *
 * @async
 * @param {Object} params
 * @param {number} params.companyId
 * @param {string} params.provider
 * @param {string} params.dataset
 * @returns {Promise<any[]>}
 */
export async function fetchInterventionTypeGoals({ companyId, provider, dataset }) {
  if (!companyId || !provider || !dataset) {
    return [];
  }

  try {
    const response = await corvaDataAPI.get(`/api/v1/data/${provider}/${dataset}/`, {
      limit: 100,
      sort: JSON.stringify({ 'data.operation_type': 1 }),
      query: JSON.stringify({ company_id: companyId }),
    });

    return extractResults(response);
  } catch (error) {
    console.error('Error fetching intervention type goals:', error);
    throw error;
  }
}

/**
 * Fetches tripping speed goals from ypf#interventions.tripping-speed-goals collection.
 *
 * @async
 * @param {Object} params
 * @param {number} params.companyId - Company ID (default: 375)
 * @returns {Promise<any[]>}
 */
export async function fetchTrippingSpeedGoals({ companyId = 375 }) {
  try {
    console.log('[Performance] Fetching tripping speed goals for companyId:', companyId);
    const response = await corvaDataAPI.get('/api/v1/data/ypf/interventions.tripping-speed-goals/', {
      limit: 100,
      query: JSON.stringify({ company_id: companyId }),
      sort: JSON.stringify({ 'data.code': 1 }), // Required parameter
    });

    console.log('[Performance] Tripping speed goals response:', response);

    if (Array.isArray(response?.results)) {
      console.log('[Performance] Found', response.results.length, 'goals in results');
      return response.results;
    }

    if (Array.isArray(response?.data)) {
      console.log('[Performance] Found', response.data.length, 'goals in data');
      return response.data;
    }

    const result = Array.isArray(response) ? response : [];
    console.log('[Performance] Returning', result.length, 'goals (direct array or empty)');
    return result;
  } catch (error) {
    console.error('[Performance] Error fetching tripping speed goals:', error);
    return [];
  }
}

/**
 * Gets intervention type (ypf_name) for a given well by matching operation with intervention.type.goals.
 * Mirrors KPIs app logic.
 *
 * @async
 * @param {Object} params
 * @param {number} params.wellId
 * @param {number} params.companyId
 * @param {string} params.provider
 * @param {string} params.dataset
 * @returns {Promise<string|null>} Intervention type ypf_name (e.g., 'FALLA', 'BIF', 'BES') or null
 */
export async function getInterventionType({ wellId, companyId, provider, dataset }) {
  const { fetchInterventionUnitEvents } = await import('./events');
  
  if (!wellId || !companyId || !provider || !dataset) {
    return null;
  }

  try {
    const eventsResponse = await fetchInterventionUnitEvents(wellId);
    const eventsArray = Array.isArray(eventsResponse?.data)
      ? eventsResponse.data
      : Array.isArray(eventsResponse)
      ? eventsResponse
      : [];

    if (!eventsArray.length) {
      return null;
    }

    const firstEvent = eventsArray[0];
    const operation = firstEvent?.attributes?.operation || firstEvent?.operation;

    if (!operation) {
      return null;
    }

    const typeGoals = await fetchInterventionTypeGoals({ companyId, provider, dataset });

    const matchingType = typeGoals.find((rec) => rec?.data?.operation_type === operation);

    if (!matchingType || !matchingType.data?.ypf_name) {
      return null;
    }

    return String(matchingType.data.ypf_name).trim();
  } catch (error) {
    console.error('Error getting intervention type:', error);
    return null;
  }
}

