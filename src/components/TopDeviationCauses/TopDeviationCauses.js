import React from 'react';
import PropTypes from 'prop-types';

import styles from './TopDeviationCauses.css';

function TopDeviationCauses({ title, blocks, height }) {
  return (
    <div className={styles.card} style={{ height }}>
      <div className={styles.title}>{title}</div>
      <div className={styles.grid}>
        {blocks.map((block, index) => (
          <div className={styles.block} key={`${block.label}-${index}`}>
            <div className={styles.blockHeader}>
              {block.color ? <span className={styles.colorBar} style={{ background: block.color }} /> : null}
              <span className={styles.blockLabel}>{block.label}</span>
            </div>
            <div className={styles.blockValueRow}>
              <span className={styles.value}>{block.value}</span>
              {block.unit ? <span className={styles.unit}>{block.unit}</span> : null}
            </div>
            <div className={styles.comment}>
              <span className={styles.commentLabel}>Comment: </span>
              <span className={styles.commentText}>{block.comment}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

TopDeviationCauses.propTypes = {
  title: PropTypes.string.isRequired,
  blocks: PropTypes.arrayOf(
    PropTypes.shape({
      label: PropTypes.string.isRequired,
      value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
      unit: PropTypes.string,
      comment: PropTypes.string,
      color: PropTypes.string,
    })
  ).isRequired,
  height: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
};

TopDeviationCauses.defaultProps = {
  height: 375,
};

export default TopDeviationCauses;
