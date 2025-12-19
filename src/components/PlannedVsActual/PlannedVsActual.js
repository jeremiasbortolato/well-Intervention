import React from 'react';
import PropTypes from 'prop-types';

import styles from './PlannedVsActual.css';

function PlannedVsActual({
  title,
  statusText,
  metrics,
  deviationLabel,
  deviationValue,
  deviationNumeric,
  operationalDeviationLabel,
  operationalDeviationValue,
  operationalDeviationNumeric,
}) {
  const getDeviationChipClass = (value) => {
    if (value <= 0) {
      return styles.deviationChipGreen;
    } else if (value > 0 && value <= 10) {
      return styles.deviationChipYellow;
    } else {
      return styles.deviationChipRed;
    }
  };

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

      <div className={styles.deviationsRow}>
        <div className={styles.deviationCard}>
          <span className={styles.metricLabel}>{deviationLabel}</span>
          <span
            className={
              deviationNumeric !== undefined
                ? getDeviationChipClass(deviationNumeric)
                : styles.warningChip
            }
          >
            {deviationValue}
          </span>
        </div>
        {operationalDeviationLabel && operationalDeviationValue ? (
          <div className={styles.deviationCard}>
            <span className={styles.metricLabel}>{operationalDeviationLabel}</span>
            <span
              className={
                operationalDeviationNumeric !== undefined
                  ? getDeviationChipClass(operationalDeviationNumeric)
                  : styles.warningChip
              }
            >
              {operationalDeviationValue}
            </span>
          </div>
        ) : null}
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
  deviationNumeric: PropTypes.number,
  operationalDeviationLabel: PropTypes.string,
  operationalDeviationValue: PropTypes.string,
  operationalDeviationNumeric: PropTypes.number,
};

PlannedVsActual.defaultProps = {
  statusText: '',
};

export default PlannedVsActual;
