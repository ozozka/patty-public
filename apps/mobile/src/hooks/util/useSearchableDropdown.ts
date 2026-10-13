import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';

export function useSearchableDropdown<
  T extends { id: number; name_tr: string; name_en: string },
>(items: T[], selectedId?: number) {
  const { i18n } = useTranslation();
  const isTurkish = i18n.language === 'tr';

  const dropdownData = useMemo(() => {
    return items.map((item) => ({
      ...item,
      name: isTurkish ? item.name_tr : item.name_en,
    }));
  }, [items, isTurkish]);

  const selectedItem = useMemo(() => {
    return dropdownData.find((item) => item.id === selectedId);
  }, [dropdownData, selectedId]);

  return {
    dropdownData,
    selectedItem,
  };
}
