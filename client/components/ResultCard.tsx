import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Colors from '../constants/Colors';

interface ResultCardProps {
  result: {
    score: number;
    summary?: string;
    strengths?: string[];
    weaknesses?: string[];
    improvements?: string[];
  };
}

export default function ResultCard({ result }: ResultCardProps) {
  if (!result) return null;

  return (
    <View style={styles.container}>
      <View style={styles.scoreRow}>
        <Text style={styles.scoreLabel}>Resume Score</Text>
        <View style={styles.scoreBadge}>
          <Text style={styles.scoreText}>{result.score}/100</Text>
        </View>
      </View>

      {result.summary && (
        <Text style={styles.summary}>{result.summary}</Text>
      )}

      {result.strengths && result.strengths.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>✅ Strengths</Text>
          {result.strengths.map((item, index) => (
            <View key={index} style={styles.listItem}>
              <View style={styles.bullet} />
              <Text style={styles.listText}>{item}</Text>
            </View>
          ))}
        </View>
      )}

      {result.weaknesses && result.weaknesses.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>⚠️ Weaknesses</Text>
          {result.weaknesses.map((item, index) => (
            <View key={index} style={styles.listItem}>
              <View style={[styles.bullet, { backgroundColor: '#e67e22' }]} />
              <Text style={styles.listText}>{item}</Text>
            </View>
          ))}
        </View>
      )}

      {result.improvements && result.improvements.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>💡 Suggestions</Text>
          {result.improvements.map((item, index) => (
            <View key={index} style={styles.listItem}>
              <View style={[styles.bullet, { backgroundColor: Colors.primaryLight }]} />
              <Text style={styles.listText}>{item}</Text>
            </View>
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.surface,
    borderRadius: 20,
    padding: 24,
    marginTop: 16,
    borderWidth: 1,
    borderColor: Colors.borderCard,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.08,
    shadowRadius: 20,
    elevation: 4,
  },
  scoreRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  scoreLabel: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.primaryDark,
  },
  scoreBadge: {
    backgroundColor: Colors.primary,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  scoreText: {
    color: Colors.white,
    fontSize: 18,
    fontWeight: '800',
  },
  summary: {
    fontSize: 15,
    color: Colors.textSecondary,
    lineHeight: 24,
    marginBottom: 16,
  },
  section: {
    marginTop: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.textDark,
    marginBottom: 10,
  },
  listItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  bullet: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.success,
    marginTop: 6,
    marginRight: 12,
  },
  listText: {
    flex: 1,
    fontSize: 14,
    color: Colors.textSecondary,
    lineHeight: 22,
  },
});
