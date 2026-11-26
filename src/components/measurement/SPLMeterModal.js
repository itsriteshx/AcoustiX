import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  SafeAreaView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SPACING, FONT_SIZES } from '../../constants/theme';
import {
  startImpulseRecording,
  cancelImpulseRecording,
} from '../../services/audio/audioRecorder';

/**
 * Maps raw Expo metering dBFS (-100 to 0) to estimated consumer SPL (dBA).
 * Note: Smartphone MEMS mics typically clip around ~115-120 dBA SPL.
 */
function dbfsToEstimatedDba(dbfs) {
  const clamped = Math.max(-90, Math.min(0, dbfs));
  return Math.round(clamped + 115);
}

function getSafetyZone(dba) {
  if (dba < 55) {
    return { label: 'QUIET / STUDIO', color: COLORS.accent, desc: 'Ideal ambient noise floor for acoustic measurement.' };
  }
  if (dba < 70) {
    return { label: 'MODERATE', color: COLORS.primary, desc: 'Normal conversation or classroom background level.' };
  }
  if (dba < 85) {
    return { label: 'LOUD', color: COLORS.warning, desc: 'Elevated noise; may mask low-level RT60 decay tails.' };
  }
  return { label: 'HAZARDOUS (OSHA)', color: COLORS.danger, desc: 'Prolonged exposure > 85 dBA risks hearing fatigue.' };
}

