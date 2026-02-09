import { corvaDataAPI } from '@corva/ui/clients';
import { extractResults } from '../utils';

/**
 * Gets wind status data for intervention operations.
 * Fetches data from ypf#intervention_wind_status dataset.
 * 
 * Calculates total hours in each wind status category:
 * - GOOD: Good wind conditions (safe for operations)
 * - CAUTION: Caution wind conditions (moderate risk)
 * - DANGER: Danger wind conditions (high risk)
 *
 * @async
 * @param {Object} params
 * @param {number} params.assetId - Asset ID
 * @returns {Promise<{goodHours: number, cautionHours: number, dangerHours: number, totalHours: number}>}
 */
export async function getWindStatusData({ assetId }) {
  if (!assetId) {
    return {
      goodHours: 0,
      cautionHours: 0,
      dangerHours: 0,
      totalHours: 0,
    };
  }

  try {
    const response = await corvaDataAPI.get('/api/v1/data/ypf/intervention_wind_status/', {
      limit: 10000,
      query: JSON.stringify({
        asset_id: assetId,
      }),
      sort: JSON.stringify({ timestamp: 1 }),
    });

    const records = extractResults(response);

    let goodSeconds = 0;
    let cautionSeconds = 0;
    let dangerSeconds = 0;

    console.log('[Wind Status] Total records fetched:', records.length);

    records.forEach((rec) => {
      const status = rec?.data?.status;
      
      // The field 'good_wind_conditions_sustained_for' represents the duration of the current state in seconds
      // Despite its name, it applies to ALL statuses (GOOD, CAUTION, DANGER)
      let durationSeconds = rec?.data?.good_wind_conditions_sustained_for;
      
      // Fallback: calculate from start_time and end_time if available
      if (durationSeconds == null) {
        const startTime = rec?.data?.start_time;
        const endTime = rec?.data?.end_time;
        
        if (startTime != null && endTime != null) {
          durationSeconds = endTime - startTime;
        }
      }
      
      // Skip if no valid duration (null, undefined, NaN, or <= 0)
      if (durationSeconds == null || isNaN(durationSeconds) || durationSeconds <= 0) {
        return;
      }

      // Group by status and accumulate duration
      switch (status) {
        case 'GOOD':
          goodSeconds += durationSeconds;
          break;
        case 'CAUTION':
          cautionSeconds += durationSeconds;
          break;
        case 'DANGER':
          dangerSeconds += durationSeconds;
          break;
        default:
          // Unknown status, log and ignore
          if (status) {
            console.warn('[Wind Status] Unknown status:', status, 'for record:', rec._id);
          }
          break;
      }
    });

    console.log('[Wind Status] Records processed successfully');

    // Convert seconds to hours
    const goodHours = goodSeconds / 3600;
    const cautionHours = cautionSeconds / 3600;
    const dangerHours = dangerSeconds / 3600;
    const totalHours = goodHours + cautionHours + dangerHours;

    console.log('[Wind Status] Calculated totals (seconds):', {
      goodSeconds,
      cautionSeconds,
      dangerSeconds,
      totalSeconds: goodSeconds + cautionSeconds + dangerSeconds,
    });

    console.log('[Wind Status] Calculated totals (hours):', {
      goodHours: goodHours.toFixed(2),
      cautionHours: cautionHours.toFixed(2),
      dangerHours: dangerHours.toFixed(2),
      totalHours: totalHours.toFixed(2),
    });

    return {
      goodHours: Number(goodHours.toFixed(2)),
      cautionHours: Number(cautionHours.toFixed(2)),
      dangerHours: Number(dangerHours.toFixed(2)),
      totalHours: Number(totalHours.toFixed(2)),
    };
  } catch (error) {
    console.error('Error getting wind status data:', error);
    return {
      goodHours: 0,
      cautionHours: 0,
      dangerHours: 0,
      totalHours: 0,
    };
  }
}

/**
 * Gets torque monitoring connection data (making connections KPIs).
 * Fetches data from ypf#intervention.torque_monitor.connections dataset.
 * 
 * Calculates:
 * - Bad connections: count with connection_health "bad" and connection_type "making"
 * - OK connections: count with connection_health "good" or "average" and connection_type "making"
 * - Total connections: bad + ok
 * - Bad connections percentage
 *
 * @async
 * @param {Object} params
 * @param {number} params.assetId - Asset ID
 * @returns {Promise<{badConnections: number, okConnections: number, totalConnections: number, badPercentage: number}>}
 */
export async function getTorqueConnectionsData({ assetId }) {
  if (!assetId) {
    return {
      badConnections: 0,
      okConnections: 0,
      totalConnections: 0,
      badPercentage: 0,
    };
  }

  try {
    const response = await corvaDataAPI.get('/api/v1/data/ypf/intervention.torque_monitor.connections/', {
      limit: 10000,
      query: JSON.stringify({
        asset_id: assetId,
        'data.connection_type': 'making',
      }),
      sort: JSON.stringify({ timestamp: -1 }),
    });

    const records = extractResults(response);

    // Count bad connections (excluding "checking" type, but already filtered by "making")
    const badConnections = records.filter((rec) => {
      const health = rec?.data?.connection_health;
      const type = rec?.data?.connection_type;
      
      // Already filtered by "making" in query, but double-check to exclude "checking"
      if (type === 'checking') return false;
      
      return health === 'bad';
    }).length;

    // Count OK connections (good or average, excluding "checking")
    const okConnections = records.filter((rec) => {
      const health = rec?.data?.connection_health;
      const type = rec?.data?.connection_type;
      
      // Already filtered by "making" in query, but double-check to exclude "checking"
      if (type === 'checking') return false;
      
      return health === 'good' || health === 'average';
    }).length;

    const totalConnections = badConnections + okConnections;
    const badPercentage = totalConnections > 0 ? (badConnections / totalConnections) * 100 : 0;

    return {
      badConnections,
      okConnections,
      totalConnections,
      badPercentage,
    };
  } catch (error) {
    console.error('Error getting torque connections data:', error);
    return {
      badConnections: 0,
      okConnections: 0,
      totalConnections: 0,
      badPercentage: 0,
    };
  }
}

