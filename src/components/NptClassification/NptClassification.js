import React from 'react';
import PropTypes from 'prop-types';

import styles from './NptClassification.css';

function NptClassification({ title, items }) {
  return (
    <div className={styles.card}>
      <div className={styles.title}>{title}</div>
      <div className={styles.metricsRow}>
        {items.map((item) => (
          <div className={styles.metricCard} key={item.label}>
            <div className={styles.metricLabel}>{item.label}</div>
            <div className={styles.valueRow}>
              {item.isChip ? (
                <span className={styles.warningChip}>{item.value}</span>
              ) : (
                <>
                  <span className={styles.value}>{item.value}</span>
                  {item.unit ? <span className={styles.unit}>{item.unit}</span> : null}
                </>
              )}
            </div>
          </div>
        ))}
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
    })
  ).isRequired,
};

export default NptClassification;
