import { StyleSheet, Text, View } from 'react-native';
import { badgeStatus } from '@cargo/tokens';
import { role, space, type } from './theme';
import { StatusBadge } from './StatusBadge';
import type { StatusValue } from './labels';

export interface TimelineStep {
  status: StatusValue;
  at?: string;
  state?: 'done' | 'current' | 'upcoming';
}

/**
 * Timeline (RN) — `status`-axis history only. Step type is `StatusValue`, so
 * claim_status can never appear here (TZ §3). Each step reuses StatusBadge.
 */
export function Timeline({ steps }: { steps: readonly TimelineStep[] }) {
  return (
    <View>
      {steps.map((step, i) => {
        const last = i === steps.length - 1;
        const upcoming = step.state === 'upcoming';
        return (
          <View key={`${step.status}-${i}`} style={styles.row}>
            <View style={styles.rail}>
              <View
                style={[
                  styles.dot,
                  { backgroundColor: badgeStatus[step.status].text },
                  step.state === 'current' && styles.dotCurrent,
                  upcoming && styles.dim,
                ]}
              />
              {!last && <View style={[styles.line, upcoming && styles.dim]} />}
            </View>
            <View style={styles.body}>
              <StatusBadge status={step.status} />
              {step.at && <Text style={styles.meta}>{step.at}</Text>}
            </View>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: space[3] },
  rail: { alignItems: 'center' },
  dot: {
    width: 14,
    height: 14,
    borderRadius: 999,
    marginTop: 3,
    borderWidth: 2,
    borderColor: role.bg.surface,
  },
  dotCurrent: { borderColor: role.accent.subtle, borderWidth: 3 },
  line: { width: 2, flex: 1, minHeight: space[4], backgroundColor: role.border.default, marginVertical: 2 },
  dim: { opacity: 0.5 },
  body: { flex: 1, paddingBottom: space[3], gap: 2 },
  meta: { fontSize: type.sm.fontSize, lineHeight: type.sm.lineHeight, color: role.text.muted, fontFamily: 'monospace' },
});
