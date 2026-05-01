import { Stack } from 'expo-router';
import Colors from '../../constants/Colors';

export default function ScreensLayout() {
  return (
    <Stack
      screenOptions={{
        headerStyle: {
          backgroundColor: Colors.background,
        },
        headerTintColor: Colors.primary,
        headerTitleStyle: {
          fontWeight: '700',
          color: Colors.textDark,
        },
        headerShadowVisible: false,
        animation: 'slide_from_right',
      }}
    >
      <Stack.Screen name="resume" options={{ title: 'Resume Analyzer' }} />
      <Stack.Screen name="interview" options={{ title: 'Interview Practice' }} />
      <Stack.Screen name="voice-coach" options={{ title: 'Voice Coach' }} />
      <Stack.Screen name="aptitude" options={{ title: 'Aptitude Test' }} />
      <Stack.Screen name="coding" options={{ title: 'Coding Test' }} />
      <Stack.Screen name="communication" options={{ title: 'Communication' }} />
      <Stack.Screen name="github-review" options={{ title: 'GitHub Review' }} />
      <Stack.Screen name="roadmap" options={{ title: 'Study Planner' }} />
      <Stack.Screen name="vr-interview" options={{ title: 'VR Interview' }} />
    </Stack>
  );
}
