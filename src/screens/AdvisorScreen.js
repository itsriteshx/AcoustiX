import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  TextInput,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SPACING, FONT_SIZES } from '../constants/theme';
import { ROOM_TARGET_SPECS } from '../constants/targets';

export const AdvisorScreen = () => {
  const [length, setLength] = useState('6');
  const [width, setWidth] = useState('5');
  const [height, setHeight] = useState('3');
  const [targetRT, setTargetRT] = useState('0.6');

  // Sabine Equation: RT60 = 0.161 * V / A => A = 0.161 * V / RT60
  const l = parseFloat(length) || 0;
  const w = parseFloat(width) || 0;
  const h = parseFloat(height) || 0;
  const rt = parseFloat(targetRT) || 0.6;

  const volume = l * w * h;
  const surfaceArea = 2 * (l * w + l * h + w * h);
  const requiredAbsorption = rt > 0 && volume > 0 ? (0.161 * volume) / rt : 0;
  const averageAbsorptionCoeff = surfaceArea > 0 ? requiredAbsorption / surfaceArea : 0;

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Acoustic Standards</Text>
          <Text style={styles.subtitle}>
            ISO 3382 reverberation guidelines & Sabine absorption calculator.
          </Text>
        </View>

        {/* Sabine Calculator Card */}
        <View style={styles.card}>
          <View style={styles.cardHeaderRow}>
            <Ionicons name="calculator-outline" size={18} color={COLORS.primary} />
            <Text style={styles.cardHeaderTitle}>Sabine Absorption Calculator</Text>
          </View>
          <Text style={styles.calcIntro}>
            Estimate required acoustic absorption (Sabins) for your room dimensions:
          </Text>

          <View style={styles.inputGrid}>
            <View style={styles.inputItem}>
              <Text style={styles.inputLabel}>Length (m)</Text>
              <TextInput
                style={styles.input}
                value={length}
                onChangeText={setLength}
                keyboardType="numeric"
                placeholderTextColor={COLORS.textMuted}
              />
            </View>
            <View style={styles.inputItem}>
              <Text style={styles.inputLabel}>Width (m)</Text>
              <TextInput
                style={styles.input}
                value={width}
                onChangeText={setWidth}
                keyboardType="numeric"
                placeholderTextColor={COLORS.textMuted}
              />
            </View>
            <View style={styles.inputItem}>
              <Text style={styles.inputLabel}>Height (m)</Text>
              <TextInput
                style={styles.input}
                value={height}
                onChangeText={setHeight}
                keyboardType="numeric"
                placeholderTextColor={COLORS.textMuted}
              />
            </View>
            <View style={styles.inputItem}>
              <Text style={styles.inputLabel}>Target RT (s)</Text>
              <TextInput
                style={styles.input}
                value={targetRT}
                onChangeText={setTargetRT}
                keyboardType="numeric"
                placeholderTextColor={COLORS.textMuted}
              />
            </View>
          </View>

          <View style={styles.calcResultBox}>
            <View style={styles.calcResultRow}>
              <Text style={styles.resultLabel}>Room Volume (V):</Text>
              <Text style={styles.resultValue}>{volume.toFixed(1)} m³</Text>
            </View>
            <View style={styles.calcResultRow}>
              <Text style={styles.resultLabel}>Total Surface Area (S):</Text>
              <Text style={styles.resultValue}>{surfaceArea.toFixed(1)} m²</Text>
            </View>
            <View style={styles.calcResultRow}>
              <Text style={[styles.resultLabel, { color: COLORS.primary }]}>
                Required Absorption (A):
              </Text>
              <Text style={[styles.resultValue, { color: COLORS.primary }]}>
                {requiredAbsorption.toFixed(1)} metric Sabins
              </Text>
            </View>
            <View style={styles.calcResultRow}>
              <Text style={styles.resultLabel}>Avg Absorption Coeff (α):</Text>
              <Text style={styles.resultValue}>{averageAbsorptionCoeff.toFixed(2)}</Text>
            </View>
          </View>
        </View>

        {/* Room Standards Target Reference List */}
        <Text style={styles.sectionHeading}>Target RT60 by Room Purpose (ISO 3382)</Text>
        {Object.values(ROOM_TARGET_SPECS).map((spec) => (
          <View key={spec.category} style={styles.specCard}>
            <View style={styles.specHeader}>
              <Text style={styles.specName}>{spec.name}</Text>
              <View style={styles.specBadge}>
                <Text style={styles.specBadgeText}>
                  {spec.minRT60}s – {spec.maxRT60}s
                </Text>
              </View>
            </View>
            <Text style={styles.specDesc}>{spec.description}</Text>
            <View style={styles.tipRow}>
              <Ionicons name="sparkles" size={13} color={COLORS.accent} />
              <Text style={styles.tipText}>{spec.recommendationTip}</Text>
            </View>
          </View>
        ))}
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
    marginBottom: SPACING.md,
  },
  title: {
    color: COLORS.text,
    fontSize: FONT_SIZES.xxl,
    fontWeight: '800',
  },
  subtitle: {
    color: COLORS.textSecondary,
    fontSize: FONT_SIZES.sm,
    marginTop: 4,
  },
  card: {
    backgroundColor: COLORS.card,
    borderRadius: 14,
    padding: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: SPACING.lg,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 6,
  },
  cardHeaderTitle: {
    color: COLORS.text,
    fontSize: FONT_SIZES.md,
    fontWeight: '700',
  },
  calcIntro: {
    color: COLORS.textMuted,
    fontSize: 11,
    marginBottom: 12,
  },
  inputGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  inputItem: {
    flex: 1,
    minWidth: '45%',
  },
  inputLabel: {
    color: COLORS.textSecondary,
    fontSize: 11,
    marginBottom: 4,
  },
  input: {
    backgroundColor: COLORS.surface,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: 12,
    paddingVertical: 8,
    color: COLORS.text,
    fontSize: 14,
    fontWeight: '600',
  },
  calcResultBox: {
    backgroundColor: COLORS.surface,
    borderRadius: 10,
    padding: 12,
    marginTop: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
    gap: 6,
  },
  calcResultRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  resultLabel: {
    color: COLORS.textSecondary,
    fontSize: 12,
  },
  resultValue: {
    color: COLORS.text,
    fontSize: 12,
    fontWeight: '700',
  },
  sectionHeading: {
    color: COLORS.text,
    fontSize: FONT_SIZES.lg,
    fontWeight: '700',
    marginBottom: SPACING.md,
  },
  specCard: {
    backgroundColor: COLORS.card,
    borderRadius: 12,
    padding: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: SPACING.sm,
  },
  specHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  specName: {
    color: COLORS.text,
    fontSize: 14,
    fontWeight: '700',
    flex: 1,
  },
  specBadge: {
    backgroundColor: 'rgba(6, 182, 212, 0.1)',
    borderColor: COLORS.primary,
    borderWidth: 1,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
  },
  specBadgeText: {
    color: COLORS.primary,
    fontSize: 11,
    fontWeight: '700',
  },
  specDesc: {
    color: COLORS.textSecondary,
    fontSize: 12,
    lineHeight: 16,
  },
  tipRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 8,
    backgroundColor: COLORS.surface,
    padding: 8,
    borderRadius: 6,
  },
  tipText: {
    color: COLORS.accent,
    fontSize: 11,
    flex: 1,
  },
});
