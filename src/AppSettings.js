import { Checkbox, FormControlLabel } from '@material-ui/core';

import { DEFAULT_SETTINGS } from './constants';

/**
 * @param {Object} props
 * @param {Object} props.app
 * @param {Object} props.appData
 * @param {Object} props.company
 * @param {(key: string, value: any) => void} props.onSettingChange
 * @param {{isExampleCheckboxChecked: boolean}} props.settings
 * @param {Object} props.user
 * @returns
 */
function AppSettings({
  settings: apiSettings,
  onSettingChange,
  // appData,
  // app,
  // user = {},
  // company = {},
}) {
  const settings = { ...DEFAULT_SETTINGS, ...apiSettings };
  return (
    <div>
      <FormControlLabel
        label="Example checkbox"
        control={
          <Checkbox
            data-testid="exampleCheckbox"
            checked={settings.isExampleCheckboxChecked}
            onChange={e => onSettingChange('isExampleCheckboxChecked', e.target.checked)}
          />
        }
      />
    </div>
  );
}

// Important: Do not change root component default export (AppSettings.js). Use it as container
//  for your App Settings. It's required to make build and zip scripts work as expected;
export default AppSettings;
