/**
 * A full-screen modal for viewing images.
 */
import { Image } from 'expo-image';
import React from 'react';
import {
  Dimensions,
  Modal,
  Pressable,
  TouchableOpacity,
  View,
} from 'react-native';
import { StyleSheet, useUnistyles } from 'react-native-unistyles';
import { X } from 'src/lib/icons';

const CLOSE_BUTTON_TOP = 48;

interface ImageModalProps {
  visible: boolean;
  imageUrl: string | null;
  onClose: () => void;
  testID?: string;
}

const { width, height } = Dimensions.get('window');

export const ImageModal: React.FC<ImageModalProps> = ({
  visible,
  imageUrl,
  onClose,
  testID,
}) => {
  const { theme } = useUnistyles();

  if (!imageUrl) return null;

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        <TouchableOpacity
          testID={`${testID}-close`}
          style={styles.closeButton}
          onPress={onClose}
          activeOpacity={0.7}
        >
          <X size={theme.sizes.iconLg} color={theme.colors.TEXT_ON_IMAGE} />
        </TouchableOpacity>

        <Pressable
          testID={`${testID}-image`}
          style={[styles.imageContainer, { width, height }]}
          onPress={onClose}
        >
          <Image
            source={{ uri: imageUrl }}
            style={styles.image}
            contentFit="contain"
            transition={300}
          />
        </Pressable>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create((theme) => ({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
  },
  closeButton: {
    position: 'absolute',
    right: theme.spacing.xl,
    top: CLOSE_BUTTON_TOP,
    zIndex: theme.zIndex.dropdown,
    padding: theme.spacing.sm,
  },
  imageContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  image: {
    height: height * 0.8,
    width: '100%',
  },
}));
