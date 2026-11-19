import { Audio } from 'expo-av';
import { Alert, Linking, Platform } from 'react-native';

/**
 * Checks and requests microphone permissions for room impulse recording.
 * @returns {Promise<boolean>} True if granted, false otherwise.
 */
export async function requestMicrophonePermission() {
  try {
    const { status: existingStatus } = await Audio.getPermissionsAsync();
    if (existingStatus === 'granted') {
      return true;
    }

    const { status } = await Audio.requestPermissionsAsync();
    if (status === 'granted') {
      return true;
    }

    // Permission denied: show helpful explanation dialog
    Alert.alert(
      'Microphone Permission Required',
      'AcoustiTape needs access to your microphone to capture the room impulse response (handclap) for measuring reverberation time (RT60).',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Open Settings',
          onPress: () => {
            if (Platform.OS === 'ios') {
              Linking.openURL('app-settings:');
            } else {
              Linking.openSettings();
            }
          },
        },
      ]
    );

    return false;
  } catch (error) {
    console.warn('[audioPermissions] Error requesting permissions:', error);
    return false;
  }
}

/**
 * Checks current microphone permission status without prompting.
 * @returns {Promise<boolean>}
 */
export async function checkMicrophonePermission() {
  try {
    const { status } = await Audio.getPermissionsAsync();
    return status === 'granted';
  } catch (error) {
    console.warn('[audioPermissions] Error checking permissions:', error);
    return false;
  }
}
