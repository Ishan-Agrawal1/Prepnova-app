import { Platform } from 'react-native';

// On web, use localhost so cookies stay same-origin (avoids cross-origin cookie issues).
// On native, use the LAN IP so the device can reach the server.
const envUrl = process.env.EXPO_PUBLIC_API_URL;

if (!envUrl) {
  throw new Error('EXPO_PUBLIC_API_URL is not defined. Please set it in your .env file.');
}

// On web, ensure the API URL uses the SAME hostname as the current page
// so cookies stay same-site. If the page is on localhost, use localhost.
// If the page is on a LAN IP, keep the LAN IP.
let API_URL = envUrl;
if (Platform.OS === 'web' && typeof window !== 'undefined') {
  try {
    const parsed = new URL(envUrl);
    const pageHost = window.location.hostname;

    if (pageHost === 'localhost' || pageHost === '127.0.0.1') {
      // Page is on localhost → rewrite API to localhost for same-site cookies
      if (parsed.hostname !== 'localhost' && parsed.hostname !== '127.0.0.1') {
        API_URL = `${parsed.protocol}//localhost:${parsed.port}`;
      }
    } else {
      // Page is on a LAN IP → keep API on the same LAN IP for same-site cookies
      if (parsed.hostname !== pageHost) {
        API_URL = `${parsed.protocol}//${pageHost}:${parsed.port}`;
      }
    }
  } catch {}
}

export { API_URL };