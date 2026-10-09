import React, { useMemo, useState } from 'react';
import { Alert, FlatList, Modal, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useCafe } from '@/context/CafeContext';
import { KeyboardAwareScrollViewCompat } from '@/components/KeyboardAwareScrollViewCompat';
import { EmptyState, IconButton, LoadingState, money, PillButton, SectionTitle, StorageWarning, timeLabel } from '@/components/pos-ui';
import { useColors } from '@/hooks/useColors';
import type { Order } from '@/types/pos';

export default function OrdersScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const {
    orders,
    finalizeOrder,
    createBlankOrder,
    requestOrderEdit,
    cancelOpenOrder,
    isLoading,
    storageError,
  } = useCafe();
  const [filter, setFilter] = useState<'open' | 'completed'>('open');
  const [newOrderOpen, setNewOrderOpen] = useState(false);
  const [newOrderLabel, setNewOrderLabel] = useState('');
  const visibleOrders = useMemo(() => orders.filter((order) => order.status === filter), [orders, filter]);
  const openOrders = orders.filter((order) => order.status === 'open');
  const todayTotal = orders.filter((order) => order.status === 'completed' && new Date(order.completedAt ?? order.createdAt).toDateString() === new Date().toDateString()).reduce((sum, order) => sum + order.total, 0);

  const complete = (id: string) => {
    const result = finalizeOrder(id);
    if (!result.ok) Alert.alert('Não foi possível finalizar', result.message);
    else Alert.alert('Pedido finalizado', `Comanda #${result.order.number} concluída e estoque atualizado.`);
  };

  const startNewOrder = () => {
    setNewOrderLabel('');
    setNewOrderOpen(true);
  };

  const createNewOrder = () => {
    const order = createBlankOrder(newOrderLabel);
    if (!order) return;
    setNewOrderOpen(false);
    router.navigate('/(tabs)');
  };

  const continueOrder = (id: string) => {
    requestOrderEdit(id);
    router.navigate('/(tabs)');
  };

  const cancelOrder = (order: Order) => {
    Alert.alert(
      'Cancelar comanda?',
      `${order.label ? `${order.label} · ` : ''}A comanda #${order.number} será removida. O estoque não será alterado.`,
      [
        { text: 'Manter comanda', style: 'cancel' },
        { text: 'Cancelar comanda', style: 'destructive', onPress: () => cancelOpenOrder(order.id) },
      ],
    );
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
            <View style={styles.headerRow}>
              <View>
                <Text style={[styles.eyebrow, { color: colors.mutedForeground }]}>ACOMPANHAMENTO</Text>
                <Text style={[styles.pageTitle, { color: colors.foreground }]}>Pedidos</Text>
              </View>
              <PillButton label="Nova comanda" icon="plus" onPress={startNewOrder} testID="new-order" />
            </View>
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
        renderItem={({ item }) => (
          <OrderCard
            order={item}
            onContinue={() => continueOrder(item.id)}
            onComplete={() => complete(item.id)}
            onCancel={() => cancelOrder(item)}
          />
        )}
        ListEmptyComponent={
          <EmptyState
            icon={filter === 'open' ? 'coffee' : 'archive'}
            title={filter === 'open' ? 'Tudo em dia por aqui' : 'Seu histórico começa aqui'}
            detail={filter === 'open' ? 'Os pedidos salvos em aberto aparecem nesta lista.' : 'Pedidos finalizados ficarão registrados nesta aba.'}
          />
        }
        scrollEnabled={visibleOrders.length > 0}
      />
      <Modal visible={newOrderOpen} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setNewOrderOpen(false)}>
        <View style={[styles.newOrderSheet, { backgroundColor: colors.background }]}>
          <View style={styles.newOrderHeading}>
            <View>
              <Text style={[styles.eyebrow, { color: colors.mutedForeground }]}>NOVO PEDIDO</Text>
              <Text style={[styles.newOrderTitle, { color: colors.foreground }]}>Criar comanda</Text>
            </View>
            <IconButton icon="x" onPress={() => setNewOrderOpen(false)} accessibilityLabel="Fechar" />
          </View>
          <KeyboardAwareScrollViewCompat
            style={{ flex: 1 }}
            contentContainerStyle={{ flexGrow: 1, justifyContent: 'space-between', paddingBottom: 28 }}
            keyboardShouldPersistTaps="handled"
            bottomOffset={24}
          >
            <View>
              <Text style={[styles.label, { color: colors.foreground }]}>Identificação (opcional)</Text>
              <TextInput
                testID="new-order-label"
                value={newOrderLabel}
                onChangeText={setNewOrderLabel}
                placeholder="Ex.: Mesa 3 ou Ana"
                placeholderTextColor={colors.mutedForeground}
                style={[styles.labelInput, { backgroundColor: colors.card, borderColor: colors.border, color: colors.foreground }]}
                returnKeyType="done"
                maxLength={32}
              />
              <Text style={[styles.hint, { color: colors.mutedForeground }]}>Você pode identificar por mesa, nome ou deixar sem identificação.</Text>
            </View>
            <PillButton label="Criar comanda" icon="arrow-right" onPress={createNewOrder} testID="confirm-new-order" />
          </KeyboardAwareScrollViewCompat>
        </View>
      </Modal>
    </View>
  );
}

