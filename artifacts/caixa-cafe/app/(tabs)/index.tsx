import React, { useEffect, useMemo, useState } from 'react';
import {
  FlatList,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  Alert,
} from 'react-native';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { KeyboardAvoidingView } from 'react-native-keyboard-controller';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useCafe } from '@/context/CafeContext';
import { EmptyState, LoadingState, money, PillButton, SectionTitle, StorageWarning } from '@/components/pos-ui';
import { useColors } from '@/hooks/useColors';
import type { OrderLine, Product } from '@/types/pos';

const iconForCategory: Record<string, keyof typeof MaterialCommunityIcons.glyphMap> = {
  Cafés: 'coffee-outline', Comidas: 'bread-slice-outline', Chás: 'tea-outline', Outros: 'silverware-fork-knife',
};

export default function CashScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const {
    products,
    orders,
    isLoading,
    storageError,
    orderIdToEdit,
    createOrder,
    updateOpenOrder,
    clearOrderEditRequest,
  } = useCafe();
  const [category, setCategory] = useState('Tudo');
  const [search, setSearch] = useState('');
  const [cart, setCart] = useState<OrderLine[]>([]);
  const [editingOrderId, setEditingOrderId] = useState<string | null>(null);
  const [cartOpen, setCartOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const categories = useMemo(() => ['Tudo', ...Array.from(new Set(products.map((item) => item.category)))], [products]);
  const filtered = useMemo(() => products.filter((product) => {
    const matchesCategory = category === 'Tudo' || product.category === category;
    return matchesCategory && product.name.toLocaleLowerCase('pt-BR').includes(search.toLocaleLowerCase('pt-BR'));
  }), [products, category, search]);
  const openCount = orders.filter((order) => order.status === 'open').length;
  const cartTotal = cart.reduce((sum, line) => sum + line.price * line.quantity, 0);
  const cartCount = cart.reduce((sum, line) => sum + line.quantity, 0);

  useEffect(() => {
    if (!orderIdToEdit) return;
    const order = orders.find((item) => item.id === orderIdToEdit && item.status === 'open');
    if (order) {
      setEditingOrderId(order.id);
      setCart(order.lines);
      setCartOpen(true);
    }
    clearOrderEditRequest();
  }, [orderIdToEdit, orders, clearOrderEditRequest]);

  useEffect(() => {
    if (!editingOrderId) return;
    const stillOpen = orders.some((order) => order.id === editingOrderId && order.status === 'open');
    if (!stillOpen) {
      setEditingOrderId(null);
      setCart([]);
      setCartOpen(false);
    }
  }, [editingOrderId, orders]);

  const addToCart = (product: Product) => {
    const existing = cart.find((line) => line.productId === product.id);
    if (product.stock <= 0 || (existing && existing.quantity >= product.stock)) return;
    const nextCart = existing
      ? cart.map((line) => line.productId === product.id ? { ...line, quantity: Math.min(product.stock, line.quantity + 1) } : line)
      : [...cart, { productId: product.id, name: product.name, price: product.price, quantity: 1 }];
    setCart(nextCart);
    if (editingOrderId) updateOpenOrder(editingOrderId, nextCart, false);
  };

  const changeQuantity = (id: string, delta: number) => {
    const nextCart = cart.flatMap((line) => {
      if (line.productId !== id) return [line];
      const quantity = line.quantity + delta;
      return quantity <= 0 ? [] : [{ ...line, quantity }];
    });
    setCart(nextCart);
    if (editingOrderId) updateOpenOrder(editingOrderId, nextCart, false);
  };

  const submitOrder = (finalize: boolean) => {
    if (saving || (finalize && !cart.length)) return;
    setSaving(true);
    const result = editingOrderId
      ? updateOpenOrder(editingOrderId, cart, finalize)
      : createOrder(cart, finalize);
    setSaving(false);
    if (!result.ok) {
      Alert.alert('Não foi possível concluir', result.message);
      return;
    }
    setCart([]);
    setEditingOrderId(null);
    setCartOpen(false);
    const message = finalize
      ? `Comanda #${result.order.number} finalizada e estoque atualizado.`
      : editingOrderId
        ? `Comanda #${result.order.number} foi atualizada e continua em aberto.`
        : `Comanda #${result.order.number} salva para finalizar depois.`;
    Alert.alert(finalize ? 'Pedido finalizado' : editingOrderId ? 'Comanda atualizada' : 'Pedido em aberto', message);
  };

  if (isLoading) return <LoadingState />;
  return (
    <View style={[styles.screen, { backgroundColor: colors.background }]}>
      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id}
        numColumns={2}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={[styles.listContent, { paddingTop: PlatformTop(insets.top), paddingBottom: cartCount ? 118 : 42 }]}
        columnWrapperStyle={styles.productColumns}
        ListHeaderComponent={
          <View>
            <View style={styles.topbar}>
              <View>
                <Text style={[styles.greeting, { color: colors.mutedForeground }]}>BOM DIA, CAFÉ</Text>
                <Text style={[styles.pageTitle, { color: colors.foreground }]}>Seu caixa</Text>
              </View>
              <View style={[styles.openBadge, { backgroundColor: colors.accent }]}>
                <Feather name="clock" size={14} color={colors.primary} />
                <Text style={[styles.openBadgeText, { color: colors.primary }]}>{openCount} abertas</Text>
              </View>
            </View>
            {storageError ? <StorageWarning message={storageError} /> : null}
            <View style={[styles.welcome, { backgroundColor: colors.primary }]}>
              <View style={styles.welcomeCopy}>
                <Text style={[styles.welcomeEyebrow, { color: colors.primaryMuted }]}>CAFÉ FRESCO, CAIXA EM DIA</Text>
                <Text style={[styles.welcomeTitle, { color: colors.primaryForeground }]}>O que vamos servir?</Text>
                <Text style={[styles.welcomeSub, { color: colors.primaryMuted }]}>Toque em um item para adicionar à comanda.</Text>
              </View>
              <View style={[styles.cupArt, { backgroundColor: colors.accent }]}><MaterialCommunityIcons name="coffee" size={34} color={colors.primary} /></View>
            </View>
            <View style={[styles.search, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <Feather name="search" size={18} color={colors.mutedForeground} />
              <TextInput value={search} onChangeText={setSearch} placeholder="Buscar no cardápio" placeholderTextColor={colors.mutedForeground} style={[styles.searchInput, { color: colors.foreground }]} returnKeyType="search" testID="product-search" />
              {!!search && <Pressable onPress={() => setSearch('')} accessibilityRole="button" accessibilityLabel="Limpar busca"><Feather name="x-circle" size={17} color={colors.mutedForeground} /></Pressable>}
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips}>
              {categories.map((item) => {
                const selected = category === item;
                return (
                  <Pressable key={item} onPress={() => setCategory(item)} style={[styles.chip, { backgroundColor: selected ? colors.primary : colors.card, borderColor: selected ? colors.primary : colors.border }]}>
                    <Text style={{ color: selected ? colors.primaryForeground : colors.mutedForeground, fontWeight: '700', fontSize: 13 }}>{item}</Text>
                  </Pressable>
                );
              })}
            </ScrollView>
            <SectionTitle title="Cardápio" eyebrow={`${filtered.length} produtos disponíveis`} />
            {!filtered.length ? <EmptyState icon="coffee" title="Nenhum produto encontrado" detail="Tente outra busca ou cadastre produtos na aba Produtos." /> : null}
          </View>
        }
        renderItem={({ item }) => (
          <ProductTile
            product={item}
            onPress={() => addToCart(item)}
          />
        )}
        scrollEnabled={filtered.length > 0}
      />
      {cartCount > 0 ? (
        <Pressable testID="open-cart" accessibilityRole="button" onPress={() => setCartOpen(true)} style={({ pressed }) => [styles.cartBar, { backgroundColor: colors.primary, bottom: insets.bottom + 12, opacity: pressed ? 0.88 : 1 }]}>
          <View style={[styles.cartCount, { backgroundColor: colors.accent }]}><Text style={[styles.cartCountText, { color: colors.primary }]}>{cartCount}</Text></View>
          <View style={{ flex: 1 }}>
            <Text style={[styles.cartTitle, { color: colors.primaryForeground }]}>Ver comanda</Text>
            <Text style={[styles.cartSub, { color: colors.primaryMuted }]}>{cartCount} {cartCount === 1 ? 'item' : 'itens'}</Text>
          </View>
          <Text style={[styles.cartTotal, { color: colors.primaryForeground }]}>{money(cartTotal)}</Text>
          <Feather name="arrow-up-right" size={17} color={colors.primaryForeground} />
        </Pressable>
      ) : null}
      <CartModal
        visible={cartOpen}
        lines={cart}
        products={products}
        orderNumber={editingOrderId ? orders.find((order) => order.id === editingOrderId)?.number : undefined}
        orderLabel={editingOrderId ? orders.find((order) => order.id === editingOrderId)?.label : undefined}
        onAddProduct={addToCart}
        onClose={() => setCartOpen(false)}
        onChangeQuantity={changeQuantity}
        onSaveOpen={() => submitOrder(false)}
        onFinalize={() => submitOrder(true)}
        total={cartTotal}
        saving={saving}
      />
    </View>
  );
}

