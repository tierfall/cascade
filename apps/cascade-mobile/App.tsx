import { CascadeClient } from '@tierfall/cascade-sdk';
import { colors, spacing, typography } from '@tierfall/cascade-tokens';
import { StatusBar } from 'expo-status-bar';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

// Boundary proof: the SDK constructor runs on RN without any DOM polyfill.
// We don't actually hit the API — we just prove the constructor type-checks AND
// runs in the RN bundler.
const _client = new CascadeClient({ baseUrl: 'http://localhost:3000' });
void _client;

/** Convert a rem string (e.g. "1.5rem") to React Native pixels (base-16). */
function rem(value: string): number {
  return parseFloat(value) * 16;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.neutral.background.dark,
    alignItems: 'center',
    justifyContent: 'center',
    padding: rem(spacing['6']),
  },
  title: {
    color: colors.neutral.foreground.dark,
    fontFamily: typography.fontFamily.sans.split(',')[0]?.trim() ?? 'System',
    fontSize: rem(typography.fontSize.h1),
    fontWeight: '700',
    marginBottom: rem(spacing['4']),
  },
  tierRow: {
    flexDirection: 'row',
    gap: rem(spacing['2']),
  },
  tierBadge: {
    paddingHorizontal: rem(spacing['2']),
    paddingVertical: rem(spacing['1']),
    borderRadius: 9999,
  },
  tierLabel: {
    color: '#ffffff',
    fontSize: rem(typography.fontSize.caption),
    fontWeight: '500',
  },
});

export default function App(): React.JSX.Element {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Cascade</Text>
      <View style={styles.tierRow}>
        {colors.tier.map((color, i) => (
          <View key={i} style={[styles.tierBadge, { backgroundColor: color }]}>
            <Text style={styles.tierLabel}>Tier {i}</Text>
          </View>
        ))}
      </View>
      <StatusBar style="light" />
    </View>
  );
}
