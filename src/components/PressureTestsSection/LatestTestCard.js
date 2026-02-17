import React from 'react';
import { IndicatorLive } from '@corva/ui/componentsV2';

import TestKPICard from '../TestKPICard/TestKPICard';

import styles from './LatestTestCard.css';

const formatDateTime = timestampSeconds => {
  if (!timestampSeconds) return '-';
  return new Date(timestampSeconds * 1000).toLocaleString('es-AR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  });
};

const LatestTestCard = ({ test, isLive, kpiData }) => {
  if (!test) return null;

  const startDate = formatDateTime(test.data?.start_time);
  const endDate = test.data?.end_time ? formatDateTime(test.data?.end_time) : '-';

  const showKPIs = Boolean(test.data?.end_time && kpiData);

  return (
    <div className={styles.container}>
      <div className={`${styles.testCard} ${isLive ? styles.liveCard : ''}`}>
        <div className={styles.cardHeader}>
          <h3 className={styles.testTitle}>{test.data?.name || 'Sin nombre'}</h3>
          <div className={styles.cardActions}>
            {isLive && <IndicatorLive state="live" size="small" type="indicator" />}
          </div>
        </div>

        <div className={styles.cardsGrid}>
          {/* Start */}
          <div className={styles.chipCard}>
            <span className={styles.chipLabel}>Start</span>
            <span className={styles.chipValue}>{startDate}</span>
          </div>

          {/* End */}
          <div className={styles.chipCard}>
            <span className={styles.chipLabel}>End</span>
            <span className={styles.chipValue}>{endDate}</span>
          </div>
        </div>

        {showKPIs && <TestKPICard kpiData={kpiData} />}
      </div>
    </div>
  );
};

export default LatestTestCard;


