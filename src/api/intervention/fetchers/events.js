import { corvaAPI, corvaDataAPI } from '@corva/ui/clients';
import { unwrapCorvaResponse, extractResults } from '../utils';

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

    return extractResults(response);
  } catch (error) {
    console.error('Error fetching NPT events:', error);
    throw error;
  }
}

/**
 * Fetches failure identification data for interventions with "Downhole Equipment Failure" operation type.
 * Fetches all activities from /v2/activities with type: 'post' and filters those that have
 * isFailure === true in context.post.data matching the asset_id.
 *
 * @async
 * @param {Object} params
 * @param {number} params.assetId - Asset ID
 * @returns {Promise<Array<{id: string, failureType: string, comment: string, timestamp: Date|null, userName: string}>>}
 */
export async function getFailureIdentificationData({ assetId }) {
  if (!assetId) {
    return [];
  }

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

    // Create users map for getting user names
    const usersMap = included.reduce((acc, item) => {
      if (item?.type === 'user') {
        acc[item.id] = item;
      }
      return acc;
    }, {});

    // Filter for posts with isFailure === true matching the asset_id
    const failureActivities = activities.filter((activity) => {
      const post = activity?.attributes?.context?.post;
      
      if (!post) return false;
      
      // Filter by asset_id to match the specific asset
      if (post?.asset_id && Number(post.asset_id) !== Number(assetId)) {
        return false;
      }

      // Check if isFailure is true
      if (post?.data?.isFailure !== true) {
        return false;
      }

      return true;
    });

    // Map to structured data
    return failureActivities.map((activity, index) => {
      const post = activity?.attributes?.context?.post;
      const postData = post?.data || {};
      const userId = activity?.relationships?.user?.data?.id;
      const user = userId ? usersMap[userId] : null;
      const firstName = user?.attributes?.first_name || '';
      const lastName = user?.attributes?.last_name || '';
      const userName = `${firstName} ${lastName}`.trim() || 'Usuario desconocido';

      return {
        id: String(activity?.id ?? index),
        failureType: postData?.failureType || postData?.failureTypeText || 'Tipo de falla no especificado',
        comment: post?.body || 'Sin comentario',
        timestamp: post?.timestamp ? new Date(post.timestamp) : null,
        userName,
      };
    });
  } catch (error) {
    console.error('Error getting failure identification data:', error);
    return [];
  }
}

