import React from 'react';
import { View } from 'react-native';
import { ModalContainer } from 'src/component/common/ModalContainer';

export interface EditProfileBottomSheetProps {
  visible: boolean;
  onClose: () => void;
  children: React.ReactNode;
}

export function EditProfileBottomSheet({
  visible,
  onClose,
  children,
}: EditProfileBottomSheetProps) {
  return (
    <ModalContainer
      visible={visible}
      onRequestClose={onClose}
      testID="edit-profile-bottom-sheet"
    >
      <View>{children}</View>
    </ModalContainer>
  );
}
