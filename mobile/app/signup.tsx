import { useState } from 'react'
import { View, Text, TextInput, Pressable, ActivityIndicator, KeyboardAvoidingView, Platform } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Link } from 'expo-router'
import { supabase } from '../lib/supabase'
import { colors } from '../theme'

export default function Signup() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [done, setDone] = useState(false)

  const handleSignup = async () => {
    setLoading(true)
    setError('')
    const { error } = await supabase.auth.signUp({ email: email.trim(), password })
    if (error) {
      setError(error.message)
      setLoading(false)
    } else {
      setDone(true)
    }
  }

  if (done) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg, alignItems: 'center', justifyContent: 'center', padding: 24 }}>
        <Text style={{ fontSize: 40, marginBottom: 12 }}>✅</Text>
        <Text style={{ color: colors.text, fontSize: 22, fontWeight: '700', textAlign: 'center' }}>Account created!</Text>
        <Text style={{ color: colors.muted, fontSize: 15, marginTop: 8, textAlign: 'center' }}>
          You can now sign in and start learning.
        </Text>
        <Link href="/login" style={{ color: colors.primary, fontSize: 15, fontWeight: '600', marginTop: 24 }}>
          Go to sign in
        </Link>
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }}>
      <KeyboardAvoidingView
        style={{ flex: 1, paddingHorizontal: 24, justifyContent: 'center' }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={{ marginBottom: 40 }}>
          <View style={{ width: 48, height: 48, borderRadius: 14, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center', marginBottom: 20 }}>
            <Text style={{ fontSize: 24 }}>⚡</Text>
          </View>
          <Text style={{ color: colors.text, fontSize: 28, fontWeight: '700' }}>Create your account</Text>
          <Text style={{ color: colors.muted, fontSize: 15, marginTop: 6 }}>Start learning anything with AI</Text>
        </View>

        <Text style={styles.label}>Email</Text>
        <TextInput
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          keyboardType="email-address"
          placeholder="you@example.com"
          placeholderTextColor={colors.faint}
          style={styles.input}
        />

        <Text style={[styles.label, { marginTop: 16 }]}>Password</Text>
        <TextInput
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          placeholder="At least 6 characters"
          placeholderTextColor={colors.faint}
          style={styles.input}
        />

        {error ? <Text style={{ color: colors.red, marginTop: 14, fontSize: 14 }}>{error}</Text> : null}

        <Pressable onPress={handleSignup} disabled={loading} style={styles.button}>
          {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Create Free Account</Text>}
        </Pressable>

        <View style={{ flexDirection: 'row', justifyContent: 'center', marginTop: 24 }}>
          <Text style={{ color: colors.faint, fontSize: 14 }}>Already have an account? </Text>
          <Link href="/login" style={{ color: colors.primary, fontSize: 14, fontWeight: '600' }}>
            Sign in
          </Link>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
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
