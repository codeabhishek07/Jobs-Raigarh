import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, radius } from '../lib/theme';

export function BarChart({ data, height = 160 }: { data: { label: string; value: number; color?: string }[]; height?: number }) {
  const max = Math.max(1, ...data.map((d) => d.value));
  return (
    <View style={[styles.barWrap, { height }]}>
      {data.map((d, i) => (
        <View key={i} style={styles.barCol}>
          <Text style={styles.barValue}>{d.value}</Text>
          <View style={styles.barTrack}>
            <View style={[styles.bar, { height: `${(d.value / max) * 100}%`, backgroundColor: d.color ?? colors.primary }]} />
          </View>
          <Text style={styles.barLabel} numberOfLines={1}>{d.label}</Text>
        </View>
      ))}
    </View>
  );
}

export function HBarChart({ data }: { data: { label: string; value: number; color?: string }[] }) {
  const max = Math.max(1, ...data.map((d) => d.value));
  return (
    <View style={{ gap: 12 }}>
      {data.map((d, i) => (
        <View key={i}>
          <View style={styles.hRow}>
            <Text style={styles.hLabel} numberOfLines={1}>{d.label}</Text>
            <Text style={styles.hValue}>{d.value}</Text>
          </View>
          <View style={styles.hTrack}>
            <View style={[styles.hFill, { width: `${(d.value / max) * 100}%`, backgroundColor: d.color ?? colors.primary }]} />
          </View>
        </View>
      ))}
    </View>
  );
}

export function DonutLegend({ data }: { data: { label: string; value: number; color: string }[] }) {
  const total = Math.max(1, data.reduce((s, d) => s + d.value, 0));
  return (
    <View>
      <View style={styles.stackedBar}>
        {data.map((d, i) => (
          <View key={i} style={{ flex: Math.max(0.001, d.value), backgroundColor: d.color }} />
        ))}
      </View>
      <View style={styles.legendWrap}>
        {data.map((d, i) => (
          <View key={i} style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: d.color }]} />
            <Text style={styles.legendLabel}>{d.label}</Text>
            <Text style={styles.legendValue}>{d.value} ({Math.round((d.value / total) * 100)}%)</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  barWrap: { flexDirection: 'row', alignItems: 'flex-end', gap: 8 },
  barCol: { flex: 1, alignItems: 'center', height: '100%', justifyContent: 'flex-end' },
  barTrack: { width: '70%', flex: 1, justifyContent: 'flex-end', marginVertical: 4 },
  bar: { width: '100%', borderRadius: 6, minHeight: 4 },
  barValue: { fontSize: 11, fontWeight: '700', color: colors.textMuted },
  barLabel: { fontSize: 10, color: colors.textMuted, marginTop: 4 },
  hRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 5 },
  hLabel: { fontSize: 13, color: colors.text, fontWeight: '600', flex: 1 },
  hValue: { fontSize: 13, fontWeight: '800', color: colors.text },
  hTrack: { height: 10, backgroundColor: colors.bg, borderRadius: radius.pill, overflow: 'hidden' },
  hFill: { height: '100%', borderRadius: radius.pill, minWidth: 4 },
  stackedBar: { flexDirection: 'row', height: 18, borderRadius: radius.pill, overflow: 'hidden', backgroundColor: colors.bg },
  legendWrap: { marginTop: 14, gap: 9 },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  legendDot: { width: 11, height: 11, borderRadius: 3 },
  legendLabel: { fontSize: 13, color: colors.text, flex: 1 },
  legendValue: { fontSize: 12.5, color: colors.textMuted, fontWeight: '600' },
});
