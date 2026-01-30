import React from 'react';
import PropTypes from 'prop-types';

import styles from './OperatingTimesChart.css';

function clampPercent(n) {
  if (!Number.isFinite(n)) return 0;
  return Math.max(0, Math.min(100, n));
}

function formatPercent(n, skipClamp = false) {
  if (skipClamp) {
    return Number.isFinite(n) ? `${Math.max(0, n).toFixed(1)}%` : '0.0%';
  }
  return `${clampPercent(n).toFixed(1)}%`;
}

function OperatingTimesChart({ title, planPercent, overPlanPercent, overPlanPercentLabel, items }) {
  const hasAny =
    Number.isFinite(planPercent) ||
    Number.isFinite(overPlanPercent) ||
    (Array.isArray(items) && items.length > 0);

  if (!hasAny) {
    return (
      <div className={styles.card}>
        <div className={styles.title}>{title}</div>
        <div className={styles.emptyState}>Sin datos disponibles</div>
      </div>
    );
  }

  const safePlan = clampPercent(planPercent);
  const planLabelPercent = 100;
  const safeOverPlan = clampPercent(overPlanPercent);
  const safeItems = (items || [])
    .map((it) => ({
      ...it,
      percent: clampPercent(it.percent),
    }))
    .filter((it) => it.percent > 0.0001);

  // Ensure the bar fills 100% (avoid rounding gaps)
  const normalizedItems = (() => {
    const sum = safeItems.reduce((acc, it) => acc + it.percent, 0);
    if (sum <= 0) return [];
    return safeItems.map((it) => ({ ...it, width: (it.percent / sum) * 100 }));
  })();

  // OverPlan - ahora como overlay desde la derecha, independiente del plan
  const overPlanPlacement = (() => {
    const width = clampPercent(safeOverPlan);
    const left = clampPercent(100 - width);
    return { left, width };
  })();

  const legendItems = [
    {
      key: 'plan',
      label: 'Plan:',
      percent: planLabelPercent,
      color: 'var(--white-w24, rgba(255, 255, 255, 0.24))',
      dotOpacity: 0.4,
      skipClamp: false,
    },
    {
      key: 'overPlan',
      label: 'Desvío total:',
      percent: overPlanPercentLabel !== undefined ? overPlanPercentLabel : safeOverPlan,
      color: 'rgba(255, 67, 54, 0.40)',
      dotOpacity: 0.4,
      skipClamp: true, // No limitar el porcentaje de desvío
    },
    ...safeItems,
  ];

  return (
    <div className={styles.card}>
      <div className={styles.title}>{title}</div>

      <div className={styles.content}>
        <div className={styles.barWrap}>
          <div
            className={styles.planBackground}
            style={{ width: `${safePlan}%` }}
            aria-label={`Plan ${formatPercent(safePlan)}`}
          />

          <div className={styles.bar}>
            <div className={styles.barBase}>
            {normalizedItems.length ? (
              normalizedItems.map((it) => (
                <div
                  key={it.key || it.label}
                  className={styles.segment}
                  style={{
                    width: `${it.width}%`,
                    background: it.color,
                  }}
                  aria-label={`${it.label} ${formatPercent(it.percent)}`}
                />
              ))
            ) : (
              <div className={styles.barEmpty} />
            )}
            </div>
          </div>

          {/* Desvío total (Over Plan) */}
          {overPlanPlacement.width > 0 ? (
            <div
              className={styles.overPlanOverlay}
              style={{ left: `${overPlanPlacement.left}%`, width: `${overPlanPlacement.width}%` }}
              aria-label={`Desvío total ${formatPercent(safeOverPlan)}`}
            />
          ) : null}
          
          {/* Plan label overlay */}
          <div className={styles.planLabel}>
            Plan: {formatPercent(planLabelPercent)}
          </div>
          
          {/* Desvío total label overlay */}
          {overPlanPlacement.width > 0 ? (
            <div className={styles.desvioLabel}>
              Desvío total: {formatPercent(overPlanPercentLabel !== undefined ? overPlanPercentLabel : safeOverPlan, true)}
            </div>
          ) : null}
        </div>

        <div className={styles.legend}>
          {legendItems.map((it) => (
            <div 
              key={it.key || it.label} 
              className={`${styles.legendItem} ${it.key === 'plan' ? styles.legendItemPlan : ''} ${it.key === 'overPlan' ? styles.legendItemDesvio : ''}`}
            >
              <span
                className={styles.legendDot}
                style={{ background: it.color, opacity: it.dotOpacity ?? 1 }}
              />
              <span className={styles.legendLabel}>
                {it.label} {formatPercent(it.percent, it.skipClamp)}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

OperatingTimesChart.propTypes = {
  title: PropTypes.string.isRequired,
  planPercent: PropTypes.number,
  overPlanPercent: PropTypes.number,
  overPlanPercentLabel: PropTypes.number,
  items: PropTypes.arrayOf(
    PropTypes.shape({
      key: PropTypes.string,
      label: PropTypes.string.isRequired,
      percent: PropTypes.number.isRequired,
      color: PropTypes.string.isRequired,
    })
  ),
};

OperatingTimesChart.defaultProps = {
  planPercent: 0,
  overPlanPercent: 0,
  overPlanPercentLabel: undefined,
  items: [],
};

export default OperatingTimesChart;
