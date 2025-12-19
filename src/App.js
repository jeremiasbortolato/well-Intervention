import React, { useCallback, useEffect, useMemo, useState } from 'react';
import moment from 'moment-timezone';
import { AppContainer, AppHeader } from '@corva/ui/componentsV2';
import { useAppCommons } from '@corva/ui/effects';

import InterventionSelect from './components/InterventionSelect/InterventionSelect';
import BasicInformation from './components/BasicInformation/BasicInformation';
import PlannedVsActual from './components/PlannedVsActual/PlannedVsActual';
import NptClassification from './components/NptClassification/NptClassification';
import OperatingTimesChart from './components/OperatingTimesChart/OperatingTimesChart';
import LostTimeTreemap from './components/LostTimeTreemap/LostTimeTreemap';
import TopDeviationCauses from './components/TopDeviationCauses/TopDeviationCauses';
import OperationalSummary from './components/OperationalSummary/OperationalSummary';
import { NonQualityCostCard } from './components/OperationalSummary/OperationalSummary';
import PerformanceComparison from './components/PerformanceComparison/PerformanceComparison';
import InterventionCurveChart from './components/InterventionCurveChart';
import {
  fetchInterventionUnitEvents,
  fetchInterventionUnitWithActiveWell,
  fetchInterventionTypeGoals,
  fetchWellPlanData,
  fetchTimelogData,
  fetchNptEvents,
} from './api/intervention';
import {
  INTERVENTION_OPTIONS,
  BASIC_INFO_ITEMS,
  PLANNED_VS_ACTUAL_METRICS,
  NPT_ITEMS,
  NPT_CONSECUENCIAS,
  LOST_TIME_DATA,
  TOP_CAUSES_BLOCKS,
  OPERATIONAL_SUMMARY,
  PERFORMANCE_ROWS,
  INTERVENTION_TYPE_PROVIDER,
  INTERVENTION_TYPE_DATASET,
  INTERVENTION_COMPANY_ID,
} from './constants';

import styles from './App.css';

