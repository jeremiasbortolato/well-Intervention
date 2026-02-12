/**
 * Opciones de configuración para el gráfico de Curva Plana de Intervención
 * Basado en Highcharts
 */

const defaultHighchartsOptions = {
  title: undefined,
  chart: {
    backgroundColor: 'rgba(255, 255, 255, 0.0)',
    type: 'line',
    inverted: true,
    height: null,
  },
  tooltip: {
    shared: true,
  },
  plotOptions: {
    series: {
      marker: {
        enabled: false,
      },
    },
  },
  xAxis: {
    type: 'linear',
    title: { text: 'Pasos del programa', style: { color: '#9E9E9E' } },
    gridLineWidth: 1,
    allowDecimals: false,
    gridLineColor: '#333333',
    tickLength: 0,
    lineColor: '#333333',
    lineWidth: 1,
    labels: {
      style: { color: '#9E9E9E' },
    },
  },
  yAxis: {
    title: { text: 'Horas (hs)', style: { color: '#9E9E9E' } },
    gridLineColor: '#333333',
    startOnTick: true,
    endOnTick: true,
    lineWidth: 1,
    tickLength: 0,
    lineColor: '#333333',
    labels: {
      style: { color: '#9E9E9E' },
    },
  },
  legend: {
    itemStyle: { color: 'white', fontWeight: '400' },
    itemHoverStyle: { color: '#e2e2e2' },
  },
  credits: { enabled: false },
  exporting: { enabled: false },
};

/**
 * Genera las opciones de Highcharts para el gráfico de curva plana
 * @param {Object} params - Parámetros para generar las opciones
 * @param {Array} params.plan - Datos del plan
 * @param {Array} params.real - Datos reales
 * @param {Array} params.realWONPT - Datos reales sin NPT (operativo)
 * @param {Array} params.forecast - Proyección
 * @param {Array} params.forecastWONPT - Proyección sin NPT
 * @returns {Object} Opciones de Highcharts
 */
