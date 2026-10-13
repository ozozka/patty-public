import { fireEvent, waitFor } from '@testing-library/react-native';
import React from 'react';
import { renderWithProviders } from 'src/__tests__/utils/test-utils';

import { SearchableDropdown } from '../SearchableDropdown';

const mockData = [
  { id: '1', name: 'Istanbul', plate_code: '34' },
  { id: '2', name: 'Ankara', plate_code: '06' },
  { id: '3', name: 'Izmir', plate_code: '06' }, // Fake plate code just for testing
];

describe('SearchableDropdown', () => {
  it('renders correctly with default placeholder', () => {
    const { getByText } = renderWithProviders(
      <SearchableDropdown data={mockData} onSelect={jest.fn()} />,
    );
    expect(getByText('common.select')).toBeTruthy();
  });

  it('renders correctly with selected item', () => {
    const { getAllByText } = renderWithProviders(
      <SearchableDropdown
        data={mockData}
        onSelect={jest.fn()}
        selectedItem={mockData[0]}
      />,
    );
    expect(getAllByText('Istanbul')[0]).toBeTruthy();
  });

  it('opens modal and selects an item', async () => {
    const onSelect = jest.fn();
    const { getByText, getAllByText } = renderWithProviders(
      <SearchableDropdown data={mockData} onSelect={onSelect} />,
    );

    // Open modal
    fireEvent.press(getByText('common.select'));

    await waitFor(() => {
      expect(getAllByText('Ankara')[0]).toBeTruthy();
    });

    // Select Ankara
    fireEvent.press(getAllByText('Ankara')[0]!);

    expect(onSelect).toHaveBeenCalledWith(mockData[1]);
  });

  it('filters data when searching', async () => {
    const { getByText, getByTestId, queryAllByText, getAllByText } =
      renderWithProviders(
        <SearchableDropdown
          data={mockData}
          onSelect={jest.fn()}
          testID="city-dropdown"
        />,
      );

    // Open modal
    fireEvent.press(getByText('common.select'));

    await waitFor(() => {
      expect(getAllByText('Istanbul')[0]).toBeTruthy();
    });

    // Search for 'Ank'
    const searchInput = getByTestId('city-dropdown-search-input');
    fireEvent.changeText(searchInput, 'Ank');

    expect(queryAllByText('Istanbul').length).toBe(0);
    expect(getAllByText('Ankara')[0]).toBeTruthy();
  });
});