function OrderCard({
  order,
  onContinue,
  onComplete,
  onCancel,
}: {
  order: Order;
  onContinue: () => void;
  onComplete: () => void;
  onCancel: () => void;
}) {
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
            <Text style={[styles.orderNumber, { color: colors.foreground }]}>{order.label || `Comanda #${order.number}`}</Text>
            <Text style={[styles.orderTime, { color: colors.mutedForeground }]}>{order.label ? `Comanda #${order.number} · ` : ''}{open ? 'Aberta' : 'Finalizada'} às {timeLabel(order.completedAt ?? order.createdAt)}</Text>
          </View>
        </View>
        <View style={styles.orderHeadRight}>
          {open ? <IconButton icon="x" onPress={onCancel} accessibilityLabel={`Cancelar comanda ${order.number}`} testID={`cancel-order-${order.number}`} tone="danger" /> : null}
          <Text style={[styles.orderTotal, { color: colors.primary }]}>{money(order.total)}</Text>
        </View>
      </View>
      <View style={[styles.orderDivider, { borderColor: colors.border }]} />
      {order.lines.length ? (
        <View style={{ gap: 7 }}>
          {order.lines.map((line) => (
            <View key={`${order.id}-${line.productId}`} style={styles.orderLine}>
              <Text style={[styles.lineQty, { color: colors.mutedForeground }]}>{line.quantity}×</Text>
              <Text style={[styles.lineTitle, { color: colors.foreground }]} numberOfLines={1}>{line.name}</Text>
              <Text style={[styles.lineAmount, { color: colors.foreground }]}>{money(line.quantity * line.price)}</Text>
            </View>
          ))}
        </View>
      ) : (
        <Text style={[styles.emptyOrderText, { color: colors.mutedForeground }]}>Comanda vazia. Continue para incluir produtos.</Text>
      )}
      {open ? (
        <View style={styles.orderAction}>
          <PillButton label="Continuar" icon="edit-2" tone="soft" onPress={onContinue} testID={`continue-order-${order.number}`} />
          <PillButton label="Finalizar" icon="check" onPress={onComplete} disabled={!order.lines.length} testID={`complete-order-${order.number}`} />
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
  headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  newOrderSheet: { flex: 1, paddingTop: 22, paddingHorizontal: 20 },
  newOrderHeading: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 25 },
  newOrderTitle: { fontSize: 24, fontWeight: '700', letterSpacing: -0.6 },
  label: { fontSize: 13, fontWeight: '700', marginBottom: 9 },
  labelInput: { minHeight: 52, borderWidth: 1, borderRadius: 15, paddingHorizontal: 14, fontSize: 15 },
  hint: { fontSize: 12, lineHeight: 18, marginTop: 9 },
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
  orderHeadRight: { flexDirection: 'row', alignItems: 'center', gap: 2 },
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
  emptyOrderText: { fontSize: 12, lineHeight: 18 },
  orderAction: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 8, marginTop: 15 },
  completedTag: { alignSelf: 'flex-start', marginTop: 14, borderRadius: 12, paddingHorizontal: 10, paddingVertical: 7, flexDirection: 'row', alignItems: 'center', gap: 6 },
  completedText: { fontSize: 11, fontWeight: '700' },
});
