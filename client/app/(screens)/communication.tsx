import React, { useState } from 'react';
import { View, Text, ScrollView, TextInput, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import * as Speech from 'expo-speech';
import Colors from '../../constants/Colors';

const commQuestions = [
  'Tell me about a technical challenge you solved.',
  'How do you explain a complex idea to a non-technical person?',
  'Describe a time when you worked on a team project.',
  'What is your process for receiving feedback?',
  'Why is communication important in engineering?',
];

const modelAnswers = [
  'I faced a bug in a production API that caused intermittent failures. I reproduced it locally, identified the data race, refactored the async flow and added tests. Stability improved by 30%.',
  'I use a simple analogy and focus on outcomes. For example, comparing software architecture to a transit system: components are stations, data is passengers.',
  'I coordinated with designers and backend developers to launch a new feature. I clarified expectations, shared progress daily, and helped resolve blockers.',
  'I start by listening, ask clarifying questions, and thank the person. Then I reflect, identify improvements, and follow up with actions.',
  'Clear communication keeps teams aligned, avoids misunderstandings, and helps everyone move faster. It ensures tradeoffs are explained to stakeholders.',
];

export default function CommunicationScreen() {
  const [mode, setMode] = useState<'comm' | 'company'>('comm');
  const [started, setStarted] = useState(false);
  const [current, setCurrent] = useState(0);
  const [answers, setAnswers] = useState(Array(commQuestions.length).fill(''));
  const [text, setText] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [feedback, setFeedback] = useState('');
  const [details, setDetails] = useState<any[]>([]);
  const [comparison, setComparison] = useState<any>(null);

  const questions = commQuestions;

  const speakQuestion = () => Speech.speak(questions[current], { language: 'en-US' });

  const saveAnswer = () => {
    if (!text.trim()) { Alert.alert('Error', 'Type your answer first'); return; }
    const upd = [...answers]; upd[current] = text.trim(); setAnswers(upd); setText('');
    Alert.alert('Saved');
  };

  const goTo = (i: number) => { setCurrent(i); setText(answers[i] || ''); setComparison(null); };
  const next = () => { if (current < questions.length - 1) goTo(current + 1); };
  const prev = () => { if (current > 0) goTo(current - 1); };

  const analyze = (answer: string, idx: number) => {
    const lower = (answer || '').toLowerCase();
    let score = 70;
    const pos: string[] = [], imp: string[] = [];
    if (!answer.trim()) { return { score: 30, answer: 'No answer', model: modelAnswers[idx], positives: [], improvements: ['Answer this question.'] }; }
    if (answer.length >= 120) { score += 10; pos.push('Good detail.'); } else imp.push('Expand with more context.');
    if (lower.includes('i think') || lower.includes('maybe')) imp.push('Use confident language.');
    if (pos.length === 0) pos.push('Keep practicing.');
    return { score: Math.min(100, Math.max(30, score)), answer, model: modelAnswers[idx], positives: pos, improvements: imp };
  };

  const compareAnswer = () => setComparison(analyze(answers[current] || '', current));

  const submitAll = () => {
    const results = answers.map((a, i) => analyze(a, i));
    const avg = Math.round(results.reduce((s, r) => s + r.score, 0) / results.length);
    setFeedback(`Overall score: ${avg}/100. Focus on clarity and concrete examples.`);
    setDetails(results);
    setSubmitted(true);
  };

  if (!started) {
    return (
      <ScrollView style={s.container} contentContainerStyle={s.content}>
        <Text style={s.title}>Interview Practice</Text>
        <Text style={s.subtitle}>Choose a mode and start practicing with real-style questions.</Text>
        <View style={s.card}>
          <View style={s.modeRow}>
            <TouchableOpacity style={[s.modeBtn, mode === 'comm' && s.modeBtnActive]} onPress={() => setMode('comm')}>
              <Text style={[s.modeText, mode === 'comm' && s.modeTextActive]}>Communication</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[s.modeBtn, mode === 'company' && s.modeBtnActive]} onPress={() => setMode('company')}>
              <Text style={[s.modeText, mode === 'company' && s.modeTextActive]}>Company Aptitude</Text>
            </TouchableOpacity>
          </View>
          <Text style={s.infoText}>Mode: {mode === 'comm' ? 'Communication' : 'Company Aptitude'} • Questions: {questions.length}</Text>
          <TouchableOpacity style={s.startBtn} onPress={() => { setStarted(true); setAnswers(Array(questions.length).fill('')); }}>
            <Text style={s.startBtnText}>Start Practice</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    );
  }

  return (
    <ScrollView style={s.container} contentContainerStyle={s.content}>
      <View style={s.card}>
        <View style={s.badge}><Text style={s.badgeText}>Q{current + 1}/{questions.length}</Text></View>
        <Text style={s.question}>{questions[current]}</Text>

        <TextInput style={s.input} multiline placeholder="Type your response..." placeholderTextColor={Colors.textMuted} value={text} onChangeText={setText} textAlignVertical="top" />

        <View style={s.controls}>
          <TouchableOpacity style={s.ctrlBtn} onPress={saveAnswer}><Text style={s.ctrlText}>Save</Text></TouchableOpacity>
          <TouchableOpacity style={s.ctrlBtn} onPress={speakQuestion}><Text style={s.ctrlText}>🔊 Read</Text></TouchableOpacity>
          <TouchableOpacity style={s.ctrlBtnO} onPress={compareAnswer}><Text style={s.ctrlTextO}>Compare</Text></TouchableOpacity>
        </View>

        <View style={s.navRow}>
          <TouchableOpacity style={[s.navBtn, current === 0 && { opacity: 0.4 }]} onPress={prev} disabled={current === 0}>
            <Text style={s.navText}>← Prev</Text></TouchableOpacity>
          <TouchableOpacity style={[s.navBtn, current === questions.length - 1 && { opacity: 0.4 }]} onPress={next} disabled={current === questions.length - 1}>
            <Text style={s.navText}>Next →</Text></TouchableOpacity>
        </View>
      </View>

      {comparison && (
        <View style={s.card}>
          <Text style={s.secTitle}>Comparison</Text>
          <Text style={s.label}>Your answer:</Text><Text style={s.body}>{comparison.answer}</Text>
          <Text style={s.label}>Model answer:</Text><Text style={s.body}>{comparison.model}</Text>
          <Text style={s.label}>Score: {comparison.score}/100</Text>
          <Text style={s.label}>Suggestions: {comparison.improvements.join(' ') || 'Great!'}</Text>
        </View>
      )}

      <View style={s.card}>
        <Text style={s.secTitle}>Progress</Text>
        {answers.map((a, i) => (
          <TouchableOpacity key={i} style={s.progressItem} onPress={() => goTo(i)}>
            <Text style={a ? s.progressFilled : s.progressEmpty}>Q{i + 1}: {a ? 'Saved' : 'Not answered'}</Text>
          </TouchableOpacity>
        ))}
        <TouchableOpacity style={s.submitBtn} onPress={submitAll}>
          <Text style={s.submitText}>Submit for Feedback</Text>
        </TouchableOpacity>
      </View>

      {submitted && (
        <View style={s.card}>
          <Text style={s.secTitle}>Feedback</Text>
          <Text style={s.body}>{feedback}</Text>
          {details.map((d, i) => (
            <View key={i} style={s.fbItem}>
              <Text style={s.fbQ}>Q{i + 1} — Score: {d.score}/100</Text>
              <Text style={s.fbBody}>✅ {d.positives.join(' ')}</Text>
              <Text style={s.fbBody}>💡 {d.improvements.join(' ')}</Text>
            </View>
          ))}
        </View>
      )}
      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  content: { padding: 20 },
  title: { fontSize: 26, fontWeight: '800', color: Colors.textHeading, marginBottom: 6 },
  subtitle: { fontSize: 15, color: Colors.textSecondary, marginBottom: 20 },
  card: { backgroundColor: Colors.surface, borderRadius: 24, padding: 22, borderWidth: 1, borderColor: Colors.borderCard, marginBottom: 16 },
  modeRow: { flexDirection: 'row', gap: 10, marginBottom: 16 },
  modeBtn: { flex: 1, borderRadius: 14, paddingVertical: 14, alignItems: 'center', backgroundColor: Colors.inputBg, borderWidth: 1, borderColor: Colors.borderInput },
  modeBtnActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  modeText: { fontWeight: '700', color: Colors.textSecondary, fontSize: 13 },
  modeTextActive: { color: Colors.white },
  infoText: { fontSize: 13, color: Colors.textMuted, marginBottom: 16, textAlign: 'center' },
  startBtn: { backgroundColor: Colors.primaryLight, borderRadius: 16, paddingVertical: 16, alignItems: 'center' },
  startBtnText: { color: Colors.white, fontSize: 16, fontWeight: '700' },
  badge: { backgroundColor: Colors.pillBg, alignSelf: 'flex-start', borderRadius: 999, paddingHorizontal: 12, paddingVertical: 4, marginBottom: 12 },
  badgeText: { color: Colors.primary, fontWeight: '700', fontSize: 13 },
  question: { fontSize: 18, fontWeight: '700', color: Colors.textDark, marginBottom: 16, lineHeight: 26 },
  input: { backgroundColor: Colors.inputBg, borderRadius: 14, borderWidth: 1, borderColor: Colors.borderInput, padding: 14, fontSize: 14, color: Colors.text, minHeight: 120, marginBottom: 14 },
  controls: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 14 },
  ctrlBtn: { backgroundColor: Colors.primaryLight, borderRadius: 12, paddingHorizontal: 18, paddingVertical: 10 },
  ctrlText: { color: Colors.white, fontWeight: '700', fontSize: 13 },
  ctrlBtnO: { borderWidth: 1, borderColor: Colors.primaryLight, borderRadius: 12, paddingHorizontal: 18, paddingVertical: 10 },
  ctrlTextO: { color: Colors.primaryLight, fontWeight: '700', fontSize: 13 },
  navRow: { flexDirection: 'row', justifyContent: 'space-between' },
  navBtn: { borderWidth: 1, borderColor: Colors.primaryLight, borderRadius: 12, paddingHorizontal: 20, paddingVertical: 10 },
  navText: { color: Colors.primaryLight, fontWeight: '600', fontSize: 14 },
  secTitle: { fontSize: 17, fontWeight: '700', color: Colors.primaryDark, marginBottom: 12 },
  label: { fontSize: 13, fontWeight: '700', color: Colors.textDark, marginTop: 8 },
  body: { fontSize: 13, color: Colors.textSecondary, lineHeight: 20, marginBottom: 4 },
  progressItem: { paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: Colors.borderInput },
  progressFilled: { color: Colors.primary, fontWeight: '600', fontSize: 13 },
  progressEmpty: { color: Colors.textMuted, fontSize: 13 },
  submitBtn: { backgroundColor: Colors.primaryLight, borderRadius: 16, paddingVertical: 16, alignItems: 'center', marginTop: 16 },
  submitText: { color: Colors.white, fontSize: 16, fontWeight: '700' },
  fbItem: { backgroundColor: Colors.inputBg, borderRadius: 14, padding: 14, marginTop: 10, borderWidth: 1, borderColor: Colors.borderInput },
  fbQ: { fontSize: 14, fontWeight: '700', color: Colors.primaryDark, marginBottom: 6 },
  fbBody: { fontSize: 13, color: Colors.textSecondary, lineHeight: 20 },
});
