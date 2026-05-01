import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import Colors from '../../constants/Colors';
import { useAuth } from '../../contexts/AuthContext';
import { saveAptitude } from '../../services/api';

const questions = [
  { question: 'What is 25% of 200?', options: ['25', '50', '75', '100'], answer: '50' },
  { question: 'If a train travels 60 km in 1 hour, how far in 3 hours?', options: ['120 km', '180 km', '240 km', '300 km'], answer: '180 km' },
];

export default function AptitudeScreen() {
  const { user } = useAuth();
  const [selected, setSelected] = useState<Record<number, string>>({});
  const [score, setScore] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);

  const submitTest = async () => {
    let total = 0;
    questions.forEach((q, i) => { if (selected[i] === q.answer) total++; });
    try {
      setSaving(true);
      await saveAptitude({ userEmail: user?.email || 'guest@example.com', score: total, total: questions.length });
      setScore(total);
    } catch (err: any) {
      Alert.alert('Error', err.response?.data?.error || 'Failed to save');
    } finally { setSaving(false); }
  };

  return (
    <ScrollView style={s.container} contentContainerStyle={s.content}>
      <View style={s.pill}><Text style={s.pillText}>Quant Skills</Text></View>
      <Text style={s.title}>Aptitude Test</Text>
      <Text style={s.subtitle}>Practice quick aptitude questions for placement readiness.</Text>

      <View style={s.card}>
        {questions.map((q, i) => (
          <View key={i} style={s.questionBlock}>
            <Text style={s.qLabel}>{i + 1}. {q.question}</Text>
            {q.options.map((opt, j) => (
              <TouchableOpacity key={j} style={[s.option, selected[i] === opt && s.optionActive]} onPress={() => setSelected({ ...selected, [i]: opt })}>
                <View style={[s.radio, selected[i] === opt && s.radioActive]} />
                <Text style={[s.optionText, selected[i] === opt && s.optionTextActive]}>{opt}</Text>
              </TouchableOpacity>
            ))}
          </View>
        ))}
        <TouchableOpacity style={[s.btn, saving && { opacity: 0.6 }]} onPress={submitTest} disabled={saving}>
          <Text style={s.btnText}>{saving ? 'Saving...' : 'Submit Test'}</Text>
        </TouchableOpacity>
      </View>

      {score !== null && (
        <View style={s.resultCard}>
          <Text style={s.resultTitle}>Your Score</Text>
          <Text style={s.resultScore}>{score}/{questions.length}</Text>
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
  card: { backgroundColor: Colors.surface, borderRadius: 24, padding: 24, borderWidth: 1, borderColor: Colors.borderCard, marginBottom: 16 },
  questionBlock: { marginBottom: 24 },
  qLabel: { fontSize: 16, fontWeight: '700', color: Colors.primaryDark, marginBottom: 12 },
  option: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: Colors.inputBg, borderRadius: 14, padding: 14,
    borderWidth: 1, borderColor: Colors.borderInput, marginBottom: 8,
  },
  optionActive: { backgroundColor: Colors.pillBg, borderColor: Colors.primary },
  radio: { width: 20, height: 20, borderRadius: 10, borderWidth: 2, borderColor: Colors.textMuted },
  radioActive: { borderColor: Colors.primary, backgroundColor: Colors.primary },
  optionText: { fontSize: 14, color: Colors.textSecondary },
  optionTextActive: { color: Colors.primary, fontWeight: '600' },
  btn: { backgroundColor: Colors.primaryLight, borderRadius: 16, paddingVertical: 16, alignItems: 'center' },
  btnText: { color: Colors.white, fontSize: 16, fontWeight: '700' },
  resultCard: {
    backgroundColor: Colors.surface, borderRadius: 20, padding: 24,
    borderWidth: 1, borderColor: Colors.borderCard, alignItems: 'center',
  },
  resultTitle: { fontSize: 18, fontWeight: '700', color: Colors.primaryDark, marginBottom: 8 },
  resultScore: { fontSize: 36, fontWeight: '800', color: Colors.primary },
});
