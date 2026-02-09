import { corvaDataAPI } from '@corva/ui/clients';
import { extractResults } from '../utils';

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
  if (!assetId) {
    return [];
  }

  try {
    if (eventId) {
      const response = await corvaDataAPI.get('/api/v1/data/corva/interventions.timelog.data/', {
        limit: 500,
        sort: JSON.stringify({ 'data.start_time': 1 }),
        query: JSON.stringify({
          asset_id: assetId,
          'data.event_id': eventId,
        }),
      });

      const results = extractResults(response);
      if (results.length) {
        return results;
      }
    }

    // Fallback: if event_id didn't return data (common on open wells),
    // fetch latest records by timestamp and use the most recent event_id.
    const fallbackResponse = await corvaDataAPI.get(
      '/api/v1/data/corva/interventions.timelog.data/',
      {
        limit: 500,
        sort: JSON.stringify({ timestamp: -1 }),
        query: JSON.stringify({
          asset_id: assetId,
        }),
      }
    );

    const fallbackResults = extractResults(fallbackResponse);
    if (!fallbackResults.length) return [];

    let latestEventId = null;
    for (const item of fallbackResults) {
      const currentEventId = item?.data?.event_id;
      if (currentEventId) {
        latestEventId = currentEventId;
        break;
      }
    }

    if (!latestEventId) {
      return fallbackResults;
    }

    const filtered = fallbackResults.filter((item) => item?.data?.event_id === latestEventId);
    return filtered.length ? filtered : fallbackResults;
  } catch (error) {
    console.error('Error fetching timelog data:', error);
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

    return extractResults(response);
  } catch (error) {
    console.error('Error fetching well plan data:', error);
    throw error;
  }
}

/**
 * Fetches well plan steps (full list) to compute KPIs that depend on per-step target durations.
 * Mirrors KPIs app logic (latest record per step by timestamp).
 *
 * @async
 * @param {Object} params
 * @param {number} params.assetId
 * @param {string} params.eventId
 * @returns {Promise<any[]>}
 */
export async function fetchWellPlanStepsData({ assetId, eventId }) {
  if (!assetId || !eventId) {
    return [];
  }

  try {
    const response = await corvaDataAPI.get('/api/v1/data/corva/interventions.well-plan.data/', {
      limit: 1000,
      sort: JSON.stringify({ timestamp: 1 }),
      fields: 'data.step_no,data.target_duration,data.idrec,timestamp',
      query: JSON.stringify({
        asset_id: assetId,
        'data.event_id': eventId,
      }),
    });

    return extractResults(response);
  } catch (error) {
    console.error('Error fetching well plan steps:', error);
    throw error;
  }
}

/**
 * Fetches production parameters (control oil and incremental oil) from the latest well plan record.
 * Used for calculating "Costo Desvio Prod. Diferida".
 *
 * @async
 * @param {Object} params
 * @param {number} params.assetId
 * @param {string} params.eventId
 * @returns {Promise<{controlOil: number|null, incrementalOil: number|null}>}
 */
export async function fetchPlanProductionParams({ assetId, eventId }) {
  if (!assetId || !eventId) {
    return { controlOil: null, incrementalOil: null };
  }

  try {
    const response = await corvaDataAPI.get('/api/v1/data/corva/interventions.well-plan.data/', {
      limit: 1,
      sort: JSON.stringify({ timestamp: -1 }),
      fields: 'data.control_petroleo,data.petroleo_estimado,timestamp',
      query: JSON.stringify({
        asset_id: assetId,
        'data.event_id': eventId,
      }),
    });

    const records = extractResults(response);

    const latest = records[0]?.data || {};
    const controlOil =
      latest?.control_petroleo != null ? Number(latest.control_petroleo) : null;
    const incrementalOil =
      latest?.petroleo_estimado != null ? Number(latest.petroleo_estimado) : null;

    return {
      controlOil: Number.isFinite(controlOil) ? controlOil : null,
      incrementalOil: Number.isFinite(incrementalOil) ? incrementalOil : null,
    };
  } catch (error) {
    console.error('Error fetching plan production params:', error);
    return { controlOil: null, incrementalOil: null };
  }
}

/**
 * Fetches pressure test progress records marked for final report.
 * Returns all records with include_on_final_report: true for the given asset.
 *
 * @async
 * @param {Object} params
 * @param {number} params.assetId - Asset ID
 * @returns {Promise<any[]>} Array of pressure test progress records
 */
export async function fetchFinalReportPressureTests({ assetId }) {
  if (!assetId) {
    return [];
  }

  try {
    const response = await corvaDataAPI.get('/api/v1/data/ypf/interventions.pressure_test_progress/', {
      limit: 100,
      sort: JSON.stringify({ timestamp: -1 }),
      query: JSON.stringify({
        asset_id: assetId,
        'data.include_on_final_report': true,
      }),
    });

    return extractResults(response);
  } catch (error) {
    console.error('Error fetching final report pressure tests:', error);
    return [];
  }
}

