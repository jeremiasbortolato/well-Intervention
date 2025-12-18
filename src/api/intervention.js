import { corvaAPI, corvaDataAPI } from '@corva/ui/clients';

/**
 * Normalizes Corva client responses.
 * Some clients return JSON:API payload directly, others wrap it in `{ data: payload }` (axios-like).
 */
function unwrapCorvaResponse(response) {
  const wrapped = response?.data;
  // If the payload is wrapped, it should look like: { data: [...], included: [...] }
  if (wrapped && (Array.isArray(wrapped?.data) || Array.isArray(wrapped?.included))) {
    return wrapped;
  }
  return response;
}

/**
 * Fetches intervention unit events from Corva API v2 endpoint.
 *
 * @async
 * @param {string|number} wellId - The well identifier.
 * @returns {Promise<any>} The fetched intervention unit events data.
 */
export async function fetchInterventionUnitEvents(wellId) {
  if (!wellId) {
    return null;
  }

  try {
    const response = await corvaAPI.get('/v2/intervention_unit_events', {
      fields: 'all',
      order: 'asc',
      per_page: 100,
      sort: 'created_at',
      well_id: wellId,
    });

    return unwrapCorvaResponse(response);
  } catch (error) {
    console.error('Error fetching intervention unit events:', error);
    throw error;
  }
}

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

    if (Array.isArray(response?.results)) {
      return response.results;
    }

    if (Array.isArray(response?.data)) {
      return response.data;
    }

    return Array.isArray(response) ? response : [];
  } catch (error) {
    console.error('Error fetching intervention type goals:', error);
    throw error;
  }
}

/**
 * Fetches well plan data from Corva DATA API.
 * Returns a single record (limit: 1) since estimated_duration is the same across all records.
 *
 * @async
 * @param {Object} params
 * @param {number} params.assetId
 * @param {string} params.eventId
 * @returns {Promise<any[]>}
 */
export async function fetchWellPlanData({ assetId, eventId }) {
  if (!assetId || !eventId) {
    return [];
  }

  try {
    const response = await corvaDataAPI.get('/api/v1/data/corva/interventions.well-plan.data/', {
      limit: 1,
      sort: JSON.stringify({ 'data.report_no': -1 }),
      query: JSON.stringify({
        asset_id: assetId,
        'data.event_id': eventId,
      }),
    });

    if (Array.isArray(response?.results)) {
      return response.results;
    }

    if (Array.isArray(response?.data)) {
      return response.data;
    }

    return Array.isArray(response) ? response : [];
  } catch (error) {
    console.error('Error fetching well plan data:', error);
    throw error;
  }
}

/**
 * Fetches timelog data from Corva DATA API.
 * Returns all records to sum duration values.
 *
 * @async
 * @param {Object} params
 * @param {number} params.assetId
 * @param {string} params.eventId
 * @returns {Promise<any[]>}
 */
export async function fetchTimelogData({ assetId, eventId }) {
  if (!assetId || !eventId) {
    return [];
  }

  try {
    const response = await corvaDataAPI.get('/api/v1/data/corva/interventions.timelog.data/', {
      limit: 500,
      sort: JSON.stringify({ 'data.start_time': 1 }),
      query: JSON.stringify({
        asset_id: assetId,
        'data.event_id': eventId,
      }),
    });

    if (Array.isArray(response?.results)) {
      return response.results;
    }

    if (Array.isArray(response?.data)) {
      return response.data;
    }

    return Array.isArray(response) ? response : [];
  } catch (error) {
    console.error('Error fetching timelog data:', error);
    throw error;
  }
}

/**
 * Fetches NPT events from Corva DATA API.
 * Returns all records to classify by consequence code.
 *
 * @async
 * @param {Object} params
 * @param {number} params.assetId
 * @param {string} params.eventId
 * @returns {Promise<any[]>}
 */
export async function fetchNptEvents({ assetId, eventId }) {
  if (!assetId || !eventId) {
    return [];
  }

  try {
    const response = await corvaDataAPI.get('/api/v1/data/corva/interventions.data.npt-events/', {
      limit: 500,
      sort: JSON.stringify({ 'data.start_time': -1 }),
      query: JSON.stringify({
        asset_id: assetId,
        'data.event_id': eventId,
      }),
    });

    if (Array.isArray(response?.results)) {
      return response.results;
    }

    if (Array.isArray(response?.data)) {
      return response.data;
    }

    return Array.isArray(response) ? response : [];
  } catch (error) {
    console.error('Error fetching NPT events:', error);
    throw error;
  }
}

/**
 * Fetches intervention unit details (and included active well) from Corva API v2.
 * Used to retrieve well attributes like `area` that may not exist in commons context.
 *
 * @async
 * @param {string|number} interventionUnitId
 * @returns {Promise<any>} Raw API response
 */
export async function fetchInterventionUnitWithActiveWell(interventionUnitId) {
  if (!interventionUnitId) {
    return null;
  }

  try {
    // API expects JSON:API-style sparse fieldsets with repeated `fields[]` and `ids[]`.
    // IMPORTANT: the Corva client already serializes arrays as `fields[]=...`,
    // so we must use `fields` (NOT `fields[]`) to avoid generating `fields[][]=...`.
    const response = await corvaAPI.get('/v2/intervention_units', {
      fields: [
        'intervention_unit.name',
        'intervention_unit.type',
        'intervention_unit.active_well',
      ],
      ids: [String(interventionUnitId)],
    });

    return unwrapCorvaResponse(response);
  } catch (error) {
    console.error('Error fetching intervention unit details:', error);
    throw error;
  }
}
