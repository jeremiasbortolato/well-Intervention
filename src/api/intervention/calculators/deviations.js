import { fetchWellPlanStepsData, fetchTimelogData } from '../fetchers/timelog';

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

