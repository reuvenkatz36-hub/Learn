import { useState } from 'react'
import { View, Text, TextInput, Pressable, ActivityIndicator, ScrollView } from 'react-native'
import { useRouter } from 'expo-router'
import { supabase, API_URL } from '../lib/supabase'
import { colors } from '../theme'

const LEVELS = ['beginner', 'intermediate', 'advanced'] as const

export default function Create() {
  const router = useRouter()
  const [topic, setTopic] = useState('')
  const [difficulty, setDifficulty] = useState<typeof LEVELS[number]>('beginner')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleCreate = async () => {
    if (!topic.trim()) return
    setLoading(true)
    setError('')
    try {
      const { data: { session } } = await supabase.auth.getSession()
      const res = await fetch(`${API_URL}/api/roadmap`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session?.access_token}`,
        },
        body: JSON.stringify({ topic: topic.trim(), difficulty }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to create course')
      router.replace(`/course/${data.id}`)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Something went wrong')
      setLoading(false)
    }
  }

  return (
    <ScrollView style={{ flex: 1, backgroundColor: colors.bg }} contentContainerStyle={{ padding: 20 }}>
      <Text style={{ color: colors.text, fontSize: 22, fontWeight: '700' }}>What do you want to learn?</Text>
      <Text style={{ color: colors.muted, fontSize: 14, marginTop: 6, marginBottom: 24 }}>
        AI will build a full course for you. This uses 1 credit.
      </Text>

      <Text style={styles.label}>Topic</Text>
      <TextInput
        value={topic}
        onChangeText={setTopic}
        placeholder="e.g. Photography, Python, Chess openings"
        placeholderTextColor={colors.faint}
        style={styles.input}
        multiline
      />

      <Text style={[styles.label, { marginTop: 20 }]}>Difficulty</Text>
      <View style={{ flexDirection: 'row', gap: 10, marginTop: 4 }}>
        {LEVELS.map(l => (
          <Pressable
            key={l}
            onPress={() => setDifficulty(l)}
            style={{
              flex: 1,
              paddingVertical: 12,
              borderRadius: 10,
              alignItems: 'center',
              backgroundColor: difficulty === l ? colors.primary : colors.card,
              borderWidth: 1,
              borderColor: difficulty === l ? colors.primary : colors.border,
            }}
          >
            <Text style={{ color: difficulty === l ? '#fff' : colors.muted, fontWeight: '600', fontSize: 13, textTransform: 'capitalize' }}>{l}</Text>
          </Pressable>
        ))}
      </View>

      {error ? <Text style={{ color: colors.red, marginTop: 16, fontSize: 14 }}>{error}</Text> : null}

      <Pressable onPress={handleCreate} disabled={loading || !topic.trim()} style={[styles.button, { opacity: loading || !topic.trim() ? 0.5 : 1 }]}>
        {loading ? (
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
            <ActivityIndicator color="#fff" />
            <Text style={styles.buttonText}>Building your course…</Text>
          </View>
        ) : (
          <Text style={styles.buttonText}>Create course (1 credit)</Text>
        )}
      </Pressable>
    </ScrollView>
  )
}

const styles = {
  label: { color: colors.muted, fontSize: 13, fontWeight: '600' as const, marginBottom: 8 },
  input: {
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    color: colors.text,
    fontSize: 15,
    minHeight: 56,
  },
  button: {
    backgroundColor: colors.primary,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center' as const,
    marginTop: 28,
  },
  buttonText: { color: '#fff', fontSize: 15, fontWeight: '700' as const },
}
