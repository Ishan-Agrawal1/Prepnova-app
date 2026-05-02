import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, TextInput, StyleSheet, Alert, Platform } from 'react-native';
import * as Speech from 'expo-speech';
import Colors from '../../constants/Colors';
import { useAuth } from '../../contexts/AuthContext';
import { saveInterview } from '../../services/api';

// @react-native-voice/voice removed (AndroidX conflict) — text input fallback is used instead
const Voice: any = null;

const questions = [
  'Tell me about yourself.',
  'What are your strengths?',
  'Why do you want this role?',
  'Describe one project you built.',
  'How do you handle pressure?',
];

export default function VoiceCoachScreen() {
  const { user } = useAuth();
  const [current, setCurrent] = useState(0);
  const [answers, setAnswers] = useState(Array(questions.length).fill(''));
  const [transcript, setTranscript] = useState('');
  const [listening, setListening] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [feedback, setFeedback] = useState('');
  const [saving, setSaving] = useState(false);

  // Whether native voice is available
  const voiceAvailable = !!Voice && Platform.OS !== 'web';

  const speakQuestion = () => {
    Speech.speak(questions[current], { language: 'en-US', rate: 1 });
  };

  const startListening = async () => {
    if (!voiceAvailable) {
      Alert.alert('Not Available', 'Voice recognition is not available in this environment. Please type your answer below.');
      return;
    }
    try {
      setListening(true); setTranscript('');
      Voice.onSpeechResults = (e: any) => { setTranscript(e.value?.[0] || ''); };
      Voice.onSpeechEnd = () => setListening(false);
      Voice.onSpeechError = () => { setListening(false); Alert.alert('Error', 'Speech recognition failed'); };
      await Voice.start('en-US');
    } catch { setListening(false); Alert.alert('Error', 'Could not start voice recognition'); }
  };

  const saveAnswer = () => {
    if (!transcript.trim()) { Alert.alert('Error', 'Please enter or speak your answer first'); return; }
    const updated = [...answers]; updated[current] = transcript.trim(); setAnswers(updated);
    Alert.alert('Saved', 'Answer saved');
  };

  const next = () => { if (current < questions.length - 1) { setCurrent(current + 1); setTranscript(answers[current + 1] || ''); } };
  const prev = () => { if (current > 0) { setCurrent(current - 1); setTranscript(answers[current - 1] || ''); } };

  const generateFb = () => {
    const combined = answers.join(' ').toLowerCase();
    let score = 75; const tips: string[] = [];
    if (combined.length < 100) { score -= 15; tips.push('Try giving longer, more detailed answers.'); }
    if (!combined.includes('project')) { score -= 10; tips.push('Mention real projects or practical work.'); }
    if (!combined.includes('team') && !combined.includes('collaboration')) { score -= 5; tips.push('Include teamwork examples.'); }
    if (tips.length === 0) tips.push('Good job. Keep improving confidence and clarity.');
    return { score: Math.max(40, score), text: tips.join(' ') };
  };

  const handleSubmit = async () => {
    const valid = answers.filter(a => a.trim()); if (valid.length === 0) { Alert.alert('Error', 'Answer at least one question'); return; }
    const fb = generateFb();
    try { setSaving(true);
      await saveInterview({ userEmail: user?.email || 'guest@example.com', questions, answers, feedback: fb.text, score: fb.score, mode: voiceAvailable ? 'voice' : 'text' });
      setFeedback(`Score: ${fb.score}/100. ${fb.text}`); setSubmitted(true);
    } catch (err: any) { Alert.alert('Error', err.message || 'Failed to save'); }
    finally { setSaving(false); }
  };

  return (
    <ScrollView style={s.container} contentContainerStyle={s.content}>
      <Text style={s.title}>AI Voice Coach</Text>
      <Text style={s.subtitle}>Practice interview speaking with voice or text input.</Text>

      <View style={s.card}>
        <View style={s.badge}><Text style={s.badgeText}>Question {current + 1} of {questions.length}</Text></View>
        <Text style={s.question}>{questions[current]}</Text>

        <View style={s.controls}>
          <TouchableOpacity style={s.ctrlBtn} onPress={speakQuestion}><Text style={s.ctrlText}>🔊 Hear</Text></TouchableOpacity>
          {voiceAvailable && (
            <TouchableOpacity style={s.ctrlBtn} onPress={startListening}>
              <Text style={s.ctrlText}>{listening ? '🎤 Listening...' : '🎤 Speak'}</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity style={s.ctrlBtnOutline} onPress={saveAnswer}><Text style={s.ctrlTextOutline}>Save</Text></TouchableOpacity>
        </View>

        {/* Text input fallback — always visible for typing answers */}
        <View style={s.transcriptBox}>
          <Text style={s.transcriptLabel}>
            {voiceAvailable ? 'Live Transcript / Edit' : 'Type Your Answer'}
          </Text>
          <TextInput
            style={s.transcriptInput}
            multiline
            numberOfLines={4}
            placeholder={voiceAvailable ? 'Your spoken answer will appear here (or type)...' : 'Type your answer here...'}
            placeholderTextColor={Colors.textMuted}
            value={transcript}
            onChangeText={setTranscript}
            textAlignVertical="top"
          />
        </View>

        <View style={s.navRow}>
          <TouchableOpacity style={[s.navBtn, current === 0 && s.navOff]} onPress={prev} disabled={current === 0}>
            <Text style={s.navText}>← Previous</Text></TouchableOpacity>
          <TouchableOpacity style={[s.navBtn, current === questions.length - 1 && s.navOff]} onPress={next} disabled={current === questions.length - 1}>
            <Text style={s.navText}>Next →</Text></TouchableOpacity>
        </View>
      </View>

      <View style={s.card}>
        <Text style={s.savedTitle}>Saved Answers</Text>
        {answers.every(a => !a.trim()) ? <Text style={s.emptyText}>No answers saved yet.</Text> :
          answers.map((a, i) => (
            <View key={i} style={s.answerItem}>
              <Text style={s.answerQ}>Q{i + 1}. {questions[i]}</Text>
              <Text style={s.answerA}>{a || 'Not answered yet.'}</Text>
            </View>
          ))}
        <TouchableOpacity style={[s.submitBtn, saving && { opacity: 0.6 }]} onPress={handleSubmit} disabled={saving}>
          <Text style={s.submitText}>{saving ? 'Saving...' : 'Submit Voice Interview'}</Text>
        </TouchableOpacity>
      </View>

      {submitted && <View style={s.fbCard}><Text style={s.fbTitle}>Feedback</Text><Text style={s.fbText}>{feedback}</Text></View>}
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
  badge: { backgroundColor: Colors.pillBg, alignSelf: 'flex-start', borderRadius: 999, paddingHorizontal: 12, paddingVertical: 4, marginBottom: 14 },
  badgeText: { color: Colors.primary, fontWeight: '700', fontSize: 13 },
  question: { fontSize: 20, fontWeight: '700', color: Colors.textDark, marginBottom: 18, lineHeight: 28 },
  controls: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 16 },
  ctrlBtn: { backgroundColor: Colors.primaryLight, borderRadius: 14, paddingHorizontal: 18, paddingVertical: 12 },
  ctrlText: { color: Colors.white, fontWeight: '700', fontSize: 14 },
  ctrlBtnOutline: { borderWidth: 1, borderColor: Colors.primaryLight, borderRadius: 14, paddingHorizontal: 18, paddingVertical: 12 },
  ctrlTextOutline: { color: Colors.primaryLight, fontWeight: '700', fontSize: 14 },
  transcriptBox: { backgroundColor: Colors.inputBg, borderRadius: 18, padding: 18, borderWidth: 1, borderColor: Colors.borderInput, minHeight: 100 },
  transcriptLabel: { fontSize: 14, fontWeight: '700', color: Colors.primaryDark, marginBottom: 8 },
  transcriptInput: { fontSize: 14, color: Colors.text, lineHeight: 22, minHeight: 80 },
  navRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 16 },
  navBtn: { borderWidth: 1, borderColor: Colors.primaryLight, borderRadius: 12, paddingHorizontal: 20, paddingVertical: 10 },
  navOff: { opacity: 0.4 },
  navText: { color: Colors.primaryLight, fontWeight: '600', fontSize: 14 },
  savedTitle: { fontSize: 18, fontWeight: '700', color: Colors.textDark, marginBottom: 14 },
  emptyText: { color: Colors.textMuted, fontSize: 14 },
  answerItem: { backgroundColor: Colors.inputBg, borderRadius: 14, padding: 14, marginBottom: 10, borderWidth: 1, borderColor: Colors.borderInput },
  answerQ: { fontSize: 13, fontWeight: '700', color: Colors.primaryDark, marginBottom: 4 },
  answerA: { fontSize: 13, color: Colors.textSecondary, lineHeight: 20 },
  submitBtn: { backgroundColor: Colors.primaryLight, borderRadius: 16, paddingVertical: 16, alignItems: 'center', marginTop: 12 },
  submitText: { color: Colors.white, fontSize: 16, fontWeight: '700' },
  fbCard: { backgroundColor: Colors.surface, borderRadius: 20, padding: 22, borderWidth: 1, borderColor: Colors.borderCard },
  fbTitle: { fontSize: 18, fontWeight: '700', color: Colors.primaryDark, marginBottom: 10 },
  fbText: { fontSize: 14, color: Colors.textSecondary, lineHeight: 24 },
});
