import { useState, useEffect, useMemo } from 'react';
import { corvaDataAPI } from '@corva/ui/clients';

import { convertDataToUnitSystem, getPressureAtTimestamp } from '../utils/dataHelpers';
import {
  calculatePressureDrop,
  getTestResult,
  calculateMaxPressure,
  calculateCycles,
} from '../utils/kpiCalculations';

const API_ENDPOINTS = {
  WITS_DATA: '/api/v1/data/corva/interventions.wits/',
};

export const useTestKPIs = (tests, assetId) => {
  const [kpis, setKpis] = useState({});
  const [loading, setLoading] = useState(false);

  const completedTests = useMemo(() => {
    return tests.filter(test => test.data?.end_time && test.data?.start_time);
  }, [tests]);

  useEffect(() => {
    if (!assetId || completedTests.length === 0) {
      setKpis({});
      return;
    }

    const loadKPIsForAllTests = async () => {
      setLoading(true);
      const kpisMap = {};

      try {
        await Promise.all(
          completedTests.map(async test => {
            try {
              const startTime = test.data.start_time;
              const endTime = test.data.end_time;
              const endTimePlus10Min = endTime + 10 * 60;

              const response = await corvaDataAPI.get(API_ENDPOINTS.WITS_DATA, {
                limit: 10000,
                skip: 0,
                sort: JSON.stringify({ timestamp: 1 }),
                query: JSON.stringify({
                  asset_id: assetId,
                  timestamp: { $gte: startTime, $lte: endTimePlus10Min },
                }),
                fields: ['timestamp', 'data.block_height', 'data.standpipe_pressure'].join(','),
              });

              const testData = convertDataToUnitSystem(response || []);

              const pressureAtEnd = getPressureAtTimestamp(testData, endTime);
              const pressureAtEndPlus10 = getPressureAtTimestamp(testData, endTimePlus10Min);

              const pressureDrop = calculatePressureDrop(pressureAtEnd, pressureAtEndPlus10);
              const testResult = getTestResult(pressureDrop);

              const maxPressure = calculateMaxPressure(testData, startTime, endTime);

              const cycles = calculateCycles(
                testData.map(d => ({ blockHeight: d.blockHeight, timestamp: d.timestamp })),
                startTime,
                endTime
              );

              kpisMap[test._id] = {
                pressureDrop,
                testResult,
                maxPressure,
                cycles,
              };
            } catch (error) {
              console.error(`Error calculating KPIs for test ${test._id}:`, error);
              kpisMap[test._id] = {
                pressureDrop: null,
                testResult: null,
                maxPressure: null,
                cycles: 0,
              };
            }
          })
        );

        setKpis(kpisMap);
      } catch (error) {
        console.error('Error loading KPIs:', error);
      } finally {
        setLoading(false);
      }
    };

    loadKPIsForAllTests();
  }, [completedTests, assetId]);

  return { kpis, loading };
};

