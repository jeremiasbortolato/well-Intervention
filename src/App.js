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
import OperationalSummary from './components/OperationalSummary/OperationalSummary';
import { NonQualityCostCard } from './components/OperationalSummary/OperationalSummary';
import PerformanceComparison from './components/PerformanceComparison/PerformanceComparison';
import InterventionCurveChart from './components/InterventionCurveChart';
import PressureTestsSection from './components/PressureTestsSection/PressureTestsSection';
import Comments from './components/Comments/Comments';
import {
  fetchInterventionUnitEvents,
  fetchInterventionTypeGoals,
  fetchWellPlanData,
  fetchTimelogData,
  fetchNptEvents,
  getNoCalidadCosts,
  getNPTByConsequence,
  getTNPByOpSubcode,
  getOperationalLostTime,
  getWellComments,
  getTraceComments,
  getPerformanceComparisonData,
} from './api/intervention';
import {
  INTERVENTION_OPTIONS,
  BASIC_INFO_ITEMS,
  PLANNED_VS_ACTUAL_METRICS,
  NPT_ITEMS,
  NPT_CONSECUENCIAS,
  LOST_TIME_DATA,
  OPERATIONAL_SUMMARY,
  PERFORMANCE_ROWS,
  INTERVENTION_TYPE_PROVIDER,
  INTERVENTION_TYPE_DATASET,
  INTERVENTION_COMPANY_ID,
} from './constants';

import styles from './App.css';

