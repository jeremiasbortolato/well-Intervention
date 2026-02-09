/**
 * Grouping of sub-operation codes that share the same goals.
 * Based on reference table provided.
 */
export const TRIPPING_CODE_GROUPS = {
  SACA_VB_SIMPLE: {
    category: 'Varilla',
    description: 'Saca v/b en simple',
    codes: ['251A', '251C'],
  },
  SACA_VB_DOBLES: {
    category: 'Varilla',
    description: 'Saca v/b en dobles',
    codes: ['251B', '251D'],
  },
  BAJA_VB_SIMPLE: {
    category: 'Varilla',
    description: 'Baja v/b en simple',
    codes: ['255A', '255C'],
  },
  BAJA_VB_DOBLES: {
    category: 'Varilla',
    description: 'Baja v/b en dobles',
    codes: ['255B', '255D'],
  },
  SACA_TBG_SIMPLE: {
    category: 'Tubing',
    description: 'Saca TBG en simple',
    codes: ['253A', '253C'],
  },
  SACA_TBG_DOBLES: {
    category: 'Tubing',
    description: 'Saca TBG en dobles',
    codes: ['253B', '253D'],
  },
  SACA_TBG_SIMPLE_SUNCHOS: {
    category: 'Tubing',
    description: 'Saca TBG en simple sunchos',
    codes: ['253M'],
  },
  SACA_TBG_DOBLES_SUNCHOS: {
    category: 'Tubing',
    description: 'Saca TBG en dobles sunchos',
    codes: ['253T'],
  },
  BAJA_TBG_SIMPLE: {
    category: 'Tubing',
    description: 'Baja TBG en simple',
    codes: ['257A', '257C'],
  },
  BAJA_TBG_DOBLES: {
    category: 'Tubing',
    description: 'Baja TBG en dobles',
    codes: ['257B', '257D'],
  },
  BAJA_TBG_DOBLES_SUNCHOS: {
    category: 'Tubing',
    description: 'Baja TBG en dobles sunchos',
    codes: ['257S'],
  },
  BAJA_TBG_SIMPLE_SUNCHOS: {
    category: 'Tubing',
    description: 'Baja TBG en simple sunchos',
    codes: ['257M'],
  },
};

export const TRIPPING_CODE_TO_GROUP = Object.entries(TRIPPING_CODE_GROUPS).reduce(
  (acc, [groupKey, group]) => {
    group.codes.forEach((code) => {
      acc[code] = groupKey;
    });
    return acc;
  },
  {}
);

/**
 * Days vs Activity app key constant
 */
export const DVA_APP_KEY = 'ypf.days_vs_activity.ui';

