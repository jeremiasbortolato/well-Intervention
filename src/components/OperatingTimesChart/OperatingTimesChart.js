import React from 'react';
import PropTypes from 'prop-types';
import ReactECharts from 'echarts-for-react';

import styles from './OperatingTimesChart.css';

const DEFAULT_COLORS = ['#3BA7FF', '#FF9D3B', '#9F7AEA', '#F56565', '#10B981', '#EC4899'];

function OperatingTimesChart({ title, categories, values, colors }) {
  const chartColors = colors?.length ? colors : DEFAULT_COLORS;

  // If no data, show empty state
  if (!categories.length || !values.length) {
    return (
      <div className={styles.card}>
        <div className={styles.title}>{title}</div>
        <div className={styles.emptyState}>Sin datos disponibles</div>
      </div>
    );
  }

  // Create bar data with individual colors
  const barData = values.map((value, index) => ({
    value,
    itemStyle: {
      color: chartColors[index % chartColors.length],
    },
  }));

  const option = {
    tooltip: {
      trigger: 'item',
      backgroundColor: '#333333',
      borderColor: '#333333',
      textStyle: { color: '#BDBDBD', fontSize: 12 },
      formatter: params => {
        if (!params) return '';
        return `${params.name}<br/>${params.marker}${params.value} horas`;
      },
    },
    grid: {
      top: 30,
      left: 60,
      right: 20,
      bottom: 55,
      containLabel: false,
    },
    xAxis: {
      type: 'category',
      data: categories,
      name: 'Tiempos Operativos',
      nameLocation: 'middle',
      nameGap: 30,
      nameTextStyle: { color: '#BDBDBD', fontSize: 12 },
      axisLabel: {
        color: '#BDBDBD',
        fontSize: 11,
        margin: 10,
      },
      axisLine: { lineStyle: { color: '#333333' } },
      axisTick: { show: false },
    },
    yAxis: {
      type: 'value',
      name: 'Tiempo (horas)',
      nameLocation: 'middle',
      nameGap: 40,
      nameRotate: 90,
      nameTextStyle: { color: '#BDBDBD', fontSize: 12 },
      splitLine: { lineStyle: { color: '#333333' } },
      axisLabel: { color: '#BDBDBD', fontSize: 10 },
    },
    series: [
      {
        type: 'bar',
        data: barData,
        barWidth: '40%',
        barCategoryGap: '30%',
        itemStyle: {
          borderRadius: [4, 4, 0, 0],
        },
        emphasis: {
          itemStyle: {
            opacity: 0.8,
          },
          focus: 'none',
        },
        label: {
          show: true,
          position: 'top',
          color: '#ffffff',
          fontSize: 11,
          formatter: '{c}',
        },
      },
    ],
  };

  return (
    <div className={styles.card}>
      <div className={styles.title}>{title}</div>
      <ReactECharts option={option} className={styles.chart} notMerge lazyUpdate />
      <div className={styles.legend}>
        {categories.map((cat, idx) => (
          <div key={cat} className={styles.legendItem}>
            <span
              className={styles.legendDot}
              style={{ backgroundColor: chartColors[idx % chartColors.length] }}
            />
            <span className={styles.legendLabel}>{cat}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

OperatingTimesChart.propTypes = {
  title: PropTypes.string.isRequired,
  categories: PropTypes.arrayOf(PropTypes.string).isRequired,
  values: PropTypes.arrayOf(PropTypes.number).isRequired,
  colors: PropTypes.arrayOf(PropTypes.string),
};

OperatingTimesChart.defaultProps = {
  colors: DEFAULT_COLORS,
};

export default OperatingTimesChart;
