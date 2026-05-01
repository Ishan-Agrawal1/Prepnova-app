import React, { useState } from 'react';
import { View, Text, ScrollView, TextInput, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import Colors from '../../constants/Colors';

function parseGitHubRepo(url: string) {
  try {
    const match = url.trim().replace(/\s+/g, '').match(/github\.com\/([^/]+)\/([^/]+)(?:\/.*)?$/i);
    if (!match) return null;
    return { owner: match[1], repo: match[2].replace(/\.git$/, '') };
  } catch { return null; }
}

function getReviewData(repo: any, readmeText: string, topics: string[]) {
  const desc = repo.description || 'No description provided.';
  const readmeLen = readmeText?.length || 0;
  const hasReadme = readmeLen > 100;
  const hasLicense = !!repo.license;
  const hasTopics = topics?.length > 0;
  const hasHomepage = !!repo.homepage;
  const stars = repo.stargazers_count || 0;
  const forks = repo.forks_count || 0;
  const issues = repo.open_issues_count || 0;
  const days = Math.max(0, Math.round((Date.now() - new Date(repo.updated_at).getTime()) / 86400000));

  const score = Math.min(100, 40 + (hasReadme ? 15 : 0) + (hasLicense ? 10 : 0) + (hasTopics ? 10 : 0) + (hasHomepage ? 5 : 0) + Math.min(20, Math.floor(stars / 5)) - Math.min(10, Math.floor(issues / 5)));

  const needToDo = [
    hasReadme ? 'Expand README with installation and usage.' : 'Add a strong README.',
    hasLicense ? 'Confirm license visibility.' : 'Add a license file.',
    hasTopics ? 'Keep topics up to date.' : 'Add relevant topics.',
  ];

  const improvements: string[] = [];
  if (!hasReadme) improvements.push('Write a detailed README.');
  if (!hasLicense) improvements.push('Add a license.');
  if (!hasTopics) improvements.push('Tag with relevant topics.');
  if (issues > 10) improvements.push('Close or label open issues.');
  if (days > 60) improvements.push('Refresh codebase and update dependencies.');

  return {
    score, name: repo.full_name, description: desc,
    language: repo.language, stars, forks, openIssues: issues,
    updated: `${days} day${days === 1 ? '' : 's'} ago`,
    topics, needToDo,
    bestPart: `The repository shows ${stars} star${stars === 1 ? '' : 's'} and ${forks} fork${forks === 1 ? '' : 's'}.`,
    improvements: improvements.length ? improvements : ['Repository is in good shape.'],
  };
}

export default function GithubReviewScreen() {
  const [url, setUrl] = useState('');
  const [analysis, setAnalysis] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleReview = async () => {
    setError(''); setAnalysis(null);
    const parsed = parseGitHubRepo(url);
    if (!parsed) { setError('Enter a valid GitHub URL.'); return; }
    setLoading(true);
    try {
      const headers = { Accept: 'application/vnd.github.mercy-preview+json' };
      const repoRes = await fetch(`https://api.github.com/repos/${parsed.owner}/${parsed.repo}`, { headers });
      if (!repoRes.ok) throw new Error('Repo not found or rate limited.');
      const repoData = await repoRes.json();
      const topicsRes = await fetch(`https://api.github.com/repos/${parsed.owner}/${parsed.repo}/topics`, { headers });
      const topicsData = topicsRes.ok ? await topicsRes.json() : { names: [] };
      const readmeRes = await fetch(`https://api.github.com/repos/${parsed.owner}/${parsed.repo}/readme`, { headers });
      const readmeJson = readmeRes.ok ? await readmeRes.json() : null;
      let readmeText = '';
      if (readmeJson?.content) { try { readmeText = atob(readmeJson.content.replace(/\n/g, '')); } catch {} }
      setAnalysis(getReviewData(repoData, readmeText, topicsData.names || []));
    } catch (e: any) { setError(e.message || 'Could not analyze.'); }
    finally { setLoading(false); }
  };

  return (
    <ScrollView style={s.container} contentContainerStyle={s.content}>
      <View style={s.pill}><Text style={s.pillText}>Project Review</Text></View>
      <Text style={s.title}>GitHub Analyzer</Text>
      <Text style={s.subtitle}>Paste your GitHub repo link for industry-focused analysis.</Text>

      <View style={s.card}>
        <TextInput style={s.input} placeholder="https://github.com/user/repo" placeholderTextColor={Colors.textMuted} value={url} onChangeText={setUrl} autoCapitalize="none" autoCorrect={false} />
        <TouchableOpacity style={[s.btn, loading && { opacity: 0.6 }]} onPress={handleReview} disabled={loading}>
          <Text style={s.btnText}>{loading ? 'Analyzing...' : 'Analyze Project'}</Text>
        </TouchableOpacity>
        {error !== '' && <Text style={s.error}>{error}</Text>}
      </View>

      {analysis && (
        <View style={s.resultCard}>
          <Text style={s.resultName}>{analysis.name}</Text>
          <Text style={s.resultDesc}>{analysis.description}</Text>

          <View style={s.statsRow}>
            {[['Lang', analysis.language || '—'], ['Stars', analysis.stars], ['Forks', analysis.forks], ['Issues', analysis.openIssues]].map(([l, v], i) => (
              <View key={i} style={s.stat}><Text style={s.statVal}>{v}</Text><Text style={s.statLabel}>{l}</Text></View>
            ))}
          </View>

          <View style={s.scoreBadge}><Text style={s.scoreText}>Score: {analysis.score}/100</Text></View>

          <Text style={s.secTitle}>What needs to be done</Text>
          {analysis.needToDo.map((t: string, i: number) => <BulletItem key={i} text={t} />)}

          <Text style={s.secTitle}>Best part</Text>
          <Text style={s.bodyText}>{analysis.bestPart}</Text>

          <Text style={s.secTitle}>Improvements</Text>
          {analysis.improvements.map((t: string, i: number) => <BulletItem key={i} text={t} />)}
        </View>
      )}
      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

function BulletItem({ text }: { text: string }) {
  return <View style={s.bullet}><View style={s.dot} /><Text style={s.bulletText}>{text}</Text></View>;
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  content: { padding: 20 },
  pill: { backgroundColor: Colors.pillBg, alignSelf: 'flex-start', borderRadius: 999, paddingHorizontal: 14, paddingVertical: 6, marginBottom: 14 },
  pillText: { color: Colors.primary, fontWeight: '700', fontSize: 13 },
  title: { fontSize: 26, fontWeight: '800', color: Colors.textHeading, marginBottom: 8 },
  subtitle: { fontSize: 15, color: Colors.textSecondary, lineHeight: 24, marginBottom: 20 },
  card: { backgroundColor: Colors.surface, borderRadius: 24, padding: 24, borderWidth: 1, borderColor: Colors.borderCard, marginBottom: 16 },
  input: { backgroundColor: Colors.inputBg, borderRadius: 14, borderWidth: 1, borderColor: Colors.borderInput, padding: 16, fontSize: 14, color: Colors.text, marginBottom: 16 },
  btn: { backgroundColor: Colors.primaryLight, borderRadius: 16, paddingVertical: 16, alignItems: 'center' },
  btnText: { color: Colors.white, fontSize: 16, fontWeight: '700' },
  error: { color: Colors.error, marginTop: 12, fontSize: 14 },
  resultCard: { backgroundColor: Colors.surface, borderRadius: 24, padding: 24, borderWidth: 1, borderColor: Colors.borderCard },
  resultName: { fontSize: 20, fontWeight: '800', color: Colors.textDark, marginBottom: 6 },
  resultDesc: { fontSize: 14, color: Colors.textSecondary, marginBottom: 16 },
  statsRow: { flexDirection: 'row', gap: 8, marginBottom: 16 },
  stat: { flex: 1, backgroundColor: Colors.inputBg, borderRadius: 12, padding: 10, alignItems: 'center', borderWidth: 1, borderColor: Colors.borderInput },
  statVal: { fontSize: 16, fontWeight: '800', color: Colors.primary },
  statLabel: { fontSize: 11, color: Colors.textMuted, marginTop: 2 },
  scoreBadge: { backgroundColor: Colors.primary, borderRadius: 14, padding: 14, alignItems: 'center', marginBottom: 20 },
  scoreText: { color: Colors.white, fontSize: 18, fontWeight: '800' },
  secTitle: { fontSize: 16, fontWeight: '700', color: Colors.primaryDark, marginTop: 16, marginBottom: 10 },
  bodyText: { fontSize: 14, color: Colors.textSecondary, lineHeight: 22 },
  bullet: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 8 },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: Colors.primary, marginTop: 6, marginRight: 10 },
  bulletText: { flex: 1, fontSize: 14, color: Colors.textSecondary, lineHeight: 22 },
});
