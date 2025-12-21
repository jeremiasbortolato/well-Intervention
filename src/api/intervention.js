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

    if (Array.isArray(response?.results)) {
      return response.results;
    }

    if (Array.isArray(response?.data)) {
      return response.data;
    }

    return Array.isArray(response) ? response : [];
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

    const records = Array.isArray(response?.results)
      ? response.results
      : Array.isArray(response?.data)
      ? response.data
      : Array.isArray(response)
      ? response
      : [];

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

    const records = Array.isArray(response?.results)
      ? response.results
      : Array.isArray(response?.data)
      ? response.data
      : Array.isArray(response)
      ? response
      : [];

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

/**
 * Calculates NPT Gestionable and No Gestionable hours by classifying NPT events by consequence code.
 * Mirrors KPIs app logic.
 *
 * @async
 * @param {Object} params
 * @param {number} params.assetId
 * @param {string} params.eventId
 * @param {Array} params.nptConsequences - Array of consequence code definitions (NPT_CONSECUENCIAS)
 * @returns {Promise<{gestionable: number, noGestionable: number}>}
 */
export async function getNPTGestionableNoGestionable({ assetId, eventId, nptConsequences }) {
  if (!assetId || !eventId) {
    return { gestionable: 0, noGestionable: 0 };
  }

  try {
    const nptEvents = await fetchNptEvents({ assetId, eventId });

    const gestionableCodes = new Set(
      nptConsequences
        .filter((c) => c.tipo === 'Gestionable')
        .map((c) => String(Number(c.codigo)))
    );
    const noGestionableCodes = new Set(
      nptConsequences
        .filter((c) => c.tipo === 'No gestionable')
        .map((c) => String(Number(c.codigo)))
    );

    let gestionable = 0;
    let noGestionable = 0;

    nptEvents.forEach((rec) => {
      const duration = rec.data?.duration || 0;
      const codeRaw = rec.data?.npt_consecuencia;

      if (!codeRaw) {
        return;
      }

      const codeNum = Number(codeRaw);
      if (isNaN(codeNum)) {
        return;
      }
      const code = String(codeNum);

      if (gestionableCodes.has(code)) {
        gestionable += duration;
      } else if (noGestionableCodes.has(code)) {
        noGestionable += duration;
      }
    });

    return { gestionable, noGestionable };
  } catch (error) {
    console.error('Error calculating NPT Gestionable/No Gestionable:', error);
    return { gestionable: 0, noGestionable: 0 };
  }
}

/**
 * Calculates total operative deviation (hours) for a given intervention.
 * Formula: desvioOperativo = (totalTime - nptTime) - totalPlan
 * Includes projection for remaining steps.
 * Mirrors KPIs app logic.
 *
 * @async
 * @param {Object} params
 * @param {number} params.assetId
 * @param {string} params.eventId
 * @returns {Promise<number>}
 */
export async function getDesvioOperativoTotal({ assetId, eventId }) {
  if (!assetId || !eventId) {
    return 0;
  }

  try {
    const wellPlanSteps = await fetchWellPlanStepsData({ assetId, eventId });
    const timelogs = await fetchTimelogData({ assetId, eventId });

    // Get latest record per step_no (by timestamp)
    const stepMap = {};
    wellPlanSteps.forEach((rec) => {
      if (
        rec.data &&
        rec.data.idrec &&
        rec.data.step_no &&
        typeof rec.timestamp === 'number'
      ) {
        const stepNo = String(rec.data.step_no);
        if (!stepMap[stepNo] || rec.timestamp > stepMap[stepNo].timestamp) {
          stepMap[stepNo] = rec;
        }
      }
    });
    const uniquePlanSteps = Object.values(stepMap);

    const totalPlan = uniquePlanSteps.reduce(
      (acc, rec) => acc + (Number(rec.data?.target_duration) || 0),
      0
    );

    // Current step
    const stepNos = timelogs
      .map((r) => Number(r?.data?.step_no))
      .filter((n) => Number.isFinite(n));
    const currentStepNo = stepNos.length ? Math.max(...stepNos) : null;

    const realCurrentConNPT = timelogs
      .filter((r) => Number(r?.data?.step_no) === currentStepNo)
      .reduce((acc, r) => acc + (Number(r?.data?.duration) || 0), 0);

    const plannedCurrent = Number(
      uniquePlanSteps.find((r) => Number(r.data?.step_no) === currentStepNo)?.data
        ?.target_duration || 0
    );

    const plannedNext = uniquePlanSteps
      .filter((rec) => Number(rec.data?.step_no) > currentStepNo)
      .reduce((acc, rec) => acc + (Number(rec.data?.target_duration) || 0), 0);

    const projectedConNPT =
      (realCurrentConNPT >= plannedCurrent ? 0 : plannedCurrent - realCurrentConNPT) +
      plannedNext;

    const totalTimeReal = timelogs.reduce(
      (acc, rec) => acc + (rec.data?.duration || 0),
      0
    );
    const totalTime = totalTimeReal + projectedConNPT;

    const nptTime = timelogs
      .filter((rec) => rec.data?.sub_code_5 === 'NPT')
      .reduce((acc, rec) => acc + (rec.data?.duration || 0), 0);

    const operativeTotal = totalTime - nptTime;
    const desvioOperativoTotal = operativeTotal - totalPlan;

    return desvioOperativoTotal;
  } catch (error) {
    console.error('Error calculating Desvio Operativo Total:', error);
    return 0;
  }
}

