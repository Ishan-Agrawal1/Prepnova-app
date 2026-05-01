import React, { useState } from 'react';
import { View, Text, ScrollView, TextInput, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import Colors from '../../constants/Colors';
import { useAuth } from '../../contexts/AuthContext';
import { saveInterview } from '../../services/api';

const questions = [
  'Tell me about yourself.',
  'What are your strengths?',
  'Why do you want this role?',
  'Describe one project you built.',
  'How do you handle pressure?',
];

export default function InterviewScreen() {
  const { user } = useAuth();
  const [answers, setAnswers] = useState(Array(questions.length).fill(''));
  const [submitted, setSubmitted] = useState(false);
  const [feedback, setFeedback] = useState('');
  const [saving, setSaving] = useState(false);

  const handleChange = (index: number, value: string) => {
    const updated = [...answers];
    updated[index] = value;
    setAnswers(updated);
  };

  const handleSubmit = async () => {
    const fb = 'Good start. Your answers should be more structured, confident, and specific. Try adding real project examples, measurable achievements, and clearer introductions.';
    try {
      setSaving(true);
      await saveInterview({
        userEmail: user?.email || 'guest@example.com',
        questions, answers, feedback: fb,
      });
      setFeedback(fb);
      setSubmitted(true);
    } catch (err: any) {
      Alert.alert('Error', err.response?.data?.error || 'Failed to save interview result');
    } finally { setSaving(false); }
  };

  return (
    <ScrollView style={s.container} contentContainerStyle={s.content}>
      <View style={s.pill}><Text style={s.pillText}>Practice & Improve</Text></View>
      <Text style={s.title}>AI Interview Practice</Text>
      <Text style={s.subtitle}>Practice common interview questions and receive coaching feedback.</Text>

      <View style={s.card}>
        {questions.map((q, i) => (
          <View key={i} style={s.questionBlock}>
            <Text style={s.qLabel}>Question {i + 1}</Text>
            <Text style={s.qText}>{q}</Text>
            <TextInput
              style={s.input}
              multiline numberOfLines={4}
              placeholder="Write your answer here..."
              placeholderTextColor={Colors.textMuted}
              value={answers[i]}
              onChangeText={(v) => handleChange(i, v)}
              textAlignVertical="top"
            />
          </View>
        ))}
        <TouchableOpacity style={[s.btn, saving && s.btnOff]} onPress={handleSubmit} disabled={saving}>
          <Text style={s.btnText}>{saving ? 'Saving...' : 'Submit Interview'}</Text>
        </TouchableOpacity>
      </View>

      {submitted && (
        <View style={s.fbCard}>
          <Text style={s.fbTitle}>Interview Feedback</Text>
          <Text style={s.fbText}>{feedback}</Text>
        </View>
      )}
      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  content: { padding: 20 },
  pill: { backgroundColor: Colors.pillBg, alignSelf: 'flex-start', borderRadius: 999, paddingHorizontal: 14, paddingVertical: 6, marginBottom: 14 },
  pillText: { color: Colors.primary, fontWeight: '700', fontSize: 13 },
  title: { fontSize: 26, fontWeight: '800', color: Colors.textHeading, marginBottom: 8 },
  subtitle: { fontSize: 15, color: Colors.textSecondary, lineHeight: 24, marginBottom: 20 },
  card: {
    backgroundColor: Colors.surface, borderRadius: 24, padding: 24,
    borderWidth: 1, borderColor: Colors.borderCard, marginBottom: 16,
  },
  questionBlock: { marginBottom: 24 },
  qLabel: { fontSize: 14, fontWeight: '700', color: Colors.primary, marginBottom: 4 },
  qText: { fontSize: 15, color: Colors.textSecondary, marginBottom: 10 },
  input: {
    backgroundColor: Colors.inputBg, borderRadius: 14, borderWidth: 1, borderColor: Colors.borderInput,
    padding: 14, fontSize: 14, color: Colors.text, minHeight: 100,
  },
  btn: {
    backgroundColor: Colors.primaryLight, borderRadius: 16, paddingVertical: 16, alignItems: 'center',
  },
  btnOff: { opacity: 0.6 },
  btnText: { color: Colors.white, fontSize: 16, fontWeight: '700' },
  fbCard: {
    backgroundColor: Colors.surface, borderRadius: 20, padding: 22,
    borderWidth: 1, borderColor: Colors.borderCard,
  },
  fbTitle: { fontSize: 18, fontWeight: '700', color: Colors.primaryDark, marginBottom: 10 },
  fbText: { fontSize: 14, color: Colors.textSecondary, lineHeight: 24 },
});
