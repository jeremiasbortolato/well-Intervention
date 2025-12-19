import React from 'react';
import PropTypes from 'prop-types';

import styles from './NptClassification.css';

function NptClassification({ title, items, plannedTimeHours }) {
  const getChipClass = (value, label) => {
    // Only apply color logic to "Gestionable" and "TNP Total"
    if (label !== 'Gestionable' && label !== 'TNP Total') {
      return styles.warningChip;
    }

    if (!plannedTimeHours || plannedTimeHours <= 0) {
      return styles.warningChip;
    }

    const threshold10 = plannedTimeHours * 0.1;
    const threshold15 = plannedTimeHours * 0.15;

    if (value <= threshold10) {
      return styles.chipGreen;
    } else if (value > threshold10 && value <= threshold15) {
      return styles.chipYellow;
    } else {
      return styles.chipRed;
    }
  };

  return (
    <div className={styles.card}>
      <div className={styles.title}>{title}</div>
      <div className={styles.metricsRow}>
        {items.map((item) => {
          const numericValue = typeof item.numericValue === 'number' ? item.numericValue : 0;
          const chipClass = item.isChip ? getChipClass(numericValue, item.label) : null;

          return (
            <div className={styles.metricCard} key={item.label}>
              <div className={styles.metricLabel}>{item.label}</div>
              <div className={styles.valueRow}>
                {item.isChip ? (
                  <span className={chipClass || styles.warningChip}>{item.value}</span>
                ) : (
                  <>
                    <span className={styles.value}>{item.value}</span>
                    {item.unit ? <span className={styles.unit}>{item.unit}</span> : null}
                  </>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

NptClassification.propTypes = {
  title: PropTypes.string.isRequired,
  items: PropTypes.arrayOf(
    PropTypes.shape({
      label: PropTypes.string.isRequired,
      value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
      unit: PropTypes.string,
      isChip: PropTypes.bool,
      numericValue: PropTypes.number,
    })
  ).isRequired,
  plannedTimeHours: PropTypes.number,
};

export default NptClassification;
