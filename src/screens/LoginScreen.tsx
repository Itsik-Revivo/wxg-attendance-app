import React, { useEffect } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  ActivityIndicator, Image, SafeAreaView,
} from 'react-native';
import { router } from 'expo-router';
import { useAuthStore } from '../store/auth.store';
import { employeeApi } from '../api/client';
import { Colors, Spacing, Radius, Shadows, Typography } from '../theme';

export default function LoginScreen() {
  const { login, loadToken, token, setEmployee, isLoading, error } = useAuthStore();

  // On mount: restore saved token and fetch profile
  useEffect(() => {
    (async () => {
      await loadToken();
    })();
  }, []);

  useEffect(() => {
    if (!token) return;
    (async () => {
      try {
        const { data } = await employeeApi.getMe();
        setEmployee(data);
        router.replace('/(tabs)/home');
      } catch {
        // Token expired or invalid — stay on login
      }
    })();
  }, [token]);

  return (
    <SafeAreaView style={s.container}>
      <View style={s.inner}>

        {/* Logo / Branding */}
        <View style={s.logoBlock}>
          <View style={s.logoCircle}>
            <Text style={s.logoText}>WXG</Text>
          </View>
          <Text style={s.title}>מערכת נוכחות</Text>
          <Text style={s.subtitle}>וקסמן גרופ</Text>
        </View>

        {/* Login button */}
        <View style={s.loginBlock}>
          {error && <Text style={s.errorText}>{error}</Text>}

          <TouchableOpacity
            style={[s.btn, isLoading && s.btnDisabled]}
            onPress={login}
            disabled={isLoading}
            activeOpacity={0.85}
          >
            {isLoading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <>
                <Text style={s.btnIcon}>🔐</Text>
                <Text style={s.btnText}>כניסה עם חשבון WXG</Text>
              </>
            )}
          </TouchableOpacity>

          <Text style={s.hint}>
            הכניסה מתבצעת דרך חשבון Microsoft הארגוני שלך
          </Text>
        </View>

      </View>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.primary,
  },
  inner: {
    flex: 1,
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.xxl,
  },
  logoBlock: {
    alignItems: 'center',
    marginTop: Spacing.xxl,
  },
  logoCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(255,255,255,0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.lg,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  logoText: {
    fontSize: 28,
    fontWeight: '800',
    color: '#fff',
    letterSpacing: 2,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#fff',
    marginBottom: Spacing.xs,
  },
  subtitle: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.7)',
  },
  loginBlock: {
    width: '100%',
    alignItems: 'center',
  },
  btn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: Radius.lg,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.xl,
    width: '100%',
    justifyContent: 'center',
    gap: Spacing.sm,
    ...Shadows.button,
  },
  btnDisabled: {
    opacity: 0.7,
  },
  btnIcon: {
    fontSize: 20,
  },
  btnText: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.primary,
  },
  errorText: {
    color: '#FFB3B3',
    marginBottom: Spacing.md,
    textAlign: 'center',
  },
  hint: {
    marginTop: Spacing.md,
    fontSize: 13,
    color: 'rgba(255,255,255,0.5)',
    textAlign: 'center',
  },
});
