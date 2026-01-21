import React from 'react';
import PropTypes from 'prop-types';
import { MenuItem } from '@material-ui/core';
import { Select } from '@corva/ui/components';

import styles from './InterventionSelect.css';

function InterventionSelect({ label, value, options, onChange }) {
  const selectedOption = options.find((opt) => opt.value === value);
  
  return (
    <div className={styles.wrapper}>
      <Select
        label={label}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        renderValue={() => selectedOption?.label || ''}
        fullWidth
      >
        {options.map((option) => (
          <MenuItem key={option.value} value={option.value}>
            <div className={styles.optionRow}>
              <span className={styles.optionPrimary}>{option.label}</span>
              {option.secondaryLabel ? (
                <span className={styles.optionSecondary}>{option.secondaryLabel}</span>
              ) : null}
            </div>
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
      secondaryLabel: PropTypes.string,
      value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
    })
  ).isRequired,
  onChange: PropTypes.func.isRequired,
};

export default InterventionSelect;