function App() {
  const { appKey, well, interventionUnit } = useAppCommons();
  const [selectedInterventionId, setSelectedInterventionId] = useState(
    INTERVENTION_OPTIONS[0].value
  );
  const [interventionEvents, setInterventionEvents] = useState([]);
  const [isLoadingEvents, setIsLoadingEvents] = useState(false);
  const [eventsError, setEventsError] = useState(null);
  const [typeGoals, setTypeGoals] = useState([]);
  const [isLoadingTypeGoals, setIsLoadingTypeGoals] = useState(false);
  const [typeGoalsError, setTypeGoalsError] = useState(null);
  const [wellPlanData, setWellPlanData] = useState([]);
  const [timelogData, setTimelogData] = useState([]);
  const [nptData, setNptData] = useState([]);
  const [isLoadingPlannedVsActual, setIsLoadingPlannedVsActual] = useState(false);
  const [activeWellDetails, setActiveWellDetails] = useState(null);

  useEffect(() => {
    const interventionUnitId = interventionUnit?.id;
    if (!interventionUnitId) {
      setActiveWellDetails(null);
      return;
    }

    let isMounted = true;

    const loadActiveWellFromUnit = async () => {
      try {
        const response = await fetchInterventionUnitWithActiveWell(interventionUnitId);
        if (!isMounted) return;

        const unit = Array.isArray(response?.data) ? response.data[0] : null;
        const included = Array.isArray(response?.included) ? response.included : [];

        const activeWellId = unit?.relationships?.active_well?.data?.id;
        if (!activeWellId) {
          setActiveWellDetails(null);
          return;
        }

        const includedWell = included.find(
          item => item?.type === 'well' && String(item?.id) === String(activeWellId)
        );

        const wellAttrs = includedWell?.attributes || {};
        setActiveWellDetails({
          id: String(includedWell?.id ?? activeWellId),
          name: wellAttrs?.name,
          area: wellAttrs?.area,
          settings: wellAttrs?.settings,
          asset_id: wellAttrs?.asset_id,
          raw: includedWell,
        });
      } catch (e) {
        if (!isMounted) return;
        setActiveWellDetails(null);
      }
    };

    loadActiveWellFromUnit();

    return () => {
      isMounted = false;
    };
  }, [interventionUnit?.id]);

  useEffect(() => {
    if (!well?.id) {
      return;
    }

    let isMounted = true;

    const loadEvents = async () => {
      setIsLoadingEvents(true);
      setEventsError(null);
      try {
        const response = await fetchInterventionUnitEvents(well.id);
        if (!isMounted) return;

        const eventsArray = Array.isArray(response?.data)
          ? response.data
          : Array.isArray(response)
          ? response
          : [];

        const normalizedEvents = eventsArray.map((event, index) => {
          const attributes = event?.attributes || {};
          const relationships = event?.relationships || {};
          const wellRelationshipId = relationships?.well?.data?.id;
          const fallbackWellId = attributes?.well_id || event?.well_id;
          // integration_id is used as event_id in the datasets (e.g., "E2Efu")
          const integrationId = attributes?.integration_id || event?.integration_id;

          return {
            id: String(event?.id ?? attributes?.id ?? index),
            integrationId: String(integrationId ?? ''),
            operation: attributes?.operation || event?.operation || 'Sin datos',
            wellId: String(wellRelationshipId ?? fallbackWellId ?? ''),
            raw: event,
          };
        });

        // eslint-disable-next-line no-console
        console.log('[App] Loaded intervention events:', normalizedEvents);

        setInterventionEvents(normalizedEvents);
      } catch (error) {
        if (!isMounted) return;
        setEventsError(error);
        setInterventionEvents([]);
      } finally {
        if (isMounted) {
          setIsLoadingEvents(false);
        }
      }
    };

    loadEvents();

    return () => {
      isMounted = false;
    };
  }, [well?.id]);

  useEffect(() => {
    let isMounted = true;

    const loadTypeGoals = async () => {
      setIsLoadingTypeGoals(true);
      setTypeGoalsError(null);
      try {
        const response = await fetchInterventionTypeGoals({
          companyId: INTERVENTION_COMPANY_ID,
          provider: INTERVENTION_TYPE_PROVIDER,
          dataset: INTERVENTION_TYPE_DATASET,
        });

        if (!isMounted) return;
        setTypeGoals(response);
      } catch (error) {
        if (!isMounted) return;
        setTypeGoalsError(error);
        setTypeGoals([]);
      } finally {
        if (isMounted) {
          setIsLoadingTypeGoals(false);
        }
      }
    };

    loadTypeGoals();

    return () => {
      isMounted = false;
    };
  }, []);

  const interventionTypeMap = useMemo(() => {
    return typeGoals.reduce((acc, record) => {
      const data = record?.data || {};
      const operation = data.operation_type;
      const ypfName = data.ypf_name;
      if (operation && ypfName) {
        acc[operation] = ypfName;
      }
      return acc;
    }, {});
  }, [typeGoals]);

  const getInterventionDisplayName = useCallback(
    operation => {
      if (!operation) return 'Sin datos';
      return interventionTypeMap[operation] || operation;
    },
    [interventionTypeMap]
  );

  const eventsForWell = useMemo(() => {
    const wellId = well?.id ? String(well.id) : null;
    if (!wellId) {
      return [];
    }

    return interventionEvents.filter(event => event.wellId === wellId);
  }, [interventionEvents, well?.id]);

  const interventionOptions = useMemo(() => {
    const options = eventsForWell.map(event => ({
      label: getInterventionDisplayName(event.operation),
      value: event.id,
    }));

    return options.length ? options : INTERVENTION_OPTIONS;
  }, [eventsForWell, getInterventionDisplayName]);

  useEffect(() => {
    if (!eventsForWell.length) {
      setSelectedInterventionId(INTERVENTION_OPTIONS[0].value);
      return;
    }

    setSelectedInterventionId(prev => {
      const exists = eventsForWell.some(event => event.id === prev);
      return exists ? prev : eventsForWell[0].id;
    });
  }, [eventsForWell]);

  const selectedEvent = useMemo(() => {
    if (!eventsForWell.length) {
      return null;
    }
    return eventsForWell.find(event => event.id === selectedInterventionId) || null;
  }, [eventsForWell, selectedInterventionId]);

  // Extract primitive values for useEffect dependencies to avoid re-fetching on object reference changes
  const assetId = well?.asset_id || well?.assetId || interventionUnit?.asset_id;
  const eventId = selectedEvent?.integrationId;

  // Load Planned vs Actual data when event is selected
  useEffect(() => {
    // eslint-disable-next-line no-console
    console.log('[App] PlannedVsActual check:', { assetId, eventId });

    if (!assetId || !eventId) {
      // eslint-disable-next-line no-console
      console.log('[App] Missing assetId or eventId, skipping fetch');
      setWellPlanData([]);
      setTimelogData([]);
      setNptData([]);
      return;
    }

    let isMounted = true;

    const loadInterventionData = async () => {
      setIsLoadingPlannedVsActual(true);
      // eslint-disable-next-line no-console
      console.log('[App] Fetching intervention data:', { assetId, eventId });

      // Use Promise.allSettled to prevent one failure from blocking others
      const [wellPlanResult, timelogResult, nptResult] = await Promise.allSettled([
        fetchWellPlanData({ assetId, eventId }),
        fetchTimelogData({ assetId, eventId }),
        fetchNptEvents({ assetId, eventId }),
      ]);

      if (!isMounted) return;

      // Handle wellPlan
      if (wellPlanResult.status === 'fulfilled') {
        // eslint-disable-next-line no-console
        console.log('[App] WellPlan response:', wellPlanResult.value);
        setWellPlanData(wellPlanResult.value);
      } else {
        console.error('Error fetching wellPlan:', wellPlanResult.reason);
        setWellPlanData([]);
      }

      // Handle timelog
      if (timelogResult.status === 'fulfilled') {
        // eslint-disable-next-line no-console
        console.log('[App] Timelog response:', timelogResult.value);
        setTimelogData(timelogResult.value);
      } else {
        console.error('Error fetching timelog:', timelogResult.reason);
        setTimelogData([]);
      }

      // Handle NPT
      if (nptResult.status === 'fulfilled') {
        // eslint-disable-next-line no-console
        console.log('[App] NPT response:', nptResult.value);
        setNptData(nptResult.value);
      } else {
        console.error('Error fetching NPT:', nptResult.reason);
        setNptData([]);
      }

      if (isMounted) {
        setIsLoadingPlannedVsActual(false);
      }
    };

    loadInterventionData();

    return () => {
      isMounted = false;
    };
  }, [assetId, eventId]);

  const interventionType = useMemo(() => {
    if (eventsForWell.length) {
      return getInterventionDisplayName(selectedEvent?.operation);
    }
    const fallbackOption = INTERVENTION_OPTIONS.find(
      option => option.value === selectedInterventionId
    );
    return (
      fallbackOption?.label || (isLoadingEvents || isLoadingTypeGoals ? 'Cargando...' : 'Sin datos')
    );
  }, [
    eventsForWell.length,
    selectedEvent,
    selectedInterventionId,
    isLoadingEvents,
    isLoadingTypeGoals,
    getInterventionDisplayName,
  ]);

  // Calculate Planned vs Actual metrics
  const plannedVsActualMetrics = useMemo(() => {
    // Well Planning Último (report_no from the single well plan record)
    const lastReportNo = wellPlanData[0]?.data?.report_no ?? '-';

    // Tiempo Planificado = estimated_duration (in hours)
    const plannedTimeHours = wellPlanData[0]?.data?.estimated_duration ?? 0;

    // Tiempo Total Real = sum of duration from timelog (in hours)
    const actualTimeHours = timelogData.reduce((sum, record) => {
      const duration = record?.data?.duration ?? 0;
      return sum + duration;
    }, 0);

    // Calculate NPT Total
    const gestionableCodes = new Set(
      NPT_CONSECUENCIAS.filter(c => c.tipo === 'Gestionable').map(c => String(Number(c.codigo)))
    );
    const noGestionableCodes = new Set(
      NPT_CONSECUENCIAS.filter(c => c.tipo === 'No gestionable').map(c => String(Number(c.codigo)))
    );

    let gestionable = 0;
    let noGestionable = 0;

    nptData.forEach(rec => {
      const codeRaw = rec?.data?.npt_consecuencia;
      if (!codeRaw) return;
      const code = String(Number(codeRaw));
      const duration = rec?.data?.duration || 0;
      if (gestionableCodes.has(code)) gestionable += duration;
      if (noGestionableCodes.has(code)) noGestionable += duration;
    });

    const totalNpt = gestionable + noGestionable;

    // Tiempo Real s/NPT = Tiempo Total Real - NPT Total
    const actualTimeWithoutNpt = Math.max(0, actualTimeHours - totalNpt);

    // Calculate deviation percentage
    const deviation =
      plannedTimeHours > 0 ? ((actualTimeHours - plannedTimeHours) / plannedTimeHours) * 100 : 0;

    const deviationSign = deviation >= 0 ? '+' : '';
    const deviationText = `${deviationSign} ${deviation.toFixed(1)} %`;

    // Calculate operational deviation: Desvío Operativo = 1 - (Tiempo Real s/NPT / Tiempo Planificado) [%]
    const operationalDeviation =
      plannedTimeHours > 0
        ? ( (actualTimeWithoutNpt / plannedTimeHours)-1) * 100
        : 0;

    const operationalDeviationSign = operationalDeviation >= 0 ? '+' : '';
    const operationalDeviationText = `${operationalDeviationSign} ${operationalDeviation.toFixed(1)} %`;

    return {
      metrics: [
        { label: 'Well Planing Ultimo', value: lastReportNo },
        { label: 'Tiempo Planificado', value: plannedTimeHours.toFixed(1), unit: 'hs' },
        { label: 'Tiempo Total Real', value: actualTimeHours.toFixed(1), unit: 'hs' },
        { label: 'Tiempo Real s/NPT', value: actualTimeWithoutNpt.toFixed(1), unit: 'hs' },
      ],
      deviation: deviationText,
      deviationNumeric: deviation,
      operationalDeviation: operationalDeviationText,
      operationalDeviationNumeric: operationalDeviation,
    };
  }, [wellPlanData, timelogData, nptData]);

  // Calculate NPT Classification metrics
  const nptClassificationItems = useMemo(() => {
    // Build sets of codes by type
    const gestionableCodes = new Set(
      NPT_CONSECUENCIAS.filter(c => c.tipo === 'Gestionable').map(c => String(Number(c.codigo)))
    );
    const noGestionableCodes = new Set(
      NPT_CONSECUENCIAS.filter(c => c.tipo === 'No gestionable').map(c => String(Number(c.codigo)))
    );

    let gestionable = 0;
    let noGestionable = 0;

    nptData.forEach(rec => {
      const codeRaw = rec?.data?.npt_consecuencia;
      if (!codeRaw) return;
      const code = String(Number(codeRaw));
      const duration = rec?.data?.duration || 0;
      if (gestionableCodes.has(code)) gestionable += duration;
      if (noGestionableCodes.has(code)) noGestionable += duration;
    });

    const totalNpt = gestionable + noGestionable;

    // Calculate TNP Total = Sum of data.duration for "sub_code_5": "TNP" in timelogData
    const totalTnp = timelogData.reduce((sum, record) => {
      const subCode5 = record?.data?.sub_code_5;
      if (subCode5 === 'TNP') {
        return sum + (record?.data?.duration || 0);
      }
      return sum;
    }, 0);

    // Calculate Tiempo Real s/NPT = Tiempo Total Real - NPT Total
    const actualTimeHours = timelogData.reduce((sum, record) => {
      const duration = record?.data?.duration ?? 0;
      return sum + duration;
    }, 0);
    const actualTimeWithoutNpt = Math.max(0, actualTimeHours - totalNpt);

    // Calculate Tiempo Operativo = Tiempo Real s/NPT - TNP Total
    const tiempoOperativo = Math.max(0, actualTimeWithoutNpt - totalTnp);

    return [
      {
        label: 'Gestionable',
        value: `${Number(gestionable).toFixed(1)} hs`,
        isChip: true,
        numericValue: gestionable,
      },
      { label: 'No Gestionable', value: Number(noGestionable).toFixed(1), unit: 'hs' },
      { label: 'NPT Total', value: Number(totalNpt).toFixed(1), unit: 'hs' },
      {
        label: 'TNP Total',
        value: `${totalTnp.toFixed(1)} hs`,
        isChip: true,
        numericValue: totalTnp,
      },
      { label: 'Tiempo Operativo', value: tiempoOperativo.toFixed(1), unit: 'hs' },
    ];
  }, [nptData, timelogData]);

  // Calculate Operating Times data grouped by sub_code_5
  const operatingTimesData = useMemo(() => {
    // Group durations by sub_code_5
    const groupedByCode = {};

    timelogData.forEach(rec => {
      const code = rec?.data?.sub_code_5;
      if (!code) return;
      const duration = rec?.data?.duration || 0;
      groupedByCode[code] = (groupedByCode[code] || 0) + duration;
    });

    // Convert to arrays for the chart
    const entries = Object.entries(groupedByCode);

    // Sort by duration descending for better visualization
    entries.sort((a, b) => b[1] - a[1]);

    const categories = entries.map(([code]) => code);
    const values = entries.map(([, duration]) => Number(duration.toFixed(1)));

    return { categories, values };
  }, [timelogData]);

  // Calculate Intervention Curve Chart data (Curva Plana)
  const interventionCurveData = useMemo(() => {
    // Build real series from timelogData grouped by step_no
    const realByStep = {};
    const allStepNos = new Set();

    timelogData.forEach(rec => {
      const stepNo = rec?.data?.step_no;
      if (stepNo === undefined || stepNo === null) return;
      const duration = rec?.data?.duration || 0;
      allStepNos.add(stepNo);
      if (!realByStep[stepNo]) {
        realByStep[stepNo] = { hours: 0, desc: rec?.data?.description || '' };
      }
      realByStep[stepNo].hours += duration;
    });

    // Build NPT by step
    const nptByStep = {};
    nptData.forEach(rec => {
      const stepNo = rec?.data?.step_no;
      if (stepNo === undefined || stepNo === null) return;
      const duration = rec?.data?.duration || 0;
      allStepNos.add(stepNo);
      nptByStep[stepNo] = (nptByStep[stepNo] || 0) + duration;
    });

    // Sort by stepNumber and calculate cumulative duration for Real
    const realSteps = Object.entries(realByStep)
      .map(([stepNo, data]) => ({
        stepNumber: Number(stepNo),
        hours: data.hours,
        desc: data.desc,
      }))
      .sort((a, b) => a.stepNumber - b.stepNumber);

    let realAccum = 0;
    const real = realSteps.map(step => {
      realAccum += step.hours;
      return {
        stepNumber: step.stepNumber,
        duration: realAccum,
        hours: step.hours,
        desc: step.desc,
      };
    });

    // Build realWONPT (real without NPT) - exclude NPT durations
    let realWONPTAccum = 0;
    const realWONPT = realSteps.map(step => {
      const nptHours = nptByStep[step.stepNumber] || 0;
      const hoursWithoutNPT = Math.max(0, step.hours - nptHours);
      realWONPTAccum += hoursWithoutNPT;
      return {
        stepNumber: step.stepNumber,
        duration: realWONPTAccum,
        hours: hoursWithoutNPT,
        desc: step.desc,
      };
    });

    // Build plan series
    // First try to get from wellPlanData steps, if not available use estimated_duration
    const planSteps = wellPlanData[0]?.data?.steps;
    let plan = [];

    if (Array.isArray(planSteps) && planSteps.length > 0) {
      // If wellPlanData has steps array, use it
      let planAccum = 0;
      plan = planSteps
        .filter(step => step.step_no !== undefined && step.step_no !== null)
        .map(step => {
          const hours = step.estimated_duration || step.duration || 0;
          planAccum += hours;
          return {
            stepNumber: step.step_no,
            duration: planAccum,
            hours,
            desc: step.description || '',
          };
        })
        .sort((a, b) => a.stepNumber - b.stepNumber);
    } else if (real.length > 0) {
      // Fallback: create plan based on estimated_duration spread across steps
      const totalEstimated = wellPlanData[0]?.data?.estimated_duration || 0;
      const avgHoursPerStep = real.length > 0 ? totalEstimated / real.length : 0;

      let planAccum = 0;
      plan = realSteps.map(step => {
        const hours = avgHoursPerStep;
        planAccum += hours;
        return {
          stepNumber: step.stepNumber,
          duration: planAccum,
          hours,
          desc: step.desc,
        };
      });
    }

    // Calculate forecast (projection from last real point to end of plan)
    const forecast = [];
    const forecastWONPT = [];

    if (real.length > 0 && plan.length > 0) {
      const lastReal = real[real.length - 1];
      const lastRealWONPT = realWONPT[realWONPT.length - 1];

      // Get remaining plan steps (if plan extends beyond real)
      const remainingPlanSteps = plan.filter(p => p.stepNumber > lastReal.stepNumber);

      if (remainingPlanSteps.length > 0) {
        // Calculate forecast
        let forecastAccum = lastReal.duration;
        remainingPlanSteps.forEach(planStep => {
          forecastAccum += planStep.hours;
          forecast.push({
            stepNumber: planStep.stepNumber,
            duration: forecastAccum,
            hours: planStep.hours,
            desc: planStep.desc,
          });
        });

        // Calculate forecastWONPT
        let forecastWONPTAccum = lastRealWONPT.duration;
        remainingPlanSteps.forEach(planStep => {
          forecastWONPTAccum += planStep.hours;
          forecastWONPT.push({
            stepNumber: planStep.stepNumber,
            duration: forecastWONPTAccum,
            hours: planStep.hours,
            desc: planStep.desc,
          });
        });
      }
    }

    // Calculate metrics
    const totalNptHours = Object.values(nptByStep).reduce((sum, h) => sum + h, 0);
    const totalPlanHours = plan.length > 0 ? plan[plan.length - 1].duration : 0;
    const totalRealHours = real.length > 0 ? real[real.length - 1].duration : 0;
    const totalRealWONPTHours = realWONPT.length > 0 ? realWONPT[realWONPT.length - 1].duration : 0;

    // Desvío Operativo = (Real sin NPT - Plan) / Plan * 100
    const desvioOperativo =
      totalPlanHours > 0 ? ((totalRealWONPTHours - totalPlanHours) / totalPlanHours) * 100 : 0;

    // Desvío Proyectado = (Real total proyectado - Plan) / Plan * 100
    const projectedTotal =
      forecast.length > 0 ? forecast[forecast.length - 1].duration : totalRealHours;
    const desvioProyectado =
      totalPlanHours > 0 ? ((projectedTotal - totalPlanHours) / totalPlanHours) * 100 : 0;

    return {
      plan,
      real,
      realWONPT,
      forecast,
      forecastWONPT,
      nptTotal: totalNptHours,
      desvioOperativo,
      desvioProyectado,
    };
  }, [wellPlanData, timelogData, nptData]);

  const basicInfoItems = useMemo(() => {
    const tz =
      well?.settings?.timezone || activeWellDetails?.settings?.timezone || moment.tz.guess();

    let minStart = null;
    let maxEnd = null;

    if (Array.isArray(timelogData) && timelogData.length) {
      for (const row of timelogData) {
        const start = row?.data?.start_time;
        const end = row?.data?.end_time;

        if (typeof start === 'number' && Number.isFinite(start)) {
          minStart = minStart == null ? start : Math.min(minStart, start);
        }

        if (typeof end === 'number' && Number.isFinite(end)) {
          maxEnd = maxEnd == null ? end : Math.max(maxEnd, end);
        }
      }
    }

    const formatTs = ts =>
      ts == null ? '-' : moment.unix(ts).tz(tz).format('DD/MM/YYYY HH:mm');

    const fechaInicio = { label: 'Fecha Inicio', value: formatTs(minStart), unit: '' };
    const fechaFin = { label: 'Fecha Fin', value: formatTs(maxEnd), unit: '' };

    return [
      { label: 'Equipo', value: interventionUnit?.name || 'Sin datos' },
      { label: 'Pozo', value: well?.name || activeWellDetails?.name || 'Sin datos' },
      { label: 'Tipo de Intervención', value: interventionType },
      fechaInicio,
      fechaFin,
      {
        label: 'Yacimiento',
        value: well?.settings?.basin || activeWellDetails?.settings?.basin || 'Sin datos',
      },
      { label: 'Área', value: activeWellDetails?.area || well?.area || 'Sin datos' },
    ];
  }, [
    interventionUnit?.name,
    interventionType,
    well?.name,
    well?.settings?.basin,
    well?.settings?.timezone,
    well?.area,
    activeWellDetails?.name,
    activeWellDetails?.settings?.basin,
    activeWellDetails?.settings?.timezone,
    activeWellDetails?.area,
    timelogData,
  ]);

  return (
    <AppContainer header={<AppHeader />} testId={appKey}>
      <div className={styles.page}>
        <div className={styles.topRow}>
          <InterventionSelect
            label="Tipo de intervención"
            value={selectedInterventionId}
            options={interventionOptions}
            onChange={setSelectedInterventionId}
          />
        </div>

        <BasicInformation
          title="Información Básica"
          badgeText="Objetivo Final Cumplido"
          items={basicInfoItems}
        />

        <div className={styles.metricsRow}>
          <div className={styles.metricsColumn}>
            <PlannedVsActual
              title="Tiempo Planificado vs Real"
              statusText={isLoadingPlannedVsActual ? 'Cargando...' : null}
              metrics={
                isLoadingPlannedVsActual ? PLANNED_VS_ACTUAL_METRICS : plannedVsActualMetrics.metrics
              }
              deviationLabel="Desvío"
              deviationValue={isLoadingPlannedVsActual ? '-' : plannedVsActualMetrics.deviation}
              deviationNumeric={
                isLoadingPlannedVsActual ? undefined : plannedVsActualMetrics.deviationNumeric
              }
              operationalDeviationLabel="Desvío Operativo"
              operationalDeviationValue={
                isLoadingPlannedVsActual ? '-' : plannedVsActualMetrics.operationalDeviation
              }
              operationalDeviationNumeric={
                isLoadingPlannedVsActual
                  ? undefined
                  : plannedVsActualMetrics.operationalDeviationNumeric
              }
            />
          </div>
          <div className={styles.metricsColumn}>
            <NptClassification
              title="Clasificación de Tiempos No Productivos"
              items={isLoadingPlannedVsActual ? NPT_ITEMS : nptClassificationItems}
              plannedTimeHours={
                isLoadingPlannedVsActual
                  ? undefined
                  : wellPlanData[0]?.data?.estimated_duration ?? 0
              }
            />
          </div>
        </div>

        <div className={styles.nonQualityCostRow}>
          <NonQualityCostCard
            costTitle="Costo de No Calidad"
            costs={OPERATIONAL_SUMMARY.costs}
            totalCost={OPERATIONAL_SUMMARY.totalCost}
          />
        </div>

        <div className={styles.operatingTimesRow}>
          <OperatingTimesChart
            title="Clasificación de Tiempos Operativos"
            categories={operatingTimesData.categories}
            values={operatingTimesData.values}
          />
        </div>

        <div className={styles.secondaryRow}>
          <div className={styles.secondaryLeft}>
            <LostTimeTreemap
              title="Tiempo Perdido por Causa"
              linkLabel="See All"
              data={LOST_TIME_DATA}
            />
          </div>
          <div className={styles.secondaryRight}>
            <TopDeviationCauses title="Top 5 Causas de Desvío" blocks={TOP_CAUSES_BLOCKS} />
          </div>
        </div>

        <div className={styles.tertiaryRow}>
          <div className={styles.tertiaryLeft}>
            <OperationalSummary
              title="Resumen Operativo de la Intervención"
              unscrews={OPERATIONAL_SUMMARY.unscrews}
              dragLevels={OPERATIONAL_SUMMARY.dragLevels}
              tests={OPERATIONAL_SUMMARY.tests}
              costTitle="Costo de No Calidad"
              costs={OPERATIONAL_SUMMARY.costs}
              totalCost={OPERATIONAL_SUMMARY.totalCost}
              showCostCard={false}
            />
          </div>
          <div className={styles.tertiaryRight}>
            <PerformanceComparison
              title="Comparación de Performance vs Carta Oferta"
              rows={PERFORMANCE_ROWS}
            />
          </div>
        </div>

        {/* Curva Plana de la Intervención */}
        <div className={styles.curveChartRow}>
          <InterventionCurveChart
            title="Curva Plana de la Intervención con Desvíos"
            plan={interventionCurveData.plan}
            real={interventionCurveData.real}
            realWONPT={interventionCurveData.realWONPT}
            forecast={interventionCurveData.forecast}
            forecastWONPT={interventionCurveData.forecastWONPT}
            nptTotal={interventionCurveData.nptTotal}
            desvioOperativo={interventionCurveData.desvioOperativo}
            desvioProyectado={interventionCurveData.desvioProyectado}
            isLoading={isLoadingPlannedVsActual}
            height={550}
          />
        </div>

        {eventsError ? (
          <div className={styles.errorMessage}>
            No se pudieron cargar los eventos de intervención.
          </div>
        ) : null}
      </div>
    </AppContainer>
  );
}

// Important: Do not change root component default export (App.js). Use it as container
//  for your App. It's required to make build and zip scripts work as expected;
export default App;
