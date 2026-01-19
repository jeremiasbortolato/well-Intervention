import React from 'react';
import PropTypes from 'prop-types';
import { Chip } from '@corva/ui/componentsV2';
import { Table, TableBody, TableHead, TableRow, TableCell, TableContainer } from '@corva/ui/components';

import styles from './PerformanceComparison.css';

function PerformanceComparison({ title, rows, height }) {
  return (
    <div className={styles.card} style={{ height }}>
      <div className={styles.title}>{title}</div>
      <TableContainer className={styles.tableContainer}>
        <Table size="small">
          <TableHead>
            <TableRow className={styles.headerRow}>
              <TableCell className={styles.headerCell}>Categoría</TableCell>
              <TableCell className={styles.headerCell}>Operación</TableCell>
              <TableCell className={styles.headerCell}>Valor Reportado (u/h)</TableCell>
              <TableCell className={styles.headerCell}>Objetivo (CO) (u/h)</TableCell>
              <TableCell className={styles.headerCell}>Diferencia</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {rows.map((row, index) => (
              <TableRow key={`${row.category}-${row.operation}-${index}`} className={styles.bodyRow}>
                <TableCell className={styles.cell}>{row.category}</TableCell>
                <TableCell className={styles.cell}>{row.operation}</TableCell>
                <TableCell className={styles.cell}>{row.actual}</TableCell>
                <TableCell className={styles.cell}>{row.target}</TableCell>
                <TableCell className={styles.cell}>
                  <Chip
                    size="small"
                    state={row.differenceState}
                    shape="square"
                    type="default"
                    className={styles.diffChip}
                  >
                    {row.difference}
                  </Chip>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </div>
  );
}

PerformanceComparison.propTypes = {
  title: PropTypes.string.isRequired,
  rows: PropTypes.arrayOf(
    PropTypes.shape({
      category: PropTypes.string.isRequired,
      operation: PropTypes.string.isRequired,
      actual: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
      target: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
      difference: PropTypes.string.isRequired,
      differenceState: PropTypes.oneOf(['neutral', 'info', 'caution', 'warning', 'error', 'success', 'pending'])
        .isRequired,
    })
  ).isRequired,
  height: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
};

PerformanceComparison.defaultProps = {
  height: 500,
};

export default PerformanceComparison;
