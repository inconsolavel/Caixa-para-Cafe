import React, { useMemo, useState } from 'react';
import { Alert, FlatList, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useCafe } from '@/context/CafeContext';
import { EmptyState, LoadingState, money, PillButton, SectionTitle, StorageWarning, timeLabel } from '@/components/pos-ui';
import { useColors } from '@/hooks/useColors';
import type { Order } from '@/types/pos';

export default function OrdersScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { orders, finalizeOrder, isLoading, storageError } = useCafe();
  const [filter, setFilter] = useState<'open' | 'completed'>('open');
  const visibleOrders = useMemo(() => orders.filter((order) => order.status === filter), [orders, filter]);
  const openOrders = orders.filter((order) => order.status === 'open');
  const todayTotal = orders.filter((order) => order.status === 'completed' && new Date(order.completedAt ?? order.createdAt).toDateString() === new Date().toDateString()).reduce((sum, order) => sum + order.total, 0);

  const complete = (id: string) => {
    const result = finalizeOrder(id);
    if (!result.ok) Alert.alert('Não foi possível finalizar', result.message);
    else Alert.alert('Pedido finalizado', `Comanda #${result.order.number} concluída e estoque atualizado.`);
  };

  if (isLoading) return <LoadingState />;
  return (
    <View style={[styles.screen, { backgroundColor: colors.background }]}>
      <FlatList
        data={visibleOrders}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ paddingHorizontal: 18, paddingTop: insets.top + 12, paddingBottom: 38 }}
        ListHeaderComponent={
          <View>
            <Text style={[styles.eyebrow, { color: colors.mutedForeground }]}>ACOMPANHAMENTO</Text>
            <Text style={[styles.pageTitle, { color: colors.foreground }]}>Pedidos</Text>
            {storageError ? <StorageWarning message={storageError} /> : null}
            <View style={styles.metrics}>
              <View style={[styles.metric, { backgroundColor: colors.primary }]}>
                <Text style={[styles.metricLabelLight, { color: colors.primaryMuted }]}>EM ABERTO</Text>
                <Text style={[styles.metricValueLight, { color: colors.primaryForeground }]}>{openOrders.length}</Text>
                <Feather name="clock" size={15} color={colors.primaryMuted} style={styles.metricIcon} />
              </View>
              <View style={[styles.metric, { backgroundColor: colors.accent }]}>
                <Text style={[styles.metricLabel, { color: colors.mutedForeground }]}>VENDAS HOJE</Text>
                <Text style={[styles.metricValue, { color: colors.primary }]}>{money(todayTotal)}</Text>
                <Feather name="trending-up" size={15} color={colors.primary} style={styles.metricIcon} />
              </View>
            </View>
            <View style={[styles.switcher, { backgroundColor: colors.secondary }]}>
              {(['open', 'completed'] as const).map((value) => {
                const selected = value === filter;
                return (
                  <Pressable key={value} testID={`orders-filter-${value}`} accessibilityRole="button" onPress={() => setFilter(value)} style={[styles.switchItem, selected && { backgroundColor: colors.card }]}>
                    <Text style={[styles.switchText, { color: selected ? colors.foreground : colors.mutedForeground }]}>{value === 'open' ? `Em aberto (${openOrders.length})` : 'Histórico'}</Text>
                  </Pressable>
                );
              })}
            </View>
            <SectionTitle title={filter === 'open' ? 'Aguardando' : 'Finalizados'} eyebrow={filter === 'open' ? 'Pedidos que ainda não foram concluídos' : 'Pedidos concluídos neste aparelho'} />
          </View>
        }
        renderItem={({ item }) => <OrderCard order={item} onComplete={() => complete(item.id)} />}
        ListEmptyComponent={
          <EmptyState
            icon={filter === 'open' ? 'coffee' : 'archive'}
            title={filter === 'open' ? 'Tudo em dia por aqui' : 'Seu histórico começa aqui'}
            detail={filter === 'open' ? 'Os pedidos salvos em aberto aparecem nesta lista.' : 'Pedidos finalizados ficarão registrados nesta aba.'}
          />
        }
        scrollEnabled={visibleOrders.length > 0}
      />
    </View>
  );
}