/**
 * Calculates all "No Calidad" (Quality Cost) metrics for a given asset.
 * Returns 4 values:
 * - Costo Desvio Operativo
 * - Costo Desvio NPT Gestionable
 * - Costo Desvio Prod. Diferida
 * - Costo Total (sum of the above 3)
 * Mirrors KPIs app logic.
 *
 * @async
 * @param {Object} params
 * @param {number} params.assetId
 * @param {string} params.eventId
 * @param {number} params.wellId
 * @param {number} params.companyId
 * @param {string} params.provider
 * @param {string} params.dataset
 * @param {Array} params.nptConsequences
 * @returns {Promise<{costoDesvioOperativo: number, costoDesvioNPTGestionable: number, costoDesvioProdDiferida: number, costoTotal: number, error: string|null}>}
 */
export async function getNoCalidadCosts({
  assetId,
  eventId,
  wellId,
  companyId,
  provider,
  dataset,
  nptConsequences,
}) {
  try {
    // 1. Get deviation hours (sin NPT)
    const desvioOperativoTotal = await getDesvioOperativoTotal({ assetId, eventId });
    const horasDesvSinNPT = Math.max(0, Number(desvioOperativoTotal) || 0);

    // 2. Get NPT Gestionable hours
    const { gestionable } = await getNPTGestionableNoGestionable({
      assetId,
      eventId,
      nptConsequences,
    });
    const horasNPTGestionable = Number(gestionable) || 0;

    // 3. Get cost references
    const costRefs = await fetchCostReferences({ companyId });
    const { costoBarril, costoNPT, costoOperativo } = costRefs;

    // 4. Get intervention type
    const interventionType = wellId
      ? await getInterventionType({ wellId, companyId, provider, dataset })
      : null;

    // 5. Get production parameters
    const { controlOil, incrementalOil } = await fetchPlanProductionParams({ assetId, eventId });

    // 6. Calculate Costo Desvio Operativo
    const costoOperHr =
      interventionType && costoOperativo?.[interventionType] != null
        ? Number(costoOperativo[interventionType])
        : 0;
    const costoDesvioOperativo = horasDesvSinNPT * costoOperHr;

    // 7. Calculate Costo Desvio NPT Gestionable
    const costoDesvioNPTGestionable = horasNPTGestionable * (Number(costoNPT) || 0);

    // 8. Calculate Costo Desvio Prod. Diferida
    const hasPlanProductionData =
      Number.isFinite(controlOil) && Number.isFinite(incrementalOil);
    const horasAfectadas = horasDesvSinNPT + horasNPTGestionable;

    let costoDesvioProdDiferida = 0;
    if (hasPlanProductionData && costoBarril != null) {
      const productionRate = (controlOil + incrementalOil) / 24;
      costoDesvioProdDiferida = horasAfectadas * Number(costoBarril) * productionRate;
    }

    // 9. Calculate Costo Total
    const costoTotal = costoDesvioOperativo + costoDesvioNPTGestionable + costoDesvioProdDiferida;

    return {
      costoDesvioOperativo,
      costoDesvioNPTGestionable,
      costoDesvioProdDiferida,
      costoTotal,
      error: null,
    };
  } catch (error) {
    console.error('Error computing No Calidad costs:', error);
    return {
      costoDesvioOperativo: 0,
      costoDesvioNPTGestionable: 0,
      costoDesvioProdDiferida: 0,
      costoTotal: 0,
      error: error.message || 'Error calculating costs',
    };
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
