import React, { useMemo } from 'react';
import ReactECharts from 'echarts-for-react';
import { EmptyState } from '@corva/ui/componentsV2';
import { getUnitDisplay, getUnitPreference } from '@corva/ui/utils';

import styles from './PressureEvolutionChart.css';

const COLOR_SCHEMES = {
  blue: {
    line: '#158FEE',
    gradientStart: 'rgba(21, 143, 238, 0.24)',
    gradientEnd: 'rgba(39, 39, 39, 0.00)',
    markPointBorder: '#158FEE',
  },
  yellow: {
    line: '#FFEF5C',
    gradientStart: 'rgba(255, 239, 92, 0.24)',
    gradientEnd: 'rgba(39, 39, 39, 0.00)',
    markPointBorder: '#FFEF5C',
  },
};

const PressureEvolutionChart = ({ selectedTest, plotData, events, colorScheme = 'blue' }) => {
  const colors = COLOR_SCHEMES[colorScheme] || COLOR_SCHEMES.blue;

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

    // ── Events-based mode (Final Report) ──
    // When events are provided, build the chart exclusively from them.
    const useEventsMode = events && events.length > 0;

    // Preparar datos de presión
    const pressureData = plotData
      .filter(point => point.pressure != null)
      .map(point => [point.timestamp * 1000, point.pressure]) // ECharts espera milisegundos
      .sort((a, b) => a[0] - b[0]);

    let xMin, xMax, markLineData, markPointData;

    if (useEventsMode) {
      // Events mode: axis range covers only the events with a small padding
      const sortedEvents = [...events].sort((a, b) => a.index - b.index);
      const firstEvent = sortedEvents[0];
      const lastEvent = sortedEvents[sortedEvents.length - 1];

      const timeSpan = lastEvent.event_end - firstEvent.event_start;
      const padding = Math.max(timeSpan * 0.03, 30); // 3% padding or at least 30s

      xMin = (firstEvent.event_start - padding) * 1000;
      xMax = (lastEvent.event_end + padding) * 1000;

      // Mark lines: vertical dashed lines at each event boundary
      markLineData = sortedEvents.flatMap(event => [
        {
          xAxis: event.event_start * 1000,
          label: { show: false },
        },
        {
          xAxis: event.event_end * 1000,
          label: { show: false },
        },
      ]);

      // Mark points: first event start pressure and last event end pressure
      markPointData = [
        {
          coord: [firstEvent.event_start * 1000, firstEvent.pressure_at_start],
          value: firstEvent.pressure_at_start,
        },
        {
          coord: [lastEvent.event_end * 1000, lastEvent.pressure_at_end],
          value: lastEvent.pressure_at_end,
        },
      ];
    } else {
      // Historical data mode (original behaviour)
      const startTime = selectedTest.data?.start_time;
      const endTime = selectedTest.data?.end_time || Math.floor(Date.now() / 1000);

      const extendedStartTime = startTime - 30;
      const extendedEndTime = endTime + 10.5 * 60;
      const endTimePlus10Min = endTime + 10 * 60;

      xMin = extendedStartTime * 1000;
      xMax = extendedEndTime * 1000;

      // Obtener valores de presión en los puntos clave
      const getPressureAtTimestamp = timestamp => {
        const closest = pressureData
          .map(([ts, pressure]) => ({ ts, pressure, diff: Math.abs(ts - timestamp * 1000) }))
          .sort((a, b) => a.diff - b.diff)[0];
        return closest?.pressure || null;
      };

      const pressureAtStart = getPressureAtTimestamp(startTime);
      const pressureAtEnd = getPressureAtTimestamp(endTime);
      const pressureAtEndPlus10 = getPressureAtTimestamp(endTimePlus10Min);

      markLineData = [
        { xAxis: startTime * 1000, label: { show: false } },
        { xAxis: endTime * 1000, label: { show: false } },
        { xAxis: endTimePlus10Min * 1000, label: { show: false } },
      ];

      markPointData = [
        ...(pressureAtStart
          ? [{ coord: [startTime * 1000, pressureAtStart], value: pressureAtStart }]
          : []),
        ...(pressureAtEnd
          ? [{ coord: [endTime * 1000, pressureAtEnd], value: pressureAtEnd }]
          : []),
        ...(pressureAtEndPlus10
          ? [{ coord: [endTimePlus10Min * 1000, pressureAtEndPlus10], value: pressureAtEndPlus10 }]
          : []),
      ];
    }

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
        min: xMin,
        max: xMax,
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
            color: colors.line,
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
                { offset: 0, color: colors.gradientStart },
                { offset: 1, color: colors.gradientEnd },
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
            data: markLineData,
          },
          markPoint: {
            symbol: 'circle',
            symbolSize: 6,
            animation: false,
            itemStyle: {
              color: '#fff',
              borderColor: colors.markPointBorder,
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
            data: markPointData,
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
  }, [selectedTest, plotData, events, colors]);

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

