import React, { useState } from 'react';
import { Alert, FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useCafe } from '@/context/CafeContext';
import { EmptyState, IconButton, LoadingState, money, PillButton, SectionTitle, StorageWarning } from '@/components/pos-ui';
import { ProductEditor } from '@/components/ProductEditor';
import { useColors } from '@/hooks/useColors';
import type { Product } from '@/types/pos';

export default function ProductsScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { products, orders, addProduct, updateProduct, deleteProduct, isLoading, storageError } = useCafe();
  const [editorOpen, setEditorOpen] = useState(false);
  const [selected, setSelected] = useState<Product | null>(null);

  const save = (product: Omit<Product, 'id'> | Product) => {
    if ('id' in product) updateProduct(product);
    else addProduct(product);
    setEditorOpen(false);
    setSelected(null);
  };

  const remove = (product: Product) => {
    const inOpenOrder = orders.some((order) => order.status === 'open' && order.lines.some((line) => line.productId === product.id));
    if (inOpenOrder) {
      Alert.alert('Produto em pedido aberto', 'Finalize esse pedido antes de excluir o produto.');
      return;
    }
    Alert.alert('Excluir produto?', `${product.name} deixará de aparecer no cardápio. Os pedidos anteriores continuam no histórico.`, [
      { text: 'Manter', style: 'cancel' },
      { text: 'Excluir', style: 'destructive', onPress: () => deleteProduct(product.id) },
    ]);
  };

  if (isLoading) return <LoadingState />;
  return (
    <View style={[styles.screen, { backgroundColor: colors.background }]}>
      <FlatList
        data={products}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ paddingHorizontal: 18, paddingTop: insets.top + 12, paddingBottom: 32 }}
        ListHeaderComponent={
          <View>
            <View style={styles.topline}>
              <View>
                <Text style={[styles.eyebrow, { color: colors.mutedForeground }]}>CARDÁPIO</Text>
                <Text style={[styles.pageTitle, { color: colors.foreground }]}>Produtos</Text>
              </View>
              <PillButton label="Novo produto" icon="plus" onPress={() => { setSelected(null); setEditorOpen(true); }} testID="new-product" />
            </View>
            {storageError ? <StorageWarning message={storageError} /> : null}
            <View style={[styles.summary, { backgroundColor: colors.primary }]}>
              <View style={{ flex: 1 }}>
        <Text style={[styles.summaryLabel, { color: colors.primaryMuted }]}>NO SEU CARDÁPIO</Text>
        <Text style={[styles.summaryTitle, { color: colors.primaryForeground }]}>{products.length} produtos cadastrados</Text>
        <Text style={[styles.summaryDetail, { color: colors.primaryMuted }]}>Edite preços, categorias e quantidades.</Text>
              </View>
              <View style={[styles.summaryIcon, { backgroundColor: colors.accent }]}><MaterialCommunityIcons name="coffee-outline" size={26} color={colors.primary} /></View>
            </View>
            <SectionTitle title="Todos os produtos" eyebrow="Toque em um item para editar" />
          </View>
        }
        renderItem={({ item }) => <ProductRow product={item} onEdit={() => { setSelected(item); setEditorOpen(true); }} onDelete={() => remove(item)} />}
        ListEmptyComponent={<EmptyState icon="coffee" title="Seu cardápio está vazio" detail="Cadastre seu primeiro produto para começar a receber pedidos." />}
        scrollEnabled={products.length > 0}
      />
      <ProductEditor visible={editorOpen} product={selected} onClose={() => { setEditorOpen(false); setSelected(null); }} onSave={save} />
    </View>
  );
}

function ProductRow({ product, onEdit, onDelete }: { product: Product; onEdit: () => void; onDelete: () => void }) {
  const colors = useColors();
  const low = product.stock <= product.lowStockAt;
  return (
    <View style={[styles.row, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <View style={[styles.productIcon, { backgroundColor: colors.accent }]}>
        <MaterialCommunityIcons name={product.category === 'Comidas' ? 'bread-slice-outline' : 'coffee-outline'} size={22} color={colors.primary} />
      </View>
      <Pressable testID={`edit-product-${product.id}`} accessibilityRole="button" onPress={onEdit} style={({ pressed }) => [styles.productInfo, { opacity: pressed ? 0.72 : 1 }]}>
        <Text numberOfLines={1} style={[styles.name, { color: colors.foreground }]}>{product.name}</Text>
        <Text style={[styles.meta, { color: colors.mutedForeground }]}>{product.category} · {product.stock} em estoque</Text>
      </Pressable>
      <View style={styles.right}>
        <Text style={[styles.price, { color: colors.primary }]}>{money(product.price)}</Text>
        <Text style={[styles.low, { color: low ? colors.warningForeground : colors.mutedForeground }]}>{low ? 'Estoque baixo' : 'Ativo'}</Text>
      </View>
      <IconButton icon="trash-2" onPress={onDelete} accessibilityLabel={`Excluir ${product.name}`} testID={`delete-product-${product.id}`} tone="danger" />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  topline: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 },
  eyebrow: { fontSize: 10, fontWeight: '800', letterSpacing: 1.4, marginBottom: 5 },
  pageTitle: { fontSize: 28, fontWeight: '700', letterSpacing: -0.8 },
  summary: { minHeight: 105, borderRadius: 20, padding: 17, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 23 },
  summaryLabel: { fontSize: 9, fontWeight: '800', letterSpacing: 1.2 },
  summaryTitle: { fontSize: 16, fontWeight: '800', marginTop: 5 },
  summaryDetail: { fontSize: 11, marginTop: 4 },
  summaryIcon: { width: 46, height: 46, borderRadius: 15, alignItems: 'center', justifyContent: 'center' },
  row: { minHeight: 75, borderWidth: 1, borderRadius: 17, paddingVertical: 10, paddingLeft: 11, paddingRight: 5, flexDirection: 'row', alignItems: 'center', gap: 9, marginBottom: 9 },
  productIcon: { width: 39, height: 39, borderRadius: 13, alignItems: 'center', justifyContent: 'center' },
  productInfo: { flex: 1, minWidth: 0 },
  name: { fontSize: 13, fontWeight: '700' },
  meta: { fontSize: 10, marginTop: 4 },
  right: { alignItems: 'flex-end', minWidth: 69 },
  price: { fontSize: 12, fontWeight: '800' },
  low: { fontSize: 9, marginTop: 4, fontWeight: '600' },
});
