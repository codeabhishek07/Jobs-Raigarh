import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { colors } from '../lib/theme';
import { AppStatus } from '../lib/types';
import { fmtDate } from './ui';

const CHAIN: AppStatus[] = ['Applied', 'Under Review', 'Shortlisted', 'Interview', 'Selected'];

export default function StatusTimeline({
  status,
  history,
}: {
  status: AppStatus;
  history: { status: AppStatus; at: number; note?: string }[];
}) {
  const rejected = status === 'Rejected';
  const reachedIdx = rejected
    ? Math.max(0, CHAIN.indexOf(history[history.length - 2]?.status ?? 'Applied'))
    : CHAIN.indexOf(status);

  const steps = rejected
    ? [...CHAIN.slice(0, Math.max(1, reachedIdx + 1)), 'Rejected' as AppStatus]
    : CHAIN;

  const getAt = (s: AppStatus) => history.find((h) => h.status === s)?.at;

  return (
    <View style={styles.wrap}>
      {steps.map((s, i) => {
        const done = rejected ? s !== 'Rejected' && i <= reachedIdx : i <= reachedIdx;
        const isCurrent = s === status;
        const isReject = s === 'Rejected';
        const color = isReject ? colors.red : done || isCurrent ? colors.primary : colors.border;
        const at = getAt(s);
        return (
          <View key={s} style={styles.row}>
            <View style={styles.railCol}>
              <View
                style={[
                  styles.dot,
                  { backgroundColor: done || isCurrent || isReject ? color : colors.card, borderColor: color },
                ]}
              >
                {(done || isCurrent || isReject) && (
                  <Ionicons name={isReject ? 'close' : 'checkmark'} size={11} color={colors.white} />
                )}
              </View>
              {i < steps.length - 1 && (
                <View
                  style={[
                    styles.line,
                    { backgroundColor: i < reachedIdx && !isReject ? colors.primary : colors.border },
                  ]}
                />
              )}
            </View>
            <View style={styles.textCol}>
              <Text
                style={[
                  styles.stepTitle,
                  { color: isReject ? colors.red : done || isCurrent ? colors.text : colors.textFaint },
                  isCurrent && { fontWeight: '800' },
                ]}
              >
                {s}
              </Text>
              {at ? <Text style={styles.stepDate}>{fmtDate(at)}</Text> : null}
            </View>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { paddingVertical: 4 },
  row: { flexDirection: 'row' },
  railCol: { alignItems: 'center', width: 30 },
  dot: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  line: { width: 2, flex: 1, minHeight: 22, marginVertical: 2 },
  textCol: { flex: 1, paddingBottom: 18, paddingLeft: 6, paddingTop: 1 },
  stepTitle: { fontSize: 14.5, fontWeight: '600' },
  stepDate: { fontSize: 12, color: colors.textFaint, marginTop: 2 },
});
