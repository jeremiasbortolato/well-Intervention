import React, { useMemo } from 'react';
import { EmptyState } from '@corva/ui/componentsV2';

import PressureEvolutionChart from '../PressureEvolutionChart/PressureEvolutionChart';
import FinalReportTestCard from './FinalReportTestCard';
import { useFinalReportTests } from '../../hooks/useFinalReportTests';

import styles from './FinalReportTestsSection.css';

/**
 * Section component that displays pressure tests marked for the final report.
 * Fetches data from ypf#interventions.pressure_test_progress dataset.
 * Shows the test card on the left (50%) and the pressure chart on the right (50%).
 */
const FinalReportTestsSection = ({ assetId, title = 'Tests de Presión - Reporte Final' }) => {
  const { tests, selectedTest, loading, error } = useFinalReportTests(assetId);

  // Display the selected test or the first test available
  const displayTest = useMemo(() => {
    if (selectedTest) return selectedTest;
    if (tests.length > 0) return tests[0];
    return null;
  }, [selectedTest, tests]);

  // Extract sorted events from the test record
  const eventsFromTest = useMemo(() => {
    if (!displayTest?.originalData?.runtime?.events) return [];
    return [...displayTest.originalData.runtime.events].sort((a, b) => a.index - b.index);
  }, [displayTest]);

  // Build plotData directly from events (each event → 2 data points)
  const plotDataFromEvents = useMemo(() => {
    if (!eventsFromTest || eventsFromTest.length === 0) return [];
    return eventsFromTest.flatMap(event => [
      { timestamp: event.event_start, pressure: event.pressure_at_start },
      { timestamp: event.event_end, pressure: event.pressure_at_end },
    ]);
  }, [eventsFromTest]);


  if (loading) {
    return (
      <div className={styles.container}>
        <div className={styles.header}>
          <h2 className={styles.title}>{title}</h2>
        </div>
        <div className={styles.loadingState}>
          <EmptyState title="Cargando..." subTitle="Obteniendo tests de presión para el reporte final" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.container}>
        <div className={styles.header}>
          <h2 className={styles.title}>{title}</h2>
        </div>
        <div className={styles.emptyState}>
          <EmptyState
            title="Error al cargar"
            subTitle="No se pudieron obtener los tests de presión"
            image="noDataAvailable"
          />
        </div>
      </div>
    );
  }

  if (!tests.length) {
    return (
      <div className={styles.container}>
        <div className={styles.header}>
          <h2 className={styles.title}>{title}</h2>
        </div>
        <div className={styles.emptyState}>
          <EmptyState
            title="Sin Tests para Reporte"
            subTitle="No hay tests de presión marcados para incluir en el reporte final"
            image="noDataAvailable"
          />
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h2 className={styles.title}>{title}</h2>
        <span className={styles.testCount}>{tests.length} test{tests.length !== 1 ? 's' : ''}</span>
      </div>

      <div className={styles.contentArea}>
        {/* Test card on the left - 50% */}
        <div className={styles.testCardWrapper}>
          <FinalReportTestCard test={displayTest} events={eventsFromTest} />
        </div>

        {/* Chart on the right - 50% */}
        <div className={styles.chartWrapper}>
          <PressureEvolutionChart
            selectedTest={displayTest}
            plotData={plotDataFromEvents}
            events={eventsFromTest}
            colorScheme="yellow"
          />
        </div>
      </div>
    </div>
  );
};

export default FinalReportTestsSection;

