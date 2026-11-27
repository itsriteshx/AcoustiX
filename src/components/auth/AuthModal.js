import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  TextInput,
  SafeAreaView,
  ActivityIndicator,
  Switch,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SPACING, FONT_SIZES } from '../../constants/theme';
import {
  signInWithEmail,
  signUpWithEmail,
  sendPasswordReset,
  signOutUser,
  isFirebaseConfigured,
} from '../../services/auth/authService';
import {
  sendTestNotification,
  scheduleDailyAuditReminder,
  cancelAuditReminders,
  isDailyReminderEnabled,
} from '../../services/notifications/notificationService';

export const AuthModal = ({ visible, onClose, user, pushToken }) => {
  const [isSignUp, setIsSignUp] = useState(false);
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [loading, setLoading] = useState(false);
  const [reminderEnabled, setReminderEnabled] = useState(false);

  useEffect(() => {
    if (visible) {
      setErrorMsg('');
      isDailyReminderEnabled().then(setReminderEnabled);
    }
  }, [visible]);

  const handleSubmit = async () => {
    setErrorMsg('');
    setLoading(true);
    try {
      if (isSignUp) {
        await signUpWithEmail(email, password, displayName);
      } else {
        await signInWithEmail(email, password);
      }
      setPassword('');
    } catch (err) {
      setErrorMsg(err.message || 'Authentication failed.');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async () => {
    setErrorMsg('');
    try {
      await sendPasswordReset(email);
      Alert.alert('Reset Email Sent', `Check ${email.trim()} for a password reset link.`);
    } catch (err) {
      setErrorMsg(err.message || 'Could not send password reset email.');
    }
  };

  const handleToggleReminder = async (nextVal) => {
    try {
      if (nextVal) {
        await scheduleDailyAuditReminder(9, 0);
        setReminderEnabled(true);
        Alert.alert('Reminder Scheduled', 'Daily acoustic audit reminder set for 9:00 AM.');
      } else {
        await cancelAuditReminders();
        setReminderEnabled(false);
      }
    } catch (err) {
      Alert.alert('Notification Permission', err.message || 'Could not schedule reminder.');
    }
  };

  const handleTestNotification = async () => {
    try {
      await sendTestNotification();
    } catch (err) {
      Alert.alert('Notification Error', err.message || 'Permission required.');
    }
  };

  const firebaseLive = isFirebaseConfigured();

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <SafeAreaView style={styles.overlay}>
        <View style={styles.sheet}>
          <View style={styles.header}>
            <View style={styles.titleRow}>
              <Ionicons name="shield-checkmark-outline" size={22} color={COLORS.primary} />
              <Text style={styles.title}>Account &amp; Notifications</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Ionicons name="close" size={22} color={COLORS.textSecondary} />
            </TouchableOpacity>
          </View>

          {/* Firebase Status Badge */}
          <View style={styles.envPill}>
            <Ionicons
              name={firebaseLive ? 'cloud-done-outline' : 'laptop-outline'}
              size={14}
              color={firebaseLive ? COLORS.accent : COLORS.warning}
            />
            <Text style={styles.envText}>
              {firebaseLive
                ? 'Firebase Auth Connected'
                : 'Local Demo Auth (add EXPO_PUBLIC_FIREBASE_* in .env for live cloud)'}
            </Text>
          </View>

          {user ? (
            <View style={styles.profileCard}>
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>
                  {(user.displayName || user.email || 'A')[0].toUpperCase()}
                </Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.profileName}>{user.displayName}</Text>
                <Text style={styles.profileEmail}>{user.email}</Text>
                <Text style={styles.providerTag}>
                  Session: {user.provider === 'firebase' ? 'Firebase Cloud' : 'Local Demo'}
                </Text>
              </View>
              <TouchableOpacity style={styles.signOutBtn} onPress={signOutUser}>
                <Text style={styles.signOutText}>Sign Out</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.formCard}>
              {isSignUp && (
                <TextInput
                  style={styles.input}
                  placeholder="Full Name"
                  placeholderTextColor={COLORS.textMuted}
                  value={displayName}
                  onChangeText={setDisplayName}
                />
              )}
              <TextInput
                style={styles.input}
                placeholder="Email Address"
                placeholderTextColor={COLORS.textMuted}
                autoCapitalize="none"
                keyboardType="email-address"
                value={email}
                onChangeText={setEmail}
              />
              <TextInput
                style={styles.input}
                placeholder="Password (min 6 chars)"
                placeholderTextColor={COLORS.textMuted}
                secureTextEntry
                value={password}
                onChangeText={setPassword}
              />

              {errorMsg ? <Text style={styles.errorText}>{errorMsg}</Text> : null}

              <TouchableOpacity
                style={styles.primaryBtn}
                onPress={handleSubmit}
                disabled={loading}
                activeOpacity={0.8}
              >
                {loading ? (
                  <ActivityIndicator color="#000" />
                ) : (
                  <Text style={styles.primaryBtnText}>
                    {isSignUp ? 'Create Account' : 'Sign In'}
                  </Text>
                )}
              </TouchableOpacity>

              <View style={styles.formLinks}>
                <TouchableOpacity onPress={() => setIsSignUp(!isSignUp)}>
                  <Text style={styles.linkText}>
                    {isSignUp ? 'Already have an account? Sign In' : 'New user? Create Account'}
                  </Text>
                </TouchableOpacity>
                {!isSignUp && (
                  <TouchableOpacity onPress={handleResetPassword}>
                    <Text style={styles.linkMuted}>Forgot Password?</Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          )}

          {/* Expo Notifications Controls */}
          <View style={styles.notifCard}>
            <View style={styles.notifHeader}>
              <Ionicons name="notifications-outline" size={18} color={COLORS.primary} />
              <Text style={styles.notifTitle}>Acoustic Notifications</Text>
            </View>

            <View style={styles.switchRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.switchLabel}>Daily Audit Reminder (9:00 AM)</Text>
                <Text style={styles.switchSub}>
                  Schedules a recurring local notification via expo-notifications.
                </Text>
              </View>
              <Switch
                value={reminderEnabled}
                onValueChange={handleToggleReminder}
                trackColor={{ false: COLORS.border, true: COLORS.primary }}
              />
            </View>

            {pushToken ? (
              <Text style={styles.tokenText} numberOfLines={1}>
                Push Token: {pushToken}
              </Text>
            ) : null}

            <TouchableOpacity style={styles.testNotifBtn} onPress={handleTestNotification}>
              <Ionicons name="paper-plane-outline" size={15} color={COLORS.primary} />
              <Text style={styles.testNotifText}>Send Test Notification</Text>
            </TouchableOpacity>
          </View>
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
    marginBottom: 8,
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
  envPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: COLORS.surface,
    padding: 8,
    borderRadius: 8,
    marginBottom: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  envText: {
    color: COLORS.textSecondary,
    fontSize: 11,
    flex: 1,
  },
  profileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: COLORS.surface,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.primary,
    marginBottom: SPACING.md,
  },
  avatar: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    color: '#000',
    fontSize: 18,
    fontWeight: '800',
  },
  profileName: {
    color: COLORS.text,
    fontSize: 14,
    fontWeight: '700',
  },
  profileEmail: {
    color: COLORS.textSecondary,
    fontSize: 12,
  },
  providerTag: {
    color: COLORS.accent,
    fontSize: 10,
    fontWeight: '600',
    marginTop: 2,
  },
  signOutBtn: {
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  signOutText: {
    color: COLORS.danger,
    fontSize: 11,
    fontWeight: '700',
  },
  formCard: {
    gap: 10,
    marginBottom: SPACING.md,
  },
  input: {
    backgroundColor: COLORS.surface,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: COLORS.text,
    fontSize: 13,
  },
  errorText: {
    color: COLORS.danger,
    fontSize: 12,
    fontWeight: '600',
  },
  primaryBtn: {
    backgroundColor: COLORS.primary,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
  },
  primaryBtnText: {
    color: '#000',
    fontSize: 14,
    fontWeight: '700',
  },
  formLinks: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 2,
  },
  linkText: {
    color: COLORS.primary,
    fontSize: 12,
    fontWeight: '600',
  },
  linkMuted: {
    color: COLORS.textMuted,
    fontSize: 11,
  },
  notifCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    gap: 10,
    marginBottom: SPACING.sm,
  },
  notifHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  notifTitle: {
    color: COLORS.text,
    fontSize: 13,
    fontWeight: '700',
  },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  switchLabel: {
    color: COLORS.text,
    fontSize: 12,
    fontWeight: '600',
  },
  switchSub: {
    color: COLORS.textMuted,
    fontSize: 10,
    marginTop: 2,
  },
  tokenText: {
    color: COLORS.textMuted,
    fontSize: 10,
  },
  testNotifBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 9,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(6, 182, 212, 0.4)',
  },
  testNotifText: {
    color: COLORS.primary,
    fontSize: 12,
    fontWeight: '700',
  },
});
