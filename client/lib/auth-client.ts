import { createAuthClient } from "better-auth/react";
import { expoClient } from "@better-auth/expo/client";
import * as SecureStore from "expo-secure-store";
import { API_URL } from "../constants/Config";
import { Platform } from "react-native";

// Only include expoClient plugin on native — on web, Better Auth uses
// standard browser cookies and the plugin can interfere with that flow.
const plugins: any[] = [];
if (Platform.OS !== 'web') {
  plugins.push(
    expoClient({
      scheme: "prepnova",
      storage: SecureStore,
    })
  );
}

export const authClient = createAuthClient({
  baseURL: API_URL,
  plugins,
});
