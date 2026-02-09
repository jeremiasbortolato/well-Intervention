import { corvaAPI } from '@corva/ui/clients';
import { unwrapCorvaResponse, toDate, toUnixSeconds } from './utils';
import { DVA_APP_KEY } from './constants';

/**
 * Gets trace memos for a well (traces_memo activities).
 *
 * @async
 * @param {Object} params
 * @param {number} params.assetId
 * @returns {Promise<Array<{id: string, name: string, time: Date | null, comment: string, attachments: any[], timeSeconds: number | null, stepNumber: number | null}>>}
 */
export async function getTraceComments({ assetId }) {
  if (!assetId) {
    return [];
  }

  try {
    const response = await corvaAPI.get('/v2/activities', {
      page: 1,
      per_page: 10000,
      assets: [assetId],
      type: ['traces_memo'],
      segment: 'drilling',
      app_id: 1278,
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

    const traceMemos = activities.filter(
      (activity) =>
        activity?.attributes?.type === 'traces_memo' &&
        !!activity?.attributes?.context?.traces_memo
    );

    return traceMemos.map((activity, index) => {
      const attributes = activity?.attributes || {};
      const memo = attributes?.context?.traces_memo || {};
      const userId = activity?.relationships?.user?.data?.id;
      const user = userId ? usersMap[userId] : null;
      const firstName = user?.attributes?.first_name || '';
      const lastName = user?.attributes?.last_name || '';
      const name = `${firstName} ${lastName}`.trim() || 'Sin usuario';

      const commentBody = memo?.body || '';
      const stepNumber = memo?.stepNumber ?? null;

      const rawTimestamp = memo?.timestamp || attributes?.created_at;
      const time = toDate(rawTimestamp);
      const timeSeconds = toUnixSeconds(time);

      return {
        id: String(activity?.id ?? attributes?.id ?? index),
        name,
        time,
        comment: commentBody,
        attachments: [],
        timeSeconds,
        stepNumber,
      };
    });
  } catch (error) {
    console.error('Error getting trace comments:', error);
    return [];
  }
}

/**
 * Gets operational comments for a well (DvA posts).
 *
 * @async
 * @param {Object} params
 * @param {number} params.assetId
 * @param {number} [params.startTime] - Start timestamp (unix seconds)
 * @param {number} [params.endTime] - End timestamp (unix seconds)
 * @returns {Promise<Array<{id: string, name: string, time: Date | null, comment: string, attachments: string[], timeSeconds: number | null, stepNumber: number | null}>>}
 */
export async function getWellComments({ assetId, startTime, endTime }) {
  if (!assetId) {
    return [];
  }

  try {
    const response = await corvaAPI.get('/v2/activities', {
      page: 0,
      per_page: 10000,
      assets: [assetId],
      type: ['post', 'traces_memo'],
      segment: 'drilling',
      app_id: 4777,
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

      // Handle "post" type activities
      if (activityType === 'post') {
        const post = attributes?.context?.post;
        if (!post) return false;
        if (post?.app_key !== DVA_APP_KEY) return false;
        if (post?.asset_id && Number(post.asset_id) !== Number(assetId)) return false;
        return true;
      }

      // Handle "traces_memo" type activities
      if (activityType === 'traces_memo') {
        const tracesMemo = attributes?.context?.traces_memo;
        if (!tracesMemo) return false;
        
        // For traces_memo, verify the well id from relationships
        const wellId = activity?.relationships?.well?.data?.id;
        if (wellId && Number(wellId) !== Number(assetId)) return false;
        
        return true;
      }

      return false;
    });

    const normalized = filtered.map((activity, index) => {
      const attributes = activity?.attributes || {};
      const activityType = attributes?.type;
      const userId = activity?.relationships?.user?.data?.id;
      const user = userId ? usersMap[userId] : null;
      const firstName = user?.attributes?.first_name || '';
      const lastName = user?.attributes?.last_name || '';
      const name = `${firstName} ${lastName}`.trim() || 'Sin usuario';

      let commentBody = '';
      let stepNumber = null;
      let rawTimestamp = null;
      const attachments = [];

      // Handle "post" type
      if (activityType === 'post') {
        const post = attributes?.context?.post;
        commentBody = post?.body || '';
        stepNumber = post?.data?.stepNumber ?? null;
        rawTimestamp = post?.timestamp || post?.data?.timestamp || attributes?.created_at;
        
        const attachment = post?.attachment;
        if (attachment) {
          const url = attachment.signed_url || attachment.url;
          const attachmentName = attachment.file_name || attachment.name || 'Adjunto';
          if (url || attachmentName) {
            attachments.push({ url, name: attachmentName });
          }
        }
      }
      
      // Handle "traces_memo" type
      if (activityType === 'traces_memo') {
        const tracesMemo = attributes?.context?.traces_memo;
        commentBody = tracesMemo?.body || '';
        stepNumber = tracesMemo?.stepNumber ?? null;
        rawTimestamp = tracesMemo?.timestamp || attributes?.created_at;
        
        const attachment = tracesMemo?.attachment;
        if (attachment) {
          const url = attachment.signed_url || attachment.url;
          const attachmentName = attachment.file_name || attachment.name || 'Adjunto';
          if (url || attachmentName) {
            attachments.push({ url, name: attachmentName });
          }
        }
      }

      const time = toDate(rawTimestamp);
      const timeSeconds = toUnixSeconds(time);

      return {
        id: String(activity?.id ?? attributes?.id ?? index),
        name,
        time,
        comment: commentBody,
        attachments,
        timeSeconds,
        stepNumber,
        activityType, // Include activity type for reference
      };
    });

    // Return all normalized comments with stepNumber and timeSeconds
    // Filtering by stepNumber/date will be done in the component
    return normalized;
  } catch (error) {
    console.error('Error getting well comments:', error);
    return [];
  }
}

