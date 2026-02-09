import { corvaDataAPI } from '@corva/ui/clients';
import { extractResults } from '../utils';

/**
 * Fetches latest cost reference data from YPF dataset (barrel cost, NPT cost, operational cost by type).
 * Mirrors KPIs app logic.
 *
 * @async
 * @param {Object} params
 * @param {number} params.companyId
 * @returns {Promise<{costoBarril: number|null, costoNPT: number|null, costoOperativo: Object|null, timestamp: number|null}>}
 */
export async function fetchCostReferences({ companyId }) {
  if (!companyId) {
    return { costoBarril: null, costoNPT: null, costoOperativo: null, timestamp: null };
  }

  try {
    const response = await corvaDataAPI.get('/api/v1/data/ypf/intervention_cost-kpi_references/', {
      limit: 1,
      sort: JSON.stringify({ timestamp: -1 }),
      query: JSON.stringify({ company_id: companyId }),
    });

    const records = extractResults(response);

    if (!records.length) {
      return { costoBarril: null, costoNPT: null, costoOperativo: null, timestamp: null };
    }

    const latest = records[0]?.data || {};
    return {
      costoBarril: latest?.barrel_cost != null ? Number(latest.barrel_cost) : null,
      costoNPT: latest?.npt_cost != null ? Number(latest.npt_cost) : null,
      costoOperativo: latest?.operational_cost || null,
      timestamp: records[0]?.timestamp || null,
    };
  } catch (error) {
    console.error('Error fetching cost references:', error);
    return { costoBarril: null, costoNPT: null, costoOperativo: null, timestamp: null };
  }
}

