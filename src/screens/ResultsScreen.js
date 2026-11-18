import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SPACING, FONT_SIZES } from '../constants/theme';
import { DecayCurveChart } from '../components/charts/DecayCurveChart';
import { OctaveBarsChart } from '../components/charts/OctaveBarsChart';

export const ResultsScreen = ({ measurement, onNewMeasurement }) => {
  if (!measurement) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.emptyContainer}>
          <Ionicons name="analytics-outline" size={64} color={COLORS.textMuted} />
          <Text style={styles.emptyTitle}>No Measurement Yet</Text>
          <Text style={styles.emptyDesc}>
            Record a handclap or tap "Test with Demo Impulse" on the Measure tab to view the acoustic analysis.
          </Text>
          <TouchableOpacity
            style={styles.primaryButton}
            onPress={onNewMeasurement}
          >
            <Text style={styles.primaryButtonText}>Go to Measure</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.roomTitle}>{measurement.roomName}</Text>
          <Text style={styles.timestamp}>
            {new Date(measurement.createdAt).toLocaleTimeString([], {
              hour: '2-digit',
              minute: '2-digit',
            })}
          </Text>
        </View>

        {/* Hero RT60 Badge */}
        <View style={styles.heroCard}>
          <Text style={styles.heroLabel}>REVERBERATION TIME (RT60)</Text>
          <View style={styles.heroValueRow}>
            <Text style={styles.heroValue}>{measurement.overallRT60.toFixed(2)}</Text>
            <Text style={styles.heroUnit}>seconds</Text>
          </View>
          <View style={styles.qualityRow}>
            <Ionicons name="checkmark-circle" size={16} color={COLORS.accent} />
            <Text style={styles.qualityText}>
              Decay Fit R² = {(measurement.rSquared * 100).toFixed(1)}% (ISO 3382 Valid)
            </Text>
          </View>
        </View>

        {/* Plain Language Interpretation */}
        <View style={styles.card}>
          <View style={styles.sectionHeaderRow}>
            <Ionicons name="bulb-outline" size={18} color={COLORS.primary} />
            <Text style={styles.sectionTitle}>Acoustic Summary</Text>
          </View>
          <Text style={styles.interpretationText}>
            {measurement.interpretation.summary}
          </Text>
          <View style={styles.ratioRow}>
            <View style={styles.ratioPill}>
              <Text style={styles.ratioLabel}>Bass Ratio</Text>
              <Text style={styles.ratioValue}>
                {measurement.bassRatio.toFixed(2)} ({measurement.interpretation.warmth})
              </Text>
            </View>
            <View style={styles.ratioPill}>
              <Text style={styles.ratioLabel}>Treble Ratio</Text>
              <Text style={styles.ratioValue}>{measurement.trebleRatio.toFixed(2)}</Text>
            </View>
          </View>
        </View>

        {/* Schroeder Energy Decay Curve Chart */}
        <View style={styles.card}>
          <View style={styles.sectionHeaderRow}>
            <Ionicons name="trending-down-outline" size={18} color={COLORS.curve} />
            <Text style={styles.sectionTitle}>Schroeder Backward Integration</Text>
          </View>
          <Text style={styles.chartSubtext}>
            Energy Decay Curve (EDC) in dB vs Time. Evaluated from -5 dB to -25 dB for T20 slope.
          </Text>
          <DecayCurveChart
            points={measurement.decayCurve}
            overallRT60={measurement.overallRT60}
          />
        </View>

        {/* Octave Band Breakdown Chart */}
        <View style={styles.card}>
          <View style={styles.sectionHeaderRow}>
            <Ionicons name="bar-chart-outline" size={18} color={COLORS.primary} />
            <Text style={styles.sectionTitle}>Frequency Spectrum (Octave Bands)</Text>
          </View>
          <OctaveBarsChart
            octaves={measurement.octaveBands}
            targetAvg={measurement.overallRT60}
          />
        </View>

        {/* Detailed ISO 3382 Acoustic Metrics */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>ISO 3382 Technical Parameters</Text>
          <View style={styles.metricsGrid}>
            <View style={styles.metricCell}>
              <Text style={styles.metricLabel}>T20</Text>
              <Text style={styles.metricValue}>{measurement.t20.toFixed(2)}s</Text>
              <Text style={styles.metricSub}>(-5 to -25 dB)</Text>
            </View>
            <View style={styles.metricCell}>
              <Text style={styles.metricLabel}>T30</Text>
              <Text style={styles.metricValue}>{measurement.t30.toFixed(2)}s</Text>
              <Text style={styles.metricSub}>(-5 to -35 dB)</Text>
            </View>
            <View style={styles.metricCell}>
              <Text style={styles.metricLabel}>EDT</Text>
              <Text style={styles.metricValue}>{measurement.edt.toFixed(2)}s</Text>
              <Text style={styles.metricSub}>Early Decay (0 to -10 dB)</Text>
            </View>
            <View style={styles.metricCell}>
              <Text style={styles.metricLabel}>SNR</Text>
              <Text style={styles.metricValue}>{measurement.snrDb.toFixed(1)} dB</Text>
              <Text style={styles.metricSub}>Dynamic Range</Text>
            </View>
          </View>
        </View>

        {/* Room Suitability Badges */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Room Suitability</Text>
          {measurement.interpretation.roomSuitability.map((item, idx) => (
            <View key={idx} style={styles.suitabilityItem}>
              <Ionicons
                name={item.isCompliant ? 'checkmark-circle' : 'close-circle'}
                size={20}
                color={item.isCompliant ? COLORS.accent : COLORS.danger}
              />
              <View style={styles.suitabilityTextContainer}>
                <Text style={styles.suitabilityName}>{item.name}</Text>
                <Text style={styles.suitabilityDesc}>{item.description}</Text>
              </View>
            </View>
          ))}
        </View>
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
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.xl,
  },
  emptyTitle: {
    color: COLORS.text,
    fontSize: FONT_SIZES.xl,
    fontWeight: '700',
    marginTop: 16,
  },
  emptyDesc: {
    color: COLORS.textSecondary,
    fontSize: FONT_SIZES.sm,
    textAlign: 'center',
    marginTop: 8,
    marginBottom: 24,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  roomTitle: {
    color: COLORS.text,
    fontSize: FONT_SIZES.xl,
    fontWeight: '700',
  },
  timestamp: {
    color: COLORS.textMuted,
    fontSize: 12,
  },
  heroCard: {
    backgroundColor: COLORS.card,
    borderRadius: 16,
    padding: SPACING.lg,
    borderWidth: 1,
    borderColor: COLORS.primary,
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  heroLabel: {
    color: COLORS.primary,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1.2,
  },
  heroValueRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginVertical: 4,
    gap: 8,
  },
  heroValue: {
    color: COLORS.text,
    fontSize: 54,
    fontWeight: '800',
  },
  heroUnit: {
    color: COLORS.textSecondary,
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
  },
  qualityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 4,
  },
  qualityText: {
    color: COLORS.accent,
    fontSize: 12,
    fontWeight: '600',
  },
  card: {
    backgroundColor: COLORS.card,
    borderRadius: 14,
    padding: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: SPACING.md,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  sectionTitle: {
    color: COLORS.text,
    fontSize: FONT_SIZES.md,
    fontWeight: '700',
  },
  chartSubtext: {
    color: COLORS.textMuted,
    fontSize: 11,
    marginBottom: 10,
  },
  interpretationText: {
    color: COLORS.textSecondary,
    fontSize: 13,
    lineHeight: 18,
  },
  ratioRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 12,
  },
  ratioPill: {
    flex: 1,
    backgroundColor: COLORS.surface,
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  ratioLabel: {
    color: COLORS.textMuted,
    fontSize: 10,
    textTransform: 'uppercase',
  },
  ratioValue: {
    color: COLORS.text,
    fontSize: 12,
    fontWeight: '700',
    marginTop: 2,
  },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginTop: 12,
  },
  metricCell: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: COLORS.surface,
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  metricLabel: {
    color: COLORS.textSecondary,
    fontSize: 11,
    fontWeight: '600',
  },
  metricValue: {
    color: COLORS.text,
    fontSize: 18,
    fontWeight: '700',
    marginTop: 2,
  },
  metricSub: {
    color: COLORS.textMuted,
    fontSize: 10,
    marginTop: 2,
  },
  suitabilityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  suitabilityTextContainer: {
    flex: 1,
  },
  suitabilityName: {
    color: COLORS.text,
    fontSize: 13,
    fontWeight: '600',
  },
  suitabilityDesc: {
    color: COLORS.textMuted,
    fontSize: 11,
    marginTop: 2,
  },
  primaryButton: {
    backgroundColor: COLORS.primary,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 10,
  },
  primaryButtonText: {
    color: '#000',
    fontSize: 14,
    fontWeight: '700',
  },
});
