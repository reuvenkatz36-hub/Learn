import { useState, useCallback } from 'react'
import { View, Text, ScrollView, ActivityIndicator } from 'react-native'
import { useLocalSearchParams, useFocusEffect, Stack } from 'expo-router'
import { supabase } from '../../lib/supabase'
import { colors } from '../../theme'

interface Section {
  type?: string
  title?: string
  content?: string
}

export default function LessonScreen() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const [title, setTitle] = useState('')
  const [sections, setSections] = useState<Section[]>([])
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    const { data } = await supabase.from('lessons').select('title, content').eq('id', id).single()
    setTitle(data?.title ?? 'Lesson')
    setSections(Array.isArray(data?.content) ? (data!.content as Section[]) : [])
    setLoading(false)
  }, [id])

  useFocusEffect(useCallback(() => { load() }, [load]))

  if (loading) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.bg }}>
        <ActivityIndicator color={colors.primary} size="large" />
      </View>
    )
  }

  return (
    <ScrollView style={{ flex: 1, backgroundColor: colors.bg }} contentContainerStyle={{ padding: 20 }}>
      <Stack.Screen options={{ title }} />
      <Text style={{ color: colors.text, fontSize: 24, fontWeight: '700', marginBottom: 16 }}>{title}</Text>

      {sections.length === 0 ? (
        <View style={{ alignItems: 'center', paddingVertical: 50 }}>
          <Text style={{ fontSize: 32, marginBottom: 10 }}>📘</Text>
          <Text style={{ color: colors.muted, fontSize: 15, textAlign: 'center' }}>
            Lesson content will generate here.
          </Text>
        </View>
      ) : (
        sections.map((s, i) => (
          <View key={i} style={{ backgroundColor: colors.card, borderColor: colors.border, borderWidth: 1, borderRadius: 14, padding: 16, marginBottom: 12 }}>
            {s.title ? <Text style={{ color: colors.text, fontSize: 16, fontWeight: '600', marginBottom: 6 }}>{s.title}</Text> : null}
            <Text style={{ color: colors.muted, fontSize: 14, lineHeight: 21 }}>{s.content}</Text>
          </View>
        ))
      )}
    </ScrollView>
  )
}
