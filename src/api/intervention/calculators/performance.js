import { fetchTimelogData } from '../fetchers/timelog';
import { fetchTrippingSpeedGoals } from '../fetchers/goals';
import { TRIPPING_CODE_GROUPS, TRIPPING_CODE_TO_GROUP } from '../constants';

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

    // Get all tripping codes from the grouping lookup
    const trippingCodes = Object.keys(TRIPPING_CODE_TO_GROUP);
    console.log('[Performance] Looking for tripping codes:', trippingCodes);

    // Group timelog data by grouped operation (shared goal)
    const groupedByGroup = {};
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

      const groupKey = TRIPPING_CODE_TO_GROUP[opSubcode];
      if (!groupKey) {
        skippedNotTripping++;
        return;
      }

      if (!groupedByGroup[groupKey]) {
        groupedByGroup[groupKey] = {
          totalDuration: 0,
          totalCantidad: 0,
        };
      }

      groupedByGroup[groupKey].totalDuration += duration;
      groupedByGroup[groupKey].totalCantidad += cantidadUni;
      processedCount++;
    });
    
    console.log('[Performance] Unique op_subcodes found in timelog:', Array.from(uniqueOpSubcodes).sort());
    console.log('[Performance] Processed records:', processedCount);
    console.log('[Performance] Skipped - no code:', skippedNoCode);
    console.log('[Performance] Skipped - not tripping code:', skippedNotTripping);
    console.log('[Performance] Skipped - no cantidad_uni:', skippedNoCantidad);
    console.log('[Performance] Grouped operations:', Object.keys(groupedByGroup));

    // Build goals map from tripping-speed-goals (grouped by shared goal)
    const goalsMap = {};
    goals.forEach((goal) => {
      const goalData = goal?.data;
      if (!goalData) return;
      
      // The field names in the API response
      const code = goalData.sub_operation_code || goalData.code;
      const cantidad = goalData['cantidad (units/hour)'] || goalData.cantidad;
      const groupKey = TRIPPING_CODE_TO_GROUP[code];

      if (code && cantidad != null && groupKey) {
        const normalizedGoal = Number(cantidad);
        if (goalsMap[groupKey] && goalsMap[groupKey].goal !== normalizedGoal) {
          console.warn(
            '[Performance] Mismatched goals for grouped codes:',
            groupKey,
            goalsMap[groupKey].goal,
            normalizedGoal
          );
        }
        goalsMap[groupKey] = {
          goal: normalizedGoal,
          description: TRIPPING_CODE_GROUPS[groupKey]?.description || code,
          category: TRIPPING_CODE_GROUPS[groupKey]?.category || 'Otro',
        };
      }
    });
    
    console.log('[Performance] Goals map keys:', Object.keys(goalsMap));
    console.log('[Performance] Sample goals:', Object.entries(goalsMap).slice(0, 3));

    // Calculate performance for each used code
    const performanceRows = [];

    Object.entries(groupedByGroup).forEach(([groupKey, data]) => {
      const { totalDuration, totalCantidad } = data;
      
      // Skip if no duration or cantidad
      if (totalDuration <= 0 || totalCantidad <= 0) {
        return;
      }

      // Calculate Valor Real (actual performance in u/h)
      const valorReal = totalCantidad / totalDuration;

      // Get goal (Objetivo)
      const goalData = goalsMap[groupKey];
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
      const category = goalData?.category || TRIPPING_CODE_GROUPS[groupKey]?.category || 'Otro';
      const operation = goalData?.description || TRIPPING_CODE_GROUPS[groupKey]?.description || groupKey;

      performanceRows.push({
        category,
        operation,
        actual: Number(valorReal.toFixed(1)),
        target: Number(objetivo.toFixed(1)),
        difference: differenceStr,
        differenceState,
        code: groupKey, // Keep for sorting
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

