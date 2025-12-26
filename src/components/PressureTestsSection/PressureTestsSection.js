import React, { useMemo } from 'react';
import { EmptyState } from '@corva/ui/componentsV2';

import PressureEvolutionChart from '../PressureEvolutionChart/PressureEvolutionChart';
import LatestTestCard from './LatestTestCard';
import { useTests } from '../../hooks/useTests';
import { useHistoricalData } from '../../hooks/useHistoricalData';
import { useTestKPIs } from '../../hooks/useTestKPIs';

import styles from './PressureTestsSection.css';

const PressureTestsSection = ({ assetId, title = 'Pressure Tests' }) => {
  const { tests, liveTest, selectedTest, loading } = useTests(assetId);

  // keep in mind that we always show the last test saved even if the user doesn't select anything
  const displayTest = useMemo(() => {
    if (selectedTest) return selectedTest;
    if (tests.length > 0) return tests[0];
    return null;
  }, [selectedTest, tests]);

  const historicalData = useHistoricalData(displayTest, assetId, liveTest);

  const { kpis: testKPIs } = useTestKPIs(tests, assetId);

  const currentKPIs = useMemo(() => {
    if (!displayTest || !testKPIs) return null;
    return testKPIs[displayTest._id];
  }, [displayTest, testKPIs]);

  if (loading) {
    return (
      <div className={styles.container}>
        <div className={styles.header}>
          <h2 className={styles.title}>{title}</h2>
        </div>
        <div className={styles.loadingState}>
          <EmptyState title="Cargando..." subTitle="Obteniendo datos de tests de presión" />
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
            title="Sin Tests de Presión"
            subTitle="No hay tests de presión guardados para este pozo"
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
      </div>

      <div className={styles.contentArea}>
        <div className={styles.testCardWrapper}>
          <LatestTestCard
            test={displayTest}
            isLive={Boolean(liveTest?._id && displayTest?._id === liveTest._id)}
            kpiData={currentKPIs}
          />
        </div>

        <div className={styles.chartWrapper}>
          <PressureEvolutionChart selectedTest={displayTest} plotData={historicalData} />
        </div>
      </div>
    </div>
  );
};

export default PressureTestsSection;

