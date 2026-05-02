import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, TextInput, StyleSheet, Alert } from 'react-native';
import * as Speech from 'expo-speech';
import { Ionicons } from '@expo/vector-icons';
import Colors from '../../constants/Colors';
import { useAuth } from '../../contexts/AuthContext';
import { saveInterview } from '../../services/api';

const questions = [
  'Tell me about your background and experience.',
  'What are your key strengths?',
  'Describe a technical challenge you overcame.',
  'How do you handle feedback?',
  'Where do you see yourself in 5 years?',
];

export default function VRInterviewScreen() {
  const { user } = useAuth();
  const [started, setStarted] = useState(false);
  const [current, setCurrent] = useState(0);
  const [speaking, setSpeaking] = useState(false);
  const [answers, setAnswers] = useState(Array(questions.length).fill(''));
  const [submitted, setSubmitted] = useState(false);
  const [feedback, setFeedback] = useState<{ score: number; tips: string } | null>(null);
  const [saving, setSaving] = useState(false);

  const speak = () => {
    setSpeaking(true);
    Speech.speak(questions[current], {
      language: 'en-US',
      rate: 1,
      onDone: () => setSpeaking(false),
      onError: () => setSpeaking(false),
    });
  };

  const next = () => {
    if (current < questions.length - 1) {
      setCurrent(current + 1);
      setTimeout(() => {
        Speech.speak(questions[current + 1], {
          language: 'en-US',
          onStart: () => setSpeaking(true),
          onDone: () => setSpeaking(false),
        });
      }, 500);
    }
  };

  const prev = () => {
    if (current > 0) setCurrent(current - 1);
  };

  const handleAnswerChange = (text: string) => {
    const updated = [...answers];
    updated[current] = text;
    setAnswers(updated);
  };

  const generateAnalysis = () => {
    const combined = answers.join(' ').toLowerCase();
    const answered = answers.filter(a => a.trim().length > 0).length;
    let score = 60;
    const tips: string[] = [];

    // Score based on how many questions answered
    score += (answered / questions.length) * 15;

    // Depth of answers
    const avgLength = combined.length / Math.max(answered, 1);
    if (avgLength > 80) { score += 10; } else { tips.push('Give more detailed, longer responses to show depth.'); }

    // Keywords check
    if (combined.includes('project') || combined.includes('built') || combined.includes('developed')) {
      score += 5;
    } else { tips.push('Mention specific projects or things you built.'); }

    if (combined.includes('team') || combined.includes('collaborated') || combined.includes('together')) {
      score += 5;
    } else { tips.push('Highlight teamwork and collaboration experiences.'); }

    if (combined.includes('result') || combined.includes('impact') || combined.includes('achieved') || combined.includes('improved')) {
      score += 5;
    } else { tips.push('Quantify your achievements — mention results and impact.'); }

    if (combined.includes('learn') || combined.includes('growth') || combined.includes('improve')) {
      score += 3;
    } else { tips.push('Show a growth mindset — mention what you learned.'); }

    if (tips.length === 0) tips.push('Excellent responses! Keep practicing for even more confidence.');

    return { score: Math.min(100, Math.round(score)), tips: tips.join(' ') };
  };

  const handleSubmit = async () => {
    const valid = answers.filter(a => a.trim());
    if (valid.length === 0) {
      Alert.alert('Error', 'Please answer at least one question before submitting.');
      return;
    }

    const analysis = generateAnalysis();
    try {
      setSaving(true);
      await saveInterview({
        userEmail: user?.email || 'guest@example.com',
        questions,
        answers,
        feedback: `Score: ${analysis.score}/100. ${analysis.tips}`,
        score: analysis.score,
        mode: 'text',
      });
      setFeedback(analysis);
      setSubmitted(true);
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  if (!started) {
    return (
      <View style={s.introContainer}>
        <View style={s.introCard}>
          <View style={s.avatarCircle}>
            <Ionicons name="glasses" size={48} color={Colors.white} />
          </View>
          <Text style={s.introTitle}>VR Interview Experience</Text>
          <Text style={s.introSubtitle}>
            Experience an immersive interview with an AI interviewer. Listen to questions, type your responses, and receive a detailed analysis.
          </Text>

          <View style={s.featureList}>
            {['AI interviewer reads questions aloud', 'Type your responses naturally', 'Get scored & analyzed after submission', 'Build confidence for real interviews'].map((f, i) => (
              <View key={i} style={s.featureRow}>
                <Ionicons name="checkmark-circle" size={18} color={Colors.success} />
                <Text style={s.featureText}>{f}</Text>
              </View>
            ))}
          </View>

          <TouchableOpacity style={s.startBtn} onPress={() => { setStarted(true); setTimeout(speak, 500); }} activeOpacity={0.8}>
            <Ionicons name="play" size={22} color={Colors.white} />
            <Text style={s.startBtnText}>Start Interview</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <ScrollView style={s.container} contentContainerStyle={s.content}>
      {/* Interviewer Visual */}
      <View style={s.interviewerCard}>
        <View style={s.interviewerAvatar}>
          <View style={s.head}>
            <View style={s.eyeRow}>
              <View style={s.eye}><View style={s.pupil} /></View>
              <View style={s.eye}><View style={s.pupil} /></View>
            </View>
            <View style={s.mouth} />
          </View>
          <View style={s.body} />
        </View>
        <Text style={s.interviewerStatus}>
          {speaking ? '🎙️ Interviewer is speaking...' : '👤 Interviewer is ready'}
        </Text>
      </View>

      {/* Question Panel */}
      <View style={s.questionCard}>
        <View style={s.qBadge}>
          <Text style={s.qBadgeText}>Question {current + 1} / {questions.length}</Text>
        </View>
        <Text style={s.questionText}>{questions[current]}</Text>

        <View style={s.controls}>
          <TouchableOpacity style={[s.ctrlBtn, speaking && { opacity: 0.5 }]} onPress={speak} disabled={speaking}>
            <Ionicons name="volume-high" size={18} color={Colors.white} />
            <Text style={s.ctrlText}>{speaking ? 'Speaking...' : 'Read Question'}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[s.ctrlBtn, speaking && { opacity: 0.5 }]} onPress={speak} disabled={speaking}>
            <Ionicons name="refresh" size={18} color={Colors.white} />
            <Text style={s.ctrlText}>Repeat</Text>
          </TouchableOpacity>
        </View>

        {/* Answer Input */}
        <View style={s.answerBox}>
          <Text style={s.answerLabel}>Your Response</Text>
          <TextInput
            style={s.answerInput}
            multiline
            numberOfLines={5}
            placeholder="Type your answer here..."
            placeholderTextColor={Colors.textMuted}
            value={answers[current]}
            onChangeText={handleAnswerChange}
            textAlignVertical="top"
          />
        </View>

        {/* Progress dots */}
        <View style={s.progressRow}>
          {questions.map((_, i) => (
            <View key={i} style={[s.progressDot, answers[i]?.trim() ? s.progressDotFilled : null, current === i && s.progressDotCurrent]} />
          ))}
        </View>

        <View style={s.navRow}>
          <TouchableOpacity style={[s.navBtn, current === 0 && { opacity: 0.4 }]} onPress={prev} disabled={current === 0}>
            <Text style={s.navText}>← Previous</Text>
          </TouchableOpacity>
          {current < questions.length - 1 ? (
            <TouchableOpacity style={s.navBtn} onPress={next}>
              <Text style={s.navText}>Next →</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={[s.submitBtn, saving && { opacity: 0.6 }]}
              onPress={handleSubmit}
              disabled={saving}
            >
              <Text style={s.submitText}>{saving ? 'Analyzing...' : '✅ Submit & Analyze'}</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Analysis Result */}
      {submitted && feedback && (
        <View style={s.analysisCard}>
          <Text style={s.analysisTitle}>📊 Interview Analysis</Text>
          <View style={s.scoreCircle}>
            <Text style={s.scoreValue}>{feedback.score}</Text>
            <Text style={s.scoreLabel}>/100</Text>
          </View>
          <Text style={s.analysisGrade}>
            {feedback.score >= 85 ? '🌟 Excellent' : feedback.score >= 70 ? '👍 Good' : feedback.score >= 55 ? '📈 Fair' : '💪 Keep Practicing'}
          </Text>
          <View style={s.analysisDivider} />
          <Text style={s.analysisFeedback}>{feedback.tips}</Text>
        </View>
      )}

      {/* Tips */}
      <View style={s.tipsCard}>
        <Text style={s.tipsTitle}>Interview Tips</Text>
        {['Maintain eye contact with the camera', 'Speak clearly and at a natural pace', 'Structure answers: Situation → Action → Result', 'Show enthusiasm and genuine interest'].map((t, i) => (
          <View key={i} style={s.tipRow}>
            <View style={s.tipDot} />
            <Text style={s.tipText}>{t}</Text>
          </View>
        ))}
      </View>
      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

const s = StyleSheet.create({
  introContainer: { flex: 1, backgroundColor: Colors.background, justifyContent: 'center', padding: 24 },
  introCard: {
    backgroundColor: Colors.surface, borderRadius: 28, padding: 32, alignItems: 'center',
    borderWidth: 1, borderColor: Colors.borderCard,
    shadowColor: Colors.primary, shadowOffset: { width: 0, height: 16 }, shadowOpacity: 0.1, shadowRadius: 32, elevation: 8,
  },
  avatarCircle: {
    width: 100, height: 100, borderRadius: 50, backgroundColor: '#E91E63',
    alignItems: 'center', justifyContent: 'center', marginBottom: 20,
    shadowColor: '#E91E63', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.3, shadowRadius: 16, elevation: 8,
  },
  introTitle: { fontSize: 24, fontWeight: '800', color: Colors.textDark, marginBottom: 10, textAlign: 'center' },
  introSubtitle: { fontSize: 15, color: Colors.textSecondary, textAlign: 'center', lineHeight: 24, marginBottom: 24 },
  featureList: { alignSelf: 'stretch', marginBottom: 24 },
  featureRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 10 },
  featureText: { fontSize: 14, color: Colors.textSecondary },
  startBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: '#E91E63', borderRadius: 18, paddingVertical: 18, paddingHorizontal: 36,
    shadowColor: '#E91E63', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.3, shadowRadius: 12, elevation: 6,
  },
  startBtnText: { color: Colors.white, fontSize: 17, fontWeight: '700' },

  container: { flex: 1, backgroundColor: Colors.background },
  content: { padding: 20 },

  interviewerCard: {
    backgroundColor: '#1a1f36', borderRadius: 24, padding: 32, alignItems: 'center', marginBottom: 16,
    shadowColor: '#000', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.2, shadowRadius: 16, elevation: 6,
  },
  interviewerAvatar: { alignItems: 'center', marginBottom: 16 },
  head: {
    width: 64, height: 64, borderRadius: 32, backgroundColor: '#d4a574',
    alignItems: 'center', justifyContent: 'center', marginBottom: 4,
  },
  eyeRow: { flexDirection: 'row', gap: 14, marginBottom: 6 },
  eye: { width: 10, height: 10, borderRadius: 5, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center' },
  pupil: { width: 4, height: 4, borderRadius: 2, backgroundColor: '#1a1a1a' },
  mouth: { width: 16, height: 3, borderRadius: 2, backgroundColor: '#c4756e' },
  body: { width: 50, height: 40, borderRadius: 8, backgroundColor: '#1e3a6e', marginTop: 2 },
  interviewerStatus: { color: '#8899bb', fontSize: 14, fontWeight: '600' },

  questionCard: {
    backgroundColor: Colors.surface, borderRadius: 24, padding: 24,
    borderWidth: 1, borderColor: Colors.borderCard, marginBottom: 16,
  },
  qBadge: { backgroundColor: Colors.pillBg, alignSelf: 'flex-start', borderRadius: 999, paddingHorizontal: 12, paddingVertical: 4, marginBottom: 14 },
  qBadgeText: { color: Colors.primary, fontWeight: '700', fontSize: 13 },
  questionText: { fontSize: 20, fontWeight: '700', color: Colors.textDark, lineHeight: 30, marginBottom: 20 },
  controls: { flexDirection: 'row', gap: 10, marginBottom: 16 },
  ctrlBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: Colors.primaryLight, borderRadius: 14, paddingHorizontal: 18, paddingVertical: 12,
  },
  ctrlText: { color: Colors.white, fontWeight: '700', fontSize: 14 },

  answerBox: { backgroundColor: Colors.inputBg, borderRadius: 18, padding: 18, borderWidth: 1, borderColor: Colors.borderInput, marginBottom: 16 },
  answerLabel: { fontSize: 14, fontWeight: '700', color: Colors.primaryDark, marginBottom: 8 },
  answerInput: { fontSize: 14, color: Colors.text, lineHeight: 22, minHeight: 100 },

  progressRow: { flexDirection: 'row', justifyContent: 'center', gap: 8, marginBottom: 16 },
  progressDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: Colors.borderInput },
  progressDotFilled: { backgroundColor: Colors.success },
  progressDotCurrent: { borderWidth: 2, borderColor: Colors.primary, width: 14, height: 14, borderRadius: 7 },

  navRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  navBtn: { borderWidth: 1, borderColor: Colors.primaryLight, borderRadius: 12, paddingHorizontal: 20, paddingVertical: 10 },
  navText: { color: Colors.primaryLight, fontWeight: '600', fontSize: 14 },
  submitBtn: { backgroundColor: Colors.primaryLight, borderRadius: 14, paddingHorizontal: 24, paddingVertical: 12 },
  submitText: { color: Colors.white, fontWeight: '700', fontSize: 14 },

  analysisCard: {
    backgroundColor: Colors.surface, borderRadius: 24, padding: 28, alignItems: 'center',
    borderWidth: 1, borderColor: Colors.borderCard, marginBottom: 16,
    shadowColor: Colors.primary, shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.1, shadowRadius: 16, elevation: 4,
  },
  analysisTitle: { fontSize: 20, fontWeight: '800', color: Colors.textDark, marginBottom: 18 },
  scoreCircle: {
    flexDirection: 'row', alignItems: 'baseline', justifyContent: 'center', marginBottom: 8,
  },
  scoreValue: { fontSize: 52, fontWeight: '800', color: Colors.primary },
  scoreLabel: { fontSize: 20, fontWeight: '600', color: Colors.textMuted, marginLeft: 2 },
  analysisGrade: { fontSize: 18, fontWeight: '700', color: Colors.primaryDark, marginBottom: 16 },
  analysisDivider: { width: '80%', height: 1, backgroundColor: Colors.borderCard, marginBottom: 16 },
  analysisFeedback: { fontSize: 14, color: Colors.textSecondary, lineHeight: 24, textAlign: 'center' },

  tipsCard: {
    backgroundColor: Colors.surface, borderRadius: 20, padding: 22,
    borderWidth: 1, borderColor: Colors.borderCard,
  },
  tipsTitle: { fontSize: 17, fontWeight: '700', color: Colors.primaryDark, marginBottom: 14 },
  tipRow: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 10 },
  tipDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#E91E63', marginTop: 6, marginRight: 10 },
  tipText: { flex: 1, fontSize: 14, color: Colors.textSecondary, lineHeight: 22 },
});
