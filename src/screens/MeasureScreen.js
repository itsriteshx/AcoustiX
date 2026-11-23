import React, { useState, useRef, useEffect } from 'react';
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
import { LevelBubble } from '../components/measurement/LevelBubble';
import { RoomPhotoPicker } from '../components/measurement/RoomPhotoPicker';
import {
  startImpulseRecording,
  stopImpulseRecording,
  cancelImpulseRecording,
} from '../services/audio/audioRecorder';
import {
  startStabilityGuard,
  stopStabilityGuard,
} from '../services/sensors/stabilityGuard';
import { getCurrentLocation } from '../services/location/locationService';
import { analyzeAcoustics } from '../services/dsp/acousticAnalyzer';
import { generateSampleMeasurement } from '../services/dsp/mockAcoustics';

export const MeasureScreen = ({ onMeasurementComplete, lastMeasurement }) => {
  const [recordingState, setRecordingState] = useState('idle'); // 'idle' | 'recording' | 'processing'
  const [currentDb, setCurrentDb] = useState(-60);
  const [roomName, setRoomName] = useState('Room Acoustics');
  const [captureStats, setCaptureStats] = useState(null);
  const [locationData, setLocationData] = useState(null);
  const [photoUri, setPhotoUri] = useState(null);
  const [surfaceMaterials, setSurfaceMaterials] = useState([]);

  // Day 6 Accelerometer Stability State
  const [sensorData, setSensorData] = useState({
    pitch: 0,
    roll: 0,
    gForce: 1.0,
    isSteady: true,
    isLevel: true,
    isBumped: false,
  });

  const recordingTimeoutRef = useRef(null);
  const wasBumpedDuringRecordRef = useRef(false);

  // Initialize Accelerometer Stability Guard and GPS Location on mount
  useEffect(() => {
    startStabilityGuard((data) => {
      setSensorData(data);
      if (data.isBumped) {
        wasBumpedDuringRecordRef.current = true;
      }
    });

    // Acquire GPS location tag
    getCurrentLocation().then((loc) => {
      setLocationData(loc);
      if (loc && loc.venueName && loc.venueName !== 'Manual Entry (No GPS)') {
        setRoomName(loc.venueName);
      }
    });

    return () => {
      stopStabilityGuard();
    };
  }, []);

  // Starts real hardware microphone recording
  const handleStartLiveRecording = async () => {
    try {
      wasBumpedDuringRecordRef.current = false;
      setRecordingState('recording');
      setCurrentDb(-60);
      setCaptureStats(null);

      await startImpulseRecording(({ meteringDb }) => {
        setCurrentDb(meteringDb);
      });

      // Capture a 3.5-second impulse window
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

  // Stops recording and executes the full DSP pipeline (Days 3, 4, 5)
  const handleStopLiveRecording = async () => {
    if (recordingTimeoutRef.current) {
      clearTimeout(recordingTimeoutRef.current);
      recordingTimeoutRef.current = null;
    }

    try {
      setRecordingState('processing');
      const audioData = await stopImpulseRecording();

      // Check if phone was bumped/dropped during recording
      if (wasBumpedDuringRecordRef.current) {
        setRecordingState('idle');
        Alert.alert(
          'Motion Artifact Detected',
          'Phone acceleration spiked (> 1.75g) during capture. Please hold the phone steady and retry.',
          [
            { text: 'Retry', onPress: () => handleStartLiveRecording() },
            { text: 'Cancel', style: 'cancel' },
          ]
        );
        return;
      }

      // Execute full ISO 3382 DSP Analysis (Days 3, 4, 5, 7, 8)
      const measurement = analyzeAcoustics(
        audioData.samples,
        audioData.sampleRate,
        roomName,
        locationData
      );
      measurement.photoUri = photoUri;
      measurement.surfaceMaterials = surfaceMaterials;

      setCaptureStats({
        sampleRate: audioData.sampleRate,
        samplesCount: audioData.samples.length,
        decayCurvePoints: measurement.decayCurve.length,
        overallRT60: measurement.overallRT60,
        t20: measurement.t20,
        t30: measurement.t30,
        edt: measurement.edt,
        rSquared: measurement.rSquared,
        peakDb: measurement.peakDb,
        noiseFloorDb: measurement.noiseFloorDb,
        snrDb: measurement.snrDb,
        bassRatio: measurement.bassRatio,
        warmth: measurement.interpretation.warmth,
        isValid: true,
      });

      setTimeout(() => {
        setRecordingState('idle');
        onMeasurementComplete(measurement);
      }, 600);
    } catch (error) {
      console.error('[MeasureScreen] Analysis error:', error);
      setRecordingState('idle');
      Alert.alert(
        'Impulse Analysis Warning',
        error.message || 'Failed to analyze impulse response. Please clap firmly in a quiet room.',
        [
          { text: 'Try Again', onPress: () => handleStartLiveRecording() },
          {
            text: 'Use Demo',
            style: 'cancel',
            onPress: () => {
              const sample = generateSampleMeasurement(roomName);
              onMeasurementComplete(sample);
            },
          },
        ]
      );
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
    }, 800);
  };

  const isRecording = recordingState === 'recording';
  const isProcessing = recordingState === 'processing';

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container}>
        {/* App Title Header */}
        <View style={styles.header}>
          <View style={styles.badge}>
            <Text style={styles.badgeText}>ISO 3382 SCHROEDER ENGINE</Text>
          </View>
          <Text style={styles.title}>AcoustiTape</Text>
          <Text style={styles.subtitle}>
            Impulse analysis, octave bandpass filters & sensor stability guard.
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
                  ? 'Calculating Schroeder RT60...'
                  : isRecording
                  ? 'CLAP NOW! 👏'
                  : 'Ready to Capture'}
              </Text>
            </View>
          </View>
        </View>

        {/* GPS Location Tagging */}
        <View style={styles.locationPill}>
          <Ionicons
            name={locationData?.isGeoTagged ? 'location' : 'location-outline'}
            size={14}
            color={locationData?.isGeoTagged ? COLORS.primary : COLORS.textMuted}
          />
          <Text style={styles.locationText} numberOfLines={1}>
            {locationData?.venueName || 'Acquiring GPS venue...'}
          </Text>
        </View>

        {/* Day 6: Accelerometer Spirit Level & Motion Guard */}
        <LevelBubble
          pitch={sensorData.pitch}
          roll={sensorData.roll}
          isSteady={sensorData.isSteady}
          isLevel={sensorData.isLevel}
          isBumped={sensorData.isBumped}
        />

        {/* Day 8: Room Visual Documentation & Surface Materials */}
        <RoomPhotoPicker
          photoUri={photoUri}
          onPhotoSelected={setPhotoUri}
          selectedMaterials={surfaceMaterials}
          onMaterialsChanged={setSurfaceMaterials}
        />

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
                {isProcessing ? 'Processing Schroeder Math...' : 'Record Live Handclap'}
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
            Days 4, 5, 6 Active: Schroeder Integration, 6-Band Octave Filters, and Accelerometer Stability Guard.
          </Text>
        </View>

        {/* Real DSP Measurement Summary Card */}
        {captureStats && (
          <View style={styles.statsCard}>
            <View style={styles.statsHeaderRow}>
              <Text style={styles.cardHeader}>Live DSP Analysis (ISO 3382)</Text>
              <View style={styles.qualityBadge}>
                <Text style={styles.qualityBadgeText}>R² = {(captureStats.rSquared * 100).toFixed(1)}%</Text>
              </View>
            </View>

            <View style={styles.statsGrid}>
              <View style={styles.statCell}>
                <Text style={styles.statLabel}>Broadband RT60</Text>
                <Text style={styles.statValue}>{captureStats.overallRT60}s</Text>
              </View>
              <View style={styles.statCell}>
                <Text style={styles.statLabel}>T20 (-5 to -25dB)</Text>
                <Text style={styles.statValue}>{captureStats.t20}s</Text>
              </View>
              <View style={styles.statCell}>
                <Text style={styles.statLabel}>Early Decay (EDT)</Text>
                <Text style={styles.statValue}>{captureStats.edt}s</Text>
              </View>
              <View style={styles.statCell}>
                <Text style={styles.statLabel}>Bass Ratio</Text>
                <Text style={styles.statValue}>{captureStats.bassRatio} ({captureStats.warmth})</Text>
              </View>
            </View>
          </View>
        )}

        {/* Step-by-Step Instructions Card */}
        <View style={styles.card}>
          <Text style={styles.cardHeader}>Measurement Guidelines</Text>

          <View style={styles.stepRow}>
            <View style={styles.stepNumber}>
              <Text style={styles.stepNumberText}>1</Text>
            </View>
            <View style={styles.stepContent}>
              <Text style={styles.stepTitle}>Position & Stability</Text>
              <Text style={styles.stepDesc}>
                Hold phone steady at chest height. Check the spirit bubble above (green is steady).
              </Text>
            </View>
          </View>

          <View style={styles.stepRow}>
            <View style={styles.stepNumber}>
              <Text style={styles.stepNumberText}>2</Text>
            </View>
            <View style={styles.stepContent}>
              <Text style={styles.stepTitle}>Background Noise</Text>
              <Text style={styles.stepDesc}>
                VU meter should read below -40 dB before clapping.
              </Text>
            </View>
          </View>

          <View style={styles.stepRow}>
            <View style={styles.stepNumber}>
              <Text style={styles.stepNumberText}>3</Text>
            </View>
            <View style={styles.stepContent}>
              <Text style={styles.stepTitle}>Single Sharp Clap</Text>
              <Text style={styles.stepDesc}>
                Tap record and produce one crisp handclap. The Schroeder curve is computed instantly.
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
    marginVertical: SPACING.sm,
  },
  locationPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: COLORS.card,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignSelf: 'center',
    marginBottom: SPACING.xs,
    maxWidth: '90%',
  },
  locationText: {
    color: COLORS.textSecondary,
    fontSize: 12,
    fontWeight: '600',
  },
  outerRing: {
    width: 170,
    height: 170,
    borderRadius: 85,
    borderWidth: 2,
    borderColor: COLORS.border,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(6, 182, 212, 0.03)',
  },
  innerCircle: {
    width: 130,
    height: 130,
    borderRadius: 65,
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.border,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 10,
  },
  meterStatus: {
    color: COLORS.text,
    fontSize: 11,
    marginTop: 6,
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
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  qualityBadgeText: {
    color: COLORS.accent,
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
