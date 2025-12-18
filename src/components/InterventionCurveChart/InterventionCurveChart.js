import React, { useMemo, useRef, useState, useCallback, useEffect } from 'react';
import PropTypes from 'prop-types';
import Highcharts from 'highcharts';
import HighchartsReact from 'highcharts-react-official';

import { getHighchartsOptions } from './chartOptions';
import styles from './InterventionCurveChart.css';

/**
 * Componente de gráfico de Curva Plana de la Intervención con Desvíos
 * Muestra la comparación entre el plan, real y proyecciones
 */
function InterventionCurveChart({
  title,
  plan,
  real,
  realWONPT,
  forecast,
  forecastWONPT,
  nptTotal,
  desvioOperativo,
  desvioProyectado,
  height,
  isLoading,
}) {
  const chartRef = useRef(null);
  const [chartReady, setChartReady] = useState(false);
  const [viewMode, setViewMode] = useState('chart'); // 'chart' or 'table'

  // Handle chart resize
  const handleChartResize = useCallback(() => {
    const chart = chartRef.current?.chart;
    if (chart && chartReady) {
      requestAnimationFrame(() => {
        const currentChart = chartRef.current?.chart;
        if (currentChart && currentChart.reflow) {
          currentChart.reflow();
        }
      });
    }
  }, [chartReady]);

  // ResizeObserver for container size changes
  useEffect(() => {
    const chart = chartRef.current?.chart;
    if (!chart || !chartReady) {
      return undefined;
    }

    const container = chart.container?.parentElement;
    if (!container) {
      return undefined;
    }

    let timeoutId = null;

    const resizeObserver = new ResizeObserver(() => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
      timeoutId = setTimeout(() => {
        handleChartResize();
      }, 16);
    });

    resizeObserver.observe(container);

    return () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
      resizeObserver.disconnect();
    };
  }, [chartReady, handleChartResize]);

  // Generate chart options
  const options = useMemo(
    () =>
      getHighchartsOptions({
        plan,
        real,
        realWONPT,
        forecast,
        forecastWONPT,
      }),
    [plan, real, realWONPT, forecast, forecastWONPT]
  );

  // Format metric values
  const formatMetricValue = (value, decimals = 1) => {
    if (value === null || value === undefined || Number.isNaN(value)) {
      return '-';
    }
    return Number(value).toFixed(decimals);
  };

  // Check if we have data to display
  const hasData = plan.length > 0 && real.length > 0;

  // Loading state
  if (isLoading) {
    return (
      <div className={styles.card}>
        <div className={styles.header}>
          <div className={styles.title}>{title}</div>
        </div>
        <div className={styles.emptyState}>Cargando datos...</div>
      </div>
    );
  }

  // Empty state
  if (!hasData) {
    return (
      <div className={styles.card}>
        <div className={styles.header}>
          <div className={styles.title}>{title}</div>
        </div>
        <div className={styles.emptyState}>Sin datos disponibles para mostrar la curva</div>
      </div>
    );
  }

  return (
    <div className={styles.card}>
      {/* Header */}
      <div className={styles.header}>
        <div className={styles.title}>{title}</div>

        <div className={styles.metricsContainer}>
          <div className={styles.metricsGroup}>
            {/* NPT Total */}
            <div className={styles.metricItem}>
              <span className={styles.metricLabel}>NPT Total</span>
              <span className={styles.metricValue}>{formatMetricValue(nptTotal)}</span>
              <span className={styles.metricUnit}>hrs</span>
            </div>

            <div className={styles.separator} />

            {/* Desvío Operativo */}
            <div className={styles.metricItem}>
              <span className={styles.metricLabel}>Desvio Operativo</span>
              <span className={styles.metricValue}>{formatMetricValue(desvioOperativo)}</span>
              <span className={styles.metricUnit}>%</span>
            </div>

            <div className={styles.separator} />

            {/* Desvío Proyectado */}
            <div className={styles.metricItem}>
              <span className={styles.metricLabel}>Desvio Proyectado</span>
              <span className={styles.metricValue}>{formatMetricValue(desvioProyectado)}</span>
              <span className={styles.metricUnit}>%</span>
            </div>
          </div>

          {/* View Toggle Buttons */}
          <div className={styles.toggleContainer}>
            <button
              type="button"
              className={`${styles.toggleButton} ${
                viewMode === 'chart' ? styles.toggleButtonActive : ''
              }`}
              onClick={() => setViewMode('chart')}
              aria-label="Vista de gráfico"
            >
              <svg
                className={styles.toggleIcon}
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="M3 3v18h18" />
                <path d="M7 16l4-4 4 4 5-6" />
              </svg>
            </button>
            <button
              type="button"
              className={`${styles.toggleButton} ${
                viewMode === 'table' ? styles.toggleButtonActive : ''
              }`}
              onClick={() => setViewMode('table')}
              aria-label="Vista de tabla"
            >
              <svg
                className={styles.toggleIcon}
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <rect x="3" y="3" width="18" height="18" rx="2" />
                <line x1="3" y1="9" x2="21" y2="9" />
                <line x1="3" y1="15" x2="21" y2="15" />
                <line x1="9" y1="3" x2="9" y2="21" />
                <line x1="15" y1="3" x2="15" y2="21" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Chart */}
      <div className={styles.chartContainer} style={{ height: height || 500 }}>
        <HighchartsReact
          highcharts={Highcharts}
          options={options}
          containerProps={{ className: styles.chart }}
          ref={chartRef}
          callback={() => {
            setChartReady(true);
            requestAnimationFrame(() => {
              const c = chartRef.current?.chart;
              if (c && c.reflow) {
                c.reflow();
              }
            });
          }}
        />
      </div>
    </div>
  );
}

InterventionCurveChart.propTypes = {
  title: PropTypes.string,
  plan: PropTypes.arrayOf(
    PropTypes.shape({
      stepNumber: PropTypes.number.isRequired,
      duration: PropTypes.number.isRequired,
      hours: PropTypes.number,
    })
  ),
  real: PropTypes.arrayOf(
    PropTypes.shape({
      stepNumber: PropTypes.number.isRequired,
      duration: PropTypes.number.isRequired,
      hours: PropTypes.number,
    })
  ),
  realWONPT: PropTypes.arrayOf(
    PropTypes.shape({
      stepNumber: PropTypes.number.isRequired,
      duration: PropTypes.number.isRequired,
      hours: PropTypes.number,
    })
  ),
  forecast: PropTypes.arrayOf(
    PropTypes.shape({
      stepNumber: PropTypes.number.isRequired,
      duration: PropTypes.number.isRequired,
      hours: PropTypes.number,
    })
  ),
  forecastWONPT: PropTypes.arrayOf(
    PropTypes.shape({
      stepNumber: PropTypes.number.isRequired,
      duration: PropTypes.number.isRequired,
      hours: PropTypes.number,
    })
  ),
  nptTotal: PropTypes.number,
  desvioOperativo: PropTypes.number,
  desvioProyectado: PropTypes.number,
  height: PropTypes.number,
  isLoading: PropTypes.bool,
};

InterventionCurveChart.defaultProps = {
  title: 'Curva Plana de la Intervención con Desvíos',
  plan: [],
  real: [],
  realWONPT: [],
  forecast: [],
  forecastWONPT: [],
  nptTotal: 0,
  desvioOperativo: 0,
  desvioProyectado: 0,
  height: 500,
  isLoading: false,
};

export default InterventionCurveChart;
