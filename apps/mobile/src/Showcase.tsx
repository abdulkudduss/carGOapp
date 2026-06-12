import { useState } from 'react';
import { SafeAreaView, ScrollView, StyleSheet, Text, View } from 'react-native';
import { role, space, type, weight } from './ui/theme';
import {
  Button,
  Input,
  StatusBadge,
  ClaimBadge,
  Card,
  Timeline,
  BottomSheet,
  Skeleton,
  EmptyState,
  ToastProvider,
  useToast,
  STATUS_ORDER,
  CLAIM_ORDER,
} from './ui/index';

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={styles.section}>
      <Text style={styles.h2}>{title}</Text>
      {children}
    </View>
  );
}

function ToastButtons() {
  const { toast } = useToast();
  return (
    <View style={styles.rowWrap}>
      <Button title="success" variant="primary" onPress={() => toast({ variant: 'success', title: 'Принято', description: 'CARGO-A1B2C3D4' })} />
      <Button title="danger" variant="danger" onPress={() => toast({ variant: 'danger', title: 'Ошибка', description: 'ALREADY_CLAIMED' })} />
    </View>
  );
}

export function Showcase() {
  const [scan, setScan] = useState('');
  const [sheetOpen, setSheetOpen] = useState(false);

  return (
    <ToastProvider>
      <SafeAreaView style={styles.screen}>
        <ScrollView contentContainerStyle={styles.content}>
          <Text style={styles.h1}>CARGO · RN UI</Text>
          <Text style={styles.sub}>Витрина базовых компонентов на @cargo/tokens (comfortable)</Text>

          <Section title="Buttons">
            <View style={styles.colGap}>
              <Button title="Принять посылку" variant="primary" />
              <Button title="Отмена" variant="secondary" />
              <Button title="Подробнее" variant="ghost" />
              <Button title="Утилизировать" variant="danger" />
              <Button title="Disabled" variant="primary" disabled />
            </View>
          </Section>

          <Section title="Input">
            <View style={styles.colGap}>
              <Input label="Поиск" placeholder="Код, трек или телефон" value={scan} onChangeText={setScan} />
              <Input label="Код посылки" hint="Формат CARGO-XXXXXXXX" mono placeholder="CARGO-" />
              <Input label="Трек-номер" error="Такой трек не найден" defaultValue="JP000000" />
            </View>
          </Section>

          <Section title="StatusBadge — все 10 (ось status)">
            <View style={styles.colGap}>
              {STATUS_ORDER.map((s) => (
                <StatusBadge key={s} status={s} />
              ))}
            </View>
          </Section>

          <Section title="ClaimBadge — все 3 (ось claim_status)">
            <View style={styles.colGap}>
              {CLAIM_ORDER.map((c) => (
                <ClaimBadge key={c} claim={c} />
              ))}
            </View>
          </Section>

          <Section title="DELIVERY vs LOST (различимость)">
            <View style={styles.rowWrap}>
              <StatusBadge status="DELIVERY" />
              <StatusBadge status="LOST" />
            </View>
          </Section>

          <Section title="Card">
            <Card header="CARGO-A1B2C3D4" footer={<Button title="Выдать" variant="primary" fullWidth />}>
              <View style={styles.rowWrap}>
                <StatusBadge status="DELIVERY" />
                <ClaimBadge claim="CLAIMED" />
              </View>
            </Card>
          </Section>

          <Section title="Timeline (ось status)">
            <Timeline
              steps={[
                { status: 'SHIPPED', at: '03.06 08:00', state: 'done' },
                { status: 'AT_KG', at: '09.06 11:25', state: 'done' },
                { status: 'DELIVERY', at: '10.06 10:05', state: 'current' },
                { status: 'DONE', state: 'upcoming' },
              ]}
            />
          </Section>

          <Section title="BottomSheet">
            <Button title="Открыть sheet" variant="secondary" onPress={() => setSheetOpen(true)} />
          </Section>

          <Section title="Toast">
            <ToastButtons />
          </Section>

          <Section title="Skeleton">
            <Card>
              <View style={styles.colGap}>
                <Skeleton width={140} height={14} />
                <Skeleton width="100%" height={12} />
                <Skeleton width="70%" height={12} />
              </View>
            </Card>
          </Section>

          <Section title="EmptyState">
            <EmptyState
              icon="📦"
              title="Здесь пока пусто"
              description="Привязанных посылок нет."
              action={<Button title="Обновить" variant="secondary" />}
            />
          </Section>
        </ScrollView>

        <BottomSheet
          open={sheetOpen}
          onClose={() => setSheetOpen(false)}
          title="CARGO-A1B2C3D4"
          footer={<Button title="Закрыть" variant="primary" fullWidth onPress={() => setSheetOpen(false)} />}
        >
          <Timeline
            steps={[
              { status: 'AT_KG', at: '09.06', state: 'done' },
              { status: 'DELIVERY', at: '10.06', state: 'current' },
            ]}
          />
        </BottomSheet>
      </SafeAreaView>
    </ToastProvider>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: role.bg.app },
  content: { padding: space[4], gap: space[6] },
  h1: { fontSize: type['2xl'].fontSize, lineHeight: type['2xl'].lineHeight, fontWeight: weight.bold, color: role.accent.primary },
  sub: { fontSize: type.md.fontSize, lineHeight: type.md.lineHeight, color: role.text.secondary },
  section: { gap: space[3] },
  h2: { fontSize: type.lg.fontSize, lineHeight: type.lg.lineHeight, fontWeight: weight.semibold, color: role.text.primary },
  colGap: { gap: space[2] },
  rowWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: space[2], alignItems: 'center' },
});
