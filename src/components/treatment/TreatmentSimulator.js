import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SPACING, FONT_SIZES } from '../../constants/theme';

export const TREATMENT_MATERIALS = [
  {
    id: 'rockwool',
    name: 'Dense Rockwool Panels (50mm)',
    alpha: 0.85,
    unitArea: 0.72, // 1.2m x 0.6m
    unitDims: '1.2m × 0.6m',
    icon: 'cube',
    costPerUnit: 35,
    description: 'Gold standard for broadband absorption. Eliminates flutter echoes and midrange ring.',
  },
  {
    id: 'foam',
    name: 'Pyramid Studio Foam (50mm)',
    alpha: 0.55,
    unitArea: 0.25, // 0.5m x 0.5m
    unitDims: '0.5m × 0.5m',
    icon: 'grid',
    costPerUnit: 14,
    description: 'Lightweight open-cell foam. Tames high-frequency treble reflections and sibilance.',
  },
  {
    id: 'basstrap',
    name: 'Corner Bass Trap (100mm)',
    alpha: 0.80,
    unitArea: 0.20, // 0.6m x 0.3m
    unitDims: '0.6m × 0.3m wedge',
    icon: 'layers',
    costPerUnit: 42,
    description: 'Deep corner wedge absorbers. Absorbs standing waves (< 250 Hz) and room boominess.',
  },
  {
    id: 'curtains',
    name: 'Acoustic Velour Drapes (500g/m²)',
    alpha: 0.60,
    unitArea: 1.5, // 1.5m x 1.0m
    unitDims: '1.5m × 1.0m section',
    icon: 'bookmark',
    costPerUnit: 55,
    description: 'Heavy pleated fabric. Excellent for covering reflective glass windows and doors.',
  },
  {
    id: 'diffuser',
    name: 'Slotted Timber Diffuser',
    alpha: 0.40,
    unitArea: 0.36, // 0.6m x 0.6m
    unitDims: '0.6m × 0.6m',
    icon: 'barcode',
    costPerUnit: 68,
    description: 'Hybrid absorption-diffusion. Preserves high-frequency sparkle and musical warmth.',
  },
];

const TARGET_PRESETS = [
  { label: 'Podcast & Voiceover', rt: 0.35 },
  { label: 'Control Room / Studio', rt: 0.40 },
  { label: 'Home Cinema', rt: 0.45 },
  { label: 'Meeting / Conference', rt: 0.50 },
  { label: 'Classroom / Lecture', rt: 0.60 },
  { label: 'Music Rehearsal', rt: 0.75 },
];

