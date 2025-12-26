import React from 'react';
import PropTypes from 'prop-types';
import { Checkbox, Chip } from '@corva/ui/componentsV2';

import styles from './OperationalSummary.css';

export function NonQualityCostCard({ costTitle, costs, totalCost, postTotalCosts }) {
  return (
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
      {Array.isArray(postTotalCosts) && postTotalCosts.length ? (
        <div className={styles.costList}>
          {postTotalCosts.map((item) => (
            <div className={styles.costRow} key={item.label}>
              <span className={styles.label}>{item.label}</span>
              <span className={styles.costValue}>{item.value}</span>
            </div>
          ))}
        </div>
      ) : null}
    </div>
  );
}

function OperationalSummary({
  title,
  unscrews,
  dragLevels,
  tests,
  costTitle,
  costs,
  postTotalCosts,
  totalCost,
  height,
  showCostCard,
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

      {showCostCard ? (
        <NonQualityCostCard
          costTitle={costTitle}
          costs={costs}
          totalCost={totalCost}
          postTotalCosts={postTotalCosts}
        />
      ) : null}
    </div>
  );
}

NonQualityCostCard.propTypes = {
  costTitle: PropTypes.string.isRequired,
  costs: PropTypes.arrayOf(
    PropTypes.shape({
      label: PropTypes.string.isRequired,
      value: PropTypes.string.isRequired,
    })
  ).isRequired,
  postTotalCosts: PropTypes.arrayOf(
    PropTypes.shape({
      label: PropTypes.string.isRequired,
      value: PropTypes.string.isRequired,
    })
  ),
  totalCost: PropTypes.string.isRequired,
};

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
  postTotalCosts: PropTypes.arrayOf(
    PropTypes.shape({
      label: PropTypes.string.isRequired,
      value: PropTypes.string.isRequired,
    })
  ),
  totalCost: PropTypes.string.isRequired,
  height: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  showCostCard: PropTypes.bool,
};

OperationalSummary.defaultProps = {
  height: 500,
  showCostCard: true,
  postTotalCosts: [],
};

export default OperationalSummary;
