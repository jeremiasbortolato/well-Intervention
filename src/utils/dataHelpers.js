import { convertValue } from '@corva/ui/utils';

export const convertDataToUnitSystem = data => {
  return data.map(record => ({
    x: convertValue(record.data?.block_height || 0, 'length', 'ft'),
    y: convertValue(record.data?.hook_load || 0, 'mass', 'lb'),
    pressure: convertValue(record.data?.standpipe_pressure || 0, 'pressure', 'psi'),
    blockHeight: convertValue(record.data?.block_height || 0, 'length', 'ft'),
    timestamp: record.timestamp,
  }));
};

export const getPressureAtTimestamp = (data, targetTimestamp, toleranceSeconds = 60) => {
  if (!data || data.length === 0) return null;

  const candidates = data
    .filter(
      point =>
        point.pressure != null && Math.abs(point.timestamp - targetTimestamp) <= toleranceSeconds
    )
    .sort(
      (a, b) => Math.abs(a.timestamp - targetTimestamp) - Math.abs(b.timestamp - targetTimestamp)
    );

  return candidates.length > 0 ? candidates[0].pressure : null;
};