export const TreatmentSimulator = ({ currentRT60 = 0.65 }) => {
  const [length, setLength] = useState('5.5');
  const [width, setWidth] = useState('4.2');
  const [height, setHeight] = useState('2.8');
  const [measuredRT, setMeasuredRT] = useState(String(currentRT60 || 0.65));
  const [targetRT, setTargetRT] = useState(0.40);
  const [selectedMaterial, setSelectedMaterial] = useState(TREATMENT_MATERIALS[0]);
  const [customPanels, setCustomPanels] = useState(null);

  const rawL = parseFloat(length);
  const rawW = parseFloat(width);
  const rawH = parseFloat(height);
  const rawRT = parseFloat(measuredRT);

  const isInputValid =
    Number.isFinite(rawL) && rawL > 0 &&
    Number.isFinite(rawW) && rawW > 0 &&
    Number.isFinite(rawH) && rawH > 0 &&
    Number.isFinite(rawRT) && rawRT >= 0.15 && rawRT <= 6.0;

  const l = isInputValid ? rawL : 5.5;
  const w = isInputValid ? rawW : 4.2;
  const h = isInputValid ? rawH : 2.8;
  const rtCurrent = isInputValid ? rawRT : 0.65;
  const rtTarget = Math.max(0.15, targetRT);

  const volume = l * w * h;
  const surfaceArea = 2 * (l * w + l * h + w * h);

  // Sabine Absorption Math:
  // A = 0.161 * V / RT60
  const aCurrent = (0.161 * volume) / rtCurrent;
  const aTarget = (0.161 * volume) / rtTarget;
  const deltaA = Math.max(0, aTarget - aCurrent);

  // Net absorption coefficient gain over baseline plasterboard (~0.08)
  const baseAlpha = 0.08;
  const netAlpha = Math.max(0.1, selectedMaterial.alpha - baseAlpha);

  // Required material area in m²
  const requiredArea = deltaA / netAlpha;
  const recommendedPanels = Math.ceil(requiredArea / selectedMaterial.unitArea);

  const activePanels = customPanels !== null ? customPanels : recommendedPanels;
  const addedAbsorption = activePanels * selectedMaterial.unitArea * netAlpha;
  const simulatedRT60 = Number(
    Math.max(0.15, (0.161 * volume) / (aCurrent + addedAbsorption)).toFixed(2)
  );

  const coveragePercent = Math.min(100, Number(((activePanels * selectedMaterial.unitArea) / surfaceArea) * 100).toFixed(1));
  const totalCost = activePanels * selectedMaterial.costPerUnit;

  const isAchieved = simulatedRT60 <= rtTarget + 0.02;

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <Ionicons name="construct-outline" size={20} color={COLORS.primary} />
        <Text style={styles.headerTitle}>Acoustic Treatment Simulator</Text>
      </View>
      <Text style={styles.subtitle}>
        Calculate exact panels and material area required to meet your acoustic target.
      </Text>

      {/* Room Dimensions & Current RT60 */}
      <View style={styles.inputGrid}>
        <View style={styles.inputItem}>
          <Text style={styles.inputLabel}>Length (m)</Text>
          <TextInput
            style={styles.input}
            value={length}
            onChangeText={(v) => {
              setLength(v);
              setCustomPanels(null);
            }}
            keyboardType="numeric"
            placeholderTextColor={COLORS.textMuted}
          />
        </View>
        <View style={styles.inputItem}>
          <Text style={styles.inputLabel}>Width (m)</Text>
          <TextInput
            style={styles.input}
            value={width}
            onChangeText={(v) => {
              setWidth(v);
              setCustomPanels(null);
            }}
            keyboardType="numeric"
            placeholderTextColor={COLORS.textMuted}
          />
        </View>
        <View style={styles.inputItem}>
          <Text style={styles.inputLabel}>Height (m)</Text>
          <TextInput
            style={styles.input}
            value={height}
            onChangeText={(v) => {
              setHeight(v);
              setCustomPanels(null);
            }}
            keyboardType="numeric"
            placeholderTextColor={COLORS.textMuted}
          />
        </View>
        <View style={styles.inputItem}>
          <Text style={styles.inputLabel}>Measured RT (s)</Text>
          <TextInput
            style={[styles.input, { borderColor: COLORS.primary }]}
            value={measuredRT}
            onChangeText={(v) => {
              setMeasuredRT(v);
              setCustomPanels(null);
            }}
            keyboardType="numeric"
            placeholderTextColor={COLORS.textMuted}
          />
        </View>
      </View>

      {/* Target RT Presets */}
      {!isInputValid && (
        <View style={{ backgroundColor: 'rgba(239, 68, 68, 0.12)', padding: 8, borderRadius: 8, marginBottom: 10 }}>
          <Text style={{ color: COLORS.danger, fontSize: 11, fontWeight: '600' }}>
            Invalid dimensions or RT60: enter positive numbers (RT60: 0.15s – 6.0s). Showing default preview.
          </Text>
        </View>
      )}
      <Text style={styles.sectionLabel}>Select Acoustic Target Goal:</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.presetsRow}>
        {TARGET_PRESETS.map((preset) => {
          const isSelected = targetRT === preset.rt;
          return (
            <TouchableOpacity
              key={preset.label}
              style={[styles.presetPill, isSelected && styles.presetPillSelected]}
              onPress={() => {
                setTargetRT(preset.rt);
                setCustomPanels(null);
              }}
              activeOpacity={0.7}
            >
              <Text style={[styles.presetText, isSelected && styles.presetTextSelected]}>
                {preset.label} ({preset.rt}s)
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* Material Selection */}
      <Text style={styles.sectionLabel}>Choose Treatment Material:</Text>
      <View style={styles.materialsList}>
        {TREATMENT_MATERIALS.map((mat) => {
          const isSelected = selectedMaterial.id === mat.id;
          return (
            <TouchableOpacity
              key={mat.id}
              style={[styles.materialCard, isSelected && styles.materialCardSelected]}
              onPress={() => {
                setSelectedMaterial(mat);
                setCustomPanels(null);
              }}
              activeOpacity={0.7}
            >
              <View style={styles.materialHeader}>
                <View style={styles.materialIconTitle}>
                  <Ionicons
                    name={mat.icon}
                    size={16}
                    color={isSelected ? COLORS.primary : COLORS.textMuted}
                  />
                  <Text style={[styles.materialName, isSelected && { color: COLORS.text }]}>
                    {mat.name}
                  </Text>
                </View>
                <View style={[styles.alphaBadge, isSelected && { borderColor: COLORS.primary }]}>
                  <Text style={styles.alphaText}>α = {mat.alpha}</Text>
                </View>
              </View>
              <Text style={styles.materialDesc}>{mat.description}</Text>
              <View style={styles.materialFooter}>
                <Text style={styles.materialUnitText}>Size: {mat.unitDims}</Text>
                <Text style={styles.materialCostText}>~${mat.costPerUnit} / unit</Text>
              </View>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Simulator Results & Prediction Card */}
      <View style={styles.simulationCard}>
        <View style={styles.simHeaderRow}>
          <View>
            <Text style={styles.simTitle}>Predicted RT60 After Treatment</Text>
            <Text style={styles.simSubtitle}>
              Current: {rtCurrent}s → Target: {rtTarget}s
            </Text>
          </View>
          <View style={[styles.statusBadge, isAchieved ? styles.statusBadgePass : styles.statusBadgeNeedsMore]}>
            <Ionicons
              name={isAchieved ? 'checkmark-circle' : 'alert-circle'}
              size={14}
              color={isAchieved ? COLORS.accent : COLORS.warning}
            />
            <Text style={[styles.statusText, isAchieved ? { color: COLORS.accent } : { color: COLORS.warning }]}>
              {isAchieved ? 'Target Met' : 'Needs More Panels'}
            </Text>
          </View>
        </View>

        <View style={styles.simScoreRow}>
          <Text style={styles.simBigValue}>{simulatedRT60}s</Text>
          <Text style={styles.simDeltaText}>
            ({simulatedRT60 > rtCurrent ? '+' : ''}{(simulatedRT60 - rtCurrent).toFixed(2)}s change)
          </Text>
        </View>

        {/* Panel Quantity Controls */}
        <View style={styles.panelControlRow}>
          <View>
            <Text style={styles.panelCountLabel}>Required Panels:</Text>
            <Text style={styles.panelCountSub}>
              {((activePanels * selectedMaterial.unitArea)).toFixed(1)} m² ({coveragePercent}% of room surface)
            </Text>
          </View>
          <View style={styles.counterRow}>
            <TouchableOpacity
              style={styles.counterButton}
              onPress={() => setCustomPanels(Math.max(0, activePanels - 1))}
            >
              <Ionicons name="remove" size={18} color={COLORS.text} />
            </TouchableOpacity>
            <Text style={styles.counterValue}>{activePanels}</Text>
            <TouchableOpacity
              style={styles.counterButton}
              onPress={() => setCustomPanels(activePanels + 1)}
            >
              <Ionicons name="add" size={18} color={COLORS.text} />
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.divider} />

        <View style={styles.specsSummaryGrid}>
          <View style={styles.specItem}>
            <Text style={styles.specLabel}>Room Volume</Text>
            <Text style={styles.specValue}>{volume.toFixed(1)} m³</Text>
          </View>
          <View style={styles.specItem}>
            <Text style={styles.specLabel}>Surface Area</Text>
            <Text style={styles.specValue}>{surfaceArea.toFixed(1)} m²</Text>
          </View>
          <View style={styles.specItem}>
            <Text style={styles.specLabel}>Added Absorption</Text>
            <Text style={styles.specValue}>+{addedAbsorption.toFixed(1)} Sabins</Text>
          </View>
          <View style={styles.specItem}>
            <Text style={styles.specLabel}>Estimated Cost</Text>
            <Text style={[styles.specValue, { color: COLORS.primary }]}>${totalCost}</Text>
          </View>
        </View>

        {/* Placement Advice */}
        <View style={styles.adviceBox}>
          <Ionicons name="information-circle-outline" size={16} color={COLORS.primary} />
          <Text style={styles.adviceText}>
            Placement priority: Install first {Math.min(4, activePanels)} panels at primary mirror reflection points on side walls, next {Math.max(0, Math.min(4, activePanels - 4))} panels on front/rear walls, and corner wedges at room corners.
          </Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: SPACING.md,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  headerTitle: {
    color: COLORS.text,
    fontSize: FONT_SIZES.lg,
    fontWeight: '800',
  },
  subtitle: {
    color: COLORS.textSecondary,
    fontSize: 12,
    marginBottom: SPACING.md,
    lineHeight: 16,
  },
  inputGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: SPACING.md,
  },
  inputItem: {
    flex: 1,
    minWidth: '22%',
  },
  inputLabel: {
    color: COLORS.textMuted,
    fontSize: 10,
    marginBottom: 4,
  },
  input: {
    backgroundColor: COLORS.surface,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: 8,
    paddingVertical: 6,
    color: COLORS.text,
    fontSize: 13,
    fontWeight: '700',
    textAlign: 'center',
  },
  sectionLabel: {
    color: COLORS.text,
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 8,
    marginTop: 4,
  },
  presetsRow: {
    flexDirection: 'row',
    gap: 6,
    paddingBottom: 8,
  },
  presetPill: {
    backgroundColor: COLORS.surface,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  presetPillSelected: {
    backgroundColor: 'rgba(6, 182, 212, 0.15)',
    borderColor: COLORS.primary,
  },
  presetText: {
    color: COLORS.textSecondary,
    fontSize: 11,
    fontWeight: '600',
  },
  presetTextSelected: {
    color: COLORS.primary,
    fontWeight: '700',
  },
  materialsList: {
    gap: 8,
    marginBottom: SPACING.md,
  },
  materialCard: {
    backgroundColor: COLORS.card,
    borderRadius: 10,
    padding: 10,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  materialCardSelected: {
    borderColor: COLORS.primary,
    backgroundColor: 'rgba(6, 182, 212, 0.05)',
  },
  materialHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  materialIconTitle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flex: 1,
  },
  materialName: {
    color: COLORS.textSecondary,
    fontSize: 12,
    fontWeight: '700',
  },
  alphaBadge: {
    backgroundColor: COLORS.surface,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  alphaText: {
    color: COLORS.primary,
    fontSize: 10,
    fontWeight: '700',
  },
  materialDesc: {
    color: COLORS.textMuted,
    fontSize: 10,
    marginTop: 4,
  },
  materialFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 6,
  },
  materialUnitText: {
    color: COLORS.textSecondary,
    fontSize: 10,
  },
  materialCostText: {
    color: COLORS.accent,
    fontSize: 10,
    fontWeight: '600',
  },
  simulationCard: {
    backgroundColor: COLORS.card,
    borderRadius: 14,
    padding: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.primary,
    marginTop: SPACING.xs,
  },
  simHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  simTitle: {
    color: COLORS.text,
    fontSize: 13,
    fontWeight: '700',
  },
  simSubtitle: {
    color: COLORS.textMuted,
    fontSize: 11,
    marginTop: 2,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
  },
  statusBadgePass: {
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
  },
  statusBadgeNeedsMore: {
    backgroundColor: 'rgba(245, 158, 11, 0.15)',
  },
  statusText: {
    fontSize: 10,
    fontWeight: '700',
  },
  simScoreRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 8,
    marginVertical: 10,
  },
  simBigValue: {
    color: COLORS.text,
    fontSize: 38,
    fontWeight: '800',
  },
  simDeltaText: {
    color: COLORS.accent,
    fontSize: 13,
    fontWeight: '600',
  },
  panelControlRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginVertical: 6,
  },
  panelCountLabel: {
    color: COLORS.text,
    fontSize: 13,
    fontWeight: '700',
  },
  panelCountSub: {
    color: COLORS.textSecondary,
    fontSize: 11,
    marginTop: 2,
  },
  counterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: COLORS.surface,
    padding: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  counterButton: {
    width: 28,
    height: 28,
    borderRadius: 6,
    backgroundColor: COLORS.card,
    justifyContent: 'center',
    alignItems: 'center',
  },
  counterValue: {
    color: COLORS.primary,
    fontSize: 16,
    fontWeight: '800',
    minWidth: 24,
    textAlign: 'center',
  },
  divider: {
    height: 1,
    backgroundColor: COLORS.border,
    marginVertical: 10,
  },
  specsSummaryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  specItem: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: COLORS.surface,
    padding: 8,
    borderRadius: 6,
  },
  specLabel: {
    color: COLORS.textMuted,
    fontSize: 10,
  },
  specValue: {
    color: COLORS.text,
    fontSize: 12,
    fontWeight: '700',
    marginTop: 2,
  },
  adviceBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 6,
    backgroundColor: 'rgba(6, 182, 212, 0.08)',
    padding: 10,
    borderRadius: 8,
    marginTop: 12,
  },
  adviceText: {
    color: COLORS.textSecondary,
    fontSize: 11,
    lineHeight: 15,
    flex: 1,
  },
});