const getInterventionTimeRange = ({ selectedEvent, timelogData }) => {
  const normalizeUnixSeconds = (value) => {
    if (typeof value !== 'number' || !Number.isFinite(value)) return null;
    // ms timestamps are typically > 1e11, seconds are ~1e9
    return value > 1e11 ? Math.floor(value / 1000) : Math.floor(value);
  };

  const parseToUnixSeconds = (value) => {
    if (value == null) return null;
    if (typeof value === 'number') return normalizeUnixSeconds(value);
    if (typeof value === 'string') {
      const trimmed = value.trim();
      const parsedMs = Date.parse(trimmed);
      if (!Number.isNaN(parsedMs)) return Math.floor(parsedMs / 1000);
      const asNumber = Number(trimmed);
      if (Number.isFinite(asNumber)) return normalizeUnixSeconds(asNumber);
    }
    return null;
  };

  const eventAttrs = selectedEvent?.raw?.attributes || {};
  const startCandidates = [
    eventAttrs.start_time,
    eventAttrs.started_at,
    eventAttrs.start_at,
    eventAttrs.start,
    eventAttrs.begin_at,
    eventAttrs.begin_time,
  ];
  const endCandidates = [
    eventAttrs.end_time,
    eventAttrs.ended_at,
    eventAttrs.end_at,
    eventAttrs.end,
    eventAttrs.finish_at,
    eventAttrs.finish_time,
  ];

  let startTime = startCandidates.map(parseToUnixSeconds).find(v => v != null) ?? null;
  let endTime = endCandidates.map(parseToUnixSeconds).find(v => v != null) ?? null;

  if ((startTime == null || endTime == null) && Array.isArray(timelogData) && timelogData.length) {
    let minStart = null;
    let maxEnd = null;

    timelogData.forEach((row) => {
      const start = normalizeUnixSeconds(row?.data?.start_time);
      const end = normalizeUnixSeconds(row?.data?.end_time);

      if (start != null) {
        minStart = minStart == null ? start : Math.min(minStart, start);
      }

      if (end != null) {
        maxEnd = maxEnd == null ? end : Math.max(maxEnd, end);
      }
    });

    if (startTime == null) startTime = minStart;
    if (endTime == null) endTime = maxEnd;
  }

  if (startTime != null && endTime == null) {
    endTime = Math.floor(Date.now() / 1000);
  }

  return { startTime, endTime };
};

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
  const [qualityCosts, setQualityCosts] = useState(null);
  const [isLoadingCosts, setIsLoadingCosts] = useState(false);
  const [nptByConsequence, setNptByConsequence] = useState([]);
  const [isLoadingNptConsequence, setIsLoadingNptConsequence] = useState(false);
  const [tnpByOpSubcode, setTnpByOpSubcode] = useState([]);
  const [isLoadingTnpSubcode, setIsLoadingTnpSubcode] = useState(false);
  const [operationalLostTime, setOperationalLostTime] = useState([]);
  const [isLoadingOperationalLostTime, setIsLoadingOperationalLostTime] = useState(false);
  const [performanceData, setPerformanceData] = useState([]);
  const [isLoadingPerformance, setIsLoadingPerformance] = useState(false);
  const [isLoadingComments, setIsLoadingComments] = useState(false);

  useEffect(() => {
    if (!well?.id) {
      setActiveWellDetails(null);
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

        // Extract well details from included data
        const included = Array.isArray(response?.included) ? response.included : [];
        const includedWell = included.find(
          item => item?.type === 'well' && String(item?.id) === String(well.id)
        );

        if (includedWell) {
          const wellAttrs = includedWell?.attributes || {};
          setActiveWellDetails({
            id: String(includedWell?.id ?? well.id),
            name: wellAttrs?.name,
            area: wellAttrs?.area,
            settings: wellAttrs?.settings,
            asset_id: wellAttrs?.asset_id,
            raw: includedWell,
          });
        } else {
          setActiveWellDetails(null);
        }
      } catch (error) {
        if (!isMounted) return;
        setEventsError(error);
        setInterventionEvents([]);
        setActiveWellDetails(null);
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

  // Calculate quality costs (Costo de No Calidad) when data is loaded
  useEffect(() => {
    if (!assetId || !eventId || !well?.id || isLoadingPlannedVsActual) {
      return;
    }

    let isMounted = true;

    const calculateCosts = async () => {
      setIsLoadingCosts(true);
      try {
        const costs = await getNoCalidadCosts({
          assetId,
          eventId,
          wellId: well.id,
          companyId: INTERVENTION_COMPANY_ID,
          provider: INTERVENTION_TYPE_PROVIDER,
          dataset: INTERVENTION_TYPE_DATASET,
          nptConsequences: NPT_CONSECUENCIAS,
        });

        if (isMounted) {
          setQualityCosts(costs);
          setIsLoadingCosts(false);
        }
      } catch (error) {
        console.error('Error calculating quality costs:', error);
        if (isMounted) {
          setQualityCosts(null);
          setIsLoadingCosts(false);
        }
      }
    };

    calculateCosts();

    return () => {
      isMounted = false;
    };
  }, [assetId, eventId, well?.id, isLoadingPlannedVsActual]);

  // Load NPT by Consequence data (for treemap)
  useEffect(() => {
    if (!assetId || !eventId || isLoadingPlannedVsActual) {
      return;
    }

    let isMounted = true;

    const loadNPTConsequence = async () => {
      setIsLoadingNptConsequence(true);
      try {
        const data = await getNPTByConsequence({
          assetId,
          eventId,
          nptConsequences: NPT_CONSECUENCIAS,
          topN: 5,
        });

        if (isMounted) {
          setNptByConsequence(data);
          setIsLoadingNptConsequence(false);
        }
      } catch (error) {
        console.error('Error loading NPT by consequence:', error);
        if (isMounted) {
          setNptByConsequence([]);
          setIsLoadingNptConsequence(false);
        }
      }
    };

    loadNPTConsequence();

    return () => {
      isMounted = false;
    };
  }, [assetId, eventId, isLoadingPlannedVsActual]);

  // Load TNP by Op Subcode data (for treemap)
  useEffect(() => {
    if (!assetId || !eventId || isLoadingPlannedVsActual) {
      return;
    }

    let isMounted = true;

    const loadTNPSubcode = async () => {
      setIsLoadingTnpSubcode(true);
      try {
        const data = await getTNPByOpSubcode({
          assetId,
          eventId,
          topN: 5,
        });

        if (isMounted) {
          setTnpByOpSubcode(data);
          setIsLoadingTnpSubcode(false);
        }
      } catch (error) {
        console.error('Error loading TNP by op_subcode:', error);
        if (isMounted) {
          setTnpByOpSubcode([]);
          setIsLoadingTnpSubcode(false);
        }
      }
    };

    loadTNPSubcode();

    return () => {
      isMounted = false;
    };
  }, [assetId, eventId, isLoadingPlannedVsActual]);

  // Load Operational Lost Time data (for treemap)
  useEffect(() => {
    if (!assetId) {
      return;
    }

    let isMounted = true;

    const loadOperationalLostTime = async () => {
      setIsLoadingOperationalLostTime(true);
      try {
        const { startTime, endTime } = getInterventionTimeRange({ selectedEvent, timelogData });
        const params = { assetId, topN: 5 };
        if (startTime != null && endTime != null) {
          params.startTime = startTime;
          params.endTime = endTime;
        }

        const data = await getOperationalLostTime(params);

        if (isMounted) {
          setOperationalLostTime(data);
          setIsLoadingOperationalLostTime(false);
        }
      } catch (error) {
        console.error('Error loading operational lost time:', error);
        if (isMounted) {
          setOperationalLostTime([]);
          setIsLoadingOperationalLostTime(false);
        }
      }
    };

    loadOperationalLostTime();

    return () => {
      isMounted = false;
    };
  }, [assetId, selectedInterventionId, selectedEvent, timelogData]);

  // Raw comments data from API
  const [rawCommentsData, setRawCommentsData] = useState([]);
  const [rawTraceComments, setRawTraceComments] = useState([]);

  // Load Comments data
  useEffect(() => {
    if (!assetId) {
      setRawCommentsData([]);
      return;
    }

    let isMounted = true;

    const loadComments = async () => {
      setIsLoadingComments(true);
      try {
        // Fetch all comments for the asset
        const data = await getWellComments({ assetId });

        if (isMounted) {
          setRawCommentsData(data);
          setIsLoadingComments(false);
        }
      } catch (error) {
        console.error('Error loading comments:', error);
        if (isMounted) {
          setRawCommentsData([]);
          setIsLoadingComments(false);
        }
      }
    };

    loadComments();

    return () => {
      isMounted = false;
    };
  }, [assetId]);

  // Load Trace Comments data (traces_memo from tracing app)
  useEffect(() => {
    if (!assetId) {
      setRawTraceComments([]);
      return;
    }

    let isMounted = true;

    const loadTraceComments = async () => {
      try {
        const data = await getTraceComments({ assetId });

        if (isMounted) {
          setRawTraceComments(data);
        }
      } catch (error) {
        console.error('Error loading trace comments:', error);
        if (isMounted) {
          setRawTraceComments([]);
        }
      }
    };

    loadTraceComments();

    return () => {
      isMounted = false;
    };
  }, [assetId]);

  // Load Performance Comparison data (Comparación de Performance vs Carta Oferta)
  useEffect(() => {
    if (!assetId || !eventId || isLoadingPlannedVsActual) {
      return;
    }

    let isMounted = true;

    const loadPerformanceData = async () => {
      setIsLoadingPerformance(true);
      try {
        const data = await getPerformanceComparisonData({
          assetId,
          eventId,
          companyId: INTERVENTION_COMPANY_ID,
        });

        if (isMounted) {
          setPerformanceData(data);
          setIsLoadingPerformance(false);
        }
      } catch (error) {
        console.error('Error loading performance comparison data:', error);
        if (isMounted) {
          setPerformanceData([]);
          setIsLoadingPerformance(false);
        }
      }
    };

    loadPerformanceData();

    return () => {
      isMounted = false;
    };
  }, [assetId, eventId, isLoadingPlannedVsActual]);

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

  // Format quality costs for UI display
  const formattedQualityCosts = useMemo(() => {
    if (!qualityCosts || isLoadingCosts) {
      return {
        costs: OPERATIONAL_SUMMARY.costs,
        postTotalCosts: OPERATIONAL_SUMMARY.postTotalCosts || [],
        totalCost: OPERATIONAL_SUMMARY.totalCost,
      };
    }

    const formatCurrency = (value) => {
      if (!value && value !== 0) return '-';
      // Format with 2 decimal places, no thousands separator (matches KPIs app format)
      return `$ ${Number(value).toFixed(2)}`;
    };

    const deferredValue = (() => {
      // If we don't have Production data, show "-" (even if numeric value is 0.00)
      if (!qualityCosts?.hasPlanProductionData) return '-';
      return formatCurrency(qualityCosts.costoDesvioProdDiferida);
    })();

    const costs = [
      {
        label: 'Costo Desvio Operativo:',
        value: formatCurrency(qualityCosts.costoDesvioOperativo),
      },
      {
        label: 'Costo Desvio NPT Gestionable:',
        value: formatCurrency(qualityCosts.costoDesvioNPTGestionable),
      },
    ];

    const totalCost = formatCurrency(qualityCosts.costoTotal);

    const postTotalCosts = [
      {
        label: 'Costo Desvio Prod. Diferida:',
        value: deferredValue,
      },
    ];

    return { costs, postTotalCosts, totalCost };
  }, [qualityCosts, isLoadingCosts]);

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

  const operatingTimesData = useMemo(() => {
    const plannedTimeHours = wellPlanData[0]?.data?.estimated_duration ?? 0;

    const actualTimeHours = timelogData.reduce((sum, record) => {
      const duration = record?.data?.duration ?? 0;
      return sum + duration;
    }, 0);

    // TNP Total = Sum of timelog durations where sub_code_5 === 'TNP'
    const tnpTotal = timelogData.reduce((sum, record) => {
      const subCode5 = record?.data?.sub_code_5;
      if (subCode5 === 'TNP') {
        return sum + (record?.data?.duration || 0);
      }
      return sum;
    }, 0);

    // NPT Gestionable / No Gestionable (desde nptData + NPT_CONSECUENCIAS)
    const gestionableCodes = new Set(
      NPT_CONSECUENCIAS.filter(c => c.tipo === 'Gestionable').map(c => String(Number(c.codigo)))
    );
    const noGestionableCodes = new Set(
      NPT_CONSECUENCIAS.filter(c => c.tipo === 'No gestionable').map(c => String(Number(c.codigo)))
    );

    let nptGestionable = 0;
    let nptNoGestionable = 0;

    nptData.forEach(rec => {
      const codeRaw = rec?.data?.npt_consecuencia;
      if (!codeRaw) return;
      const code = String(Number(codeRaw));
      const duration = rec?.data?.duration || 0;
      if (gestionableCodes.has(code)) nptGestionable += duration;
      if (noGestionableCodes.has(code)) nptNoGestionable += duration;
    });

    // PE = Tiempo_Operativo = Tiempo_Total_Real - TNP_Total - NPT_Total
    const tiempoOperativo = Math.max(0, actualTimeHours - tnpTotal - nptGestionable - nptNoGestionable);

    const pct = (value) => (actualTimeHours > 0 ? (value / actualTimeHours) * 100 : 0);

    // La barra de plan es proporcional: Tiempo_Planificado / Tiempo_Total_Real
    const planPercent = pct(plannedTimeHours);
    // La barra de desvío es el resto: (Tiempo_Total_Real - Tiempo_Planificado) / Tiempo_Total_Real
    const desvioTimeHours = Math.max(0, actualTimeHours - plannedTimeHours);
    const overPlanPercent = pct(desvioTimeHours);
    // Porcentaje de desvío real para mostrar en la leyenda: (Tiempo_Total_Real - Tiempo_Planificado) / Tiempo_Planificado * 100
    const overPlanPercentLabel = plannedTimeHours > 0 
      ? (desvioTimeHours / plannedTimeHours) * 100 
      : 0;

    return {
      planPercent,
      overPlanPercent,
      overPlanPercentLabel,
      items: [
        {
          key: 'pe',
          label: 'PE',
          percent: pct(tiempoOperativo),
          color: 'var(--icon-info-light, #7CC5FF)',
        },
        { key: 'tnp', label: 'TNP', percent: pct(tnpTotal), color: 'rgba(128, 133, 233, 1)' },
        {
          key: 'nptGestionable',
          label: 'NPT Gestionable',
          percent: pct(nptGestionable),
          color: 'var(--icon-success-light, #88DA8B)',
        },
        {
          key: 'nptNoGestionable',
          label: 'NPT No Gestionable',
          percent: pct(nptNoGestionable),
          color: 'var(--icon-danger-light, #F56565)',
        },
      ],
    };
  }, [wellPlanData, timelogData, nptData]);

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

    const normalizeUnixSeconds = (value) => {
      if (typeof value !== 'number' || !Number.isFinite(value)) return null;
      // ms timestamps are typically > 1e11, seconds are ~1e9
      return value > 1e11 ? Math.floor(value / 1000) : Math.floor(value);
    };

    const parseToUnixSeconds = (value) => {
      if (value == null) return null;
      if (typeof value === 'number') return normalizeUnixSeconds(value);
      if (typeof value === 'string') {
        const trimmed = value.trim();
        const parsedMs = Date.parse(trimmed);
        if (!Number.isNaN(parsedMs)) return Math.floor(parsedMs / 1000);
        const asNumber = Number(trimmed);
        if (Number.isFinite(asNumber)) return normalizeUnixSeconds(asNumber);
      }
      return null;
    };

    let minStart = null;
    let maxEnd = null;

    // Aggregate timelog data by step_no to get accurate timestamps
    // This mirrors the logic in days-vs-activity app
    if (Array.isArray(timelogData) && timelogData.length) {
      const stepMap = new Map();
      
      // Group by step_no and track min start_time and max end_time for each step
      for (const row of timelogData) {
        const stepNo = row?.data?.step_no;
        const start = parseToUnixSeconds(row?.data?.start_time);
        const end = parseToUnixSeconds(row?.data?.end_time);

        if (stepNo != null && Number.isFinite(Number(stepNo))) {
          const step = Number(stepNo);
          
          if (!stepMap.has(step)) {
            stepMap.set(step, { minStart: null, maxEnd: null });
          }
          
          const stepData = stepMap.get(step);
          
          if (typeof start === 'number' && Number.isFinite(start)) {
            stepData.minStart = stepData.minStart == null ? start : Math.min(stepData.minStart, start);
          }
          
          if (typeof end === 'number' && Number.isFinite(end)) {
            stepData.maxEnd = stepData.maxEnd == null ? end : Math.max(stepData.maxEnd, end);
          }
        }
      }
      
      // Get sorted steps (excluding step 0 which is just a starting point)
      const sortedSteps = Array.from(stepMap.entries())
        .sort(([a], [b]) => a - b)
        .filter(([step]) => step > 0);
      
      // Get minStart from first valid step (like days-vs-activity uses real[1]?.timestamp)
      const firstWithStart = sortedSteps.find(([, stepData]) => stepData.minStart != null);
      if (firstWithStart) {
        const [, firstStepData] = firstWithStart;
        minStart = firstStepData.minStart;
      }
      
      // Get maxEnd from all steps
      for (const stepData of stepMap.values()) {
        if (stepData.maxEnd != null) {
          maxEnd = maxEnd == null ? stepData.maxEnd : Math.max(maxEnd, stepData.maxEnd);
        }
      }
    }

    //if minStart is null, get the most recent spud release
    if (minStart == null) {
      const spudRelease = well?.settings?.spud_release || activeWellDetails?.settings?.spud_release;
      if (Array.isArray(spudRelease) && spudRelease.length) {
        // search the most recent release
        const mostRecentRelease = spudRelease
          .filter(entry => entry.release)
          .sort((a, b) => {
            const dateA = moment(a.release, 'MM/DD/YYYY HH:mm');
            const dateB = moment(b.release, 'MM/DD/YYYY HH:mm');
            return dateB.valueOf() - dateA.valueOf(); // lastest first
          })[0];

        if (mostRecentRelease?.release) {
          const releaseMoment = moment.tz(mostRecentRelease.release, 'MM/DD/YYYY HH:mm', tz);
          if (releaseMoment.isValid()) {
            minStart = releaseMoment.unix();
          }
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
    well?.settings?.spud_release,
    well?.area,
    activeWellDetails?.name,
    activeWellDetails?.settings?.basin,
    activeWellDetails?.settings?.timezone,
    activeWellDetails?.settings?.spud_release,
    activeWellDetails?.area,
    timelogData,
  ]);

  // Filter comments to only show those with stepNumber that exists in the current plan
  // and that are within Fecha Inicio / Fecha Fin from Información Básica
  const commentsData = useMemo(() => {
    const allComments = [...rawCommentsData, ...rawTraceComments];
    if (allComments.length === 0) {
      return [];
    }

    const { plan } = interventionCurveData;
    if (!Array.isArray(plan) || plan.length === 0) {
      // If no plan data, don't show any comments (matching days-vs-activity)
      return [];
    }

    // Create a Set of valid step numbers from the plan
    const validStepNumbers = new Set(plan.map(p => p.stepNumber));

    const tz =
      well?.settings?.timezone || activeWellDetails?.settings?.timezone || moment.tz.guess();

    const parseBasicInfoDate = (dateStr) => {
      if (!dateStr || dateStr === '-') return null;
      const parsed = moment.tz(dateStr, 'DD/MM/YYYY HH:mm', tz);
      return parsed.isValid() ? parsed.unix() : null;
    };

    const fechaInicioItem = basicInfoItems.find(item => item.label === 'Fecha Inicio');
    const fechaFinItem = basicInfoItems.find(item => item.label === 'Fecha Fin');
    const startTime = fechaInicioItem ? parseBasicInfoDate(fechaInicioItem.value) : null;
    const endTime = fechaFinItem ? parseBasicInfoDate(fechaFinItem.value) : null;

    return allComments.filter(comment => {
      const stepNumber = comment.stepNumber;
      if (stepNumber == null || !validStepNumbers.has(stepNumber)) {
        return false;
      }

      if (startTime != null && endTime != null) {
        if (comment.timeSeconds == null) return false;
        return comment.timeSeconds >= startTime && comment.timeSeconds <= endTime;
      }

      return true;
    });
  }, [
    rawCommentsData,
    rawTraceComments,
    interventionCurveData,
    basicInfoItems,
    well?.settings?.timezone,
    activeWellDetails?.settings?.timezone,
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
          // badgeText="Objetivo Final Cumplido"
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

        <div className={styles.operatingTimesRow}>
          <OperatingTimesChart
            title="Plan / Actual"
            planPercent={operatingTimesData.planPercent}
            overPlanPercent={operatingTimesData.overPlanPercent}
            overPlanPercentLabel={operatingTimesData.overPlanPercentLabel}
            items={operatingTimesData.items}
          />
        </div>

        <div className={styles.nonQualityCostRow}>
          <NonQualityCostCard
            costTitle="Costo de No Calidad"
            costs={formattedQualityCosts.costs}
            postTotalCosts={formattedQualityCosts.postTotalCosts}
            totalCost={formattedQualityCosts.totalCost}
          />
        </div>

        <div className={styles.lostTimeTripleRow}>
          <div className={styles.lostTimeTripleColumn}>
            <LostTimeTreemap
              title="Tiempo perdido por NPT Consecuencia (top 5)"
              linkLabel="See All"
              data={isLoadingNptConsequence ? [] : nptByConsequence}
            />
          </div>
          <div className={styles.lostTimeTripleColumn}>
            <LostTimeTreemap
              title="Tiempo perdido por TNP (top 5)"
              linkLabel="See All"
              data={isLoadingTnpSubcode ? [] : tnpByOpSubcode}
            />
          </div>
          <div className={styles.lostTimeTripleColumn}>
            <LostTimeTreemap
              title="Tiempo perdido Operativo (top 5)"
              linkLabel="See All"
              data={isLoadingOperationalLostTime ? [] : operationalLostTime}
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

        <div className={styles.tertiaryRow}>
          <div className={styles.tertiaryLeft}>
            <OperationalSummary
              title="Resumen Operativo de la Intervención"
              unscrews={OPERATIONAL_SUMMARY.unscrews}
              dragLevels={OPERATIONAL_SUMMARY.dragLevels}
              tests={OPERATIONAL_SUMMARY.tests}
              costTitle="Costo de No Calidad"
              costs={formattedQualityCosts.costs}
              postTotalCosts={formattedQualityCosts.postTotalCosts}
              totalCost={formattedQualityCosts.totalCost}
              showCostCard={false}
            />
          </div>
          <div className={styles.tertiaryRight}>
            <PerformanceComparison
              title="Comparación de Performance vs Carta Oferta"
              rows={performanceData.length > 0 ? performanceData : PERFORMANCE_ROWS}
            />
          </div>
        </div>

        <div className={styles.pressureTestsRow}>
          <PressureTestsSection
            assetId={assetId}
            title="Pressure Tests - Último Test Guardado"
          />
        </div>

        <div className={styles.commentsRow}>
          <Comments comments={commentsData} isLoading={isLoadingComments} />
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
