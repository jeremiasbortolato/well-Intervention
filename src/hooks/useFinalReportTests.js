import { useState, useEffect } from 'react';
import { fetchFinalReportPressureTests } from '../api/intervention';

/**
 * Hook to fetch pressure test progress records marked for final report.
 * Fetches from ypf#interventions.pressure_test_progress dataset
 * and filters by include_on_final_report: true.
 *
 * @param {number} assetId - Asset ID to filter tests
 * @returns {Object} { tests, loading, error, refetch }
 */
export const useFinalReportTests = (assetId) => {
  const [tests, setTests] = useState([]);
  const [selectedTest, setSelectedTest] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchTests = async () => {
    if (!assetId) {
      setTests([]);
      setSelectedTest(null);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const response = await fetchFinalReportPressureTests({ assetId });

      // Normalize tests to be compatible with existing hooks (useHistoricalData, useTestKPIs)
      const normalizedTests = response.map((record) => ({
        _id: record._id,
        asset_id: record.asset_id,
        timestamp: record.timestamp,
        provider: record.provider,
        collection: record.collection,
        version: record.version,
        company_id: record.company_id,
        // Data shape compatible with LatestTestCard and existing hooks
        data: {
          name: record.data?.test_title || 'Sin título',
          start_time: record.data?.runtime?.test_times?.start_gross,
          end_time: record.data?.runtime?.test_times?.end_gross,
          // Additional metadata for display
          test_status: record.data?.execution_data?.test_status,
          final_verdict: record.data?.execution_data?.final_verdict,
          message: record.data?.execution_data?.message,
          pressure_channel: record.data?.runtime?.test_setup?.pressure_channel,
        },
        // Keep original structure for reference
        originalData: record.data,
      }));

      setTests(normalizedTests);
      
      // Auto-select first test if none selected
      setSelectedTest(currentSelected => {
        if (currentSelected) {
          const stillExists = normalizedTests.find(test => test._id === currentSelected._id);
          return stillExists || (normalizedTests.length > 0 ? normalizedTests[0] : null);
        }
        return normalizedTests.length > 0 ? normalizedTests[0] : null;
      });
    } catch (err) {
      console.error('Error fetching final report tests:', err);
      setError(err);
      setTests([]);
      setSelectedTest(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTests();
  }, [assetId]);

  const selectTest = (test) => {
    setSelectedTest(current => (current?._id === test._id ? null : test));
  };

  return {
    tests,
    selectedTest,
    setSelectedTest,
    selectTest,
    loading,
    error,
    refetch: fetchTests,
  };
};

export default useFinalReportTests;

