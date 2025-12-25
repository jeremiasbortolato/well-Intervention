import React, { useMemo } from 'react';
import ReactECharts from 'echarts-for-react';
import { EmptyState } from '@corva/ui/componentsV2';
import { getUnitDisplay, getUnitPreference } from '@corva/ui/utils';

import styles from './ScatterPlot.css';

const DEFAULT_SETTINGS = {
  minPressure: 100,
  maxPressure: 2000,
  minColor: '#00FF00',
  maxColor: '#FF0000',
};

const ScatterPlot = ({ data, hasData, selectedTest, pressureSettings = DEFAULT_SETTINGS }) => {
  const MIN_PRESSURE = pressureSettings?.minPressure ?? 100;
  const MAX_PRESSURE = pressureSettings?.maxPressure ?? 2000;

  const hexToRgb = hex => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result
      ? {
          r: parseInt(result[1], 16),
          g: parseInt(result[2], 16),
          b: parseInt(result[3], 16),
        }
      : { r: 0, g: 255, b: 0 };
  };

  const MIN_COLOR = hexToRgb(pressureSettings?.minColor || '#00FF00');
  const MAX_COLOR = hexToRgb(pressureSettings?.maxColor || '#FF0000');

  const interpolateColor = pressure => {
    const normalized = Math.max(
      0,
      Math.min(1, (pressure - MIN_PRESSURE) / (MAX_PRESSURE - MIN_PRESSURE))
    );

    const r = Math.round(MIN_COLOR.r + (MAX_COLOR.r - MIN_COLOR.r) * normalized);
    const g = Math.round(MIN_COLOR.g + (MAX_COLOR.g - MIN_COLOR.g) * normalized);
    const b = Math.round(MIN_COLOR.b + (MAX_COLOR.b - MIN_COLOR.b) * normalized);

    return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`;
  };

  const calculateYAxisMin = yValues => {
    if (!yValues || yValues.length === 0) return 0;

    const minValue = Math.min(...yValues);

    const minEven = Math.floor(minValue / 2) * 2;

    if (minValue - minEven < 0.5) {
      return Math.max(0, minEven);
    }

    return Math.max(0, minEven);
  };

  const chartOption = useMemo(() => {
    if (!data || data.length === 0) return {};

    const sortedData = [...data].sort((a, b) => (a.timestamp || 0) - (b.timestamp || 0));

    const lengthUnit = getUnitDisplay('length', getUnitPreference('length'));
    const massUnit = getUnitDisplay('mass', getUnitPreference('mass'));
    const pressureUnit = getUnitDisplay('pressure', getUnitPreference('pressure'));

    const yValues = sortedData.map(point => point.y).filter(val => val != null);
    const yAxisMin = calculateYAxisMin(yValues);

    const lineData = sortedData.map(point => [point.x, point.y]);
    const scatterData = sortedData.map(point => ({
      value: [point.x, point.y],
      itemStyle: {
        color: interpolateColor(point.pressure || 0),
        opacity: 1,
      },
      timestamp: point.timestamp,
      pressure: point.pressure,
    }));

    return {
      backgroundColor: '#2a2a2a',
      grid: {
        left: '7%',
        right: '7%',
        top: '8%',
        bottom: '8%',
        containLabel: true,
      },
      xAxis: {
        type: 'value',
        name: `Block Height (${lengthUnit})`,
        nameLocation: 'middle',
        nameGap: 30,
        nameTextStyle: {
          color: '#ccc',
          fontSize: 12,
        },
        axisLabel: {
          color: '#ccc',
          fontSize: 11,
        },
        axisLine: {
          lineStyle: {
            color: '#444',
            width: 1,
          },
        },
        splitLine: {
          lineStyle: {
            color: '#333',
            width: 0.5,
            opacity: 0.6,
          },
        },
      },
      yAxis: {
        type: 'value',
        name: `Hook Load (${massUnit})`,
        nameLocation: 'middle',
        nameGap: 50,
        nameTextStyle: {
          color: '#ccc',
          fontSize: 12,
        },
        axisLabel: {
          color: '#ccc',
          fontSize: 11,
        },
        axisLine: {
          lineStyle: {
            color: '#555',
            width: 1,
          },
        },
        splitLine: {
          lineStyle: {
            color: '#444',
            width: 0.5,
            opacity: 0.6,
          },
        },
        min: yAxisMin,
        interval: 2,
      },
      series: [
        {
          name: 'Sequence Line',
          type: 'line',
          data: lineData,
          lineStyle: {
            color: 'rgba(59, 130, 246, 0.40)',
            width: 1,
          },
          symbol: 'none',
          connectNulls: false,
          showInLegend: false,
          silent: true,
          tooltip: {
            show: false,
          },
        },
        {
          name: 'Pressure Data',
          type: 'scatter',
          data: scatterData,
          symbolSize: 12,
          itemStyle: {
            borderColor: 'transparent',
            borderWidth: 0,
            opacity: 1,
          },
          emphasis: {
            itemStyle: {
              opacity: 1,
              borderColor: '#fff',
              borderWidth: 2,
            },
          },
          showInLegend: false,
        },
      ],
      tooltip: {
        backgroundColor: '#2a2a2a',
        borderColor: '#333',
        textStyle: {
          color: '#fff',
        },
        trigger: 'item',
        formatter: params => {
          if (!params || !params.data || !params.data.value) {
            return '';
          }

          const { data } = params;

          let dateStr = 'Invalid Date';
          if (data.timestamp) {
            const date = new Date(data.timestamp * 1000);
            dateStr = date.toLocaleString();
          }

          let pressureStr = `undefined ${pressureUnit}`;
          if (data.pressure !== undefined && data.pressure !== null) {
            pressureStr = `${data.pressure.toFixed(2)} ${pressureUnit}`;
          }

          return `<b>Timestamp: ${dateStr}</b><br/>
                  Block Height: ${data.value[0].toFixed(2)} ${lengthUnit}<br/>
                  Hook Load: ${data.value[1].toFixed(2)} ${massUnit}<br/>
                  Pressure: ${pressureStr}`;
        },
      },
      legend: {
        show: false,
      },
    };
  }, [data, pressureSettings]);

  if (!hasData) {
    return (
      <div className={styles.container}>
        <div className={styles.emptyState}>
          <EmptyState
            title="No Data Plotted"
            subTitle="Start Test to Plot Data"
            image="noDataAvailable"
          />
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.plotContainer}>
        <div className={styles.plot}>
          <ReactECharts
            option={chartOption}
            style={{ height: '100%', width: '100%' }}
            notMerge
            lazyUpdate={false}
          />
        </div>
        <div className={styles.legend}>
          <div className={styles.legendItem}>
            <span
              className={styles.legendColor}
              style={{
                backgroundColor: pressureSettings?.minColor || '#00FF00',
              }}
            />
            Low Pressure
          </div>
          <div className={styles.legendItem}>
            <span
              className={styles.legendColor}
              style={{
                backgroundColor: pressureSettings?.maxColor || '#FF0000',
              }}
            />
            High Pressure
          </div>
        </div>
      </div>
    </div>
  );
};

export default ScatterPlot;

