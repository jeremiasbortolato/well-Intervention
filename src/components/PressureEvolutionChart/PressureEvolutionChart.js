import React, { useMemo } from 'react';
import ReactECharts from 'echarts-for-react';
import { EmptyState } from '@corva/ui/componentsV2';
import { getUnitDisplay, getUnitPreference } from '@corva/ui/utils';

import styles from './PressureEvolutionChart.css';

const PressureEvolutionChart = ({ selectedTest, plotData }) => {
  const chartOption = useMemo(() => {
    if (!selectedTest || !plotData || plotData.length === 0) {
      return {
        backgroundColor: '#2a2a2a',
        xAxis: { type: 'time' },
        yAxis: { type: 'value' },
        series: [],
      };
    }

    const pressureUnit = getUnitDisplay('pressure', getUnitPreference('pressure'));

    const startTime = selectedTest.data?.start_time;
    const endTime = selectedTest.data?.end_time || Math.floor(Date.now() / 1000);

    // Calcular timestamps clave
    const extendedStartTime = startTime - 30; // 30 segundos antes
    const extendedEndTime = endTime + 10.5 * 60; // 10.5 minutos después (630 segundos)
    const endTimePlus10Min = endTime + 10 * 60; // end_time + 10 minutos

    // Preparar datos de presión
    const pressureData = plotData
      .filter(point => point.pressure != null)
      .map(point => [point.timestamp * 1000, point.pressure]) // ECharts espera milisegundos
      .sort((a, b) => a[0] - b[0]);

    // Obtener valores de presión en los puntos clave para las etiquetas
    const getPressureAtTimestamp = timestamp => {
      const closest = pressureData
        .map(([ts, pressure]) => ({ ts, pressure, diff: Math.abs(ts - timestamp * 1000) }))
        .sort((a, b) => a.diff - b.diff)[0];

      return closest?.pressure || null;
    };

    const pressureAtStart = getPressureAtTimestamp(startTime);
    const pressureAtEnd = getPressureAtTimestamp(endTime);
    const pressureAtEndPlus10 = getPressureAtTimestamp(endTimePlus10Min);

    return {
      backgroundColor: '#2a2a2a',
      grid: {
        left: '10%',
        right: '8%',
        top: '8%',
        bottom: '12%',
        containLabel: true,
      },
      xAxis: {
        type: 'time',
        name: 'Time',
        nameLocation: 'middle',
        nameGap: 25,
        min: extendedStartTime * 1000, // Desde 30 segundos antes del start
        max: extendedEndTime * 1000, // Hasta 10.5 minutos después del end
        nameTextStyle: {
          color: '#ccc',
          fontSize: 12,
        },
        axisLabel: {
          color: '#ccc',
          fontSize: 10,
          rotate: 0,
          interval: 'auto',
          formatter: value => {
            const date = new Date(value);
            const hours = date.getHours().toString().padStart(2, '0');
            const minutes = date.getMinutes().toString().padStart(2, '0');
            return `${hours}:${minutes}`;
          },
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
        name: `Pressure (${pressureUnit})`,
        nameLocation: 'middle',
        nameGap: 40,
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
      series: [
        {
          name: 'Pressure',
          type: 'line',
          data: pressureData,
          lineStyle: {
            color: '#3b82f6',
            width: 2,
          },
          symbol: 'none',
          smooth: false,
          areaStyle: {
            color: {
              type: 'linear',
              x: 0,
              y: 0,
              x2: 0,
              y2: 1,
              colorStops: [
                { offset: 0, color: 'rgba(59, 130, 246, 0.3)' },
                { offset: 1, color: 'rgba(59, 130, 246, 0.05)' },
              ],
            },
          },
          showInLegend: false,
          markLine: {
            silent: true,
            symbol: 'none',
            animation: false,
            lineStyle: {
              color: '#fff',
              width: 1,
              type: 'dashed',
            },
            data: [
              {
                xAxis: startTime * 1000,
                label: {
                  show: false, // Quitar tag
                },
              },
              {
                xAxis: endTime * 1000,
                label: {
                  show: false, // Quitar tag
                },
              },
              {
                xAxis: endTimePlus10Min * 1000,
                label: {
                  show: false, // Quitar tag
                },
              },
            ],
          },
          markPoint: {
            symbol: 'circle',
            symbolSize: 6,
            animation: false,
            itemStyle: {
              color: '#fff',
              borderColor: '#3b82f6',
              borderWidth: 2,
            },
            label: {
              show: true,
              position: 'top',
              formatter: params => {
                if (!params.value) return '';
                return `${params.value.toFixed(0)} ${pressureUnit}`;
              },
              color: '#fff',
              fontSize: 10,
              fontWeight: 'bold',
            },
            data: [
              ...(pressureAtStart
                ? [
                    {
                      coord: [startTime * 1000, pressureAtStart],
                      value: pressureAtStart,
                    },
                  ]
                : []),
              ...(pressureAtEnd
                ? [
                    {
                      coord: [endTime * 1000, pressureAtEnd],
                      value: pressureAtEnd,
                    },
                  ]
                : []),
              ...(pressureAtEndPlus10
                ? [
                    {
                      coord: [endTimePlus10Min * 1000, pressureAtEndPlus10],
                      value: pressureAtEndPlus10,
                    },
                  ]
                : []),
            ],
          },
        },
      ],
      tooltip: {
        backgroundColor: '#2a2a2a',
        borderColor: '#333',
        textStyle: {
          color: '#fff',
        },
        trigger: 'axis',
        formatter: params => {
          if (!params || params.length === 0) return '';

          const data = params[0];
          const date = new Date(data.value[0]);
          const pressure = data.value[1];

          return `<b>${date.toLocaleString()}</b><br/>
                  Pressure: ${pressure.toFixed(2)} ${pressureUnit}`;
        },
      },
    };
  }, [selectedTest, plotData]);

  if (!selectedTest) {
    return (
      <div className={styles.container}>
        <div className={styles.emptyState}>
          <EmptyState
            title="No Test Selected"
            subTitle="Select a test to view pressure evolution"
            image="noDataAvailable"
          />
        </div>
      </div>
    );
  }

  if (!plotData || plotData.length === 0) {
    return (
      <div className={styles.container}>
        <div className={styles.emptyState}>
          <EmptyState
            title="No Data Available"
            subTitle="No pressure data available for this test"
            image="noDataAvailable"
          />
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <ReactECharts
        option={chartOption}
        style={{ height: '100%', width: '100%' }}
        notMerge
        lazyUpdate={false}
      />
    </div>
  );
};

export default PressureEvolutionChart;

