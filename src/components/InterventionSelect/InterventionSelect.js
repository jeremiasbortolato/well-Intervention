import React from 'react';
import PropTypes from 'prop-types';
import { MenuItem } from '@material-ui/core';
import { Select } from '@corva/ui/components';

import styles from './InterventionSelect.css';

function InterventionSelect({ label, value, options, onChange }) {
  return (
    <div className={styles.wrapper}>
      <Select
        label={label}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        fullWidth
      >
        {options.map((option) => (
          <MenuItem key={option.value} value={option.value}>
            {option.label}
          </MenuItem>
        ))}
      </Select>
    </div>
  );
}

InterventionSelect.propTypes = {
  label: PropTypes.string.isRequired,
  value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
  options: PropTypes.arrayOf(
    PropTypes.shape({
      label: PropTypes.string.isRequired,
      value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
    })
  ).isRequired,
  onChange: PropTypes.func.isRequired,
};

export default InterventionSelect;
