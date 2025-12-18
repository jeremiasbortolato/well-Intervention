import React from 'react';
import PropTypes from 'prop-types';

import styles from './BasicInformation.css';

function BasicInformation({ title, badgeText, items }) {
  return (
    <div className={styles.card}>
      <div className={styles.header}>
        <span className={styles.title}>{title}</span>
        {badgeText ? <span className={styles.badge}>{badgeText}</span> : null}
      </div>

      <div className={styles.grid}>
        {items.map((item) => (
          <div className={styles.item} key={item.label}>
            <div className={styles.itemLabel}>{item.label}</div>
            <div className={styles.valueRow}>
              <span className={styles.value}>{item.value}</span>
              {item.unit ? <span className={styles.unit}>{item.unit}</span> : null}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

BasicInformation.propTypes = {
  title: PropTypes.string.isRequired,
  badgeText: PropTypes.string,
  items: PropTypes.arrayOf(
    PropTypes.shape({
      label: PropTypes.string.isRequired,
      value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
      unit: PropTypes.string,
    })
  ).isRequired,
};

BasicInformation.defaultProps = {
  badgeText: '',
};

export default BasicInformation;
