import { useState, useCallback } from 'react'
import { View, Text, Pressable, ScrollView, ActivityIndicator } from 'react-native'
import { useLocalSearchParams, useFocusEffect, Stack, useRouter } from 'expo-router'
import { supabase } from '../../lib/supabase'
import { colors } from '../../theme'

interface Lesson {
  id: string
  title: string
  section_index: number
  status: string
}

export default function CourseDetail() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const router = useRouter()
  const [title, setTitle] = useState('')
  const [lessons, setLessons] = useState<Lesson[]>([])
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    const [{ data: roadmap }, { data: ls }] = await Promise.all([
      supabase.from('roadmaps').select('title').eq('id', id).single(),
      supabase.from('lessons').select('id, title, section_index, status').eq('roadmap_id', id).order('section_index'),
    ])
    setTitle(roadmap?.title ?? 'Course')
    setLessons((ls as Lesson[]) ?? [])
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
      <Text style={{ color: colors.text, fontSize: 24, fontWeight: '700', marginBottom: 20 }}>{title}</Text>

      {lessons.map((l, i) => {
        const locked = l.status === 'locked'
        return (
          <Pressable
            key={l.id}
            disabled={locked}
            onPress={() => router.push(`/lesson/${l.id}`)}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              backgroundColor: colors.card,
              borderColor: colors.border,
              borderWidth: 1,
              borderRadius: 14,
              padding: 16,
              marginBottom: 10,
              opacity: locked ? 0.5 : 1,
            }}
          >
            <View style={{ width: 30, height: 30, borderRadius: 15, backgroundColor: colors.border, alignItems: 'center', justifyContent: 'center', marginRight: 14 }}>
              <Text style={{ color: colors.text, fontWeight: '700' }}>{locked ? '🔒' : i + 1}</Text>
            </View>
            <Text style={{ color: colors.text, fontSize: 15, fontWeight: '500', flex: 1 }}>{l.title}</Text>
            {l.status === 'completed' ? <Text style={{ color: colors.green }}>✓</Text> : null}
          </Pressable>
        )
      })}
    </ScrollView>
  )
}
