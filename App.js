import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from './src/constants/theme';
import { MeasureScreen } from './src/screens/MeasureScreen';
import { ResultsScreen } from './src/screens/ResultsScreen';
import { AdvisorScreen } from './src/screens/AdvisorScreen';
import { HistoryScreen } from './src/screens/HistoryScreen';
import { ComparisonModal } from './src/components/measurement/ComparisonModal';
import { AuthModal } from './src/components/auth/AuthModal';
import { saveMeasurement, getAllMeasurements } from './src/services/storage/historyStorage';
import { subscribeAuthState } from './src/services/auth/authService';
import {
  setupNotifications,
  sendAuditCompleteNotification,
} from './src/services/notifications/notificationService';

export default function App() {
  const [activeTab, setActiveTab] = useState('measure');
  const [currentMeasurement, setCurrentMeasurement] = useState(null);
  const [user, setUser] = useState(null);
  const [pushToken, setPushToken] = useState(null);
  const [authModalVisible, setAuthModalVisible] = useState(false);
  const [comparisonModal, setComparisonModal] = useState({
    visible: false,
    roomA: null,
    roomB: null,
  });

  // Restore last measurement, subscribe to Firebase Auth, and initialize notifications
  React.useEffect(() => {
    getAllMeasurements().then((list) => {
      if (list && list.length > 0) {
        setCurrentMeasurement(list[0]);
      }
    });

    const unsubscribeAuth = subscribeAuthState((activeUser) => {
      setUser(activeUser);
    });

    setupNotifications().then(({ expoPushToken }) => {
      if (expoPushToken) setPushToken(expoPushToken);
    });

    return () => {
      unsubscribeAuth();
    };
  }, []);

  const handleMeasurementComplete = (measurement) => {
    setCurrentMeasurement(measurement);
    saveMeasurement(measurement);
    sendAuditCompleteNotification(measurement);
    setActiveTab('results');
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="light" />

      {/* Top Account & Notification Bar */}
      <View style={styles.topBar}>
        <Text style={styles.topBrand}>AcoustiTape</Text>
        <TouchableOpacity
          style={styles.accountPill}
          onPress={() => setAuthModalVisible(true)}
          activeOpacity={0.75}
        >
          <Ionicons
            name={user ? 'person-circle' : 'person-circle-outline'}
            size={16}
            color={COLORS.primary}
          />
          <Text style={styles.accountText} numberOfLines={1}>
            {user ? user.displayName : 'Sign In'}
          </Text>
          <Ionicons name="notifications-outline" size={14} color={COLORS.textSecondary} />
        </TouchableOpacity>
      </View>

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
        {activeTab === 'history' && (
          <HistoryScreen
            onSelectMeasurement={(item) => {
              setCurrentMeasurement(item);
              setActiveTab('results');
            }}
            onCompareRooms={(roomA, roomB) => {
              setComparisonModal({ visible: true, roomA, roomB });
            }}
          />
        )}
        {activeTab === 'advisor' && <AdvisorScreen />}
      </View>

      {/* Room Comparison Modal */}
      <ComparisonModal
        visible={comparisonModal.visible}
        roomA={comparisonModal.roomA}
        roomB={comparisonModal.roomB}
        onClose={() => setComparisonModal({ visible: false, roomA: null, roomB: null })}
      />

      {/* Firebase Auth & Notifications Modal */}
      <AuthModal
        visible={authModalVisible}
        onClose={() => setAuthModalVisible(false)}
        user={user}
        pushToken={pushToken}
      />

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
          onPress={() => setActiveTab('history')}
          activeOpacity={0.7}
        >
          <Ionicons
            name={activeTab === 'history' ? 'time' : 'time-outline'}
            size={22}
            color={activeTab === 'history' ? COLORS.primary : COLORS.textMuted}
          />
          <Text
            style={[
              styles.tabLabel,
              activeTab === 'history' && styles.tabLabelActive,
            ]}
          >
            History
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
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    backgroundColor: COLORS.surface,
  },
  topBrand: {
    color: COLORS.text,
    fontSize: 15,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  accountPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: COLORS.card,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    maxWidth: 180,
  },
  accountText: {
    color: COLORS.text,
    fontSize: 11,
    fontWeight: '600',
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
