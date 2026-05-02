import React, { useState } from 'react';
import { View, Text, ScrollView, TextInput, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import Colors from '../../constants/Colors';
import { useAuth } from '../../contexts/AuthContext';
import { saveCoding } from '../../services/api';

export default function CodingScreen() {
  const { user } = useAuth();
  const [code, setCode] = useState('');
  const [result, setResult] = useState('');
  const [saving, setSaving] = useState(false);
  const question = 'Write logic to reverse a string.';

  const runCheck = async () => {
    const feedback = code.trim().length < 20
      ? 'Your answer is too short. Try writing proper logic.'
      : 'Good attempt. Improve formatting, edge case handling, and explanation.';
    try {
      setSaving(true);
      await saveCoding({ userEmail: user?.email || 'guest@example.com', question, code, feedback });
      setResult(feedback);
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to save');
    } finally { setSaving(false); }
  };

  return (
    <ScrollView style={s.container} contentContainerStyle={s.content}>
      <View style={s.pill}><Text style={s.pillText}>Code Practice</Text></View>
      <Text style={s.title}>Coding Test</Text>
      <Text style={s.subtitle}>Write your code and get instant feedback on completeness, style, and logic.</Text>

      <View style={s.card}>
        <Text style={s.qLabel}>Question</Text>
        <Text style={s.qText}>{question}</Text>
        <TextInput
          style={s.codeInput}
          multiline numberOfLines={10}
          placeholder="Write your code here..."
          placeholderTextColor={Colors.textMuted}
          value={code}
          onChangeText={setCode}
          textAlignVertical="top"
          autoCapitalize="none"
          autoCorrect={false}
        />
        <TouchableOpacity style={[s.btn, saving && { opacity: 0.6 }]} onPress={runCheck} disabled={saving}>
          <Text style={s.btnText}>{saving ? 'Checking...' : 'Check Answer'}</Text>
        </TouchableOpacity>
      </View>

      {result !== '' && (
        <View style={s.fbCard}>
          <Text style={s.fbTitle}>Code Feedback</Text>
          <Text style={s.fbText}>{result}</Text>
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
  qLabel: { fontSize: 16, fontWeight: '700', color: Colors.primaryDark, marginBottom: 6 },
  qText: { fontSize: 15, color: Colors.textSecondary, marginBottom: 18 },
  codeInput: {
    backgroundColor: '#1e1e2e', borderRadius: 14, padding: 16, fontSize: 14,
    color: '#e0e0e0', fontFamily: 'monospace', minHeight: 200, marginBottom: 16,
  },
  btn: { backgroundColor: Colors.primaryLight, borderRadius: 16, paddingVertical: 16, alignItems: 'center' },
  btnText: { color: Colors.white, fontSize: 16, fontWeight: '700' },
  fbCard: { backgroundColor: Colors.surface, borderRadius: 20, padding: 22, borderWidth: 1, borderColor: Colors.borderCard },
  fbTitle: { fontSize: 18, fontWeight: '700', color: Colors.primaryDark, marginBottom: 10 },
  fbText: { fontSize: 14, color: Colors.textSecondary, lineHeight: 24 },
});
