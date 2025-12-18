import React from 'react';
import PropTypes from 'prop-types';
import ReactECharts from 'echarts-for-react';

import styles from './LostTimeTreemap.css';

const DEFAULT_COLORS = ['#15A4F8', '#7B6491', '#1876D2', '#FF938B', '#A55C84'];

function LostTimeTreemap({ title, linkLabel, data, height }) {
  const option = {
    color: DEFAULT_COLORS,
    tooltip: { formatter: '{b}: {c} hs' },
    series: [
      {
        type: 'treemap',
        data,
        leafDepth: 1,
        roam: false,
        nodeClick: false,
        breadcrumb: { show: false },
        label: {
          show: true,
          formatter: '{b}\n{c} hs',
          color: '#141414',
          fontSize: 12,
        },
        upperLabel: { show: false },
        itemStyle: { borderRadius: 0, borderColor: '#1b1b1b', gapWidth: 2 },
        width: '100%',
        height: '100%',
        left: 0,
        right: 0,
        top: 0,
        bottom: 0,
      },
    ],
  };

  return (
    <div className={styles.card} style={{ height }}>
      <div className={styles.header}>
        <span className={styles.title}>{title}</span>
        {linkLabel ? <span className={styles.link}>{linkLabel}</span> : null}
      </div>
      <ReactECharts option={option} className={styles.chart} />
    </div>
  );
}

LostTimeTreemap.propTypes = {
  title: PropTypes.string.isRequired,
  linkLabel: PropTypes.string,
  data: PropTypes.arrayOf(
    PropTypes.shape({
      name: PropTypes.string.isRequired,
      value: PropTypes.number.isRequired,
    })
  ).isRequired,
  height: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
};

LostTimeTreemap.defaultProps = {
  linkLabel: '',
  height: 375,
};

export default LostTimeTreemap;
