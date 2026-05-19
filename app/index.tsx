// app/index.tsx
import { useEffect } from 'react';
import { router } from 'expo-router';
import { useAuthStore } from '../src/store/auth.store';
import { View, ActivityIndicator } from 'react-native';
import { Colors } from '../src/theme';

export default function Index() {
  const { loadToken, token } = useAuthStore();

  useEffect(() => {
    (async () => {
      await loadToken();
      if (token) {
        router.replace('/(tabs)/home');
      } else {
        router.replace('/login');
      }
    })();
  }, []);

  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: Colors.primary }}>
      <ActivityIndicator color="#fff" size="large" />
    </View>
  );
}