export const SPLMeterModal = ({ visible, onClose }) => {
  const [isMonitoring, setIsMonitoring] = useState(false);
  const [liveDbfs, setLiveDbfs] = useState(-60);
  const [liveDba, setLiveDba] = useState(55);
  const [minDba, setMinDba] = useState(null);
  const [maxDba, setMaxDba] = useState(null);
  const [avgDba, setAvgDba] = useState(null);
  const [errorMsg, setErrorMsg] = useState('');

  const samplesRef = useRef([]);

  useEffect(() => {
    if (!visible && isMonitoring) {
      stopMeter();
    }
  }, [visible]);

  const startMeter = async () => {
    try {
      setErrorMsg('');
      samplesRef.current = [];
      setMinDba(null);
      setMaxDba(null);
      setAvgDba(null);
      setIsMonitoring(true);

      await startImpulseRecording(({ meteringDb }) => {
        const dba = dbfsToEstimatedDba(meteringDb);
        setLiveDbfs(Number(meteringDb.toFixed(1)));
        setLiveDba(dba);

        samplesRef.current.push(dba);
        const arr = samplesRef.current;
        setMinDba((prev) => (prev === null ? dba : Math.min(prev, dba)));
        setMaxDba((prev) => (prev === null ? dba : Math.max(prev, dba)));
        const sum = arr.reduce((a, b) => a + b, 0);
        setAvgDba(Math.round(sum / arr.length));
      });
    } catch (err) {
      setIsMonitoring(false);
      setErrorMsg(err.message || 'Microphone permission required for SPL meter.');
    }
  };

  const stopMeter = async () => {
    await cancelImpulseRecording();
    setIsMonitoring(false);
  };

  const handleClose = async () => {
    await stopMeter();
    onClose();
  };

  const safety = getSafetyZone(liveDba);
  const meterPercent = Math.max(0, Math.min(100, ((liveDba - 25) / 95) * 100));

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <SafeAreaView style={styles.overlay}>
        <View style={styles.sheet}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.titleRow}>
              <Ionicons name="speedometer-outline" size={22} color={COLORS.primary} />
              <Text style={styles.title}>Live SPL Decibel Meter</Text>
            </View>
            <TouchableOpacity onPress={handleClose} style={styles.closeBtn}>
              <Ionicons name="close" size={22} color={COLORS.textSecondary} />
            </TouchableOpacity>
          </View>

          <Text style={styles.subtitle}>
            Continuous real-time ambient sound pressure monitor with Peak Hold & WHO/OSHA safety zones.
          </Text>

          {errorMsg ? (
            <View style={styles.errorBox}>
              <Text style={styles.errorText}>{errorMsg}</Text>
            </View>
          ) : null}

          {/* Big Digital Readout */}
          <View style={[styles.readoutCard, { borderColor: safety.color }]}>
            <View style={[styles.safetyBadge, { backgroundColor: `${safety.color}22` }]}>
              <Text style={[styles.safetyBadgeText, { color: safety.color }]}>{safety.label}</Text>
            </View>
            <View style={styles.dbaRow}>
              <Text style={styles.dbaValue}>{liveDba}</Text>
              <Text style={styles.dbaUnit}>dBA (est.)</Text>
            </View>
            <Text style={styles.dbfsText}>Raw Input: {liveDbfs.toFixed(1)} dBFS</Text>

            {/* Horizontal Bar */}
            <View style={styles.barTrack}>
              <View
                style={[
                  styles.barFill,
                  { width: `${meterPercent}%`, backgroundColor: safety.color },
                ]}
              />
            </View>
            <View style={styles.scaleLabels}>
              <Text style={styles.scaleText}>30 dBA</Text>
              <Text style={styles.scaleText}>60 dBA</Text>
              <Text style={styles.scaleText}>85 dBA</Text>
              <Text style={styles.scaleText}>115+ dBA</Text>
            </View>
            <Text style={styles.safetyDesc}>{safety.desc}</Text>
          </View>

          {/* Min / Avg / Peak Hold Stats */}
          <View style={styles.statsRow}>
            <View style={styles.statBox}>
              <Text style={styles.statLabel}>MIN</Text>
              <Text style={styles.statVal}>{minDba !== null ? `${minDba}` : '--'}</Text>
            </View>
            <View style={styles.statBox}>
              <Text style={styles.statLabel}>AVERAGE</Text>
              <Text style={[styles.statVal, { color: COLORS.primary }]}>
                {avgDba !== null ? `${avgDba}` : '--'}
              </Text>
            </View>
            <View style={styles.statBox}>
              <Text style={styles.statLabel}>PEAK HOLD</Text>
              <Text style={[styles.statVal, { color: COLORS.warning }]}>
                {maxDba !== null ? `${maxDba}` : '--'}
              </Text>
            </View>
          </View>

          {/* Controls */}
          <TouchableOpacity
            style={[
              styles.actionBtn,
              isMonitoring ? { backgroundColor: COLORS.danger } : { backgroundColor: COLORS.primary },
            ]}
            onPress={isMonitoring ? stopMeter : startMeter}
            activeOpacity={0.8}
          >
            <Ionicons
              name={isMonitoring ? 'stop-circle' : 'mic'}
              size={20}
              color={isMonitoring ? '#FFF' : '#000'}
            />
            <Text style={[styles.actionBtnText, isMonitoring && { color: '#FFF' }]}>
              {isMonitoring ? 'Stop SPL Monitoring' : 'Start Live SPL Meter'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.closeFooterBtn} onPress={handleClose}>
            <Text style={styles.closeFooterText}>Close</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.85)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: COLORS.card,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: SPACING.md,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
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
  closeBtn: {
    padding: 4,
  },
  subtitle: {
    color: COLORS.textSecondary,
    fontSize: 12,
    marginBottom: SPACING.md,
    lineHeight: 16,
  },
  errorBox: {
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    padding: 10,
    borderRadius: 8,
    marginBottom: SPACING.sm,
  },
  errorText: {
    color: COLORS.danger,
    fontSize: 12,
  },
  readoutCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 14,
    padding: SPACING.md,
    borderWidth: 1.5,
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  safetyBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    marginBottom: 6,
  },
  safetyBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1,
  },
  dbaRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 6,
  },
  dbaValue: {
    color: COLORS.text,
    fontSize: 56,
    fontWeight: '800',
  },
  dbaUnit: {
    color: COLORS.textSecondary,
    fontSize: 14,
    fontWeight: '600',
  },
  dbfsText: {
    color: COLORS.textMuted,
    fontSize: 11,
    marginBottom: 12,
  },
  barTrack: {
    width: '100%',
    height: 10,
    backgroundColor: COLORS.card,
    borderRadius: 5,
    overflow: 'hidden',
  },
  barFill: {
    height: '100%',
    borderRadius: 5,
  },
  scaleLabels: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  scaleText: {
    color: COLORS.textMuted,
    fontSize: 9,
  },
  safetyDesc: {
    color: COLORS.textSecondary,
    fontSize: 11,
    textAlign: 'center',
    marginTop: 10,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: SPACING.md,
  },
  statBox: {
    flex: 1,
    backgroundColor: COLORS.surface,
    padding: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center',
  },
  statLabel: {
    color: COLORS.textMuted,
    fontSize: 10,
    fontWeight: '700',
  },
  statVal: {
    color: COLORS.text,
    fontSize: 20,
    fontWeight: '800',
    marginTop: 2,
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 12,
    marginBottom: 8,
  },
  actionBtnText: {
    color: '#000',
    fontSize: 14,
    fontWeight: '700',
  },
  closeFooterBtn: {
    backgroundColor: COLORS.surfaceLight,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  closeFooterText: {
    color: COLORS.text,
    fontSize: 13,
    fontWeight: '700',
  },
});
