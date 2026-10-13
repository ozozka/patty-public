jest.mock('@shopify/flash-list', () => {
  const MockReact = require('react');
  const { View } = require('react-native');

  return {
    FlashList: ({ data, renderItem, keyExtractor, ...props }: any) => {
      const items = data ?? [];
      return MockReact.createElement(
        View,
        props,
        items.map((item: unknown, index: number) =>
          MockReact.createElement(
            View,
            { key: keyExtractor ? keyExtractor(item, index) : index },
            renderItem ? renderItem({ item, index }) : null,
          ),
        ),
      );
    },
  };
});
