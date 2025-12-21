import { NPT_CONSECUENCIAS } from '../constants';

function formatUsd(value) {
  const safe = Number.isFinite(value) ? value : 0;
  const rounded = Math.round(safe);
  const formatted = new Intl.NumberFormat('en-US', { maximumFractionDigits: 0 }).format(rounded);
  return `$ ${formatted}`;
}

function getGestionableNptHours(nptEvents) {
  const consecuencias = Array.isArray(NPT_CONSECUENCIAS[0]) ? NPT_CONSECUENCIAS.flat() : NPT_CONSECUENCIAS;
  const gestionableCodes = new Set(
    consecuencias
      .filter(c => c.tipo === 'Gestionable')
      .map(c => String(Number(c.codigo)))
  );

  let gestionable = 0;
  (nptEvents || []).forEach(rec => {
    const duration = Number(rec?.data?.duration) || 0;
    const codeRaw = rec?.data?.npt_consecuencia;
    if (!codeRaw) return;
    const codeNum = Number(codeRaw);
    if (Number.isNaN(codeNum)) return;
    const code = String(codeNum);
    if (gestionableCodes.has(code)) gestionable += duration;
  });
  return gestionable;
}

function computeDesvioOperativoTotalHours({ wellPlanSteps, timelogs }) {
  const stepMap = {};
  (wellPlanSteps || []).forEach(rec => {
    const stepNo = rec?.data?.step_no;
    const idrec = rec?.data?.idrec;
    const ts = rec?.timestamp;
    if (!idrec || !stepNo || typeof ts !== 'number') return;
    const key = String(stepNo);
    if (!stepMap[key] || ts > stepMap[key].timestamp) stepMap[key] = rec;
  });
  const uniquePlanSteps = Object.values(stepMap);

  const totalPlan = uniquePlanSteps.reduce(
    (acc, rec) => acc + (Number(rec?.data?.target_duration) || 0),
    0
  );

  const stepNos = (timelogs || [])
    .map(r => Number(r?.data?.step_no))
    .filter(n => Number.isFinite(n));
  const currentStepNo = stepNos.length ? Math.max(...stepNos) : null;

  const realCurrentConNPT = (timelogs || [])
    .filter(r => Number(r?.data?.step_no) === currentStepNo)
    .reduce((acc, r) => acc + (Number(r?.data?.duration) || 0), 0);

  const plannedCurrent = Number(
    uniquePlanSteps.find(r => Number(r?.data?.step_no) === currentStepNo)?.data?.target_duration || 0
  );

  const plannedNext = uniquePlanSteps
    .filter(rec => Number(rec?.data?.step_no) > currentStepNo)
    .reduce((acc, rec) => acc + (Number(rec?.data?.target_duration) || 0), 0);

  const projectedConNPT =
    (realCurrentConNPT >= plannedCurrent ? 0 : plannedCurrent - realCurrentConNPT) + plannedNext;

  const totalTimeReal = (timelogs || []).reduce(
    (acc, rec) => acc + (Number(rec?.data?.duration) || 0),
    0
  );
  const totalTime = totalTimeReal + projectedConNPT;

  const nptTime = (timelogs || [])
    .filter(rec => String(rec?.data?.sub_code_5 || '').toUpperCase() === 'NPT')
    .reduce((acc, rec) => acc + (Number(rec?.data?.duration) || 0), 0);

  const operativeTotal = totalTime - nptTime;
  const desvioOperativoTotal = operativeTotal - totalPlan;

  return Number.isFinite(desvioOperativoTotal) ? desvioOperativoTotal : 0;
}

function getInterventionTypeYpfName({ operation, typeGoals }) {
  if (!operation || !Array.isArray(typeGoals) || !typeGoals.length) return null;
  const match = typeGoals.find(rec => rec?.data?.operation_type === operation);
  const name = match?.data?.ypf_name;
  return name != null ? String(name).trim() : null;
}

export function buildNoCalidadCostsUI({
  wellPlanSteps,
  timelogData,
  nptData,
  typeGoals,
  operation,
  costReferences,
  planProductionParams,
}) {
  const desvioOperativoTotal = computeDesvioOperativoTotalHours({
    wellPlanSteps,
    timelogs: timelogData,
  });
  const horasDesvSinNPT = Math.max(0, Number(desvioOperativoTotal) || 0);

  const horasNPTGestionable = getGestionableNptHours(nptData);

  const { costoBarril, costoNPT, costoOperativo } = costReferences || {};
  const interventionType = getInterventionTypeYpfName({ operation, typeGoals });

  const costoOperHr =
    interventionType && costoOperativo?.[interventionType] != null
      ? Number(costoOperativo[interventionType])
      : 0;

  const costoDesvioOperativo = horasDesvSinNPT * (Number(costoOperHr) || 0);
  const costoDesvioNPTGestionable = horasNPTGestionable * (Number(costoNPT) || 0);

  const controlOil = planProductionParams?.controlOil;
  const incrementalOil = planProductionParams?.incrementalOil;
  const hasPlanProductionData = Number.isFinite(controlOil) && Number.isFinite(incrementalOil);
  const horasAfectadas = horasDesvSinNPT + horasNPTGestionable;

  let costoDesvioProdDiferida = 0;
  if (hasPlanProductionData && costoBarril != null) {
    const productionRate = (controlOil + incrementalOil) / 24;
    costoDesvioProdDiferida = horasAfectadas * Number(costoBarril) * productionRate;
  }

  const costoTotal = costoDesvioOperativo + costoDesvioNPTGestionable + costoDesvioProdDiferida;

  const costs = [
    { label: 'Costo Desvio Operativo:', value: formatUsd(costoDesvioOperativo) },
    { label: 'Costo Desvio NPT Gestionable:', value: formatUsd(costoDesvioNPTGestionable) },
    { label: 'Costo Desvio Prod. Diferida:', value: formatUsd(costoDesvioProdDiferida) },
    { label: 'Costo de No Calidad:', value: formatUsd(costoTotal) },
  ];

  return {
    costs,
    totalCost: formatUsd(costoTotal),
    debug: {
      interventionType,
      desvioOperativoTotal,
      horasDesvSinNPT,
      horasNPTGestionable,
      hasPlanProductionData,
    },
  };
}


