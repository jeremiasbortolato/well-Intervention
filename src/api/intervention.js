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
 * Gets NPT events grouped by consequence (npt_consecuencia) with total duration for each.
 * Returns array sorted by duration (highest first), limited to topN.
 * Mirrors ypf_app_interventions_npt_analysis logic.
 *
 * @async
 * @param {Object} params
 * @param {number} params.assetId
 * @param {string} params.eventId
 * @param {Array} params.nptConsequences - Array of consequence code definitions (NPT_CONSECUENCIAS)
 * @param {number} params.topN - Number of top items to return (default: 5)
 * @returns {Promise<Array<{name: string, value: number}>>} Array of {name, value} for treemap
 */
export async function getNPTByConsequence({ assetId, eventId, nptConsequences, topN = 5 }) {
  if (!assetId || !eventId) {
    return [];
  }

  try {
    const nptEvents = await fetchNptEvents({ assetId, eventId });

    // Create a map of code -> consequence name
    const codeToConsequence = {};
    nptConsequences.forEach((c) => {
      if (c.codigo != null && c.consecuencia) {
        codeToConsequence[String(Number(c.codigo))] = c.consecuencia;
      }
    });

    // Group by consequence and sum durations
    const consequenceMap = {};
    nptEvents.forEach((rec) => {
      const codeRaw = rec.data?.npt_consecuencia;
      const duration = rec.data?.duration || 0;

      if (!codeRaw || !duration) {
        return;
      }

      const codeNum = Number(codeRaw);
      if (isNaN(codeNum)) {
        return;
      }
      const code = String(codeNum);

      const consequenceName = codeToConsequence[code] || `Código ${code}`;

      if (!consequenceMap[consequenceName]) {
        consequenceMap[consequenceName] = 0;
      }
      consequenceMap[consequenceName] += duration;
    });

    // Convert to array and sort by duration (highest first)
    const result = Object.entries(consequenceMap)
      .map(([name, value]) => ({
        name,
        value: Number(value.toFixed(2)),
      }))
      .sort((a, b) => b.value - a.value)
      .slice(0, topN);

    return result;
  } catch (error) {
    console.error('Error getting NPT by consequence:', error);
    return [];
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
 * @returns {Promise<{costoDesvioOperativo: number, costoDesvioNPTGestionable: number, costoDesvioProdDiferida: number, costoTotal: number, hasPlanProductionData: boolean, error: string|null}>}
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
    // NOTE: "Costo Desvio Prod. Diferida" is shown separately and should NOT be included in totals.
    const costoTotal = costoDesvioOperativo + costoDesvioNPTGestionable;

    return {
      costoDesvioOperativo,
      costoDesvioNPTGestionable,
      costoDesvioProdDiferida,
      costoTotal,
      hasPlanProductionData,
      error: null,
    };
  } catch (error) {
    console.error('Error computing No Calidad costs:', error);
    return {
      costoDesvioOperativo: 0,
      costoDesvioNPTGestionable: 0,
      costoDesvioProdDiferida: 0,
      costoTotal: 0,
      hasPlanProductionData: false,
      error: error.message || 'Error calculating costs',
    };
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

/**
 * Gets operational comments and trace memos for a well.
 * Includes DvA "Operativo" and "Observaciones" entries plus trace comments.
 *
 * @async
 * @param {Object} params
 * @param {number} params.assetId
 * @param {number} [params.startTime] - Start timestamp (unix seconds)
 * @param {number} [params.endTime] - End timestamp (unix seconds)
 * @returns {Promise<Array<{id: string, name: string, time: Date | null, comment: string, attachments: string[]}>>}
 */
export async function getWellComments({ assetId, startTime, endTime }) {
  if (!assetId) {
    return [];
  }

  const DVA_APP_KEY = 'ypf.days_vs_activity.ui';
  const allowedMainTypes = new Set(['operativo', 'observations', 'observaciones']);

  const toDate = (value) => {
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
  };

  const toUnixSeconds = (date) => {
    if (!(date instanceof Date)) return null;
    const ms = date.getTime();
    return Number.isFinite(ms) ? Math.floor(ms / 1000) : null;
  };

  try {
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
    const included = Array.isArray(responseData?.included) ? responseData.included : [];

    const usersMap = included.reduce((acc, item) => {
      if (item?.type === 'user') {
        acc[item.id] = item;
      }
      return acc;
    }, {});

    const filtered = activities.filter((activity) => {
      const attributes = activity?.attributes;
      const activityType = attributes?.type;

      if (activityType !== 'post') {
        return false;
      }

      const post = attributes?.context?.post;
      if (!post) return false;
      if (post?.app_key !== DVA_APP_KEY) return false;
      if (post?.asset_id && Number(post.asset_id) !== Number(assetId)) return false;

      const mainType = post?.data?.mainType;
      if (typeof mainType !== 'string') return false;
      return allowedMainTypes.has(mainType.toLowerCase());
    });

    const normalized = filtered.map((activity, index) => {
      const attributes = activity?.attributes || {};
      const post = attributes?.context?.post;
      const userId = activity?.relationships?.user?.data?.id;
      const user = userId ? usersMap[userId] : null;
      const firstName = user?.attributes?.first_name || '';
      const lastName = user?.attributes?.last_name || '';
      const name = `${firstName} ${lastName}`.trim() || 'Sin usuario';

      const commentBody = post?.body || '';

      const rawTimestamp =
        post?.timestamp || post?.data?.timestamp || attributes?.created_at;
      const time = toDate(rawTimestamp);
      const timeSeconds = toUnixSeconds(time);

      const attachments = [];
      const attachment = post?.attachment;
      if (attachment) {
        const url = attachment.signed_url || attachment.url;
        const name = attachment.file_name || attachment.name || 'Adjunto';
        if (url || name) {
          attachments.push({ url, name });
        }
      }

      return {
        id: String(activity?.id ?? attributes?.id ?? index),
        name,
        time,
        comment: commentBody,
        attachments,
        timeSeconds,
      };
    });

    const filteredByTime =
      startTime && endTime
        ? normalized.filter((item) => {
            if (!item.timeSeconds) return false;
            return item.timeSeconds >= startTime && item.timeSeconds <= endTime;
          })
        : normalized;

    return filteredByTime.map(({ timeSeconds, ...rest }) => rest);
  } catch (error) {
    console.error('Error getting well comments:', error);
    return [];
  }
}

/**
 * Mapping of sub-operation codes to their categories and descriptions.
 * Based on reference table provided.
 */
const TRIPPING_CODE_MAP = {
  '251A': { category: 'Varilla', description: 'Saca v/b en simple' },
  '251B': { category: 'Varilla', description: 'Saca v/b en dobles' },
  '251C': { category: 'Varilla', description: 'Saca v/b en simple' },
  '251D': { category: 'Varilla', description: 'Saca v/b en dobles' },
  '253A': { category: 'Tubing', description: 'Saca TBG en simple' },
  '253B': { category: 'Tubing', description: 'Saca TBG en dobles' },
  '253C': { category: 'Tubing', description: 'Saca TBG en simple' },
  '253D': { category: 'Tubing', description: 'Saca TBG en dobles' },
  '253M': { category: 'Tubing', description: 'Saca TBG en simple sunchos' },
  '253T': { category: 'Tubing', description: 'Saca TBG en dobles sunchos' },
  '257S': { category: 'Tubing', description: 'Baja TBG en dobles sunchos' },
  '257M': { category: 'Tubing', description: 'Baja TBG en simple sunchos' },
  '257D': { category: 'Tubing', description: 'Baja TBG en dobles' },
  '257C': { category: 'Tubing', description: 'Baja TBG en simple' },
  '257B': { category: 'Tubing', description: 'Baja TBG en dobles' },
  '257A': { category: 'Tubing', description: 'Baja TBG en simple' },
  '255D': { category: 'Varilla', description: 'Baja v/b en dobles' },
  '255C': { category: 'Varilla', description: 'Baja v/b en simple' },
  '255B': { category: 'Varilla', description: 'Baja v/b en dobles' },
  '255A': { category: 'Varilla', description: 'Baja v/b en simple' },
};

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
 * Calculates performance comparison data for tripping operations vs carta oferta goals.
 * 
 * Uses timelog data to calculate actual performance (Valor Real) in u/h units.
 * Compares with goals from tripping-speed-goals collection (Objetivo).
 * Only includes codes that were actually used in the well.
 *
 * @async
 * @param {Object} params
 * @param {number} params.assetId - Asset ID
 * @param {string} params.eventId - Event ID
 * @param {number} params.companyId - Company ID (default: 375)
 * @returns {Promise<Array<{category: string, operation: string, actual: number|string, target: number|string, difference: string, differenceState: string}>>}
 */
export async function getPerformanceComparisonData({ assetId, eventId, companyId = 375 }) {
  if (!assetId || !eventId) {
    return [];
  }

  try {
    // Fetch timelog data and tripping speed goals in parallel
    const [timelogs, goals] = await Promise.all([
      fetchTimelogData({ assetId, eventId }),
      fetchTrippingSpeedGoals({ companyId }),
    ]);

    console.log('[Performance] Total timelog records:', timelogs.length);
    console.log('[Performance] Total goals:', goals.length);

    // Get all tripping codes from the constant
    const trippingCodes = Object.keys(TRIPPING_CODE_MAP);
    console.log('[Performance] Looking for tripping codes:', trippingCodes);

    // Group timelog data by op_subcode
    const groupedByCode = {};
    let skippedNoCode = 0;
    let skippedNotTripping = 0;
    let skippedNoCantidad = 0;
    let processedCount = 0;
    
    // Collect all unique op_subcodes found
    const uniqueOpSubcodes = new Set();
    
    timelogs.forEach((rec) => {
      const opSubcode = rec?.data?.op_subcode;
      
      if (!opSubcode) {
        skippedNoCode++;
        return;
      }
      
      uniqueOpSubcodes.add(opSubcode);
      
      if (!trippingCodes.includes(opSubcode)) {
        skippedNotTripping++;
        return; // Skip if not a tripping code
      }

      const duration = Number(rec?.data?.duration) || 0;
      const cantidadUni = Number(rec?.data?.cantidad_uni) || 0;
      
      // Skip if no cantidad_uni (we need it for calculation)
      if (cantidadUni <= 0) {
        skippedNoCantidad++;
        return;
      }

      if (!groupedByCode[opSubcode]) {
        groupedByCode[opSubcode] = {
          totalDuration: 0,
          totalCantidad: 0,
        };
      }

      groupedByCode[opSubcode].totalDuration += duration;
      groupedByCode[opSubcode].totalCantidad += cantidadUni;
      processedCount++;
    });
    
    console.log('[Performance] Unique op_subcodes found in timelog:', Array.from(uniqueOpSubcodes).sort());
    console.log('[Performance] Processed records:', processedCount);
    console.log('[Performance] Skipped - no code:', skippedNoCode);
    console.log('[Performance] Skipped - not tripping code:', skippedNotTripping);
    console.log('[Performance] Skipped - no cantidad_uni:', skippedNoCantidad);
    console.log('[Performance] Grouped codes:', Object.keys(groupedByCode));

    // Build goals map from tripping-speed-goals
    const goalsMap = {};
    goals.forEach((goal) => {
      const goalData = goal?.data;
      if (!goalData) return;
      
      // The field names in the API response
      const code = goalData.sub_operation_code || goalData.code;
      const cantidad = goalData['cantidad (units/hour)'] || goalData.cantidad;
      const description = goalData.description;

      if (code && cantidad != null) {
        goalsMap[code] = {
          goal: Number(cantidad),
          description: description || TRIPPING_CODE_MAP[code]?.description || '',
        };
      }
    });
    
    console.log('[Performance] Goals map keys:', Object.keys(goalsMap));
    console.log('[Performance] Sample goals:', Object.entries(goalsMap).slice(0, 3));

    // Calculate performance for each used code
    const performanceRows = [];

    Object.entries(groupedByCode).forEach(([code, data]) => {
      const { totalDuration, totalCantidad } = data;
      
      // Skip if no duration or cantidad
      if (totalDuration <= 0 || totalCantidad <= 0) {
        return;
      }

      // Calculate Valor Real (actual performance in u/h)
      const valorReal = totalCantidad / totalDuration;

      // Get goal (Objetivo)
      const goalData = goalsMap[code];
      const objetivo = goalData?.goal;

      // Skip if no goal available for this code
      if (objetivo == null || objetivo <= 0) {
        return;
      }

      // Calculate difference
      const diferencia = objetivo - valorReal;
      const porcentaje = (diferencia / objetivo) * 100;

      // Determine state based on performance
      // Negative difference means actual is better than goal (valorReal > objetivo) = good
      // Positive difference means actual is worse than goal (valorReal < objetivo) = bad
      let differenceState = 'neutral';
      if (diferencia < 0) {
        // Actual is better than goal (faster/more units per hour)
        differenceState = 'success';
      } else if (diferencia > 0) {
        // Actual is worse than goal (slower/fewer units per hour)
        differenceState = 'error';
      }

      // Format difference string
      // Show "+" when actual is better (diferencia < 0), "-" when actual is worse (diferencia > 0)
      const differenceStr = `${diferencia < 0 ? '+' : '-'} ${Math.abs(diferencia).toFixed(1)} (${Math.abs(porcentaje).toFixed(1)}%)`;

      // Get category and description from mapping
      const codeInfo = TRIPPING_CODE_MAP[code];
      const category = codeInfo?.category || 'Otro';
      const operation = goalData?.description || codeInfo?.description || code;

      performanceRows.push({
        category,
        operation,
        actual: Number(valorReal.toFixed(1)),
        target: Number(objetivo.toFixed(1)),
        difference: differenceStr,
        differenceState,
        code, // Keep for sorting
      });
    });

    // Sort by category (Tubing first, then Varilla) and then by code
    performanceRows.sort((a, b) => {
      if (a.category !== b.category) {
        // Tubing first
        if (a.category === 'Tubing') return -1;
        if (b.category === 'Tubing') return 1;
        return a.category.localeCompare(b.category);
      }
      return a.code.localeCompare(b.code);
    });

    console.log('[Performance] Final performance rows count:', performanceRows.length);
    if (performanceRows.length === 0) {
      console.log('[Performance] No performance data found. This well may not have tripping operations yet, or cantidad_uni is not recorded.');
    }

    // Remove code property before returning
    return performanceRows.map(({ code, ...row }) => row);
  } catch (error) {
    console.error('Error getting performance comparison data:', error);
    return [];
  }
}
