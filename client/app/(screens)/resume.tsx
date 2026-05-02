import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import Colors from '../../constants/Colors';
import { useAuth } from '../../contexts/AuthContext';
import { uploadResume } from '../../services/api';
import ResultCard from '../../components/ResultCard';
import Loader from '../../components/Loader';

export default function ResumeScreen() {
  const { user } = useAuth();
  const [file, setFile] = useState<any>(null);
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const pickFile = async () => {
    const res = await DocumentPicker.getDocumentAsync({
      type: ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
      copyToCacheDirectory: true,
    });
    if (!res.canceled && res.assets?.[0]) {
      setFile(res.assets[0]);
      setResult(null);
    }
  };

  const handleUpload = async () => {
    if (!file) { Alert.alert('Error', 'Please select a resume file first'); return; }
    try {
      setLoading(true); setResult(null);
      const data = await uploadResume(file.uri, file.name, file.mimeType || 'application/pdf', user?.email || 'guest@example.com');
      setResult(data);
    } catch (err: any) {
      Alert.alert('Upload Failed', err.message || 'Resume upload failed');
    } finally { setLoading(false); }
  };

  return (
    <ScrollView style={s.container} contentContainerStyle={s.content}>
      <View style={s.hero}>
        <View style={s.pill}><Text style={s.pillText}>Resume Intelligence</Text></View>
        <Text style={s.title}>AI Resume Analyzer</Text>
        <Text style={s.subtitle}>Upload your resume and receive industry-ready feedback, score, strengths, and weaknesses.</Text>
      </View>

      <View style={s.card}>
        <Text style={s.cardTitle}>Upload your resume</Text>
        <Text style={s.cardDesc}>Choose a PDF or DOCX file and let AI provide targeted suggestions.</Text>

        <TouchableOpacity style={s.filePicker} onPress={pickFile} activeOpacity={0.7}>
          <Text style={s.fileIcon}>{file ? '📄' : '📁'}</Text>
          <Text style={s.fileText}>{file ? file.name : 'Tap to select file'}</Text>
        </TouchableOpacity>

        <TouchableOpacity style={[s.btn, loading && s.btnDisabled]} onPress={handleUpload} disabled={loading} activeOpacity={0.8}>
          <Text style={s.btnText}>{loading ? 'Analyzing...' : 'Upload & Analyze'}</Text>
        </TouchableOpacity>

        {loading && <Loader message="Analyzing resume, please wait..." />}
        {result && <ResultCard result={result} />}
      </View>

      <View style={s.tipsCard}>
        <Text style={s.tipsTitle}>Why this matters</Text>
        {['Keyword optimization for technical roles', 'Experience highlighting that employers notice', 'Structure and formatting checks'].map((t, i) => (
          <View key={i} style={s.tipRow}><View style={s.dot} /><Text style={s.tipText}>{t}</Text></View>
        ))}
      </View>
      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  content: { padding: 20 },
  hero: { marginBottom: 20 },
  pill: { backgroundColor: Colors.pillBg, alignSelf: 'flex-start', borderRadius: 999, paddingHorizontal: 14, paddingVertical: 6, marginBottom: 14 },
  pillText: { color: Colors.primary, fontWeight: '700', fontSize: 13 },
  title: { fontSize: 28, fontWeight: '800', color: Colors.textHeading, marginBottom: 8 },
  subtitle: { fontSize: 15, color: Colors.textSecondary, lineHeight: 24 },
  card: {
    backgroundColor: Colors.surface, borderRadius: 24, padding: 24,
    borderWidth: 1, borderColor: Colors.borderCard, marginBottom: 16,
    shadowColor: Colors.primary, shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.06, shadowRadius: 16, elevation: 4,
  },
  cardTitle: { fontSize: 20, fontWeight: '700', color: Colors.textDark, marginBottom: 6 },
  cardDesc: { fontSize: 14, color: Colors.textSecondary, marginBottom: 20 },
  filePicker: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: Colors.inputBg, borderRadius: 16, padding: 18,
    borderWidth: 1, borderColor: Colors.borderInput, borderStyle: 'dashed', marginBottom: 16,
  },
  fileIcon: { fontSize: 24 },
  fileText: { flex: 1, fontSize: 14, color: Colors.textSecondary },
  btn: {
    backgroundColor: Colors.primaryLight, borderRadius: 16, paddingVertical: 16, alignItems: 'center',
    shadowColor: Colors.primaryLight, shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.25, shadowRadius: 12, elevation: 4,
  },
  btnDisabled: { opacity: 0.6 },
  btnText: { color: Colors.white, fontSize: 16, fontWeight: '700' },
  tipsCard: {
    backgroundColor: Colors.surface, borderRadius: 20, padding: 22,
    borderWidth: 1, borderColor: Colors.borderCard,
  },
  tipsTitle: { fontSize: 17, fontWeight: '700', color: Colors.primaryDark, marginBottom: 14 },
  tipRow: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 10 },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: Colors.primary, marginTop: 6, marginRight: 12 },
  tipText: { flex: 1, fontSize: 14, color: Colors.textSecondary, lineHeight: 22 },
});
