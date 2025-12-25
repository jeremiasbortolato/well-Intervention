export const calculatePressureDrop = (pressureAtEnd, pressureAfter10min) => {
  if (!pressureAtEnd || pressureAtEnd === 0) return null;
  if (!pressureAfter10min && pressureAfter10min !== 0) return null;

  const drop = 1 - pressureAfter10min / pressureAtEnd;
  return drop * 100;
};

export const getTestResult = dropPercentage => {
  if (dropPercentage === null || dropPercentage === undefined) return null;
  return dropPercentage <= 5 ? 'positiva' : 'negativa';
};

export const calculateMaxPressure = (data, startTime, endTime) => {
  if (!data || data.length === 0) return null;

  const filteredData = data.filter(
    point => point.timestamp >= startTime && point.timestamp <= endTime && point.pressure != null
  );

  if (filteredData.length === 0) return null;

  return Math.max(...filteredData.map(point => point.pressure));
};

const calculateMedian = values => {
  if (!values || values.length === 0) return null;

  const sorted = [...values].sort((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);

  if (sorted.length % 2 === 0) {
    return (sorted[middle - 1] + sorted[middle]) / 2;
  }
  return sorted[middle];
};

export const calculateCycles = (data, startTime, endTime) => {
  if (!data || data.length === 0) {
    return 0;
  }

  const filteredData = data
    .filter(
      point =>
        point.timestamp >= startTime && point.timestamp <= endTime && point.blockHeight != null
    )
    .map(point => point.blockHeight)
    .sort((a, b) => a - b);

  if (filteredData.length === 0) {
    return 0;
  }

  const median = calculateMedian(filteredData);

  if (median === null) {
    return 0;
  }

  const timeOrderedData = data
    .filter(
      point =>
        point.timestamp >= startTime && point.timestamp <= endTime && point.blockHeight != null
    )
    .sort((a, b) => a.timestamp - b.timestamp);

  if (timeOrderedData.length < 2) {
    return 0;
  }

  let cycles = 0;
  let currentSide = null;
  let previousSide = null;

  for (let i = 0; i < timeOrderedData.length; i++) {
    const point = timeOrderedData[i];
    const isAbove = point.blockHeight > median;

    if (currentSide === null) {
      currentSide = isAbove;
      previousSide = isAbove;
      continue;
    }

    if (previousSide !== isAbove) {
      previousSide = isAbove;

      if (isAbove === currentSide) {
        cycles++;
        currentSide = isAbove;
      }
    }
  }

  return cycles;
};

