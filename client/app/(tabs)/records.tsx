import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, RefreshControl } from 'react-native';
import Colors from '../../constants/Colors';
import { useAuth } from '../../contexts/AuthContext';
import { fetchAnalysesByEmail, fetchInterviews, fetchAptitude, fetchCoding } from '../../services/api';
import Loader from '../../components/Loader';

export default function RecordsScreen() {
  const { user } = useAuth();
  const email = user?.email || '';
  const [resume, setResume] = useState<any[]>([]);
  const [interviews, setInterviews] = useState<any[]>([]);
  const [aptitude, setAptitude] = useState<any[]>([]);
  const [coding, setCoding] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => { if (email) load(); else setLoading(false); }, [email]);

  const load = async () => {
    try {
      const [r, i, a, c] = await Promise.all([
        fetchAnalysesByEmail(email).catch(() => []),
        fetchInterviews(email).catch(() => []),
        fetchAptitude(email).catch(() => []),
        fetchCoding(email).catch(() => []),
      ]);
      setResume(r); setInterviews(i); setAptitude(a); setCoding(c);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  const onRefresh = async () => { setRefreshing(true); await load(); setRefreshing(false); };

  if (!email) return <Empty icon="🔐" title="Login Required" text="Please login to see records." />;
  if (loading) return <View style={s.center}><Loader message="Loading records..." /></View>;

  return (
    <ScrollView style={s.container} contentContainerStyle={s.content}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />}>
      <Text style={s.title}>Records</Text>
      <Text style={s.subtitle}>Track your performance across all modules.</Text>

      <Section title="📄 Resume Analysis" count={resume.length}>
        {resume.map((it: any) => (
          <Item key={it._id} name={it.fileName}
            lines={[`Score: ${it.score}/100`, `Strengths: ${it.strengths?.join(', ')}`]} />
        ))}
      </Section>

      <Section title="🎤 Interviews" count={interviews.length}>
        {interviews.map((it: any) => (
          <Item key={it._id} name="Interview Session"
            lines={[`Questions: ${it.questions?.length}`, `Feedback: ${it.feedback}`]}
            date={it.createdAt} />
        ))}
      </Section>

      <Section title="🧮 Aptitude" count={aptitude.length}>
        {aptitude.map((it: any) => (
          <Item key={it._id} name="Aptitude Test"
            lines={[`Score: ${it.score}/${it.total}`]} date={it.createdAt} />
        ))}
      </Section>

      <Section title="💻 Coding" count={coding.length}>
        {coding.map((it: any) => (
          <Item key={it._id} name={it.question}
            lines={[`Feedback: ${it.feedback}`]} date={it.createdAt} />
        ))}
      </Section>
      <View style={{ height: 32 }} />
    </ScrollView>
  );
}

function Section({ title, count, children }: any) {
  return (
    <View style={s.section}>
      <View style={s.sectionHead}>
        <Text style={s.sectionTitle}>{title}</Text>
        <View style={s.badge}><Text style={s.badgeText}>{count}</Text></View>
      </View>
      {count === 0 ? <View style={s.emptyCard}><Text style={s.emptyText}>No records yet.</Text></View> : children}
    </View>
  );
}

function Item({ name, lines, date }: { name: string; lines: string[]; date?: string }) {
  return (
    <View style={s.item}>
      <Text style={s.itemName}>{name}</Text>
      {lines.map((l, i) => <Text key={i} style={s.itemDetail}>{l}</Text>)}
      {date && <Text style={s.itemDate}>{new Date(date).toLocaleDateString()}</Text>}
    </View>
  );
}

function Empty({ icon, title, text }: any) {
  return (
    <View style={s.center}>
      <Text style={{ fontSize: 48 }}>{icon}</Text>
      <Text style={s.emptyTitle}>{title}</Text>
      <Text style={s.emptySubtext}>{text}</Text>
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  content: { padding: 20, paddingTop: 60 },
  center: { flex: 1, backgroundColor: Colors.background, alignItems: 'center', justifyContent: 'center', padding: 32 },
  title: { fontSize: 28, fontWeight: '800', color: Colors.textHeading, marginBottom: 6 },
  subtitle: { fontSize: 15, color: Colors.textSecondary, marginBottom: 24 },
  section: { marginBottom: 24 },
  sectionHead: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 12 },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: Colors.textDark },
  badge: { backgroundColor: Colors.pillBg, borderRadius: 10, paddingHorizontal: 10, paddingVertical: 3 },
  badgeText: { color: Colors.primary, fontSize: 13, fontWeight: '700' },
  item: {
    backgroundColor: Colors.surface, borderRadius: 16, padding: 16, marginBottom: 10,
    borderWidth: 1, borderColor: Colors.borderCard,
  },
  itemName: { fontSize: 15, fontWeight: '700', color: Colors.textDark, marginBottom: 6 },
  itemDetail: { fontSize: 13, color: Colors.textSecondary, lineHeight: 20 },
  itemDate: { fontSize: 12, color: Colors.textMuted, marginTop: 6 },
  emptyCard: { backgroundColor: Colors.surface, borderRadius: 16, padding: 20, borderWidth: 1, borderColor: Colors.borderCard, alignItems: 'center' },
  emptyText: { color: Colors.textMuted, fontSize: 14 },
  emptyTitle: { fontSize: 22, fontWeight: '700', color: Colors.textDark, marginTop: 16, marginBottom: 8 },
  emptySubtext: { fontSize: 15, color: Colors.textSecondary, textAlign: 'center' },
});
