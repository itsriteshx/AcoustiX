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
import { TreatmentSimulator } from '../components/treatment/TreatmentSimulator';

export const AdvisorScreen = () => {
  const [activeSubTab, setActiveSubTab] = useState('simulator'); // 'simulator' | 'calculator' | 'standards'
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
          <Text style={styles.title}>Acoustic Advisor</Text>
          <Text style={styles.subtitle}>
            Acoustic treatment simulator, Sabine calculations & ISO 3382 room standards.
          </Text>
        </View>

        {/* Sub-navigation Tabs */}
        <View style={styles.navRow}>
          <TouchableOpacity
            style={[styles.navTab, activeSubTab === 'simulator' && styles.navTabActive]}
            onPress={() => setActiveSubTab('simulator')}
            activeOpacity={0.7}
          >
            <Ionicons
              name="construct-outline"
              size={15}
              color={activeSubTab === 'simulator' ? COLORS.primary : COLORS.textMuted}
            />
            <Text style={[styles.navTabText, activeSubTab === 'simulator' && styles.navTabTextActive]}>
              Treatment Simulator
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.navTab, activeSubTab === 'calculator' && styles.navTabActive]}
            onPress={() => setActiveSubTab('calculator')}
            activeOpacity={0.7}
          >
            <Ionicons
              name="calculator-outline"
              size={15}
              color={activeSubTab === 'calculator' ? COLORS.primary : COLORS.textMuted}
            />
            <Text style={[styles.navTabText, activeSubTab === 'calculator' && styles.navTabTextActive]}>
              Sabine Math
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.navTab, activeSubTab === 'standards' && styles.navTabActive]}
            onPress={() => setActiveSubTab('standards')}
            activeOpacity={0.7}
          >
            <Ionicons
              name="book-outline"
              size={15}
              color={activeSubTab === 'standards' ? COLORS.primary : COLORS.textMuted}
            />
            <Text style={[styles.navTabText, activeSubTab === 'standards' && styles.navTabTextActive]}>
              ISO Targets
            </Text>
          </TouchableOpacity>
        </View>

        {/* View 1: Advanced Acoustic Treatment Simulator */}
        {activeSubTab === 'simulator' && (
          <TreatmentSimulator currentRT60={0.65} />
        )}

        {/* View 2: Sabine Absorption Calculator Card */}
        {activeSubTab === 'calculator' && (
          <View style={styles.card}>
            <View style={styles.cardHeaderRow}>
              <Ionicons name="calculator-outline" size={18} color={COLORS.primary} />
              <Text style={styles.cardHeaderTitle}>Sabine Formula Calculator</Text>
            </View>
            <Text style={styles.calcIntro}>
              Estimate baseline required acoustic absorption (metric Sabins) via W.C. Sabine's classic formula:
            </Text>

            <View style={styles.formulaBox}>
              <Text style={styles.formulaText}>RT₆₀ = 0.161 × V / A   ⟹   A = 0.161 × V / RT₆₀</Text>
            </View>

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
        )}

        {/* View 3: Room Standards Target Reference List */}
        {activeSubTab === 'standards' && (
          <View>
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
    marginBottom: SPACING.sm,
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
  navRow: {
    flexDirection: 'row',
    backgroundColor: COLORS.surface,
    borderRadius: 10,
    padding: 4,
    marginVertical: SPACING.sm,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  navTab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingVertical: 8,
    borderRadius: 8,
  },
  navTabActive: {
    backgroundColor: COLORS.card,
  },
  navTabText: {
    color: COLORS.textMuted,
    fontSize: 11,
    fontWeight: '600',
  },
  navTabTextActive: {
    color: COLORS.primary,
    fontWeight: '700',
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
    marginBottom: 10,
  },
  formulaBox: {
    backgroundColor: 'rgba(6, 182, 212, 0.08)',
    padding: 8,
    borderRadius: 8,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(6, 182, 212, 0.2)',
  },
  formulaText: {
    color: COLORS.primary,
    fontSize: 11,
    fontWeight: '700',
    textAlign: 'center',
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
    marginVertical: SPACING.sm,
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