export function getHighchartsOptions({ plan, real, realWONPT, forecast, forecastWONPT }) {
  // Mapas para búsqueda rápida
  const planHoursMap = plan.reduce((acc, item) => {
    acc[item.stepNumber] = item.hours;
    return acc;
  }, {});

  const planDurationMap = plan.reduce((acc, item) => {
    acc[item.stepNumber] = item.duration;
    return acc;
  }, {});

  // Función para conectar series reales con forecast
  const connectRealWithForecast = (realData, forecastData) => {
    if (realData.length === 0 || forecastData.length === 0) {
      return realData;
    }

    const lastReal = realData[realData.length - 1];
    const firstForecast = forecastData[0];

    if (lastReal.stepNumber === firstForecast.stepNumber) {
      const connectedReal = [...realData];
      connectedReal[connectedReal.length - 1] = {
        ...lastReal,
        duration: firstForecast.duration,
      };
      return connectedReal;
    }

    return realData;
  };

  // Conectar series reales con sus respectivas series de forecast
  const connectedReal = connectRealWithForecast(real, forecast);
  const connectedRealWONPT = connectRealWithForecast(realWONPT, forecastWONPT);

  // Crear copias de forecast para agregar punto de conexión
  const forecastCopy = [...forecast];
  if (connectedReal.length > 0) {
    forecastCopy.unshift(connectedReal[connectedReal.length - 1]);
  }

  const forecastWONPTCopy = [...forecastWONPT];
  if (connectedRealWONPT.length > 0) {
    forecastWONPTCopy.unshift(connectedRealWONPT[connectedRealWONPT.length - 1]);
  }

  // Serie "plan" - Azul
  const planSeries = {
    type: 'line',
    step: 'right',
    name: 'Plan',
    data: plan.map(({ stepNumber, duration }) => ({
      x: stepNumber,
      y: duration,
    })),
    turboThreshold: 0,
    zIndex: 1,
    lineWidth: 2,
    color: '#158fee',
    enableMouseTracking: true,
  };

  // Serie "real" - Rojo/Naranja (más gruesa)
  const realSeries = {
    type: 'line',
    step: 'right',
    name: 'Real',
    data: connectedReal.map(({ stepNumber, duration }) => ({
      x: stepNumber,
      y: duration,
    })),
    turboThreshold: 0,
    zIndex: 4,
    color: '#ea6e52',
    lineWidth: 4,
    enableMouseTracking: true,
  };

  // Serie "Real s/NPT" (Operativo) - Cyan/Turquesa
  const realWONPTSeries = {
    type: 'line',
    step: 'right',
    name: 'Operativo',
    data: connectedRealWONPT.map(({ stepNumber, duration }) => ({
      x: stepNumber,
      y: duration,
    })),
    turboThreshold: 0,
    zIndex: 5,
    lineWidth: 2,
    color: '#00d5be',
    enableMouseTracking: true,
  };

  // Serie "Proyección" - Rojo/Naranja punteada
  const forecastSeries = {
    type: 'line',
    step: 'right',
    name: 'Proyección',
    data: forecastCopy.map(({ stepNumber, duration }, index) => ({
      x: stepNumber,
      y: duration,
      marker: {
        enabled: index === 0 || index === forecastCopy.length - 1,
        radius: index === 0 || index === forecastCopy.length - 1 ? 6 : 0,
        symbol: 'circle',
        fillColor: '#ea6e52',
        lineColor: '#ea6e52',
        lineWidth: 0,
      },
    })),
    turboThreshold: 0,
    zIndex: 2,
    lineWidth: 2,
    dashStyle: 'Dot',
    color: '#ea6e52',
    enableMouseTracking: true,
  };

  // Serie "Proyección Operativo" - Cyan/Turquesa punteada
  const forecastWONPTSeries = {
    type: 'line',
    step: 'right',
    name: 'Proyección Operativo',
    data: forecastWONPTCopy.map(({ stepNumber, duration }, index) => ({
      x: stepNumber,
      y: duration,
      marker: {
        enabled: index === 0 || index === forecastWONPTCopy.length - 1,
        radius: index === 0 || index === forecastWONPTCopy.length - 1 ? 6 : 0,
        symbol: 'circle',
        fillColor: '#00d5be',
        lineColor: '#00d5be',
        lineWidth: 0,
      },
    })),
    turboThreshold: 0,
    zIndex: 6,
    lineWidth: 2,
    dashStyle: 'Dot',
    color: '#00d5be',
    enableMouseTracking: true,
  };

  // Formateador de tooltip personalizado (basado en el código original)
  const tooltipFormatter = function () {
    // Filtrar series de proyección si hay datos reales en el mismo punto
    const hasRealData = this.points?.some(
      p => p.series.name === 'Real' || p.series.name === 'Operativo'
    );

    const filtered = hasRealData
      ? this.points?.filter(
          p => p.series.name !== 'Proyección' && p.series.name !== 'Proyección Operativo'
        )
      : this.points || [];

    // Header con el punto del programa
    let s = `<span style="color: var(--text-primary, white);
font-size: 14px;
font-family: Roboto;
font-weight: 500;
line-height: 20px;
word-wrap: break-word">Pto. Programa: ${this.x}</span><br/>`;

    s += `
      <table style="
        color: var(--text-secondary, #BDBDBD);
        font-size: 12px;
        font-family: Roboto;
        font-weight: 400;
        line-height: 16px;
        word-wrap: break-word
      ">
        <colgroup>
          <col style="width:40%"/>
          <col style="width:20%"/>
          <col style="width:20%"/>
          <col style="width:20%"/>
        </colgroup>
        <thead>
          <tr>
            <th style="padding:4px;">Nombre</th>
            <th style="padding:4px;">Acum.</th>
            <th style="padding:4px;">Plan</th>
            <th style="padding:4px;">Desvío</th>
          </tr>
        </thead>
        <tbody>`;

    filtered.forEach(p => {
      const planDuration = planDurationMap[p.x] || 0;
      const accumValue = p.y;
      const accum = accumValue === 0 ? '-' : accumValue?.toFixed(2);
      const planValue = planDuration === 0 ? '-' : planDuration?.toFixed(2);
      const accumDiffValue = accumValue - planDuration;
      const accumDiff = accumDiffValue === 0 ? '-' : accumDiffValue?.toFixed(2);
      const diffColor =
        accumDiff === '-'
          ? 'var(--text-primary, white)'
          : accumDiffValue <= 0
          ? '#4CAF50'
          : '#FF4336';

      s += `
        <tr>
          <td style="padding:4px;white-space:nowrap; line-height: 20px; color: var(--text-primary, white);">
            <span style="color:${p.color ?? p.series.options.color}">\u25CF</span>
            ${p.series.name}
          </td>
          <td style="padding:4px; color: var(--text-primary, white);">${accum}</td>
          <td style="padding:4px; color: var(--text-primary, white);">${planValue}</td>
          <td style="padding:4px; color:${diffColor};">${accumDiff}</td>
        </tr>`;
    });

    s += `</tbody></table>`;

    return s;
  };

  return {
    ...defaultHighchartsOptions,
    tooltip: {
      shared: true,
      useHTML: true,
      backgroundColor: 'rgba(58, 58, 58, 0.90)',
      borderWidth: 0,
      followPointer: false,
      shadow: false,
      style: {
        color: '#FFF',
        padding: '8px',
      },
      formatter: tooltipFormatter,
      positioner: function (labelWidth, labelHeight) {
        const chart = this.chart;
        const tooltipX = chart.plotLeft + chart.plotWidth - labelWidth - 20;
        const tooltipY = chart.plotTop + 20;
        return { x: tooltipX, y: tooltipY };
      },
    },
    series: [planSeries, realWONPTSeries, realSeries, forecastWONPTSeries, forecastSeries],
  };
}

export default getHighchartsOptions;
