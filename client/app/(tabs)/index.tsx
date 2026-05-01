import React, { useEffect, useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet, RefreshControl,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Colors from '../../constants/Colors';
import { useAuth } from '../../contexts/AuthContext';
import { fetchAnalyses } from '../../services/api';
import FeatureCard from '../../components/FeatureCard';

export default function HomeScreen() {
  const router = useRouter();
  const { token, user, appStarted, startApp } = useAuth();
  const [analyses, setAnalyses] = useState<any[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    if (user?.email && appStarted) loadAnalyses();
  }, [user, appStarted]);

  const loadAnalyses = async () => {
    try {
      const data = await fetchAnalyses(user!.email);
      setAnalyses(data);
    } catch (err) {
      console.error('Failed to load analyses', err);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadAnalyses();
    setRefreshing(false);
  };

  const handleStart = async () => {
    if (!token) {
      router.push('/(auth)/login');
      return;
    }
    await startApp();
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />}
    >
      {/* Hero Section */}
      <View style={styles.heroCard}>
        <View style={styles.heroBadge}>
          <Ionicons name="sparkles" size={16} color={Colors.primary} />
          <Text style={styles.heroBadgeText}>AI-Powered Platform</Text>
        </View>
        <Text style={styles.heroTitle}>
          {appStarted && user ? `Welcome, ${user.name}` : 'Prepare for Real Industry'}
        </Text>
        <Text style={styles.heroSubtitle}>
          {appStarted
            ? 'See your resume analysis records and progress toward becoming industry-ready.'
            : 'Analyze your resume, improve your technical profile, prepare for interviews, and track growth.'}
        </Text>

        {!appStarted && (
          <TouchableOpacity style={styles.startBtn} onPress={handleStart} activeOpacity={0.8}>
            <Ionicons name="rocket" size={20} color={Colors.white} />
            <Text style={styles.startBtnText}>Start</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Stats */}
      {appStarted && (
        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{analyses.length}</Text>
            <Text style={styles.statLabel}>Analyses</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>
              {analyses.length > 0 ? analyses[0].score : '—'}
            </Text>
            <Text style={styles.statLabel}>Latest Score</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>📈</Text>
            <Text style={styles.statLabel}>In Progress</Text>
          </View>
        </View>
      )}

      {/* Quick Actions */}
      {appStarted && (
        <>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <View style={styles.featureGrid}>
            <FeatureCard
              title="Resume Analysis"
              description="Upload and analyze your resume"
              icon="document-attach"
              onPress={() => router.push('/(screens)/resume')}
            />
            <FeatureCard
              title="Interview Prep"
              description="Practice common questions"
              icon="chatbubbles"
              onPress={() => router.push('/(screens)/interview')}
            />
            <FeatureCard
              title="Aptitude Test"
              description="Sharpen your quant skills"
              icon="calculator"
              onPress={() => router.push('/(screens)/aptitude')}
            />
            <FeatureCard
              title="Coding Test"
              description="Improve coding logic"
              icon="code-slash"
              onPress={() => router.push('/(screens)/coding')}
            />
          </View>
        </>
      )}

      {/* Features List (when not started) */}
      {!appStarted && (
        <View style={styles.featuresCard}>
          <Text style={styles.featuresTitle}>What this platform provides</Text>
          {[
            'AI based resume analysis and scoring',
            'Skill gap identification',
            'Personalized learning roadmap',
            'Interview and career preparation modules',
            'GitHub review and code feedback',
            'Voice coaching for mock interviews',
            'Communication practice and feedback',
            'VR interview with 3D avatar interviewer',
          ].map((item, i) => (
            <View key={i} style={styles.featureItem}>
              <View style={styles.featureDot} />
              <Text style={styles.featureText}>{item}</Text>
            </View>
          ))}
        </View>
      )}

      {/* Recent Analyses */}
      {appStarted && analyses.length > 0 && (
        <View style={styles.recentCard}>
          <Text style={styles.sectionTitle}>Recent Analyses</Text>
          {analyses.slice(0, 3).map((item: any) => (
            <View key={item._id} style={styles.analysisItem}>
              <View style={styles.analysisHeader}>
                <Ionicons name="document" size={18} color={Colors.primary} />
                <Text style={styles.analysisName} numberOfLines={1}>{item.fileName}</Text>
              </View>
              <Text style={styles.analysisScore}>Score: {item.score}/100</Text>
            </View>
          ))}
        </View>
      )}

      <View style={{ height: 32 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  content: { padding: 20, paddingTop: 60 },
  heroCard: {
    backgroundColor: Colors.surface, borderRadius: 24, padding: 28,
    borderWidth: 1, borderColor: Colors.borderCard,
    shadowColor: Colors.primary, shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.08, shadowRadius: 24, elevation: 6,
    marginBottom: 20,
  },
  heroBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: Colors.pillBg, alignSelf: 'flex-start',
    paddingHorizontal: 14, paddingVertical: 6, borderRadius: 999,
    marginBottom: 16,
  },
  heroBadgeText: { color: Colors.primary, fontWeight: '700', fontSize: 13 },
  heroTitle: { fontSize: 28, fontWeight: '800', color: Colors.textHeading, marginBottom: 10, lineHeight: 36 },
  heroSubtitle: { fontSize: 15, color: Colors.textSecondary, lineHeight: 24, marginBottom: 4 },
  startBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    backgroundColor: Colors.primary, borderRadius: 16,
    paddingVertical: 16, marginTop: 20,
    shadowColor: Colors.primary, shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3, shadowRadius: 16, elevation: 6,
  },
  startBtnText: { color: Colors.white, fontSize: 17, fontWeight: '700' },
  statsRow: { flexDirection: 'row', gap: 12, marginBottom: 24 },
  statCard: {
    flex: 1, backgroundColor: Colors.surface, borderRadius: 18,
    padding: 16, alignItems: 'center',
    borderWidth: 1, borderColor: Colors.borderCard,
    shadowColor: Colors.primary, shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.05, shadowRadius: 12, elevation: 3,
  },
  statValue: { fontSize: 24, fontWeight: '800', color: Colors.primary, marginBottom: 4 },
  statLabel: { fontSize: 12, color: Colors.textMuted, fontWeight: '600' },
  sectionTitle: { fontSize: 20, fontWeight: '700', color: Colors.textDark, marginBottom: 14 },
  featureGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 24 },
  featuresCard: {
    backgroundColor: Colors.surface, borderRadius: 24, padding: 24,
    borderWidth: 1, borderColor: Colors.borderCard,
    shadowColor: Colors.primary, shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.06, shadowRadius: 16, elevation: 4,
    marginBottom: 20,
  },
  featuresTitle: { fontSize: 18, fontWeight: '700', color: Colors.primaryDark, marginBottom: 16 },
  featureItem: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 10 },
  featureDot: {
    width: 8, height: 8, borderRadius: 4,
    backgroundColor: Colors.primary, marginTop: 6, marginRight: 12,
  },
  featureText: { flex: 1, fontSize: 14, color: Colors.textSecondary, lineHeight: 22 },
  recentCard: {
    backgroundColor: Colors.surface, borderRadius: 24, padding: 24,
    borderWidth: 1, borderColor: Colors.borderCard,
    shadowColor: Colors.primary, shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.06, shadowRadius: 16, elevation: 4,
  },
  analysisItem: {
    backgroundColor: Colors.inputBg, borderRadius: 14,
    padding: 14, marginBottom: 10,
    borderWidth: 1, borderColor: Colors.borderInput,
  },
  analysisHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 },
  analysisName: { fontSize: 14, fontWeight: '600', color: Colors.textDark, flex: 1 },
  analysisScore: { fontSize: 13, color: Colors.primary, fontWeight: '600' },
});
