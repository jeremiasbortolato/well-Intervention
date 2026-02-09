import { fetchNptEvents } from '../fetchers/events';

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