function OrderCard({ order, onComplete }: { order: Order; onComplete: () => void }) {
  const colors = useColors();
  const open = order.status === 'open';
  return (
    <View style={[styles.orderCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <View style={styles.orderHead}>
        <View style={styles.orderIdentity}>
          <View style={[styles.orderIcon, { backgroundColor: open ? colors.accent : colors.success }]}>
            <Feather name={open ? 'clock' : 'check'} size={16} color={open ? colors.primary : colors.successForeground} />
          </View>
          <View>
            <Text style={[styles.orderNumber, { color: colors.foreground }]}>Comanda #{order.number}</Text>
            <Text style={[styles.orderTime, { color: colors.mutedForeground }]}>{open ? 'Aberta' : 'Finalizada'} às {timeLabel(order.completedAt ?? order.createdAt)}</Text>
          </View>
        </View>
        <Text style={[styles.orderTotal, { color: colors.primary }]}>{money(order.total)}</Text>
      </View>
      <View style={[styles.orderDivider, { borderColor: colors.border }]} />
      <View style={{ gap: 7 }}>
        {order.lines.map((line) => (
          <View key={`${order.id}-${line.productId}`} style={styles.orderLine}>
            <Text style={[styles.lineQty, { color: colors.mutedForeground }]}>{line.quantity}×</Text>
            <Text style={[styles.lineTitle, { color: colors.foreground }]} numberOfLines={1}>{line.name}</Text>
            <Text style={[styles.lineAmount, { color: colors.foreground }]}>{money(line.quantity * line.price)}</Text>
          </View>
        ))}
      </View>
      {open ? (
        <View style={styles.orderAction}>
          <PillButton label="Finalizar pedido" icon="check" onPress={onComplete} testID={`complete-order-${order.number}`} />
        </View>
      ) : (
        <View style={[styles.completedTag, { backgroundColor: colors.success }]}>
          <Feather name="check-circle" size={13} color={colors.successForeground} />
          <Text style={[styles.completedText, { color: colors.successForeground }]}>Pedido concluído</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  eyebrow: { fontSize: 10, fontWeight: '800', letterSpacing: 1.4, marginBottom: 5 },
  pageTitle: { fontSize: 28, fontWeight: '700', letterSpacing: -0.8, marginBottom: 17 },
  metrics: { flexDirection: 'row', gap: 10, marginBottom: 18 },
  metric: { flex: 1, minHeight: 101, padding: 14, borderRadius: 19, justifyContent: 'center' },
  metricLabel: { fontSize: 9, letterSpacing: 1, fontWeight: '800' },
  metricLabelLight: { fontSize: 9, letterSpacing: 1, fontWeight: '800' },
  metricValue: { fontSize: 20, fontWeight: '800', marginTop: 7 },
  metricValueLight: { fontSize: 23, fontWeight: '800', marginTop: 6 },
  metricIcon: { position: 'absolute', right: 13, top: 13 },
  switcher: { flexDirection: 'row', padding: 4, borderRadius: 16, marginBottom: 23 },
  switchItem: { flex: 1, alignItems: 'center', justifyContent: 'center', minHeight: 39, borderRadius: 12 },
  switchText: { fontSize: 13, fontWeight: '700' },
  orderCard: { borderWidth: 1, borderRadius: 20, padding: 15, marginBottom: 12 },
  orderHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10 },
  orderIdentity: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  orderIcon: { width: 36, height: 36, borderRadius: 13, alignItems: 'center', justifyContent: 'center' },
  orderNumber: { fontSize: 15, fontWeight: '800' },
  orderTime: { fontSize: 11, marginTop: 3 },
  orderTotal: { fontSize: 15, fontWeight: '800' },
  orderDivider: { borderBottomWidth: 1, borderStyle: 'dashed', marginVertical: 13 },
  orderLine: { flexDirection: 'row', alignItems: 'center', gap: 7 },
  lineQty: { fontSize: 12, fontWeight: '700', width: 24 },
  lineTitle: { flex: 1, fontSize: 13 },
  lineAmount: { fontSize: 12, fontWeight: '600' },
  orderAction: { alignItems: 'flex-start', marginTop: 15 },
  completedTag: { alignSelf: 'flex-start', marginTop: 14, borderRadius: 12, paddingHorizontal: 10, paddingVertical: 7, flexDirection: 'row', alignItems: 'center', gap: 6 },
  completedText: { fontSize: 11, fontWeight: '700' },
});
