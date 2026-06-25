import { View, ActivityIndicator } from 'react-native'
import { colors } from '../theme'

export default function Index() {
  // Routing is handled in _layout based on auth state; show a loader meanwhile.
  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.bg }}>
      <ActivityIndicator color={colors.primary} size="large" />
    </View>
  )
}
