import React from 'react';
import PropTypes from 'prop-types';
import { Checkbox, Chip } from '@corva/ui/componentsV2';

import styles from './OperationalSummary.css';

function OperationalSummary({
  title,
  unscrews,
  dragLevels,
  tests,
  costTitle,
  costs,
  totalCost,
  height,
}) {
  return (
    <div className={styles.card} style={{ height }}>
      <div className={styles.title}>{title}</div>

      <div className={styles.topRows}>
        <div className={styles.row}>
          <span className={styles.label}>Cantidad de Desenrosques Realizados</span>
          <Chip size="small" state="warning" shape="square">
            {unscrews}
          </Chip>
        </div>
        <div className={styles.row}>
          <span className={styles.label}>Nivel de Arrastre</span>
          <div className={styles.chipGroup}>
            {dragLevels.map((level) => (
              <Chip
                key={level.label}
                size="small"
                state={level.state}
                shape="square"
                type="default"
                disabled={!level.active}
              >
                {level.label}
              </Chip>
            ))}
          </div>
        </div>
      </div>

      <div className={styles.tests}>
        {tests.map((test, index) => (
          <div className={styles.testRow} key={`${test.label}-${index}`}>
            <div className={styles.checkboxLabel}>
              <Checkbox checked={test.checked} onChange={() => {}} label={test.label} />
            </div>
            <Chip size="small" state={test.state} shape="square">
              {test.statusText}
            </Chip>
          </div>
        ))}
      </div>

      <div className={styles.costCard}>
        <div className={styles.costTitle}>{costTitle}</div>
        <div className={styles.costList}>
          {costs.map((item) => (
            <div className={styles.costRow} key={item.label}>
              <span className={styles.label}>{item.label}</span>
              <span className={styles.costValue}>{item.value}</span>
            </div>
          ))}
        </div>
        <div className={styles.costRowTotal}>
          <span className={styles.totalLabel}>Total:</span>
          <span className={styles.totalValue}>{totalCost}</span>
        </div>
      </div>
    </div>
  );
}

OperationalSummary.propTypes = {
  title: PropTypes.string.isRequired,
  unscrews: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
  dragLevels: PropTypes.arrayOf(
    PropTypes.shape({
      label: PropTypes.string.isRequired,
      state: PropTypes.oneOf(['neutral', 'info', 'caution', 'warning', 'error', 'success', 'pending'])
        .isRequired,
      active: PropTypes.bool,
    })
  ).isRequired,
  tests: PropTypes.arrayOf(
    PropTypes.shape({
      label: PropTypes.string.isRequired,
      checked: PropTypes.bool,
      statusText: PropTypes.string.isRequired,
      state: PropTypes.oneOf(['neutral', 'info', 'caution', 'warning', 'error', 'success', 'pending'])
        .isRequired,
    })
  ).isRequired,
  costTitle: PropTypes.string.isRequired,
  costs: PropTypes.arrayOf(
    PropTypes.shape({
      label: PropTypes.string.isRequired,
      value: PropTypes.string.isRequired,
    })
  ).isRequired,
  totalCost: PropTypes.string.isRequired,
  height: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
};

OperationalSummary.defaultProps = {
  height: 500,
};

export default OperationalSummary;
