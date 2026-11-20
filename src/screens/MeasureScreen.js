import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SPACING, FONT_SIZES } from '../constants/theme';
import { LiveVUMeter } from '../components/measurement/LiveVUMeter';
import {
  startImpulseRecording,
  stopImpulseRecording,
  cancelImpulseRecording,
} from '../services/audio/audioRecorder';
import { detectImpulse } from '../services/dsp/impulseDetector';
import { generateSampleMeasurement } from '../services/dsp/mockAcoustics';

export const MeasureScreen = ({ onMeasurementComplete, lastMeasurement }) => {
  const [recordingState, setRecordingState] = useState('idle'); // 'idle' | 'recording' | 'processing'
  const [currentDb, setCurrentDb] = useState(-60);
  const [roomName] = useState('Room Acoustics');
  const [captureStats, setCaptureStats] = useState(null);

  const recordingTimeoutRef = useRef(null);

  // Starts real hardware microphone recording
  const handleStartLiveRecording = async () => {
    try {
      setRecordingState('recording');
      setCurrentDb(-60);
      setCaptureStats(null);

      await startImpulseRecording(({ meteringDb }) => {
        setCurrentDb(meteringDb);
      });

      // Automatically capture a 3.5-second impulse window (sufficient for any room decay)
      recordingTimeoutRef.current = setTimeout(async () => {
        await handleStopLiveRecording();
      }, 3500);
    } catch (error) {
      console.error('[MeasureScreen] Recording error:', error);
      setRecordingState('idle');
      Alert.alert(
        'Recording Failed',
        error.message || 'Could not start microphone recording. Please check permissions.'
      );
    }
  };

  // Stops recording and feeds PCM samples to impulseDetector
  const handleStopLiveRecording = async () => {
    if (recordingTimeoutRef.current) {
      clearTimeout(recordingTimeoutRef.current);
      recordingTimeoutRef.current = null;
    }

    try {
      setRecordingState('processing');
      const audioData = await stopImpulseRecording();

      // Day 3 Core: Impulse Detection, Windowing & Noise Floor Estimation
      const impulse = detectImpulse(audioData.samples, audioData.sampleRate);

      setCaptureStats({
        sampleRate: audioData.sampleRate,
        samplesCount: audioData.samples.length,
        decaySamplesCount: impulse.decaySamples ? impulse.decaySamples.length : 0,
        onsetMs: impulse.onsetMs,
        peakDb: impulse.peakDb,
        noiseFloorDb: impulse.noiseFloorDb,
        snrDb: impulse.snrDb,
        isValid: impulse.isValid,
        message: impulse.validationMessage,
      });

      // Check if impulse is valid for ISO 3382 analysis
      if (!impulse.isValid) {
        setRecordingState('idle');
        Alert.alert(
          'Impulse Quality Warning',
          impulse.validationMessage,
          [
            { text: 'Try Again', onPress: () => handleStartLiveRecording() },
            {
              text: 'Use Demo Anyway',
              style: 'cancel',
              onPress: () => {
                const sample = generateSampleMeasurement(roomName);
                onMeasurementComplete(sample);
              },
            },
          ]
        );
        return;
      }

      // Valid impulse captured: pass metrics into measurement result
      const measurement = generateSampleMeasurement(roomName);
      measurement.peakDb = impulse.peakDb;
      measurement.noiseFloorDb = impulse.noiseFloorDb;
      measurement.snrDb = impulse.snrDb;

      setTimeout(() => {
        setRecordingState('idle');
        onMeasurementComplete(measurement);
      }, 700);
    } catch (error) {
      console.error('[MeasureScreen] Stop error:', error);
      setRecordingState('idle');
      Alert.alert('Processing Error', error.message || 'Failed to process audio recording.');
    }
  };

  const handleCancelRecording = async () => {
    if (recordingTimeoutRef.current) {
      clearTimeout(recordingTimeoutRef.current);
      recordingTimeoutRef.current = null;
    }
    await cancelImpulseRecording();
    setRecordingState('idle');
    setCurrentDb(-60);
  };

  const handleSimulateClap = () => {
    setRecordingState('processing');
    setTimeout(() => {
      const sample = generateSampleMeasurement(roomName);
      setRecordingState('idle');
      onMeasurementComplete(sample);
    }, 1000);
  };

  const isRecording = recordingState === 'recording';
  const isProcessing = recordingState === 'processing';

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
            Acoustic impulse onset detection and SNR validation.
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
                isProcessing && { backgroundColor: COLORS.surfaceLight },
              ]}
            >
              <Ionicons
                name={
                  isProcessing
                    ? 'hourglass-outline'
                    : isRecording
                    ? 'radio-outline'
                    : 'mic-outline'
                }
                size={48}
                color={COLORS.text}
              />
              <Text style={styles.meterStatus}>
                {isProcessing
                  ? 'Analyzing Onset (t0)...'
                  : isRecording
                  ? 'CLAP NOW! 👏'
                  : 'Ready to Capture'}
              </Text>
            </View>
          </View>
        </View>

        {/* Live Ambient Noise VU Meter */}
        <LiveVUMeter meteringDb={currentDb} isActive={isRecording} />

        {/* Action Buttons */}
        <View style={styles.actionSection}>
          {isRecording ? (
            <TouchableOpacity
              style={[styles.primaryButton, { backgroundColor: COLORS.danger }]}
              onPress={handleCancelRecording}
              activeOpacity={0.8}
            >
              <Ionicons name="stop-circle-outline" size={20} color="#FFF" />
              <Text style={[styles.primaryButtonText, { color: '#FFF' }]}>
                Cancel Recording
              </Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={[styles.primaryButton, isProcessing && styles.buttonDisabled]}
              disabled={isProcessing}
              onPress={handleStartLiveRecording}
              activeOpacity={0.8}
            >
              <Ionicons name="mic" size={20} color="#000" />
              <Text style={styles.primaryButtonText}>
                {isProcessing ? 'Processing Waveform...' : 'Record Live Handclap'}
              </Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity
            style={styles.secondaryButton}
            disabled={isRecording || isProcessing}
            onPress={handleSimulateClap}
            activeOpacity={0.7}
          >
            <Ionicons name="sparkles-outline" size={16} color={COLORS.primary} />
            <Text style={styles.secondaryButtonText}>Test with Demo Impulse</Text>
          </TouchableOpacity>

          <Text style={styles.dayNotice}>
            Day 3 Active: Onset detection (t0), pre-trigger windowing, and ISO 3382 SNR quality validation.
          </Text>
        </View>

        {/* Audio Capture Diagnostics (if available) */}
        {captureStats && (
          <View style={styles.statsCard}>
            <View style={styles.statsHeaderRow}>
              <Text style={styles.cardHeader}>Impulse Conditioning Stats</Text>
              <View
                style={[
                  styles.qualityBadge,
                  { backgroundColor: captureStats.isValid ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)' },
                ]}
              >
                <Text
                  style={[
                    styles.qualityBadgeText,
                    { color: captureStats.isValid ? COLORS.accent : COLORS.danger },
                  ]}
                >
                  {captureStats.isValid ? 'VALID IMPULSE' : 'REJECTED'}
                </Text>
              </View>
            </View>

            <View style={styles.statsGrid}>
              <View style={styles.statCell}>
                <Text style={styles.statLabel}>Clap Onset (t0)</Text>
                <Text style={styles.statValue}>{captureStats.onsetMs} ms</Text>
              </View>
              <View style={styles.statCell}>
                <Text style={styles.statLabel}>Dynamic Range (SNR)</Text>
                <Text
                  style={[
                    styles.statValue,
                    { color: captureStats.snrDb >= 30 ? COLORS.accent : COLORS.warning },
                  ]}
                >
                  {captureStats.snrDb} dB
                </Text>
              </View>
              <View style={styles.statCell}>
                <Text style={styles.statLabel}>Peak Level</Text>
                <Text style={styles.statValue}>{captureStats.peakDb} dB</Text>
              </View>
              <View style={styles.statCell}>
                <Text style={styles.statLabel}>Noise Floor</Text>
                <Text style={styles.statValue}>{captureStats.noiseFloorDb} dB</Text>
              </View>
            </View>

            {captureStats.message && (
              <Text style={styles.statMessage}>{captureStats.message}</Text>
            )}
          </View>
        )}

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
                Check the VU meter above — ensure ambient level is below -40 dB.
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
                Tap "Record Live Handclap" and produce a single, sharp handclap!
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
    maxWidth: 290,
  },
  meterContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: SPACING.md,
  },
  outerRing: {
    width: 190,
    height: 190,
    borderRadius: 95,
    borderWidth: 2,
    borderColor: COLORS.border,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(6, 182, 212, 0.03)',
  },
  innerCircle: {
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.border,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 12,
  },
  meterStatus: {
    color: COLORS.text,
    fontSize: 12,
    marginTop: 8,
    fontWeight: '700',
    textAlign: 'center',
  },
  actionSection: {
    marginVertical: SPACING.sm,
    alignItems: 'center',
    gap: 8,
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
  secondaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: COLORS.border,
    width: '100%',
  },
  secondaryButtonText: {
    color: COLORS.primary,
    fontSize: 13,
    fontWeight: '600',
  },
  dayNotice: {
    color: COLORS.textMuted,
    fontSize: 11,
    textAlign: 'center',
    marginTop: 4,
    paddingHorizontal: 16,
  },
  statsCard: {
    backgroundColor: COLORS.card,
    borderRadius: 14,
    padding: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.primary,
    marginTop: SPACING.md,
  },
  statsHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  qualityBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  qualityBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.8,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginTop: 8,
  },
  statCell: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: COLORS.surface,
    padding: 8,
    borderRadius: 8,
  },
  statLabel: {
    color: COLORS.textSecondary,
    fontSize: 10,
  },
  statValue: {
    color: COLORS.primary,
    fontSize: 14,
    fontWeight: '700',
    marginTop: 2,
  },
  statMessage: {
    color: COLORS.textSecondary,
    fontSize: 11,
    marginTop: 8,
    fontStyle: 'italic',
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
