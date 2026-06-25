import { useState, useCallback } from 'react'
import { View, Text, Pressable, ScrollView, RefreshControl, ActivityIndicator } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useRouter, useFocusEffect } from 'expo-router'
import { supabase } from '../lib/supabase'
import { useAuth } from '../lib/auth'
import { colors } from '../theme'

interface Course {
  id: string
  title: string
  description: string | null
  difficulty: string
  status: string
}

export default function Home() {
  const router = useRouter()
  const { session } = useAuth()
  const [credits, setCredits] = useState<number | null>(null)
  const [name, setName] = useState('')
  const [courses, setCourses] = useState<Course[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  const load = useCallback(async () => {
    if (!session) return
    const [{ data: profile }, { data: roadmaps }] = await Promise.all([
      supabase.from('profiles').select('display_name, credits').eq('id', session.user.id).single(),
      supabase.from('roadmaps').select('id, title, description, difficulty, status').eq('user_id', session.user.id).order('created_at', { ascending: false }),
    ])
    setCredits(profile?.credits ?? 0)
    setName(profile?.display_name ?? 'Learner')
    setCourses((roadmaps as Course[]) ?? [])
    setLoading(false)
  }, [session])

  useFocusEffect(useCallback(() => { load() }, [load]))

  const onRefresh = async () => {
    setRefreshing(true)
    await load()
    setRefreshing(false)
  }

  if (loading) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.bg }}>
        <ActivityIndicator color={colors.primary} size="large" />
      </View>
    )
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }} edges={['top']}>
      <ScrollView
        contentContainerStyle={{ padding: 20, paddingBottom: 120 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
      >
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <View>
            <Text style={{ color: colors.muted, fontSize: 14 }}>Welcome back</Text>
            <Text style={{ color: colors.text, fontSize: 24, fontWeight: '700' }}>{name}</Text>
          </View>
          <Pressable onPress={() => supabase.auth.signOut()}>
            <Text style={{ color: colors.faint, fontSize: 13 }}>Sign out</Text>
          </Pressable>
        </View>

        <View style={{ backgroundColor: colors.card, borderColor: colors.border, borderWidth: 1, borderRadius: 18, padding: 20, marginTop: 20 }}>
          <Text style={{ color: colors.muted, fontSize: 13, fontWeight: '600' }}>YOUR CREDITS</Text>
          <View style={{ flexDirection: 'row', alignItems: 'flex-end', marginTop: 6 }}>
            <Text style={{ color: colors.text, fontSize: 40, fontWeight: '800' }}>{credits}</Text>
            <Text style={{ color: colors.faint, fontSize: 15, marginBottom: 8, marginLeft: 8 }}>credits left</Text>
          </View>
          <Text style={{ color: colors.faint, fontSize: 13, marginTop: 2 }}>1 credit = 1 new AI course</Text>
          <Pressable style={{ backgroundColor: colors.border, borderRadius: 10, paddingVertical: 11, alignItems: 'center', marginTop: 14 }}>
            <Text style={{ color: colors.text, fontWeight: '600', fontSize: 14 }}>Buy more credits</Text>
          </Pressable>
        </View>

        <Pressable
          onPress={() => router.push('/create')}
          style={{ backgroundColor: colors.primary, borderRadius: 16, paddingVertical: 16, alignItems: 'center', marginTop: 16 }}
        >
          <Text style={{ color: '#fff', fontSize: 16, fontWeight: '700' }}>+ Create a new course</Text>
        </Pressable>

        <Text style={{ color: colors.text, fontSize: 18, fontWeight: '700', marginTop: 32, marginBottom: 14 }}>Your courses</Text>
        {courses.length === 0 ? (
          <View style={{ alignItems: 'center', paddingVertical: 40 }}>
            <Text style={{ fontSize: 36, marginBottom: 10 }}>🧠</Text>
            <Text style={{ color: colors.muted, fontSize: 15 }}>No courses yet</Text>
            <Text style={{ color: colors.faint, fontSize: 13, marginTop: 4 }}>Create your first AI course above</Text>
          </View>
        ) : (
          courses.map(c => (
            <Pressable
              key={c.id}
              onPress={() => router.push(`/course/${c.id}`)}
              style={{ backgroundColor: colors.card, borderColor: colors.border, borderWidth: 1, borderRadius: 16, padding: 16, marginBottom: 12 }}
            >
              <Text style={{ color: colors.text, fontSize: 16, fontWeight: '600' }}>{c.title}</Text>
              {c.description ? <Text style={{ color: colors.muted, fontSize: 13, marginTop: 4 }} numberOfLines={2}>{c.description}</Text> : null}
              <Text style={{ color: colors.primary, fontSize: 12, marginTop: 8, textTransform: 'capitalize' }}>{c.difficulty}</Text>
            </Pressable>
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  )
}
