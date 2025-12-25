import React from 'react';
import { getUnitDisplay, getUnitPreference } from '@corva/ui/utils';

import styles from './TestKPICard.css';

const TestKPICard = ({ kpiData }) => {
  if (!kpiData) return null;

  const { pressureDrop, testResult, maxPressure, cycles } = kpiData;

  const pressureUnit = getUnitDisplay('pressure', getUnitPreference('pressure'));

  const getTestColorClass = () => {
    if (!testResult) return '';
    return testResult === 'positiva' ? styles.positiveTest : styles.negativeTest;
  };

  const formatPressureDrop = () => {
    if (pressureDrop === null || pressureDrop === undefined) return 'N/A';
    return `${pressureDrop.toFixed(1)} %`;
  };

  const formatMaxPressure = () => {
    if (maxPressure === null || maxPressure === undefined) return 'N/A';
    return `${maxPressure.toFixed(0)} ${pressureUnit}`;
  };

  const formatCycles = () => {
    if (cycles === null || cycles === undefined) return '0';
    return cycles.toString();
  };

  return (
    <div className={styles.kpisContainer}>
      <div className={`${styles.kpiBox} ${getTestColorClass()}`}>
        <div className={styles.kpiValue}>{formatPressureDrop()}</div>
        <div className={styles.kpiLabel}>Pressure Drop</div>
      </div>

      <div className={`${styles.kpiBox} ${styles.maxPressureBox}`}>
        <div className={styles.kpiValue}>{formatMaxPressure()}</div>
        <div className={styles.kpiLabel}>Max Pressure</div>
      </div>

      <div className={`${styles.kpiBox} ${styles.cyclesBox}`}>
        <div className={styles.kpiValue}>{formatCycles()}</div>
        <div className={styles.kpiLabel}>Cycles</div>
      </div>
    </div>
  );
};

export default TestKPICard;

