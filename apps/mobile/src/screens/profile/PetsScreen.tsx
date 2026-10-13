/** Source file for PetsScreen. */
import React from 'react';
import { useTranslation } from 'react-i18next';
import { AppHeader } from 'src/component/common/AppHeader';
import { ScreenContainer } from 'src/component/common/ScreenContainer';
import { PetsTab } from 'src/component/profile/PetsTab';

export function PetsScreen() {
  const { t } = useTranslation();

  return (
    <ScreenContainer header={<AppHeader title={t('navigation.pets')} />}>
      <PetsTab />
    </ScreenContainer>
  );
}
