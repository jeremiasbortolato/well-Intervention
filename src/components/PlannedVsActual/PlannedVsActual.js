import React from 'react';
import PropTypes from 'prop-types';

import styles from './PlannedVsActual.css';

function PlannedVsActual({ title, statusText, metrics, deviationLabel, deviationValue }) {
  return (
    <div className={styles.card}>
      <div className={styles.header}>
        <span className={styles.title}>{title}</span>
        {statusText ? <span className={styles.warningChip}>{statusText}</span> : null}
      </div>

      <div className={styles.metricsRow}>
        {metrics.map((metric) => (
          <div className={styles.metricCard} key={metric.label}>
            <div className={styles.metricLabel}>{metric.label}</div>
            <div className={styles.valueRow}>
              <span className={styles.value}>{metric.value}</span>
              {metric.unit ? <span className={styles.unit}>{metric.unit}</span> : null}
            </div>
          </div>
        ))}
      </div>

      <div className={styles.deviationCard}>
        <span className={styles.metricLabel}>{deviationLabel}</span>
        <span className={styles.warningChip}>{deviationValue}</span>
      </div>
    </div>
  );
}

PlannedVsActual.propTypes = {
  title: PropTypes.string.isRequired,
  statusText: PropTypes.string,
  metrics: PropTypes.arrayOf(
    PropTypes.shape({
      label: PropTypes.string.isRequired,
      value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
      unit: PropTypes.string,
    })
  ).isRequired,
  deviationLabel: PropTypes.string.isRequired,
  deviationValue: PropTypes.string.isRequired,
};

PlannedVsActual.defaultProps = {
  statusText: '',
};

export default PlannedVsActual;
