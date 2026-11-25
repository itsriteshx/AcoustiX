import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  TouchableOpacity,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SPACING, FONT_SIZES } from '../constants/theme';
import { DecayCurveChart } from '../components/charts/DecayCurveChart';
import { OctaveBarsChart } from '../components/charts/OctaveBarsChart';
import { shareAuditReport } from '../services/export/exportService';

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
          <View style={{ flex: 1 }}>
            <Text style={styles.roomTitle}>{measurement.roomName}</Text>
            {measurement.location?.venueName ? (
              <View style={styles.venueRow}>
                <Ionicons name="location-sharp" size={12} color={COLORS.primary} />
                <Text style={styles.venueText} numberOfLines={1}>
                  {measurement.location.venueName}
                </Text>
              </View>
            ) : null}
          </View>
          <Text style={styles.timestamp}>
            {new Date(measurement.createdAt).toLocaleTimeString([], {
              hour: '2-digit',
              minute: '2-digit',
            })}
          </Text>
        </View>

        {/* Room Visual Audit Photo & Materials */}
        {measurement.photoUri && (
          <View style={styles.photoCard}>
            <Image source={{ uri: measurement.photoUri }} style={styles.roomImage} />
            {measurement.surfaceMaterials && measurement.surfaceMaterials.length > 0 && (
              <View style={styles.materialsRow}>
                {measurement.surfaceMaterials.map((mat, i) => (
                  <View key={i} style={styles.materialTag}>
                    <Text style={styles.materialTagText}>{mat}</Text>
                  </View>
                ))}
              </View>
            )}
          </View>
        )}

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

        {/* Advanced Acoustic Clarity & Speech Intelligibility (C50, C80, D50, STI) */}
        {measurement.clarity && (
          <View style={styles.card}>
            <View style={styles.sectionHeaderRow}>
              <Ionicons name="sparkles" size={18} color={COLORS.primary} />
              <Text style={styles.sectionTitle}>Acoustic Clarity & Intelligibility (ISO 3382)</Text>
            </View>

            <View style={styles.clarityHeroRow}>
              <View style={styles.stiBadgeContainer}>
                <Text style={styles.stiLabel}>SPEECH TRANSMISSION INDEX (STI)</Text>
                <View style={styles.stiValueRow}>
                  <Text style={styles.stiValue}>
                    {measurement.clarity.sti.toFixed(2)}
                  </Text>
                  <View style={styles.stiRatingPill}>
                    <Text style={styles.stiRatingText}>{measurement.clarity.stiRating.toUpperCase()}</Text>
                  </View>
                </View>
                <Text style={styles.stiDesc}>{measurement.clarity.speechSuitability}</Text>
              </View>
            </View>

            <View style={styles.metricsGrid}>
              <View style={styles.metricCell}>
                <Text style={styles.metricLabel}>C50 (Speech Clarity)</Text>
                <Text style={[styles.metricValue, { color: COLORS.primary }]}>
                  {measurement.clarity.c50 > 0 ? '+' : ''}{measurement.clarity.c50.toFixed(1)} dB
                </Text>
                <Text style={styles.metricSub}>Early/Late 50ms (Target: &gt; 0 dB)</Text>
              </View>

              <View style={styles.metricCell}>
                <Text style={styles.metricLabel}>C80 (Music Clarity)</Text>
                <Text style={[styles.metricValue, { color: COLORS.accent }]}>
                  {measurement.clarity.c80 > 0 ? '+' : ''}{measurement.clarity.c80.toFixed(1)} dB
                </Text>
                <Text style={styles.metricSub}>Early/Late 80ms (Target: -2 to +4 dB)</Text>
              </View>

              <View style={styles.metricCell}>
                <Text style={styles.metricLabel}>D50 (Definition)</Text>
                <Text style={styles.metricValue}>
                  {measurement.clarity.d50.toFixed(1)}%
                </Text>
                <Text style={styles.metricSub}>Early Energy Ratio (&gt; 50% Clear)</Text>
              </View>

              <View style={styles.metricCell}>
                <Text style={styles.metricLabel}>Music Character</Text>
                <Text style={[styles.metricValue, { fontSize: 13, color: COLORS.text }]}>
                  {measurement.clarity.c80 >= -2 && measurement.clarity.c80 <= 4 ? 'Optimal Blend' : measurement.clarity.c80 > 4 ? 'High Articulation' : 'Warm Sustain'}
                </Text>
                <Text style={styles.metricSub} numberOfLines={2}>{measurement.clarity.musicSuitability}</Text>
              </View>
            </View>
          </View>
        )}

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

        {/* Share & Export Report Button */}
        <TouchableOpacity
          style={styles.shareButton}
          onPress={() => shareAuditReport(measurement)}
          activeOpacity={0.8}
        >
          <Ionicons name="share-social-outline" size={18} color="#000" />
          <Text style={styles.shareButtonText}>Export & Share Acoustic Report</Text>
        </TouchableOpacity>
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
  venueRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
  },
  venueText: {
    color: COLORS.primary,
    fontSize: 11,
    fontWeight: '500',
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
  photoCard: {
    backgroundColor: COLORS.card,
    borderRadius: 14,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: SPACING.md,
  },
  roomImage: {
    width: '100%',
    height: 160,
  },
  materialsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    padding: 10,
    backgroundColor: COLORS.surface,
  },
  materialTag: {
    backgroundColor: 'rgba(6, 182, 212, 0.1)',
    borderColor: COLORS.primary,
    borderWidth: 1,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
  },
  materialTagText: {
    color: COLORS.primary,
    fontSize: 10,
    fontWeight: '600',
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
  clarityHeroRow: {
    marginTop: 8,
    marginBottom: 4,
  },
  stiBadgeContainer: {
    backgroundColor: COLORS.surface,
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(6, 182, 212, 0.3)',
  },
  stiLabel: {
    color: COLORS.primary,
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1.1,
  },
  stiValueRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginVertical: 4,
  },
  stiValue: {
    color: COLORS.text,
    fontSize: 28,
    fontWeight: '800',
  },
  stiRatingPill: {
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  stiRatingText: {
    color: COLORS.accent,
    fontSize: 11,
    fontWeight: '700',
  },
  stiDesc: {
    color: COLORS.textSecondary,
    fontSize: 11,
    marginTop: 2,
    lineHeight: 15,
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
  shareButton: {
    backgroundColor: COLORS.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 12,
    marginTop: SPACING.xs,
    marginBottom: SPACING.md,
  },
  shareButtonText: {
    color: '#000',
    fontSize: 14,
    fontWeight: '700',
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
