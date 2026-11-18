import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from './src/constants/theme';
import { MeasureScreen } from './src/screens/MeasureScreen';
import { ResultsScreen } from './src/screens/ResultsScreen';
import { AdvisorScreen } from './src/screens/AdvisorScreen';

export default function App() {
  const [activeTab, setActiveTab] = useState('measure');
  const [currentMeasurement, setCurrentMeasurement] = useState(null);

  const handleMeasurementComplete = (measurement) => {
    setCurrentMeasurement(measurement);
    setActiveTab('results');
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="light" />

      {/* Screen Container */}
      <View style={styles.screenContainer}>
        {activeTab === 'measure' && (
          <MeasureScreen
            onMeasurementComplete={handleMeasurementComplete}
            lastMeasurement={currentMeasurement}
          />
        )}
        {activeTab === 'results' && (
          <ResultsScreen
            measurement={currentMeasurement}
            onNewMeasurement={() => setActiveTab('measure')}
          />
        )}
        {activeTab === 'advisor' && <AdvisorScreen />}
      </View>

      {/* Bottom Navigation Bar */}
      <View style={styles.tabBar}>
        <TouchableOpacity
          style={styles.tabButton}
          onPress={() => setActiveTab('measure')}
          activeOpacity={0.7}
        >
          <Ionicons
            name={activeTab === 'measure' ? 'mic' : 'mic-outline'}
            size={22}
            color={activeTab === 'measure' ? COLORS.primary : COLORS.textMuted}
          />
          <Text
            style={[
              styles.tabLabel,
              activeTab === 'measure' && styles.tabLabelActive,
            ]}
          >
            Measure
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.tabButton}
          onPress={() => setActiveTab('results')}
          activeOpacity={0.7}
        >
          <Ionicons
            name={activeTab === 'results' ? 'stats-chart' : 'stats-chart-outline'}
            size={22}
            color={activeTab === 'results' ? COLORS.primary : COLORS.textMuted}
          />
          <Text
            style={[
              styles.tabLabel,
              activeTab === 'results' && styles.tabLabelActive,
            ]}
          >
            Results
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.tabButton}
          onPress={() => setActiveTab('advisor')}
          activeOpacity={0.7}
        >
          <Ionicons
            name={activeTab === 'advisor' ? 'book' : 'book-outline'}
            size={22}
            color={activeTab === 'advisor' ? COLORS.primary : COLORS.textMuted}
          />
          <Text
            style={[
              styles.tabLabel,
              activeTab === 'advisor' && styles.tabLabelActive,
            ]}
          >
            Standards
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  screenContainer: {
    flex: 1,
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: COLORS.surface,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    paddingVertical: 10,
    paddingHorizontal: 16,
    justifyContent: 'space-around',
  },
  tabButton: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
  },
  tabLabel: {
    color: COLORS.textMuted,
    fontSize: 11,
    marginTop: 4,
    fontWeight: '500',
  },
  tabLabelActive: {
    color: COLORS.primary,
    fontWeight: '700',
  },
});
