import * as Location from 'expo-location';

/**
 * Requests location permission and returns current GPS coordinates and reverse-geocoded venue name.
 *
 * @returns {Promise<{
 *   latitude: number|null,
 *   longitude: number|null,
 *   altitude: number|null,
 *   venueName: string,
 *   city: string,
 *   formattedAddress: string,
 *   isGeoTagged: boolean
 * }>}
 */
export async function getCurrentLocation() {
  try {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') {
      return {
        latitude: null,
        longitude: null,
        altitude: null,
        venueName: 'Location Permission Denied',
        city: '',
        formattedAddress: '',
        isGeoTagged: false,
      };
    }

    const position = await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.Balanced,
    });

    const { latitude, longitude, altitude } = position.coords;

    // Reverse geocode coordinates to obtain building/venue/street name
    let venueName = 'Architectural Space';
    let city = '';
    let formattedAddress = `${latitude.toFixed(4)}° N, ${longitude.toFixed(4)}° E`;

    try {
      const geocoded = await Location.reverseGeocodeAsync({ latitude, longitude });
      if (geocoded && geocoded.length > 0) {
        const place = geocoded[0];
        const namePart = place.name || place.street || place.district;
        city = place.city || place.subregion || place.region || '';
        venueName = namePart ? `${namePart}${city ? ', ' + city : ''}` : formattedAddress;
        formattedAddress = [place.name, place.street, place.city, place.region]
          .filter(Boolean)
          .join(', ');
      }
    } catch (_) {}

    return {
      latitude: Number(latitude.toFixed(5)),
      longitude: Number(longitude.toFixed(5)),
      altitude: altitude ? Number(altitude.toFixed(1)) : null,
      venueName,
      city,
      formattedAddress,
      isGeoTagged: true,
    };
  } catch (error) {
    console.warn('[locationService] Could not acquire location:', error);
    return {
      latitude: null,
      longitude: null,
      altitude: null,
      venueName: 'Manual Entry (No GPS)',
      city: '',
      formattedAddress: '',
      isGeoTagged: false,
    };
  }
}
