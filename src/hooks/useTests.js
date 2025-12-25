import { useState, useEffect } from 'react';
import { corvaDataAPI } from '@corva/ui/clients';

const API_ENDPOINTS = {
  PUMP_TEST_RECORDS: '/api/v1/data/ypf/intervention.downhole-pump-test.records/',
};

const COLLECTIONS = {
  PUMP_TEST_RECORDS: 'intervention.downhole-pump-test.records',
};

const PROVIDERS = {
  YPF: 'ypf',
};

const COMPANY_ID = 375;

export const useTests = assetId => {
  const [tests, setTests] = useState([]);
  const [liveTest, setLiveTest] = useState(null);
  const [selectedTest, setSelectedTest] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchAllTests = async () => {
    if (!assetId) return;

    try {
      setLoading(true);
      const response = await corvaDataAPI.get(API_ENDPOINTS.PUMP_TEST_RECORDS, {
        limit: 100,
        skip: 0,
        sort: JSON.stringify({ timestamp: -1 }),
        query: JSON.stringify({ asset_id: assetId }),
        fields: [
          '_id',
          'asset_id',
          'timestamp',
          'data.start_time',
          'data.end_time',
          'data.name',
          'data.efficiency',
        ].join(','),
      });

      setTests(response || []);

      const activeTest = response?.find(test => !test.data?.end_time);
      setLiveTest(activeTest || null);

      setSelectedTest(currentSelected => {
        if (activeTest) {
          return activeTest;
        }
        // if there is no active test, by default we show the last test saved
        if (!currentSelected && response?.length) {
          return response[0];
        }
        return currentSelected;
      });

      return response;
    } catch (error) {
      console.error('Error fetching tests:', error);
      return [];
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllTests();
  }, [assetId]);

  const createTest = async ({ name, startTime }) => {
    if (!assetId) return;

    try {
      const newTestData = {
        version: 1,
        provider: PROVIDERS.YPF,
        collection: COLLECTIONS.PUMP_TEST_RECORDS,
        asset_id: assetId,
        timestamp: startTime,
        company_id: COMPANY_ID,
        data: {
          name,
          start_time: startTime,
          end_time: null,
        },
      };

      await corvaDataAPI.post(API_ENDPOINTS.PUMP_TEST_RECORDS, [newTestData]);

      const updatedTests = await fetchAllTests();
      const newLiveTest = updatedTests?.find(test => !test.data?.end_time);
      if (newLiveTest) {
        setSelectedTest(newLiveTest);
      }
    } catch (error) {
      console.error('Error creating test:', error);
    }
  };

  const stopTest = async () => {
    if (!liveTest) return;

    try {
      const updatedTest = {
        ...liveTest,
        version: liveTest.version || 1,
        provider: liveTest.provider || PROVIDERS.YPF,
        collection: liveTest.collection || COLLECTIONS.PUMP_TEST_RECORDS,
        company_id: liveTest.company_id || COMPANY_ID,
        asset_id: liveTest.asset_id,
        timestamp: liveTest.timestamp,
        data: {
          ...liveTest.data,
          end_time: Math.floor(Date.now() / 1000),
        },
      };

      const stoppedTestId = liveTest._id;

      await corvaDataAPI.put(`${API_ENDPOINTS.PUMP_TEST_RECORDS}${liveTest._id}/`, updatedTest);

      await fetchAllTests();

      const updatedTests = tests.find(t => t._id === stoppedTestId);
      if (updatedTests) {
        setSelectedTest(updatedTests);
      }
    } catch (error) {
      console.error('Error stopping test:', error);
    }
  };

  const updateTest = async (testToEdit, updatedData) => {
    if (!testToEdit) return;

    try {
      const updatedTest = {
        ...testToEdit,
        version: testToEdit.version || 1,
        provider: testToEdit.provider || PROVIDERS.YPF,
        collection: testToEdit.collection || COLLECTIONS.PUMP_TEST_RECORDS,
        company_id: COMPANY_ID,
        asset_id: testToEdit.asset_id,
        timestamp: testToEdit.timestamp,
        data: {
          ...testToEdit.data,
          ...updatedData,
        },
      };

      await corvaDataAPI.put(`${API_ENDPOINTS.PUMP_TEST_RECORDS}${testToEdit._id}/`, updatedTest);

      await fetchAllTests();

      if (selectedTest?._id === testToEdit._id) {
        setSelectedTest({ ...updatedTest, _id: testToEdit._id });
      }
    } catch (error) {
      console.error('Error updating test:', error);
    }
  };

  const selectTest = test => {
    if (liveTest && test._id !== liveTest._id) {
      return;
    }
    setSelectedTest(current => (current?._id === test._id ? null : test));
  };

  return {
    tests,
    liveTest,
    selectedTest,
    loading,
    setSelectedTest,
    createTest,
    stopTest,
    updateTest,
    selectTest,
    refetchTests: fetchAllTests,
  };
};

