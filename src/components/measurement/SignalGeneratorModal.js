import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  SafeAreaView,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SPACING, FONT_SIZES } from '../../constants/theme';
import { playAcousticSignal, stopAcousticSignal } from '../../services/audio/signalGenerator';

export const SignalGeneratorModal = ({ visible, onClose }) => {
  const [activeSignal, setActiveSignal] = useState(null); // null | 'impulse' | 'sweep' | 'pink_noise'
  const [isPlaying, setIsPlaying] = useState(false);

  const handlePlay = async (type) => {
    if (isPlaying && activeSignal === type) {
      await stopAcousticSignal();
      setIsPlaying(false);
      setActiveSignal(null);
      return;
    }

    setActiveSignal(type);
    setIsPlaying(true);
    await playAcousticSignal(type, () => {
      setIsPlaying(false);
      setActiveSignal(null);
    });
  };

  const handleClose = async () => {
    await stopAcousticSignal();
    setIsPlaying(false);
    setActiveSignal(null);
    onClose();
  };

  const SIGNALS = [
    {
      id: 'impulse',
      name: 'Dirac Acoustic Impulse Burst',
      duration: '80 ms',
      icon: 'flash',
      color: COLORS.primary,
      desc: 'Precision 1 kHz band-limited acoustic impulse. Plays a sharp burst to excite room reflections without handclapping.',
    },
    {
      id: 'sweep',
      name: 'Logarithmic Sine Sweep (20Hz - 20kHz)',
      duration: '2.5 s',
      icon: 'pulse',
      color: COLORS.accent,
      desc: 'ISO 3382 standard continuous sine chirp. Ideal when connected to an external PA or Bluetooth speaker.',
    },
    {
      id: 'pink_noise',
      name: 'Calibrated Pink Noise (-3dB/octave)',
      duration: '2.0 s',
      icon: 'radio',
      color: '#F59E0B',
      desc: 'Equal energy per octave band. Used for real-time room frequency response and speaker alignment.',
    },
  ];

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <SafeAreaView style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.titleRow}>
              <Ionicons name="volume-high" size={22} color={COLORS.primary} />
              <Text style={styles.title}>Acoustic Signal Generator</Text>
            </View>
            <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
              <Ionicons name="close" size={22} color={COLORS.textSecondary} />
            </TouchableOpacity>
          </View>

          <Text style={styles.subtitle}>
            Play calibrated test sounds through your phone speaker or connected Bluetooth/AUX sound system.
          </Text>

          {/* Sound Cards */}
          <View style={styles.cardsContainer}>
            {SIGNALS.map((sig) => {
              const isThisPlaying = isPlaying && activeSignal === sig.id;
              return (
                <View
                  key={sig.id}
                  style={[
                    styles.signalCard,
                    isThisPlaying && { borderColor: sig.color, backgroundColor: 'rgba(6, 182, 212, 0.08)' },
                  ]}
                >
                  <View style={styles.cardHeader}>
                    <View style={styles.cardIconRow}>
                      <View style={[styles.iconBadge, { backgroundColor: `${sig.color}20` }]}>
                        <Ionicons name={sig.icon} size={18} color={sig.color} />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.signalName}>{sig.name}</Text>
                        <Text style={styles.durationText}>Duration: {sig.duration}</Text>
                      </View>
                    </View>
                    <TouchableOpacity
                      style={[
                        styles.playButton,
                        isThisPlaying ? { backgroundColor: COLORS.danger } : { backgroundColor: sig.color },
                      ]}
                      onPress={() => handlePlay(sig.id)}
                      activeOpacity={0.8}
                    >
                      {isThisPlaying ? (
                        <>
                          <Ionicons name="stop" size={14} color="#FFF" />
                          <Text style={styles.playButtonText}>Stop</Text>
                        </>
                      ) : (
                        <>
                          <Ionicons name="play" size={14} color="#000" />
                          <Text style={[styles.playButtonText, { color: '#000' }]}>Play</Text>
                        </>
                      )}
                    </TouchableOpacity>
                  </View>
                  <Text style={styles.signalDesc}>{sig.desc}</Text>
                </View>
              );
            })}
          </View>

          {/* Speaker Setup Tip */}
          <View style={styles.tipBox}>
            <Ionicons name="information-circle" size={16} color={COLORS.primary} />
            <Text style={styles.tipText}>
              Tip: For large auditoriums, connect your phone to the venue PA system via Bluetooth or 3.5mm AUX and play the Dirac Impulse to record the reverberation decay.
            </Text>
          </View>

          <TouchableOpacity style={styles.doneButton} onPress={handleClose}>
            <Text style={styles.doneButtonText}>Close Generator</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.85)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: COLORS.card,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: SPACING.md,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    maxHeight: '90%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  title: {
    color: COLORS.text,
    fontSize: FONT_SIZES.lg,
    fontWeight: '800',
  },
  closeButton: {
    padding: 4,
  },
  subtitle: {
    color: COLORS.textSecondary,
    fontSize: 12,
    marginBottom: SPACING.md,
    lineHeight: 16,
  },
  cardsContainer: {
    gap: 10,
    marginBottom: SPACING.md,
  },
  signalCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cardIconRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  iconBadge: {
    width: 34,
    height: 34,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  signalName: {
    color: COLORS.text,
    fontSize: 13,
    fontWeight: '700',
  },
  durationText: {
    color: COLORS.textMuted,
    fontSize: 11,
    marginTop: 1,
  },
  playButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 8,
  },
  playButtonText: {
    fontSize: 12,
    fontWeight: '700',
  },
  signalDesc: {
    color: COLORS.textMuted,
    fontSize: 11,
    marginTop: 8,
    lineHeight: 15,
  },
  tipBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    backgroundColor: 'rgba(6, 182, 212, 0.08)',
    padding: 10,
    borderRadius: 8,
    marginBottom: SPACING.md,
  },
  tipText: {
    color: COLORS.textSecondary,
    fontSize: 11,
    lineHeight: 16,
    flex: 1,
  },
  doneButton: {
    backgroundColor: COLORS.surfaceLight,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  doneButtonText: {
    color: COLORS.text,
    fontSize: 13,
    fontWeight: '700',
  },
});
