import { render, screen } from '@testing-library/react';
import { AppTestWrapper } from '@corva/ui/testing';

import App from '../App';
import { mockAppProps } from '../__mocks__/mockAppProps';

describe('<App />', () => {
  it('should show correct layout', () => {
    render(
      <AppTestWrapper
        app={mockAppProps.app}
        appId={123}
        maximized={false}
        appSettings={mockAppProps.app.settings}
        onSettingChange={() => {
          /* noop */
        }}
      >
        <App {...mockAppProps} />
      </AppTestWrapper>
    );

    screen.getByText(/checked/i);
  });

  it('should show correct layout when settings are not provided', () => {
    const propsWithoutSettings = mockAppProps;
    delete propsWithoutSettings.isExampleCheckboxChecked;

    render(
      <AppTestWrapper
        app={mockAppProps.app}
        appId={123}
        maximized={false}
        appSettings={mockAppProps.app.settings}
        onSettingChange={() => {
          /* noop */
        }}
      >
        <App {...propsWithoutSettings} />
      </AppTestWrapper>
    );

    screen.getByText(/unchecked/i);
  });
});
