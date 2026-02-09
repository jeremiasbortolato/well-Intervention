import { getDesvioOperativoTotal } from './deviations';
import { getNPTGestionableNoGestionable } from './npt';
import { fetchCostReferences } from '../fetchers/costs';
import { fetchPlanProductionParams } from '../fetchers/timelog';
import { getInterventionType } from '../fetchers/goals';

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

