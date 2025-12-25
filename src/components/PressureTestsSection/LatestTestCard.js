import React from 'react';
import { IndicatorLive } from '@corva/ui/componentsV2';

import TestKPICard from '../TestKPICard/TestKPICard';

import styles from './LatestTestCard.css';

const formatDateTime = timestampSeconds => {
  if (!timestampSeconds) return '-';
  return new Date(timestampSeconds * 1000).toLocaleString('es-ES', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: true,
  });
};

const LatestTestCard = ({ test, isLive, kpiData }) => {
  if (!test) return null;

  const startDate = formatDateTime(test.data?.start_time);
  const endDate = test.data?.end_time ? formatDateTime(test.data?.end_time) : '-';

  const showKPIs = Boolean(test.data?.end_time && kpiData);

  return (
    <div className={styles.container}>
      <div className={styles.sectionHeader}>
        <h2 className={styles.sectionTitle}>Tests</h2>
      </div>

      <div className={`${styles.testCard} ${isLive ? styles.liveCard : ''}`}>
        <div className={styles.cardHeader}>
          <h3 className={styles.testTitle}>{test.data?.name || 'Sin nombre'}</h3>
          <div className={styles.cardActions}>
            {isLive && <IndicatorLive state="live" size="small" type="indicator" />}
          </div>
        </div>

        {showKPIs && <TestKPICard kpiData={kpiData} />}

        <div className={styles.testInfo}>
          <p>
            <span className={styles.label}>Start:</span>
            <span className={styles.value}> {startDate}</span>
          </p>
          <p>
            <span className={styles.label}>End:</span>
            <span className={styles.value}> {endDate}</span>
          </p>
        </div>
      </div>
    </div>
  );
};

export default LatestTestCard;