function PlatformTop(top: number) {
  return top + 10;
}

function ProductTile({ product, onPress }: { product: Product; onPress: () => void }) {
  const colors = useColors();
  const icon = iconForCategory[product.category] ?? 'coffee-outline';
  const soldOut = product.stock <= 0;
  return (
    <Pressable
      testID={`product-${product.id}`}
      accessibilityRole="button"
      accessibilityLabel={`${product.name}, ${money(product.price)}${soldOut ? ', sem estoque' : ''}`}
      disabled={soldOut}
      onPress={onPress}
      style={({ pressed }) => [
        styles.tile,
        { backgroundColor: colors.card, borderColor: colors.border, opacity: soldOut ? 0.48 : pressed ? 0.77 : 1 },
      ]}
    >
      <View style={[styles.tileIcon, { backgroundColor: colors.accent }]}>
        <MaterialCommunityIcons name={icon} size={24} color={colors.primary} />
      </View>
      <Text numberOfLines={2} style={[styles.tileName, { color: colors.foreground }]}>{product.name}</Text>
      <View style={styles.tileFoot}>
        <Text style={[styles.tilePrice, { color: colors.primary }]}>{money(product.price)}</Text>
        <View style={[styles.addIcon, { backgroundColor: soldOut ? colors.muted : colors.primary }]}>
          <Feather name={soldOut ? 'minus' : 'plus'} size={16} color={colors.primaryForeground} />
        </View>
      </View>
      <Text style={[styles.tileStock, { color: product.stock <= product.lowStockAt ? colors.warningForeground : colors.mutedForeground }]}>
        {soldOut ? 'Sem estoque' : `${product.stock} em estoque`}
      </Text>
    </Pressable>
  );
}

