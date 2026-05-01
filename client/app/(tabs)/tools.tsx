import React from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import Colors from '../../constants/Colors';
import FeatureCard from '../../components/FeatureCard';
import { useAuth } from '../../contexts/AuthContext';

const tools = [
  { title: 'Resume Analyzer', desc: 'Upload and get AI feedback on your resume', icon: 'document-attach' as const, route: '/(screens)/resume', color: '#1e65b7' },
  { title: 'Interview Practice', desc: 'Practice common HR and technical questions', icon: 'chatbubbles' as const, route: '/(screens)/interview', color: '#2196F3' },
  { title: 'Voice Coach', desc: 'Practice speaking with voice-based answers', icon: 'mic' as const, route: '/(screens)/voice-coach', color: '#009688' },
  { title: 'Communication', desc: 'Improve communication with guided sessions', icon: 'people' as const, route: '/(screens)/communication', color: '#673AB7' },
  { title: 'VR Interview', desc: 'Immersive interview with AI interviewer', icon: 'glasses' as const, route: '/(screens)/vr-interview', color: '#E91E63' },
  { title: 'GitHub Review', desc: 'Get feedback on your GitHub repositories', icon: 'logo-github' as const, route: '/(screens)/github-review', color: '#333' },
  { title: 'Aptitude Test', desc: 'Sharpen quantitative and logical skills', icon: 'calculator' as const, route: '/(screens)/aptitude', color: '#FF9800' },
  { title: 'Coding Test', desc: 'Practice coding logic and writing', icon: 'code-slash' as const, route: '/(screens)/coding', color: '#4CAF50' },
  { title: 'Study Planner', desc: 'AI-powered study roadmap and planning', icon: 'map' as const, route: '/(screens)/roadmap', color: '#F44336' },
];

export default function ToolsScreen() {
  const router = useRouter();
  const { appStarted } = useAuth();

  if (!appStarted) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyIcon}>🔒</Text>
        <Text style={styles.emptyTitle}>Tools Locked</Text>
        <Text style={styles.emptyText}>Press Start on Home to unlock all tools.</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.pageTitle}>All Tools</Text>
      <Text style={styles.pageSubtitle}>
        Access all preparation modules and practice sessions.
      </Text>

      <View style={styles.grid}>
        {tools.map((tool, i) => (
          <FeatureCard
            key={i}
            title={tool.title}
            description={tool.desc}
            icon={tool.icon}
            color={tool.color}
            onPress={() => router.push(tool.route as any)}
          />
        ))}
      </View>

      <View style={{ height: 32 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  content: { padding: 20, paddingTop: 60 },
  pageTitle: { fontSize: 28, fontWeight: '800', color: Colors.textHeading, marginBottom: 6 },
  pageSubtitle: { fontSize: 15, color: Colors.textSecondary, lineHeight: 22, marginBottom: 24 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  emptyContainer: {
    flex: 1, backgroundColor: Colors.background,
    alignItems: 'center', justifyContent: 'center', padding: 32,
  },
  emptyIcon: { fontSize: 48, marginBottom: 16 },
  emptyTitle: { fontSize: 22, fontWeight: '700', color: Colors.textDark, marginBottom: 8 },
  emptyText: { fontSize: 15, color: Colors.textSecondary, textAlign: 'center' },
});
