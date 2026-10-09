import React, { useMemo, useState } from 'react';
import { FlatList, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useCafe } from '@/context/CafeContext';
import { EmptyState, LoadingState, SectionTitle, StorageWarning } from '@/components/pos-ui';
import { useColors } from '@/hooks/useColors';
import type { Product } from '@/types/pos';

export default function StockScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { products, adjustStock, isLoading, storageError } = useCafe();
  const [search, setSearch] = useState('');
  const lowCount = products.filter((product) => product.stock <= product.lowStockAt).length;
  const visible = useMemo(() => [...products]
    .filter((product) => product.name.toLocaleLowerCase('pt-BR').includes(search.toLocaleLowerCase('pt-BR')))
    .sort((a, b) => Number(b.stock <= b.lowStockAt) - Number(a.stock <= a.lowStockAt) || a.name.localeCompare(b.name, 'pt-BR')),
  [products, search]);

  if (isLoading) return <LoadingState />;
  return (
    <View style={[styles.screen, { backgroundColor: colors.background }]}>
      <FlatList
        data={visible}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ paddingHorizontal: 18, paddingTop: insets.top + 12, paddingBottom: 35 }}
        ListHeaderComponent={
          <View>
            <Text style={[styles.eyebrow, { color: colors.mutedForeground }]}>OPERAÇÃO</Text>
            <Text style={[styles.pageTitle, { color: colors.foreground }]}>Estoque</Text>
            {storageError ? <StorageWarning message={storageError} /> : null}
            <View style={[styles.summary, { backgroundColor: lowCount ? colors.warning : colors.accent }]}>
              <View style={[styles.summaryIcon, { backgroundColor: lowCount ? colors.warningBorder : colors.card }]}>
                <Feather name={lowCount ? 'alert-triangle' : 'package'} size={19} color={lowCount ? colors.warningForeground : colors.primary} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.summaryTitle, { color: lowCount ? colors.warningForeground : colors.foreground }]}>
                  {lowCount ? `${lowCount} ${lowCount === 1 ? 'produto precisa' : 'produtos precisam'} de atenção` : 'Estoque em dia'}
                </Text>
                <Text style={[styles.summaryDetail, { color: lowCount ? colors.warningForeground : colors.mutedForeground }]}>
                  {lowCount ? 'Itens baixos aparecem primeiro na lista.' : 'Todos os produtos estão acima do limite mínimo.'}
                </Text>
              </View>
              <Text style={[styles.summaryCount, { color: lowCount ? colors.warningForeground : colors.primary }]}>{products.length}</Text>
            </View>
            <View style={[styles.search, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <Feather name="search" size={17} color={colors.mutedForeground} />
              <TextInput value={search} onChangeText={setSearch} placeholder="Buscar produto" placeholderTextColor={colors.mutedForeground} style={[styles.searchInput, { color: colors.foreground }]} testID="stock-search" returnKeyType="search" />
              {!!search && <Pressable onPress={() => setSearch('')} accessibilityLabel="Limpar busca"><Feather name="x-circle" size={17} color={colors.mutedForeground} /></Pressable>}
            </View>
            <SectionTitle title="Produtos" eyebrow={`${visible.length} itens no controle`} />
          </View>
        }
        renderItem={({ item }) => <StockRow product={item} onChange={(delta) => adjustStock(item.id, delta)} />}
        ListEmptyComponent={<EmptyState icon="package" title="Nenhum produto por aqui" detail="Cadastre um produto na aba Produtos para começar a controlar o estoque." />}
        scrollEnabled={visible.length > 0}
      />
    </View>
  );
}

function StockRow({ product, onChange }: { product: Product; onChange: (delta: number) => void }) {
  const colors = useColors();
  const low = product.stock <= product.lowStockAt;
  const percentage = product.lowStockAt === 0 ? (product.stock === 0 ? 0 : 1) : Math.min(1, product.stock / (product.lowStockAt * 2));
  return (
    <View style={[styles.row, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <View style={[styles.productIcon, { backgroundColor: low ? colors.warning : colors.accent }]}>
        <MaterialCommunityIcons name={product.category === 'Comidas' ? 'bread-slice-outline' : 'coffee-outline'} size={21} color={low ? colors.warningForeground : colors.primary} />
      </View>
      <View style={styles.details}>
        <Text numberOfLines={1} style={[styles.productName, { color: colors.foreground }]}>{product.name}</Text>
        <Text style={[styles.category, { color: colors.mutedForeground }]}>{product.category} · mínimo {product.lowStockAt}</Text>
        <View style={[styles.track, { backgroundColor: colors.secondary }]}>
          <View style={[styles.fill, { width: `${Math.max(4, percentage * 100)}%`, backgroundColor: low ? colors.warningForeground : colors.primary }]} />
        </View>
      </View>
      <View style={styles.controls}>
        <Text style={[styles.quantity, { color: low ? colors.warningForeground : colors.foreground }]}>{product.stock}</Text>
        <View style={styles.stepper}>
          <Pressable testID={`stock-minus-${product.id}`} accessibilityRole="button" accessibilityLabel={`Diminuir estoque de ${product.name}`} disabled={product.stock === 0} onPress={() => onChange(-1)} style={[styles.step, { backgroundColor: colors.secondary, opacity: product.stock === 0 ? 0.4 : 1 }]}><Feather name="minus" size={14} color={colors.foreground} /></Pressable>
          <Pressable testID={`stock-plus-${product.id}`} accessibilityRole="button" accessibilityLabel={`Aumentar estoque de ${product.name}`} onPress={() => onChange(1)} style={[styles.step, { backgroundColor: colors.primary }]}><Feather name="plus" size={14} color={colors.primaryForeground} /></Pressable>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  eyebrow: { fontSize: 10, fontWeight: '800', letterSpacing: 1.4, marginBottom: 5 },
  pageTitle: { fontSize: 28, fontWeight: '700', letterSpacing: -0.8, marginBottom: 17 },
  summary: { minHeight: 83, borderRadius: 18, padding: 14, flexDirection: 'row', alignItems: 'center', gap: 11, marginBottom: 16 },
  summaryIcon: { width: 39, height: 39, borderRadius: 13, alignItems: 'center', justifyContent: 'center' },
  summaryTitle: { fontSize: 13, fontWeight: '800' },
  summaryDetail: { fontSize: 10, lineHeight: 15, marginTop: 3 },
  summaryCount: { fontSize: 21, fontWeight: '800' },
  search: { height: 48, borderRadius: 15, borderWidth: 1, paddingHorizontal: 13, flexDirection: 'row', alignItems: 'center', gap: 9, marginBottom: 20 },
  searchInput: { flex: 1, fontSize: 14 },
  row: { minHeight: 88, borderWidth: 1, borderRadius: 18, padding: 12, flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 9 },
  productIcon: { width: 39, height: 39, borderRadius: 13, alignItems: 'center', justifyContent: 'center' },
  details: { flex: 1, minWidth: 0 },
  productName: { fontSize: 13, fontWeight: '700' },
  category: { fontSize: 10, marginTop: 3 },
  track: { width: '100%', height: 4, borderRadius: 3, overflow: 'hidden', marginTop: 9 },
  fill: { height: 4, borderRadius: 3 },
  controls: { minWidth: 68, alignItems: 'center', gap: 6 },
  quantity: { fontSize: 20, fontWeight: '800' },
  stepper: { flexDirection: 'row', gap: 6 },
  step: { width: 27, height: 27, borderRadius: 9, alignItems: 'center', justifyContent: 'center' },
});
