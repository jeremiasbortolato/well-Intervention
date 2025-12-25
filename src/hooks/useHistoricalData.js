import { useState, useEffect } from 'react';
import { corvaDataAPI, socketClient } from '@corva/ui/clients';

import { convertDataToUnitSystem } from '../utils/dataHelpers';

const API_ENDPOINTS = {
  WITS_DATA: '/api/v1/data/corva/interventions.wits/',
};

const PROVIDERS = {
  CORVA: 'corva',
};

const DATASETS = {
  WITS: 'interventions.wits',
};

export const useHistoricalData = (selectedTest, assetId, liveTest) => {
  const [historicalData, setHistoricalData] = useState([]);

  useEffect(() => {
    if (!selectedTest || !assetId) return;

    const loadHistoricalData = async () => {
      try {
        const startTime = selectedTest.data?.start_time;
        const endTime = selectedTest.data?.end_time || Math.floor(Date.now() / 1000);

        // Ventana: 30 segundos antes del start_time hasta 10.5 minutos después del end_time
        const extendedStartTime = startTime - 30; // 30 segundos antes
        const extendedEndTime = endTime + 10.5 * 60; // 10.5 minutos después (630 segundos)

        const response = await corvaDataAPI.get(API_ENDPOINTS.WITS_DATA, {
          limit: 10000,
          skip: 0,
          sort: JSON.stringify({ timestamp: 1 }),
          query: JSON.stringify({
            asset_id: assetId,
            timestamp: { $gte: extendedStartTime, $lte: extendedEndTime },
          }),
          fields: [
            'timestamp',
            'data.block_height',
            'data.hook_load',
            'data.standpipe_pressure',
          ].join(','),
        });

        const allData = convertDataToUnitSystem(response || []);

        setHistoricalData(allData);
      } catch (error) {
        console.error('Error loading historical data:', error);
        setHistoricalData([]);
      }
    };

    loadHistoricalData();
  }, [selectedTest, assetId]);

  useEffect(() => {
    if (!assetId || !liveTest || !selectedTest || selectedTest?._id !== liveTest?._id) return;

    const subscription = {
      provider: PROVIDERS.CORVA,
      dataset: DATASETS.WITS,
      assetId,
    };

    const onDataReceive = event => {
      const newData = convertDataToUnitSystem(event.data);
      setHistoricalData(prevData => [...prevData, ...newData]);
    };

    const unsubscribe = socketClient.subscribe(subscription, { onDataReceive });

    return () => unsubscribe();
  }, [assetId, liveTest, selectedTest]);

  return historicalData;
};

