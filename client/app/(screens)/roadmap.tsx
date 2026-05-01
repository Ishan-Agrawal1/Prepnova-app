import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, ScrollView, TextInput, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Colors from '../../constants/Colors';
import { useAuth } from '../../contexts/AuthContext';
import { fetchAptitude, fetchCoding, fetchAnalysesByEmail } from '../../services/api';

const DAY_MS = 86400000;

export default function RoadmapScreen() {
  const { user } = useAuth();
  const email = user?.email || '';
  const [examDate, setExamDate] = useState('');
  const [coverage, setCoverage] = useState(60);
  const [weakTopic, setWeakTopic] = useState('Quantitative Reasoning');
  const [aptRec, setAptRec] = useState<any[]>([]);
  const [codRec, setCodRec] = useState<any[]>([]);
  const [resRec, setResRec] = useState<any[]>([]);
  const [streak, setStreak] = useState(0);
  const [missed, setMissed] = useState(0);
  const [planMsg, setPlanMsg] = useState('');
  const [tomorrowPlan, setTomorrowPlan] = useState('');
  const [todayOutcome, setTodayOutcome] = useState('review');

  useEffect(() => { loadState(); if (email) fetchData(); }, [email]);

  const loadState = async () => {
    try {
      const s = await AsyncStorage.getItem('studyPlannerState');
      if (s) {
        const p = JSON.parse(s);
        if (p.examDate) setExamDate(p.examDate);
        if (p.coverage) setCoverage(p.coverage);
        if (p.weakTopic) setWeakTopic(p.weakTopic);
        if (p.planMsg) setPlanMsg(p.planMsg);
        if (p.tomorrowPlan) setTomorrowPlan(p.tomorrowPlan);
      }
      const sk = await AsyncStorage.getItem('studyStreak'); if (sk) setStreak(+sk);
      const ms = await AsyncStorage.getItem('studyMissed'); if (ms) setMissed(+ms);
    } catch {}
  };

  const saveState = async () => {
    await AsyncStorage.setItem('studyPlannerState', JSON.stringify({ examDate, coverage, weakTopic, planMsg, tomorrowPlan }));
    await AsyncStorage.setItem('studyStreak', streak.toString());
    await AsyncStorage.setItem('studyMissed', missed.toString());
  };

  useEffect(() => { saveState(); }, [examDate, coverage, weakTopic, planMsg, tomorrowPlan, streak, missed]);

  const fetchData = async () => {
    try {
      const [a, c, r] = await Promise.all([
        fetchAptitude(email).catch(() => []),
        fetchCoding(email).catch(() => []),
        fetchAnalysesByEmail(email).catch(() => []),
      ]);
      setAptRec(a); setCodRec(c); setResRec(r);
    } catch {}
  };

  const perf = useMemo(() => {
    const apt = aptRec.length ? Math.round(aptRec.reduce((s, i) => s + (i.score / Math.max(i.total, 1)) * 100, 0) / aptRec.length) : null;
    const cod = codRec.length ? Math.min(100, Math.round((codRec.filter(i => i.feedback?.toLowerCase().includes('well')).length / codRec.length) * 100)) : null;
    const res = resRec.length ? resRec[0].score : null;
    return { apt, cod, res };
  }, [aptRec, codRec, resRec]);

  const daysLeft = useMemo(() => {
    if (!examDate) return null;
    return Math.max(0, Math.ceil((new Date(examDate).setHours(0,0,0,0) - new Date().setHours(0,0,0,0)) / DAY_MS));
  }, [examDate]);

  const generatePlan = () => {
    setPlanMsg(`Plan ready! Focused on ${weakTopic}. Planner updates automatically.`);
    setTomorrowPlan(`Tomorrow: 30 min ${weakTopic} revision, one quiz, strategy review.`);
  };

  const adjustTomorrow = () => {
    setTomorrowPlan(todayOutcome === 'improved'
      ? `Tomorrow: Keep momentum with a ${weakTopic} quiz and strength review.`
      : `Tomorrow: Shift to ${weakTopic} concept review, add easy quiz, reduce volume.`);
  };

  const logSession = (done: boolean) => {
    if (done) { setStreak(s => s + 1); setMissed(s => Math.max(0, s - 1)); }
    else { setMissed(s => s + 1); setStreak(0); }
  };

  const topics = ['Quantitative Reasoning', 'Algebra', 'Probability', 'Verbal Ability', 'Coding Concepts'];

  return (
    <ScrollView style={s.container} contentContainerStyle={s.content}>
      <Text style={s.title}>AI Study Planner</Text>
      <Text style={s.subtitle}>Auto-generate a study roadmap and track your progress.</Text>

      {/* Inputs */}
      <View style={s.card}>
        <Text style={s.secTitle}>Planner Inputs</Text>
        <Text style={s.label}>Exam Date</Text>
        <TextInput style={s.input} placeholder="YYYY-MM-DD" value={examDate} onChangeText={setExamDate} placeholderTextColor={Colors.textMuted} />
        <Text style={s.label}>Syllabus Coverage: {coverage}%</Text>
        <View style={s.sliderRow}>
          <TouchableOpacity onPress={() => setCoverage(Math.max(0, coverage - 10))} style={s.sliderBtn}><Text style={s.sliderBtnText}>−</Text></TouchableOpacity>
          <View style={s.sliderTrack}><View style={[s.sliderFill, { width: `${coverage}%` }]} /></View>
          <TouchableOpacity onPress={() => setCoverage(Math.min(100, coverage + 10))} style={s.sliderBtn}><Text style={s.sliderBtnText}>+</Text></TouchableOpacity>
        </View>
        <Text style={s.label}>Weak Topic</Text>
        <View style={s.topicRow}>
          {topics.map(t => (
            <TouchableOpacity key={t} style={[s.topicChip, weakTopic === t && s.topicChipActive]} onPress={() => setWeakTopic(t)}>
              <Text style={[s.topicText, weakTopic === t && s.topicTextActive]}>{t}</Text>
            </TouchableOpacity>
          ))}
        </View>
        <TouchableOpacity style={s.btn} onPress={generatePlan}><Text style={s.btnText}>Generate Plan</Text></TouchableOpacity>
      </View>

      {/* Plan */}
      <View style={s.card}>
        <Text style={s.secTitle}>Study Plan</Text>
        <Text style={s.body}>{planMsg || 'Set inputs above and generate a plan.'}</Text>
        {daysLeft !== null && <Text style={s.highlight}>Days until exam: {daysLeft}</Text>}
      </View>

      {/* Streak */}
      <View style={s.card}>
        <Text style={s.secTitle}>Goal Tracking</Text>
        <View style={s.streakRow}>
          <View style={s.streakCard}><Text style={s.streakVal}>🔥 {streak}</Text><Text style={s.streakLabel}>Streak</Text></View>
          <View style={s.streakCard}><Text style={s.streakVal}>❌ {missed}</Text><Text style={s.streakLabel}>Missed</Text></View>
        </View>
        <View style={s.logRow}>
          <TouchableOpacity style={s.logBtn} onPress={() => logSession(true)}><Text style={s.logText}>✅ Done</Text></TouchableOpacity>
          <TouchableOpacity style={s.logBtnO} onPress={() => logSession(false)}><Text style={s.logTextO}>❌ Missed</Text></TouchableOpacity>
        </View>
      </View>

      {/* Tomorrow */}
      <View style={s.card}>
        <Text style={s.secTitle}>Tomorrow's Plan</Text>
        <View style={s.outcomeRow}>
          {['improved', 'review', 'struggled'].map(o => (
            <TouchableOpacity key={o} style={[s.outcomeBtn, todayOutcome === o && s.outcomeBtnActive]} onPress={() => setTodayOutcome(o)}>
              <Text style={[s.outcomeText, todayOutcome === o && s.outcomeTextActive]}>{o}</Text>
            </TouchableOpacity>
          ))}
        </View>
        <TouchableOpacity style={s.btn} onPress={adjustTomorrow}><Text style={s.btnText}>Update Tomorrow</Text></TouchableOpacity>
        {tomorrowPlan !== '' && <View style={s.tomorrowBox}><Text style={s.tomorrowText}>{tomorrowPlan}</Text></View>}
      </View>

      {/* Data */}
      <View style={s.card}>
        <Text style={s.secTitle}>Data Insights</Text>
        <Text style={s.body}>Aptitude: {perf.apt !== null ? `${perf.apt}%` : 'No data'}</Text>
        <Text style={s.body}>Coding: {perf.cod !== null ? `${perf.cod}%` : 'No data'}</Text>
        <Text style={s.body}>Resume: {perf.res !== null ? `${perf.res}/100` : 'No data'}</Text>
      </View>
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
  secTitle: { fontSize: 17, fontWeight: '700', color: Colors.primaryDark, marginBottom: 12 },
  label: { fontSize: 13, fontWeight: '700', color: Colors.textDark, marginBottom: 6, marginTop: 10 },
  input: { backgroundColor: Colors.inputBg, borderRadius: 14, borderWidth: 1, borderColor: Colors.borderInput, padding: 14, fontSize: 14, color: Colors.text, marginBottom: 8 },
  body: { fontSize: 14, color: Colors.textSecondary, lineHeight: 22, marginBottom: 4 },
  highlight: { fontSize: 15, fontWeight: '700', color: Colors.primary, marginTop: 10 },
  btn: { backgroundColor: Colors.primaryLight, borderRadius: 16, paddingVertical: 16, alignItems: 'center', marginTop: 12 },
  btnText: { color: Colors.white, fontSize: 16, fontWeight: '700' },
  topicRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 8 },
  topicChip: { backgroundColor: Colors.inputBg, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 8, borderWidth: 1, borderColor: Colors.borderInput },
  topicChipActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  topicText: { fontSize: 12, color: Colors.textSecondary, fontWeight: '600' },
  topicTextActive: { color: Colors.white },
  sliderRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 8 },
  sliderBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: Colors.pillBg, alignItems: 'center', justifyContent: 'center' },
  sliderBtnText: { fontSize: 20, fontWeight: '700', color: Colors.primary },
  sliderTrack: { flex: 1, height: 8, borderRadius: 4, backgroundColor: Colors.borderInput },
  sliderFill: { height: 8, borderRadius: 4, backgroundColor: Colors.primary },
  streakRow: { flexDirection: 'row', gap: 12, marginBottom: 14 },
  streakCard: { flex: 1, backgroundColor: Colors.inputBg, borderRadius: 14, padding: 16, alignItems: 'center', borderWidth: 1, borderColor: Colors.borderInput },
  streakVal: { fontSize: 24, fontWeight: '800' },
  streakLabel: { fontSize: 12, color: Colors.textMuted, marginTop: 4 },
  logRow: { flexDirection: 'row', gap: 10 },
  logBtn: { flex: 1, backgroundColor: '#e8f5e9', borderRadius: 14, paddingVertical: 14, alignItems: 'center' },
  logText: { fontWeight: '700', color: '#2e7d32' },
  logBtnO: { flex: 1, backgroundColor: '#fce4ec', borderRadius: 14, paddingVertical: 14, alignItems: 'center' },
  logTextO: { fontWeight: '700', color: '#c62828' },
  outcomeRow: { flexDirection: 'row', gap: 8, marginBottom: 12 },
  outcomeBtn: { flex: 1, borderRadius: 12, paddingVertical: 10, alignItems: 'center', backgroundColor: Colors.inputBg, borderWidth: 1, borderColor: Colors.borderInput },
  outcomeBtnActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  outcomeText: { fontSize: 12, fontWeight: '600', color: Colors.textSecondary },
  outcomeTextActive: { color: Colors.white },
  tomorrowBox: { backgroundColor: Colors.inputBg, borderRadius: 14, padding: 16, marginTop: 12 },
  tomorrowText: { fontSize: 14, fontWeight: '600', color: Colors.textDark, lineHeight: 22 },
});