function CartModal({
  visible, lines, products, orderNumber, orderLabel, onAddProduct, onClose, onChangeQuantity, onSaveOpen, onFinalize, total, saving,
}: {
  visible: boolean; lines: OrderLine[]; products: Product[]; orderNumber?: number; orderLabel?: string; onClose: () => void;
  onAddProduct: (product: Product) => void;
  onChangeQuantity: (id: string, delta: number) => void; onSaveOpen: () => void; onFinalize: () => void; total: number; saving: boolean;
}) {
  const colors = useColors();
  const [showProductPicker, setShowProductPicker] = useState(false);
  const [productSearch, setProductSearch] = useState('');
  const [productCategory, setProductCategory] = useState('Tudo');
  const productCategories = useMemo(
    () => ['Tudo', ...Array.from(new Set(products.map((product) => product.category)))],
    [products],
  );
  const availableProducts = useMemo(() => products.filter((product) => {
    const matchesCategory = productCategory === 'Tudo' || product.category === productCategory;
    const matchesSearch = product.name.toLocaleLowerCase('pt-BR').includes(productSearch.toLocaleLowerCase('pt-BR'));
    return matchesCategory && matchesSearch;
  }), [products, productCategory, productSearch]);

  const openProductPicker = () => {
    setProductSearch('');
    setProductCategory('Tudo');
    setShowProductPicker(true);
  };

  const closeProductPicker = () => {
    setShowProductPicker(false);
    setProductSearch('');
    setProductCategory('Tudo');
  };

  const closeModal = () => {
    closeProductPicker();
    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={closeModal}>
      <View style={[styles.modal, { backgroundColor: colors.background }]}>
        <View style={styles.modalHeading}>
          <View>
            <Text style={[styles.greeting, { color: colors.mutedForeground }]}>{orderNumber ? `${orderLabel ? `${orderLabel} · ` : 'COMANDA ' }#${orderNumber}` : 'NOVA COMANDA'}</Text>
            <Text style={[styles.modalTitle, { color: colors.foreground }]}>{showProductPicker ? 'Adicionar produtos' : orderNumber ? 'Gerenciar comanda' : 'Conferir pedido'}</Text>
          </View>
          <View style={styles.modalHeaderActions}>
            {showProductPicker ? (
              <Pressable testID="back-to-order" accessibilityRole="button" accessibilityLabel="Voltar para a comanda" onPress={closeProductPicker} style={[styles.closeButton, { backgroundColor: colors.secondary }]}>
                <Feather name="arrow-left" size={18} color={colors.foreground} />
              </Pressable>
            ) : null}
            <Pressable testID="close-order-editor" accessibilityRole="button" accessibilityLabel="Fechar comanda" onPress={closeModal} style={[styles.closeButton, { backgroundColor: colors.secondary }]}>
              <Feather name="x" size={18} color={colors.foreground} />
            </Pressable>
          </View>
        </View>
        <KeyboardAvoidingView style={styles.modalBody} behavior="padding" keyboardVerticalOffset={0}>
          {showProductPicker ? (
            <View style={styles.pickerBody}>
              <View style={[styles.search, styles.pickerSearch, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <Feather name="search" size={17} color={colors.mutedForeground} />
                <TextInput
                  testID="order-product-search"
                  value={productSearch}
                  onChangeText={setProductSearch}
                  placeholder="Buscar produto"
                  placeholderTextColor={colors.mutedForeground}
                  style={[styles.searchInput, { color: colors.foreground }]}
                  returnKeyType="search"
                  autoCorrect={false}
                />
                {productSearch ? (
                  <Pressable testID="clear-order-product-search" accessibilityRole="button" accessibilityLabel="Limpar busca" onPress={() => setProductSearch('')}>
                    <Feather name="x-circle" size={17} color={colors.mutedForeground} />
                  </Pressable>
                ) : null}
              </View>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} keyboardShouldPersistTaps="handled" contentContainerStyle={styles.pickerChips}>
                {productCategories.map((category) => {
                  const selected = category === productCategory;
                  return (
                    <Pressable
                      key={category}
                      testID={`order-category-${category}`}
                      accessibilityRole="button"
                      onPress={() => setProductCategory(category)}
                      style={[styles.chip, styles.pickerChip, { backgroundColor: selected ? colors.primary : colors.card, borderColor: selected ? colors.primary : colors.border }]}
                    >
                      <Text style={{ color: selected ? colors.primaryForeground : colors.mutedForeground, fontWeight: '700', fontSize: 12 }}>{category}</Text>
                    </Pressable>
                  );
                })}
              </ScrollView>
              <FlatList
                testID="order-product-list"
                style={styles.pickerList}
                data={availableProducts}
                keyExtractor={(item) => item.id}
                keyboardShouldPersistTaps="handled"
                keyboardDismissMode="interactive"
                contentContainerStyle={{ paddingBottom: 14 }}
                renderItem={({ item }) => (
                  <QuickAddProductRow
                    product={item}
                    quantity={lines.find((line) => line.productId === item.id)?.quantity ?? 0}
                    onAdd={() => onAddProduct(item)}
                  />
                )}
                ListEmptyComponent={<EmptyState icon="search" title="Nenhum produto encontrado" detail="Tente outro nome ou escolha outra categoria." />}
              />
            </View>
          ) : (
            <>
              <View style={styles.lineListHeading}>
                <Text style={[styles.lineListTitle, { color: colors.foreground }]}>Itens da comanda</Text>
                <PillButton label="Adicionar itens" icon="plus" tone="soft" onPress={openProductPicker} testID="add-products-to-order" />
              </View>
              <FlatList
                style={styles.orderLinesList}
                data={lines}
                keyExtractor={(item) => item.productId}
                contentContainerStyle={{ paddingBottom: 20, flexGrow: lines.length ? 0 : 1 }}
                renderItem={({ item }) => {
                  const product = products.find((candidate) => candidate.id === item.productId);
                  const remainingStock = Math.max(0, (product?.stock ?? 0) - item.quantity);
                  const maxed = item.quantity >= item.quantity + remainingStock;
                  return (
                    <View style={[styles.cartLine, { backgroundColor: colors.card, borderColor: colors.border }]}>
                      <View style={{ flex: 1 }}>
                        <Text style={[styles.lineName, { color: colors.foreground }]}>{item.name}</Text>
                        <Text style={[styles.linePrice, { color: colors.mutedForeground }]}>{money(item.price)} cada</Text>
                      </View>
                      <View style={styles.quantityStepper}>
                        <Pressable testID={`remove-${item.productId}`} accessibilityRole="button" accessibilityLabel={`Remover um ${item.name}`} onPress={() => onChangeQuantity(item.productId, -1)} style={[styles.stepButton, { backgroundColor: colors.secondary }]}><Feather name="minus" size={15} color={colors.foreground} /></Pressable>
                        <Text style={[styles.quantityText, { color: colors.foreground }]}>{item.quantity}</Text>
                        <Pressable testID={`add-${item.productId}`} accessibilityRole="button" accessibilityLabel={`Adicionar um ${item.name}`} disabled={!product || product.stock <= item.quantity || maxed} onPress={() => onChangeQuantity(item.productId, 1)} style={[styles.stepButton, { backgroundColor: colors.secondary, opacity: !product || product.stock <= item.quantity || maxed ? 0.4 : 1 }]}><Feather name="plus" size={15} color={colors.foreground} /></Pressable>
                      </View>
                      <Text style={[styles.lineTotal, { color: colors.foreground }]}>{money(item.price * item.quantity)}</Text>
                    </View>
                  );
                }}
                ListEmptyComponent={<EmptyState icon="shopping-bag" title="Sua comanda está vazia" detail="Adicione produtos pelo botão acima para começar." />}
              />
            </>
          )}
          <View style={[styles.checkoutFooter, { borderTopColor: colors.border }]}>
            <View style={styles.totalRow}><Text style={[styles.totalLabel, { color: colors.mutedForeground }]}>{showProductPicker ? 'Total da comanda' : 'Total do pedido'}</Text><Text style={[styles.totalValue, { color: colors.foreground }]}>{money(total)}</Text></View>
            <Text style={[styles.stockNote, { color: colors.mutedForeground }]}>O estoque só é baixado ao finalizar o pedido.</Text>
            {showProductPicker ? (
              <PillButton label="Voltar para a comanda" icon="arrow-left" tone="soft" onPress={closeProductPicker} testID="return-to-order" />
            ) : (
              <View style={styles.checkoutActions}>
                <PillButton label={orderNumber ? 'Salvar alterações' : 'Deixar em aberto'} icon="clock" tone="soft" disabled={saving || (!lines.length && !orderNumber)} onPress={onSaveOpen} testID="save-open-order" />
                <PillButton label="Finalizar pedido" icon="check" disabled={saving || !lines.length} onPress={onFinalize} testID="finalize-order" />
              </View>
            )}
          </View>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
}

function QuickAddProductRow({ product, quantity, onAdd }: { product: Product; quantity: number; onAdd: () => void }) {
  const colors = useColors();
  const unavailable = product.stock <= 0;
  const atLimit = quantity >= product.stock;
  const disabled = unavailable || atLimit;
  const availability = unavailable
    ? 'Sem estoque'
    : atLimit
      ? 'Limite de estoque atingido'
      : quantity
        ? `${quantity} na comanda · ${product.stock - quantity} disponíveis`
        : `${product.stock} disponíveis`;

  return (
    <View style={[styles.pickerProductRow, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <View style={{ flex: 1 }}>
        <Text style={[styles.pickerProductName, { color: colors.foreground }]} numberOfLines={1}>{product.name}</Text>
        <Text style={[styles.pickerProductAvailability, { color: disabled ? colors.mutedForeground : colors.mutedForeground }]}>{availability}</Text>
      </View>
      <Text style={[styles.pickerProductPrice, { color: colors.primary }]}>{money(product.price)}</Text>
      <Pressable
        testID={`quick-add-${product.id}`}
        accessibilityRole="button"
        accessibilityLabel={unavailable ? `${product.name}, sem estoque` : atLimit ? `${product.name}, limite de estoque atingido` : `Adicionar ${product.name}, ${money(product.price)}`}
        disabled={disabled}
        onPress={onAdd}
        style={({ pressed }) => [styles.quickAddButton, { backgroundColor: disabled ? colors.secondary : colors.primary, opacity: pressed ? 0.78 : 1 }]}
      >
        <Feather name={unavailable ? 'minus' : atLimit ? 'check' : 'plus'} size={17} color={disabled ? colors.mutedForeground : colors.primaryForeground} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  listContent: { paddingHorizontal: 18 },
  topbar: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 },
  greeting: { fontSize: 10, fontWeight: '800', letterSpacing: 1.3, marginBottom: 5 },
  pageTitle: { fontSize: 27, fontWeight: '700', letterSpacing: -0.8 },
  openBadge: { flexDirection: 'row', alignItems: 'center', gap: 7, borderRadius: 20, paddingHorizontal: 12, paddingVertical: 9 },
  openBadgeText: { fontSize: 12, fontWeight: '700' },
  welcome: { minHeight: 138, borderRadius: 24, padding: 19, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', overflow: 'hidden', marginBottom: 18 },
  welcomeCopy: { flex: 1, paddingRight: 8 },
  welcomeEyebrow: { fontSize: 9, fontWeight: '800', letterSpacing: 1.2, marginBottom: 9 },
  welcomeTitle: { fontSize: 23, lineHeight: 28, fontWeight: '700', letterSpacing: -0.6 },
  welcomeSub: { fontSize: 12, lineHeight: 17, marginTop: 6, maxWidth: 210 },
  cupArt: { width: 57, height: 57, borderRadius: 20, alignItems: 'center', justifyContent: 'center', transform: [{ rotate: '-8deg' }] },
  search: { height: 50, borderRadius: 16, borderWidth: 1, paddingHorizontal: 14, flexDirection: 'row', alignItems: 'center', gap: 10 },
  searchInput: { flex: 1, fontSize: 14, paddingVertical: 8 },
  chips: { gap: 8, paddingVertical: 15, paddingRight: 5 },
  chip: { minHeight: 37, paddingHorizontal: 15, borderRadius: 20, borderWidth: 1, justifyContent: 'center' },
  productColumns: { gap: 11, marginBottom: 11 },
  tile: { flex: 1, minHeight: 157, padding: 13, borderWidth: 1, borderRadius: 20 },
  tileIcon: { width: 40, height: 40, borderRadius: 14, alignItems: 'center', justifyContent: 'center', marginBottom: 9 },
  tileName: { fontSize: 14, fontWeight: '700', minHeight: 34, lineHeight: 18 },
  tileFoot: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 5 },
  tilePrice: { fontSize: 14, fontWeight: '800' },
  addIcon: { width: 29, height: 29, borderRadius: 11, alignItems: 'center', justifyContent: 'center' },
  tileStock: { fontSize: 10, fontWeight: '600', marginTop: 7 },
  cartBar: { position: 'absolute', left: 16, right: 16, minHeight: 68, borderRadius: 21, alignItems: 'center', flexDirection: 'row', paddingHorizontal: 14, gap: 11, elevation: 6 },
  cartCount: { width: 31, height: 31, borderRadius: 11, alignItems: 'center', justifyContent: 'center' },
  cartCountText: { fontWeight: '800', fontSize: 13 },
  cartTitle: { fontWeight: '700', fontSize: 14 },
  cartSub: { fontSize: 11, marginTop: 2 },
  cartTotal: { fontWeight: '800', fontSize: 14 },
  modal: { flex: 1, paddingTop: 22, paddingHorizontal: 18 },
  modalHeading: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingBottom: 18 },
  modalHeaderActions: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  modalBody: { flex: 1 },
  modalTitle: { fontSize: 25, fontWeight: '700', letterSpacing: -0.6 },
  closeButton: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center', borderRadius: 14 },
  lineListHeading: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8, paddingBottom: 12 },
  lineListTitle: { fontSize: 15, fontWeight: '700' },
  orderLinesList: { flex: 1 },
  pickerBody: { flex: 1 },
  pickerSearch: { marginBottom: 2 },
  pickerChips: { gap: 8, paddingVertical: 10, paddingRight: 5 },
  pickerChip: { minHeight: 34, paddingHorizontal: 13 },
  pickerList: { flex: 1 },
  pickerProductRow: { minHeight: 68, borderWidth: 1, borderRadius: 16, paddingHorizontal: 12, paddingVertical: 9, flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 8 },
  pickerProductName: { fontSize: 14, fontWeight: '700' },
  pickerProductAvailability: { fontSize: 11, marginTop: 4 },
  pickerProductPrice: { fontSize: 13, fontWeight: '800' },
  quickAddButton: { width: 38, height: 38, borderRadius: 13, alignItems: 'center', justifyContent: 'center' },
  cartLine: { borderWidth: 1, borderRadius: 18, padding: 12, flexDirection: 'row', alignItems: 'center', gap: 9, marginBottom: 10 },
  lineName: { fontSize: 14, fontWeight: '700' },
  linePrice: { fontSize: 11, marginTop: 3 },
  quantityStepper: { flexDirection: 'row', alignItems: 'center', gap: 7 },
  stepButton: { width: 29, height: 29, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  quantityText: { minWidth: 16, textAlign: 'center', fontSize: 13, fontWeight: '700' },
  lineTotal: { fontSize: 12, fontWeight: '700', minWidth: 64, textAlign: 'right' },
  checkoutFooter: { borderTopWidth: 1, paddingTop: 15, paddingBottom: 28, gap: 10 },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  totalLabel: { fontSize: 13, fontWeight: '600' },
  totalValue: { fontSize: 22, fontWeight: '800' },
  stockNote: { fontSize: 11, marginBottom: 2 },
  checkoutActions: { flexDirection: 'row', gap: 8 },
});
