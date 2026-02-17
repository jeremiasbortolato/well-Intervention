import React from 'react';
import { getUnitDisplay, getUnitPreference } from '@corva/ui/utils';

import styles from './FinalReportTestCard.css';

/**
 * Formats a unix-seconds timestamp to a human-readable date string.
 */
const formatDateTime = (timestampSeconds) => {
  if (!timestampSeconds) return '-';
  return new Date(timestampSeconds * 1000).toLocaleString('es-AR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  });
};

/**
 * Card component for a Final Report pressure test.
 * Shows KPIs as individual chip-style cards matching the Figma design:
 *   Drop, Start, End, Cycles, Pressure (avg), Max Pressure
 *
 * All values are computed from the events array (no WITS).
 *
 * @param {Object} props.test   - Normalized test object from useFinalReportTests
 * @param {Array}  props.events - Sorted events array from runtime.events
 */
const FinalReportTestCard = ({ test, events = [] }) => {
  if (!test) return null;

  const original = test.originalData || {};
  const runtime = original.runtime || {};
  const testTimes = runtime.test_times || {};

  const pressureUnit = getUnitDisplay('pressure', getUnitPreference('pressure'));

  const startDate = formatDateTime(testTimes.start_gross);
  const endDate = formatDateTime(testTimes.end_gross);

  // --- KPIs derived from events ---

  // Drop: delta_pressure from the last event (stable_pressure) + percentage
  const lastEvent = events.length > 0 ? events[events.length - 1] : null;
  const deltaPressure = lastEvent?.delta_pressure ?? null;
  const deltaPct =
    lastEvent && lastEvent.pressure_at_start
      ? Math.abs((lastEvent.delta_pressure / lastEvent.pressure_at_start) * 100)
      : null;

  // Cycles: number of pressure_build_up events
  const cycles = events.filter(e => e.type === 'pressure_build_up').length;

  // Collect every pressure value from events (start + end of each)
  const allPressures = events.flatMap(e => [e.pressure_at_start, e.pressure_at_end]);

  // Pressure (avg): average of all pressure points across events
  const avgPressure =
    allPressures.length > 0
      ? allPressures.reduce((sum, p) => sum + p, 0) / allPressures.length
      : null;

  // Max Pressure: highest pressure across all events
  const maxPressure = allPressures.length > 0 ? Math.max(...allPressures) : null;

  return (
    <div className={styles.container}>
      <h3 className={styles.testTitle}>{test.data?.name || 'Sin título'}</h3>

      <div className={styles.cardsGrid}>
        {/* Drop */}
        <div className={styles.card}>
          <span className={styles.cardLabel}>Drop</span>
          <span className={styles.cardValue}>
            {deltaPressure != null
              ? `${deltaPressure} ${pressureUnit}${deltaPct != null ? ` (${deltaPct.toFixed(0)}%)` : ''}`
              : '-'}
          </span>
        </div>

        {/* Start */}
        <div className={styles.card}>
          <span className={styles.cardLabel}>Start</span>
          <span className={styles.cardValue}>{startDate}</span>
        </div>

        {/* End */}
        <div className={styles.card}>
          <span className={styles.cardLabel}>End</span>
          <span className={styles.cardValue}>{endDate}</span>
        </div>

        {/* Cycles */}
        <div className={styles.card}>
          <span className={styles.cardLabel}>Cycles</span>
          <span className={styles.cardValue}>{cycles}</span>
        </div>

        {/* Pressure (avg) – yellow chip */}
        <div className={`${styles.card} ${styles.pressureCard}`}>
          <span className={styles.cardLabel}>Pressure ({pressureUnit})</span>
          <span className={styles.cardValue}>
            {avgPressure != null ? avgPressure.toFixed(0) : '-'}
          </span>
        </div>

        {/* Max Pressure – red chip */}
        <div className={`${styles.card} ${styles.maxPressureCard}`}>
          <span className={styles.cardLabel}>Max Pressure ({pressureUnit})</span>
          <span className={styles.cardValue}>
            {maxPressure != null ? maxPressure.toFixed(0) : '-'}
          </span>
        </div>
      </div>
    </div>
  );
};

export default FinalReportTestCard;

