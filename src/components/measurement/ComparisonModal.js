import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SPACING, FONT_SIZES } from '../../constants/theme';
import { ComparisonDecayChart } from '../charts/ComparisonDecayChart';
import { ComparisonOctaveChart } from '../charts/ComparisonOctaveChart';

export const ComparisonModal = ({ visible, onClose, roomA, roomB }) => {
  if (!roomA || !roomB) return null;

  const deltaRT = Number((roomB.overallRT60 - roomA.overallRT60).toFixed(2));
  const absDelta = Math.abs(deltaRT);

  return (
    <Modal visible={visible} animationType="slide" transparent={false}>
      <SafeAreaView style={styles.safeArea}>
        <ScrollView contentContainerStyle={styles.container}>
          {/* Header */}
          <View style={styles.header}>
            <View>
              <Text style={styles.headerTitle}>Acoustic Room Comparison</Text>
              <Text style={styles.headerSubtitle}>
                ISO 3382 Dual Impulse Decay & Frequency Analysis
              </Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Ionicons name="close-circle" size={28} color={COLORS.textSecondary} />
            </TouchableOpacity>
          </View>

          {/* Differential RT60 Summary Card */}
          <View style={styles.diffCard}>
            <Text style={styles.diffLabel}>REVERBERATION TIME DIFFERENTIAL</Text>
            <View style={styles.diffRow}>
              <Text style={styles.diffValue}>
                {deltaRT > 0 ? `+${deltaRT.toFixed(2)}s` : `${deltaRT.toFixed(2)}s`}
              </Text>
              <Text style={styles.diffDesc}>
                {deltaRT === 0
                  ? 'Identical reverberance'
                  : deltaRT < 0
                  ? `"${roomB.roomName}" is ${absDelta.toFixed(2)}s drier (more absorbent)`
                  : `"${roomB.roomName}" is ${absDelta.toFixed(2)}s more reverberant (livelier)`}
              </Text>
            </View>
          </View>

          {/* Side-by-Side Metric Cards */}
          <View style={styles.sideBySideRow}>
            {/* Room A Card */}
            <View style={[styles.roomCard, { borderColor: '#38BDF8' }]}>
              <View style={[styles.roomTag, { backgroundColor: '#38BDF8' }]}>
                <Text style={styles.roomTagText}>Room A</Text>
              </View>
              <Text style={styles.roomName} numberOfLines={1}>
                {roomA.roomName}
              </Text>
              <Text style={styles.roomRT}>{roomA.overallRT60.toFixed(2)}s</Text>
              <Text style={styles.roomSub}>T20: {roomA.t20}s • EDT: {roomA.edt}s</Text>
              <Text style={styles.roomSub}>Bass: {roomA.bassRatio}</Text>
            </View>

            {/* Room B Card */}
            <View style={[styles.roomCard, { borderColor: '#FB923C' }]}>
              <View style={[styles.roomTag, { backgroundColor: '#FB923C' }]}>
                <Text style={styles.roomTagText}>Room B</Text>
              </View>
              <Text style={styles.roomName} numberOfLines={1}>
                {roomB.roomName}
              </Text>
              <Text style={styles.roomRT}>{roomB.overallRT60.toFixed(2)}s</Text>
              <Text style={styles.roomSub}>T20: {roomB.t20}s • EDT: {roomB.edt}s</Text>
              <Text style={styles.roomSub}>Bass: {roomB.bassRatio}</Text>
            </View>
          </View>

          {/* Dual Schroeder Decay Curves */}
          <View style={styles.chartSection}>
            <Text style={styles.sectionTitle}>Schroeder Energy Decay Curves (EDC)</Text>
            <Text style={styles.chartDesc}>
              Overlay of normalized sound decay in decibels vs time.
            </Text>
            <ComparisonDecayChart
              curveA={roomA.decayCurve}
              curveB={roomB.decayCurve}
              nameA={roomA.roomName}
              nameB={roomB.roomName}
              rtA={roomA.overallRT60}
              rtB={roomB.overallRT60}
            />
          </View>

          {/* Dual Octave Band Spectrum */}
          <View style={styles.chartSection}>
            <Text style={styles.sectionTitle}>Octave Spectrum Comparison (125Hz - 4kHz)</Text>
            <Text style={styles.chartDesc}>
              Side-by-side reverberation time across standard acoustic bands.
            </Text>
            <ComparisonOctaveChart
              octavesA={roomA.octaveBands}
              octavesB={roomB.octaveBands}
              nameA={roomA.roomName}
              nameB={roomB.roomName}
            />
          </View>
        </ScrollView>
      </SafeAreaView>
    </Modal>
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  headerTitle: {
    color: COLORS.text,
    fontSize: FONT_SIZES.xl,
    fontWeight: '800',
  },
  headerSubtitle: {
    color: COLORS.textSecondary,
    fontSize: 11,
    marginTop: 2,
  },
  closeBtn: {
    padding: 4,
  },
  diffCard: {
    backgroundColor: COLORS.card,
    borderRadius: 14,
    padding: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.primary,
    marginBottom: SPACING.md,
  },
  diffLabel: {
    color: COLORS.primary,
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1.2,
  },
  diffRow: {
    marginTop: 4,
  },
  diffValue: {
    color: COLORS.text,
    fontSize: 32,
    fontWeight: '800',
  },
  diffDesc: {
    color: COLORS.textSecondary,
    fontSize: 12,
    marginTop: 2,
  },
  sideBySideRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: SPACING.md,
  },
  roomCard: {
    flex: 1,
    backgroundColor: COLORS.card,
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    position: 'relative',
  },
  roomTag: {
    position: 'absolute',
    top: 8,
    right: 8,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  roomTagText: {
    color: '#000',
    fontSize: 9,
    fontWeight: '800',
  },
  roomName: {
    color: COLORS.text,
    fontSize: 13,
    fontWeight: '700',
    marginTop: 12,
  },
  roomRT: {
    color: COLORS.text,
    fontSize: 22,
    fontWeight: '800',
    marginTop: 4,
  },
  roomSub: {
    color: COLORS.textMuted,
    fontSize: 10,
    marginTop: 2,
  },
  chartSection: {
    backgroundColor: COLORS.card,
    borderRadius: 14,
    padding: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: SPACING.md,
  },
  sectionTitle: {
    color: COLORS.text,
    fontSize: 14,
    fontWeight: '700',
  },
  chartDesc: {
    color: COLORS.textMuted,
    fontSize: 11,
    marginTop: 2,
    marginBottom: 10,
  },
});
