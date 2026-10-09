import React, { type ReactNode } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useColors } from '@/hooks/useColors';

export function money(value: number) {
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

export function timeLabel(value: string) {
  return new Date(value).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
}

export function SectionTitle({ title, eyebrow, action }: { title: string; eyebrow?: string; action?: ReactNode }) {
  const colors = useColors();
  return (
    <View style={styles.sectionHeader}>
      <View>
        {eyebrow ? <Text style={[styles.eyebrow, { color: colors.mutedForeground }]}>{eyebrow}</Text> : null}
        <Text style={[styles.sectionTitle, { color: colors.foreground }]}>{title}</Text>
      </View>
      {action}
    </View>
  );
}

export function PillButton({
  label, onPress, icon, tone = 'primary', disabled = false, testID,
}: {
  label: string; onPress: () => void; icon?: keyof typeof Feather.glyphMap;
  tone?: 'primary' | 'soft' | 'outline' | 'danger'; disabled?: boolean; testID?: string;
}) {
  const colors = useColors();
  const backgroundColor = tone === 'primary' ? colors.primary : tone === 'danger' ? colors.destructive : tone === 'soft' ? colors.secondary : 'transparent';
  const foregroundColor = tone === 'primary' || tone === 'danger' ? colors.primaryForeground : tone === 'soft' ? colors.secondaryForeground : colors.primary;
  return (
    <Pressable
      testID={testID}
      accessibilityRole="button"
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.pillButton,
        { backgroundColor, borderColor: colors.border, opacity: disabled ? 0.45 : pressed ? 0.78 : 1 },
        tone === 'outline' && { borderWidth: 1 },
      ]}
    >
      {icon ? <Feather name={icon} size={16} color={foregroundColor} /> : null}
      <Text style={[styles.pillText, { color: foregroundColor }]}>{label}</Text>
    </Pressable>
  );
}

export function IconButton({
  icon, onPress, accessibilityLabel, testID, tone = 'neutral',
}: {
  icon: keyof typeof Feather.glyphMap; onPress: () => void; accessibilityLabel: string; testID?: string; tone?: 'neutral' | 'primary' | 'danger';
}) {
  const colors = useColors();
  const color = tone === 'primary' ? colors.primary : tone === 'danger' ? colors.destructive : colors.foreground;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      testID={testID}
      onPress={onPress}
      style={({ pressed }) => [styles.iconButton, { backgroundColor: pressed ? colors.secondary : 'transparent', opacity: pressed ? 0.72 : 1 }]}
    >
      <Feather name={icon} size={19} color={color} />
    </Pressable>
  );
}

export function EmptyState({ icon, title, detail }: { icon: keyof typeof Feather.glyphMap; title: string; detail: string }) {
  const colors = useColors();
  return (
    <View style={[styles.empty, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <View style={[styles.emptyIcon, { backgroundColor: colors.accent }]}>
        <Feather name={icon} size={21} color={colors.primary} />
      </View>
      <Text style={[styles.emptyTitle, { color: colors.foreground }]}>{title}</Text>
      <Text style={[styles.emptyDetail, { color: colors.mutedForeground }]}>{detail}</Text>
    </View>
  );
}

export function LoadingState() {
  const colors = useColors();
  return <View style={styles.loading}><ActivityIndicator color={colors.primary} /><Text style={{ color: colors.mutedForeground, marginTop: 10 }}>Abrindo seu caixa...</Text></View>;
}

export function StorageWarning({ message }: { message: string }) {
  const colors = useColors();
  return (
    <View style={[styles.warning, { backgroundColor: colors.warning, borderColor: colors.warningBorder }]}>
      <Feather name="alert-circle" size={16} color={colors.warningForeground} />
      <Text style={[styles.warningText, { color: colors.warningForeground }]}>{message}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 14 },
  eyebrow: { fontSize: 11, fontWeight: '700', letterSpacing: 1.1, textTransform: 'uppercase', marginBottom: 5 },
  sectionTitle: { fontSize: 21, fontWeight: '700', letterSpacing: -0.45 },
  pillButton: { minHeight: 44, paddingHorizontal: 16, borderRadius: 14, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 8 },
  pillText: { fontSize: 14, fontWeight: '700' },
  iconButton: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center', borderRadius: 12 },
  empty: { borderWidth: 1, borderRadius: 22, padding: 25, alignItems: 'center', marginTop: 10 },
  emptyIcon: { width: 46, height: 46, borderRadius: 16, alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  emptyTitle: { fontSize: 16, fontWeight: '700', marginBottom: 5, textAlign: 'center' },
  emptyDetail: { fontSize: 13, lineHeight: 19, textAlign: 'center', maxWidth: 270 },
  loading: { flex: 1, minHeight: 220, alignItems: 'center', justifyContent: 'center' },
  warning: { borderWidth: 1, borderRadius: 13, padding: 12, flexDirection: 'row', alignItems: 'center', gap: 9, marginHorizontal: 18, marginTop: 8 },
  warningText: { flex: 1, fontSize: 12, lineHeight: 17, fontWeight: '600' },
});
