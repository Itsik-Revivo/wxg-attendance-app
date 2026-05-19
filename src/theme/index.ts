import { StyleSheet } from 'react-native';

export const Colors = {
  primary:     '#1B3A6B',   // כחול כהה WXG
  primaryLight:'#2E5FA3',
  accent:      '#E8A020',   // כתום
  success:     '#2E7D32',
  error:       '#C62828',
  warning:     '#F57F17',
  bg:          '#F4F6F9',
  surface:     '#FFFFFF',
  border:      '#DDE3ED',
  textPrimary: '#1A1A2E',
  textSecondary:'#5A6478',
  textMuted:   '#9AA3B2',
  clockedIn:   '#E8F5E9',
  clockedInBorder: '#2E7D32',
};

export const Spacing = {
  xs:  4,
  sm:  8,
  md:  16,
  lg:  24,
  xl:  32,
  xxl: 48,
};

export const Radius = {
  sm:  6,
  md:  12,
  lg:  20,
  full: 999,
};

export const Typography = StyleSheet.create({
  h1: { fontSize: 24, fontWeight: '700', color: Colors.textPrimary, textAlign: 'right' },
  h2: { fontSize: 20, fontWeight: '700', color: Colors.textPrimary, textAlign: 'right' },
  h3: { fontSize: 16, fontWeight: '600', color: Colors.textPrimary, textAlign: 'right' },
  body: { fontSize: 14, fontWeight: '400', color: Colors.textPrimary, textAlign: 'right' },
  caption: { fontSize: 12, fontWeight: '400', color: Colors.textSecondary, textAlign: 'right' },
  label: { fontSize: 13, fontWeight: '500', color: Colors.textSecondary, textAlign: 'right' },
});

export const Shadows = {
  card: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  button: {
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 5,
  },
};
