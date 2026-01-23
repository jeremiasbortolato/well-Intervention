import React from 'react';
import PropTypes from 'prop-types';
import { Chip } from '@corva/ui/componentsV2';

import styles from './OperationalSummary.css';

export function NonQualityCostCard({ costTitle, costs, totalCost, postTotalCosts }) {
  return (
    <div className={styles.costCard}>
      <div className={styles.costTitle}>{costTitle}</div>
      <div className={styles.costList}>
        {costs.map((item) => (
          <div className={styles.costRow} key={item.label}>
            <span className={styles.label}>{item.label}</span>
            <span className={styles.costValue}>{item.value}</span>
          </div>
        ))}
      </div>
      <div className={styles.costRowTotal}>
        <span className={styles.totalLabel}>Total:</span>
        <span className={styles.totalValue}>{totalCost}</span>
      </div>
      {Array.isArray(postTotalCosts) && postTotalCosts.length ? (
        <div className={styles.costList}>
          {postTotalCosts.map((item) => (
            <div className={styles.costRow} key={item.label}>
              <span className={styles.label}>{item.label}</span>
              <span className={styles.costValue}>{item.value}</span>
            </div>
          ))}
        </div>
      ) : null}
    </div>
  );
}

function OperationalSummary({
  title,
  height,
  failureIdentifications,
  torqueConnections,
  windStatus,
}) {
  // Check if there's any data to display
  const hasData =
    (failureIdentifications && failureIdentifications.length > 0) ||
    (torqueConnections && torqueConnections.totalConnections > 0) ||
    (windStatus && windStatus.totalHours > 0);

  return (
    <div className={styles.card} style={{ height }}>
      <div className={styles.title}>{title}</div>

      {!hasData ? (
        <div className={styles.emptyState}>
          <span className={styles.emptyStateText}>No hay datos para mostrar</span>
        </div>
      ) : (
        <>
          {/* Tipo de Falla Identificada Section */}
          {failureIdentifications && failureIdentifications.length > 0 ? (
            <div className={styles.failureSection}>
              <div className={styles.sectionTitle}>Tipo de Falla Identificada</div>
              <div className={styles.failureList}>
                {failureIdentifications.map((failure) => (
                  <div className={styles.failureItem} key={failure.id}>
                    <div className={styles.failureHeader}>
                      <Chip size="small" state="error" shape="square">
                        {failure.failureType}
                      </Chip>
                      <span className={styles.failureUser}>{failure.userName}</span>
                      {failure.timestamp && (
                        <span className={styles.failureTime}>
                          {new Date(failure.timestamp).toLocaleString('es-AR', {
                            day: '2-digit',
                            month: '2-digit',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                      )}
                    </div>
                    <div className={styles.failureComment}>{failure.comment}</div>
                  </div>
                ))}
              </div>
            </div>
          ) : null}

          {/* Conformance de Torque - Conexiones Armando Section */}
          {torqueConnections && torqueConnections.totalConnections > 0 ? (
            <div className={styles.torqueSection}>
              <div className={styles.sectionTitle}>Conformance de Torque</div>
              <div className={styles.torqueContent}>
                <span className={styles.torqueLabel}>Conexiones Armando:</span>
                <span className={styles.torqueData}>
                  Malas: <strong>{torqueConnections.badConnections}u</strong> (
                  <strong>{torqueConnections.badPercentage.toFixed(1)}%</strong>) de{' '}
                  <strong>{torqueConnections.totalConnections}u</strong> Totales
                </span>
              </div>
            </div>
          ) : null}

          {/* Wind Status Section */}
          {windStatus && windStatus.totalHours > 0 ? (
            <div className={styles.windSection}>
              <div className={styles.sectionTitle}>Horas de Viento por Umbral de Alerta</div>
              <div className={styles.windContent}>
                <div className={styles.windRow}>
                  <span className={styles.windLabel}>Buenas Condiciones:</span>
                  <Chip size="small" state="success" shape="square">
                    {windStatus.goodHours.toFixed(1)} hs
                  </Chip>
                </div>
                <div className={styles.windRow}>
                  <span className={styles.windLabel}>Precaución:</span>
                  <Chip size="small" state="caution" shape="square">
                    {windStatus.cautionHours.toFixed(1)} hs
                  </Chip>
                </div>
                <div className={styles.windRow}>
                  <span className={styles.windLabel}>Peligro:</span>
                  <Chip size="small" state="error" shape="square">
                    {windStatus.dangerHours.toFixed(1)} hs
                  </Chip>
                </div>
                <div className={styles.windRowTotal}>
                  <span className={styles.windLabelTotal}>Total:</span>
                  <span className={styles.windTotal}>{windStatus.totalHours.toFixed(1)} hs</span>
                </div>
              </div>
            </div>
          ) : null}
        </>
      )}
    </div>
  );
}

NonQualityCostCard.propTypes = {
  costTitle: PropTypes.string.isRequired,
  costs: PropTypes.arrayOf(
    PropTypes.shape({
      label: PropTypes.string.isRequired,
      value: PropTypes.string.isRequired,
    })
  ).isRequired,
  postTotalCosts: PropTypes.arrayOf(
    PropTypes.shape({
      label: PropTypes.string.isRequired,
      value: PropTypes.string.isRequired,
    })
  ),
  totalCost: PropTypes.string.isRequired,
};

OperationalSummary.propTypes = {
  title: PropTypes.string.isRequired,
  height: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  failureIdentifications: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string.isRequired,
      failureType: PropTypes.string.isRequired,
      comment: PropTypes.string.isRequired,
      timestamp: PropTypes.instanceOf(Date),
      userName: PropTypes.string.isRequired,
    })
  ),
  torqueConnections: PropTypes.shape({
    badConnections: PropTypes.number.isRequired,
    okConnections: PropTypes.number.isRequired,
    totalConnections: PropTypes.number.isRequired,
    badPercentage: PropTypes.number.isRequired,
  }),
  windStatus: PropTypes.shape({
    goodHours: PropTypes.number.isRequired,
    cautionHours: PropTypes.number.isRequired,
    dangerHours: PropTypes.number.isRequired,
    totalHours: PropTypes.number.isRequired,
  }),
};

OperationalSummary.defaultProps = {
  height: 'auto',
  failureIdentifications: [],
  torqueConnections: null,
  windStatus: null,
};

export default OperationalSummary;
