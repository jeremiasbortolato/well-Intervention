import { render, screen, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import AppSettings from '../AppSettings';
import { mockAppSettingsProps } from '../__mocks__/mockAppSettingsProps';

describe('<AppSettings />', () => {
  it('should call onChange with a changed setting on settings change', async () => {
    const handleSettingsChange = jest.fn();

    render(<AppSettings {...mockAppSettingsProps} onSettingChange={handleSettingsChange} />);

    const exampleCheckbox = screen.getByTestId('exampleCheckbox').querySelector('input');

    await act(async () => {
      await userEvent.click(exampleCheckbox);
    });

    expect(handleSettingsChange).toBeCalledWith('isExampleCheckboxChecked', false);
  });
});
