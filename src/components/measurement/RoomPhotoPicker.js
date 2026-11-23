import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Alert,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SPACING, FONT_SIZES } from '../../constants/theme';

export const SURFACE_MATERIALS = [
  'Carpet Floor',
  'Hardwood / Tile',
  'Concrete / Brick',
  'Glass Windows',
  'Acoustic Panels',
  'Heavy Curtains',
];

export const RoomPhotoPicker = ({
  photoUri,
  onPhotoSelected,
  selectedMaterials = [],
  onMaterialsChanged,
}) => {
  const [isPicking, setIsPicking] = useState(false);

  const handleLaunchCamera = async () => {
    try {
      setIsPicking(true);
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          'Camera Permission Required',
          'AcoustiTape requires camera access to document room surfaces for acoustic analysis.'
        );
        setIsPicking(false);
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [16, 9],
        quality: 0.7,
      });

      setIsPicking(false);
      if (!result.canceled && result.assets && result.assets.length > 0) {
        onPhotoSelected(result.assets[0].uri);
      }
    } catch (err) {
      setIsPicking(false);
      console.warn('[RoomPhotoPicker] Camera error:', err);
    }
  };

  const handleLaunchLibrary = async () => {
    try {
      setIsPicking(true);
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [16, 9],
        quality: 0.7,
      });

      setIsPicking(false);
      if (!result.canceled && result.assets && result.assets.length > 0) {
        onPhotoSelected(result.assets[0].uri);
      }
    } catch (err) {
      setIsPicking(false);
      console.warn('[RoomPhotoPicker] Library error:', err);
    }
  };

  const toggleMaterial = (mat) => {
    if (selectedMaterials.includes(mat)) {
      onMaterialsChanged(selectedMaterials.filter((m) => m !== mat));
    } else {
      onMaterialsChanged([...selectedMaterials, mat]);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.sectionTitle}>Room Visual Audit (Optional)</Text>

      {/* Photo Preview / Capture Card */}
      {photoUri ? (
        <View style={styles.previewContainer}>
          <Image source={{ uri: photoUri }} style={styles.previewImage} />
          <TouchableOpacity
            style={styles.retakeButton}
            onPress={handleLaunchCamera}
            activeOpacity={0.8}
          >
            <Ionicons name="camera-reverse" size={16} color="#FFF" />
            <Text style={styles.retakeText}>Retake Photo</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View style={styles.buttonsRow}>
          <TouchableOpacity
            style={styles.actionBtn}
            onPress={handleLaunchCamera}
            disabled={isPicking}
            activeOpacity={0.7}
          >
            <Ionicons name="camera" size={18} color={COLORS.primary} />
            <Text style={styles.actionBtnText}>Take Room Photo</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.actionBtn}
            onPress={handleLaunchLibrary}
            disabled={isPicking}
            activeOpacity={0.7}
          >
            <Ionicons name="images" size={18} color={COLORS.textSecondary} />
            <Text style={[styles.actionBtnText, { color: COLORS.textSecondary }]}>
              Gallery
            </Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Surface Material Tags */}
      <Text style={styles.materialPrompt}>Select primary surface materials:</Text>
      <View style={styles.pillsWrap}>
        {SURFACE_MATERIALS.map((mat) => {
          const isSelected = selectedMaterials.includes(mat);
          return (
            <TouchableOpacity
              key={mat}
              style={[styles.pill, isSelected && styles.pillSelected]}
              onPress={() => toggleMaterial(mat)}
              activeOpacity={0.7}
            >
              <Text style={[styles.pillText, isSelected && styles.pillTextSelected]}>
                {mat}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: COLORS.card,
    borderRadius: 14,
    padding: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginVertical: SPACING.sm,
  },
  sectionTitle: {
    color: COLORS.text,
    fontSize: FONT_SIZES.sm,
    fontWeight: '700',
    marginBottom: 8,
  },
  buttonsRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 10,
  },
  actionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: COLORS.surface,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  actionBtnText: {
    color: COLORS.primary,
    fontSize: 12,
    fontWeight: '600',
  },
  previewContainer: {
    borderRadius: 10,
    overflow: 'hidden',
    position: 'relative',
    marginBottom: 10,
  },
  previewImage: {
    width: '100%',
    height: 140,
    borderRadius: 10,
  },
  retakeButton: {
    position: 'absolute',
    bottom: 8,
    right: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
  },
  retakeText: {
    color: '#FFF',
    fontSize: 11,
    fontWeight: '600',
  },
  materialPrompt: {
    color: COLORS.textMuted,
    fontSize: 11,
    marginBottom: 8,
  },
  pillsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  pill: {
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 16,
  },
  pillSelected: {
    backgroundColor: 'rgba(6, 182, 212, 0.15)',
    borderColor: COLORS.primary,
  },
  pillText: {
    color: COLORS.textSecondary,
    fontSize: 11,
  },
  pillTextSelected: {
    color: COLORS.primary,
    fontWeight: '700',
  },
});
