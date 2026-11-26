import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SPACING, FONT_SIZES } from '../../constants/theme';
import { calculateRoomModes } from '../../services/dsp/roomModes';

export const RoomModesCalculator = () => {
  const [length, setLength] = useState('5.5');
  const [width, setWidth] = useState('4.2');
  const [height, setHeight] = useState('2.8');
  const [rt60, setRt60] = useState('0.6');

  const rawL = parseFloat(length);
  const rawW = parseFloat(width);
  const rawH = parseFloat(height);
  const rawRT = parseFloat(rt60);

  const isInputValid =
    Number.isFinite(rawL) && rawL > 0 &&
    Number.isFinite(rawW) && rawW > 0 &&
    Number.isFinite(rawH) && rawH > 0 &&
    Number.isFinite(rawRT) && rawRT >= 0.15 && rawRT <= 6.0;

  const l = isInputValid ? rawL : 5.5;
  const w = isInputValid ? rawW : 4.2;
  const h = isInputValid ? rawH : 2.8;
  const rt = isInputValid ? rawRT : 0.6;

  const analysis = calculateRoomModes(l, w, h, rt);

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <Ionicons name="pulse-outline" size={20} color={COLORS.primary} />
        <Text style={styles.title}>Room Modes & Standing Waves</Text>
      </View>
      <Text style={styles.subtitle}>
        Predict low-frequency bass resonance peaks (&lt; 250 Hz) from room geometry.
      </Text>

      {/* Dimensions Input */}
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
          <Text style={styles.inputLabel}>RT60 (s)</Text>
          <TextInput
            style={styles.input}
            value={rt60}
            onChangeText={setRt60}
            keyboardType="numeric"
            placeholderTextColor={COLORS.textMuted}
          />
        </View>
      </View>

      {/* Schroeder Frequency & Bolt Ratio Status */}
      {!isInputValid && (
        <View style={{ backgroundColor: 'rgba(239, 68, 68, 0.12)', padding: 8, borderRadius: 8, marginBottom: 10 }}>
          <Text style={{ color: COLORS.danger, fontSize: 11, fontWeight: '600' }}>
            Invalid input: dimensions must be &gt; 0m and RT60 between 0.15s and 6.0s.
          </Text>
        </View>
      )}
      <View style={styles.summaryCard}>
        <View style={styles.summaryTopRow}>
          <View>
            <Text style={styles.metricTag}>SCHROEDER FREQUENCY</Text>
            <Text style={styles.schroederValue}>{analysis.schroederFreq} Hz</Text>
            <Text style={styles.schroederHint}>
              Standing waves dominate below {analysis.schroederFreq} Hz
            </Text>
          </View>
          <View style={styles.volBox}>
            <Text style={styles.metricTag}>VOLUME</Text>
            <Text style={styles.volValue}>{analysis.volume} m³</Text>
          </View>
        </View>

        <View
          style={[
            styles.ratioBanner,
            analysis.isRatioHealthy ? styles.ratioPass : styles.ratioWarn,
          ]}
        >
          <Ionicons
            name={analysis.isRatioHealthy ? 'checkmark-circle' : 'warning'}
            size={16}
            color={analysis.isRatioHealthy ? COLORS.accent : COLORS.warning}
          />
          <View style={{ flex: 1 }}>
            <Text
              style={[
                styles.ratioTitle,
                { color: analysis.isRatioHealthy ? COLORS.accent : COLORS.warning },
              ]}
            >
              {analysis.ratioStatus}
            </Text>
            <Text style={styles.ratioMsg}>{analysis.ratioMessage}</Text>
          </View>
        </View>
      </View>

      {/* Resonant Frequencies Table */}
      <View style={styles.modesCard}>
        <Text style={styles.modesTitle}>Critical Resonant Frequencies (Hz)</Text>
        <Text style={styles.modesSub}>
          Axial modes carry the highest acoustic energy — place corner bass traps to tame them.
        </Text>

        {analysis.modes.map((m, idx) => (
          <View key={idx} style={styles.modeRow}>
            <View style={styles.freqCol}>
              <Text style={styles.freqText}>{m.freq} Hz</Text>
              <Text style={styles.indicesText}>Mode {m.indices}</Text>
            </View>
            <View style={styles.axisCol}>
              <Text style={styles.axisText}>{m.axis}</Text>
              <Text style={styles.typeText}>{m.type}</Text>
            </View>
            <View
              style={[
                styles.sevBadge,
                m.severity === 'High' ? styles.sevHigh : styles.sevMed,
              ]}
            >
              <Text
                style={[
                  styles.sevText,
                  { color: m.severity === 'High' ? COLORS.danger : COLORS.primary },
                ]}
              >
                {m.severity}
              </Text>
            </View>
          </View>
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: SPACING.sm,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  title: {
    color: COLORS.text,
    fontSize: FONT_SIZES.lg,
    fontWeight: '800',
  },
  subtitle: {
    color: COLORS.textSecondary,
    fontSize: 12,
    marginBottom: SPACING.md,
  },
  inputGrid: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: SPACING.md,
  },
  inputItem: {
    flex: 1,
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
    paddingVertical: 7,
    color: COLORS.text,
    fontSize: 13,
    fontWeight: '700',
    textAlign: 'center',
  },
  summaryCard: {
    backgroundColor: COLORS.card,
    borderRadius: 14,
    padding: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.primary,
    marginBottom: SPACING.md,
  },
  summaryTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  metricTag: {
    color: COLORS.primary,
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1,
  },
  schroederValue: {
    color: COLORS.text,
    fontSize: 28,
    fontWeight: '800',
    marginTop: 2,
  },
  schroederHint: {
    color: COLORS.textMuted,
    fontSize: 11,
  },
  volBox: {
    alignItems: 'flex-end',
  },
  volValue: {
    color: COLORS.text,
    fontSize: 18,
    fontWeight: '700',
    marginTop: 2,
  },
  ratioBanner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    padding: 10,
    borderRadius: 10,
  },
  ratioPass: {
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
  },
  ratioWarn: {
    backgroundColor: 'rgba(245, 158, 11, 0.12)',
  },
  ratioTitle: {
    fontSize: 12,
    fontWeight: '700',
  },
  ratioMsg: {
    color: COLORS.textSecondary,
    fontSize: 11,
    marginTop: 2,
    lineHeight: 15,
  },
  modesCard: {
    backgroundColor: COLORS.card,
    borderRadius: 14,
    padding: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  modesTitle: {
    color: COLORS.text,
    fontSize: FONT_SIZES.md,
    fontWeight: '700',
  },
  modesSub: {
    color: COLORS.textMuted,
    fontSize: 11,
    marginTop: 2,
    marginBottom: 10,
  },
  modeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  freqCol: {
    flex: 1,
  },
  freqText: {
    color: COLORS.text,
    fontSize: 14,
    fontWeight: '700',
  },
  indicesText: {
    color: COLORS.textMuted,
    fontSize: 10,
  },
  axisCol: {
    flex: 1,
  },
  axisText: {
    color: COLORS.textSecondary,
    fontSize: 12,
    fontWeight: '600',
  },
  typeText: {
    color: COLORS.textMuted,
    fontSize: 10,
  },
  sevBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  sevHigh: {
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
  },
  sevMed: {
    backgroundColor: 'rgba(6, 182, 212, 0.15)',
  },
  sevText: {
    fontSize: 10,
    fontWeight: '700',
  },
});
