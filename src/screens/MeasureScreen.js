import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SPACING, FONT_SIZES } from '../constants/theme';
import { generateSampleMeasurement } from '../services/dsp/mockAcoustics';

export const MeasureScreen = ({ onMeasurementComplete, lastMeasurement }) => {
  const [isRecording, setIsRecording] = useState(false);
  const [roomName] = useState('Room Acoustics');

  const handleSimulateClap = () => {
    setIsRecording(true);
    setTimeout(() => {
      const sample = generateSampleMeasurement(roomName);
      setIsRecording(false);
      onMeasurementComplete(sample);
    }, 1200);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container}>
        {/* App Title Header */}
        <View style={styles.header}>
          <View style={styles.badge}>
            <Text style={styles.badgeText}>ISO 3382 IMPULSE ENGINE</Text>
          </View>
          <Text style={styles.title}>AcoustiTape</Text>
          <Text style={styles.subtitle}>
            Measure room reverberation time (RT60) using a single handclap.
          </Text>
        </View>

        {/* Central Pulse / Clap Trigger Circle */}
        <View style={styles.meterContainer}>
          <View
            style={[
              styles.outerRing,
              isRecording && { borderColor: COLORS.primary, transform: [{ scale: 1.05 }] },
            ]}
          >
            <View
              style={[
                styles.innerCircle,
                isRecording && { backgroundColor: COLORS.primaryHover },
              ]}
            >
              <Ionicons
                name={isRecording ? 'radio-outline' : 'mic-outline'}
                size={48}
                color={COLORS.text}
              />
              <Text style={styles.meterStatus}>
                {isRecording ? 'Listening for clap...' : 'Ready to capture'}
              </Text>
            </View>
          </View>
        </View>

        {/* Action Buttons */}
        <View style={styles.actionSection}>
          <TouchableOpacity
            style={[styles.primaryButton, isRecording && styles.buttonDisabled]}
            disabled={isRecording}
            onPress={handleSimulateClap}
            activeOpacity={0.8}
          >
            <Ionicons name="sparkles-outline" size={20} color="#000" />
            <Text style={styles.primaryButtonText}>
              {isRecording ? 'Analyzing Acoustics...' : 'Test with Demo Impulse'}
            </Text>
          </TouchableOpacity>

          <Text style={styles.day1Notice}>
            Day 1 Setup: JavaScript architecture verified. Audio recording engine will hook into hardware on Day 2.
          </Text>
        </View>

        {/* Step-by-Step Instructions Card */}
        <View style={styles.card}>
          <Text style={styles.cardHeader}>How to take a measurement</Text>

          <View style={styles.stepRow}>
            <View style={styles.stepNumber}>
              <Text style={styles.stepNumberText}>1</Text>
            </View>
            <View style={styles.stepContent}>
              <Text style={styles.stepTitle}>Position</Text>
              <Text style={styles.stepDesc}>
                Hold phone at chest height in the center of the room.
              </Text>
            </View>
          </View>

          <View style={styles.stepRow}>
            <View style={styles.stepNumber}>
              <Text style={styles.stepNumberText}>2</Text>
            </View>
            <View style={styles.stepContent}>
              <Text style={styles.stepTitle}>Silence</Text>
              <Text style={styles.stepDesc}>
                Ensure quiet background noise (AC or fans minimized).
              </Text>
            </View>
          </View>

          <View style={styles.stepRow}>
            <View style={styles.stepNumber}>
              <Text style={styles.stepNumberText}>3</Text>
            </View>
            <View style={styles.stepContent}>
              <Text style={styles.stepTitle}>Produce Impulse</Text>
              <Text style={styles.stepDesc}>
                Clap hands once sharply, pop a balloon, or snap fingers firmly.
              </Text>
            </View>
          </View>
        </View>

        {/* Previous Measurement Quick Peek */}
        {lastMeasurement && (
          <View style={styles.previousResultCard}>
            <View style={styles.previousResultHeader}>
              <Text style={styles.previousTitle}>Last Measurement</Text>
              <Text style={styles.previousRoom}>{lastMeasurement.roomName}</Text>
            </View>
            <View style={styles.previousStats}>
              <View>
                <Text style={styles.statLabel}>Overall RT60</Text>
                <Text style={styles.statValue}>
                  {lastMeasurement.overallRT60.toFixed(2)}s
                </Text>
              </View>
              <View>
                <Text style={styles.statLabel}>Fit Quality (R²)</Text>
                <Text style={styles.statValue}>
                  {(lastMeasurement.rSquared * 100).toFixed(1)}%
                </Text>
              </View>
              <View>
                <Text style={styles.statLabel}>Early Decay (EDT)</Text>
                <Text style={styles.statValue}>
                  {lastMeasurement.edt.toFixed(2)}s
                </Text>
              </View>
            </View>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  container: {
    padding: SPACING.md,
    paddingBottom: SPACING.xl,
  },
  header: {
    alignItems: 'center',
    marginVertical: SPACING.md,
  },
  badge: {
    backgroundColor: COLORS.card,
    borderColor: COLORS.primary,
    borderWidth: 1,
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 4,
    marginBottom: 8,
  },
  badgeText: {
    color: COLORS.primary,
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1.2,
  },
  title: {
    color: COLORS.text,
    fontSize: FONT_SIZES.hero,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  subtitle: {
    color: COLORS.textSecondary,
    fontSize: FONT_SIZES.sm,
    textAlign: 'center',
    marginTop: 4,
    maxWidth: 280,
  },
  meterContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: SPACING.lg,
  },
  outerRing: {
    width: 200,
    height: 200,
    borderRadius: 100,
    borderWidth: 2,
    borderColor: COLORS.border,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(6, 182, 212, 0.03)',
  },
  innerCircle: {
    width: 150,
    height: 150,
    borderRadius: 75,
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.border,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 12,
  },
  meterStatus: {
    color: COLORS.textSecondary,
    fontSize: 12,
    marginTop: 8,
    fontWeight: '500',
  },
  actionSection: {
    marginVertical: SPACING.sm,
    alignItems: 'center',
  },
  primaryButton: {
    backgroundColor: COLORS.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    paddingHorizontal: 28,
    borderRadius: 12,
    width: '100%',
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  primaryButtonText: {
    color: '#000',
    fontSize: FONT_SIZES.md,
    fontWeight: '700',
  },
  day1Notice: {
    color: COLORS.textMuted,
    fontSize: 11,
    textAlign: 'center',
    marginTop: 10,
    paddingHorizontal: 16,
  },
  card: {
    backgroundColor: COLORS.card,
    borderRadius: 14,
    padding: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginTop: SPACING.md,
  },
  cardHeader: {
    color: COLORS.text,
    fontSize: FONT_SIZES.md,
    fontWeight: '700',
    marginBottom: SPACING.md,
  },
  stepRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: SPACING.md,
    gap: 12,
  },
  stepNumber: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: COLORS.surfaceLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  stepNumberText: {
    color: COLORS.primary,
    fontSize: 12,
    fontWeight: '700',
  },
  stepContent: {
    flex: 1,
  },
  stepTitle: {
    color: COLORS.text,
    fontSize: FONT_SIZES.sm,
    fontWeight: '600',
  },
  stepDesc: {
    color: COLORS.textSecondary,
    fontSize: 12,
    marginTop: 2,
  },
  previousResultCard: {
    backgroundColor: COLORS.card,
    borderRadius: 14,
    padding: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginTop: SPACING.md,
  },
  previousResultHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: SPACING.sm,
  },
  previousTitle: {
    color: COLORS.textMuted,
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  previousRoom: {
    color: COLORS.primary,
    fontSize: 12,
    fontWeight: '600',
  },
  previousStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  statLabel: {
    color: COLORS.textSecondary,
    fontSize: 11,
  },
  statValue: {
    color: COLORS.text,
    fontSize: FONT_SIZES.md,
    fontWeight: '700',
    marginTop: 2,
  },
});
