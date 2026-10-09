import React, { useEffect, useState } from 'react';
import {
  Keyboard,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { KeyboardAwareScrollViewCompat } from '@/components/KeyboardAwareScrollViewCompat';
import { useColors } from '@/hooks/useColors';
import { PillButton } from '@/components/pos-ui';
import type { Product } from '@/types/pos';

const CATEGORIES = ['Cafés', 'Comidas', 'Chás', 'Outros'];

export function ProductEditor({
  visible, product, onClose, onSave,
}: {
  visible: boolean; product: Product | null; onClose: () => void;
  onSave: (product: Omit<Product, 'id'> | Product) => void;
}) {
  const colors = useColors();
  const [name, setName] = useState('');
  const [category, setCategory] = useState(CATEGORIES[0]);
  const [price, setPrice] = useState('');
  const [stock, setStock] = useState('');
  const [lowStockAt, setLowStockAt] = useState('5');
  const [error, setError] = useState('');

  useEffect(() => {
    if (!visible) return;
    setName(product?.name ?? '');
    setCategory(product?.category ?? CATEGORIES[0]);
    setPrice(product ? product.price.toFixed(2).replace('.', ',') : '');
    setStock(product ? String(product.stock) : '');
    setLowStockAt(product ? String(product.lowStockAt) : '5');
    setError('');
  }, [visible, product]);

  const save = () => {
    const numericPrice = Number(price.trim().replace(',', '.'));
    const numericStock = Number(stock.trim());
    const numericThreshold = Number(lowStockAt.trim());
    if (!name.trim()) return setError('Digite o nome do produto.');
    if (!Number.isFinite(numericPrice) || numericPrice <= 0) return setError('Informe um preço válido maior que zero.');
    if (!Number.isInteger(numericStock) || numericStock < 0) return setError('O estoque deve ser um número inteiro igual ou maior que zero.');
    if (!Number.isInteger(numericThreshold) || numericThreshold < 0) return setError('O limite baixo deve ser um número inteiro igual ou maior que zero.');
    Keyboard.dismiss();
    const values = { name: name.trim(), category, price: numericPrice, stock: numericStock, lowStockAt: numericThreshold };
    onSave(product ? { ...values, id: product.id } : values);
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <View style={[styles.modal, { backgroundColor: colors.background }]}>
        <View style={styles.topline}>
          <View>
            <Text style={[styles.eyebrow, { color: colors.mutedForeground }]}>CATÁLOGO</Text>
            <Text style={[styles.title, { color: colors.foreground }]}>{product ? 'Editar produto' : 'Novo produto'}</Text>
          </View>
          <Pressable accessibilityRole="button" accessibilityLabel="Fechar" onPress={onClose} style={[styles.closeButton, { backgroundColor: colors.secondary }]}>
            <Text style={{ color: colors.foreground, fontSize: 20 }}>×</Text>
          </Pressable>
        </View>
        <KeyboardAwareScrollViewCompat
          style={{ flex: 1 }}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="interactive"
          bottomOffset={24}
          contentContainerStyle={styles.form}
        >
          <Field label="Nome do produto" value={name} onChangeText={setName} placeholder="Ex.: Mocha da casa" colors={colors} />
          <Text style={[styles.label, { color: colors.foreground }]}>Categoria</Text>
          <View style={styles.categories}>
            {CATEGORIES.map((item) => (
              <Pressable key={item} onPress={() => setCategory(item)} style={[styles.category, { backgroundColor: item === category ? colors.primary : colors.card, borderColor: item === category ? colors.primary : colors.border }]}>
                <Text style={{ color: item === category ? colors.primaryForeground : colors.foreground, fontWeight: '600', fontSize: 13 }}>{item}</Text>
              </Pressable>
            ))}
          </View>
          <View style={styles.row}>
            <View style={styles.half}><Field label="Preço (R$)" value={price} onChangeText={setPrice} placeholder="0,00" keyboardType="decimal-pad" colors={colors} /></View>
            <View style={styles.half}><Field label="Quantidade" value={stock} onChangeText={setStock} placeholder="0" keyboardType="number-pad" colors={colors} /></View>
          </View>
          <Field label="Avisar quando chegar a" value={lowStockAt} onChangeText={setLowStockAt} placeholder="5" keyboardType="number-pad" colors={colors} />
          {error ? <Text style={[styles.error, { color: colors.destructive }]}>{error}</Text> : null}
          <View style={{ marginTop: 8 }}>
            <PillButton label={product ? 'Salvar alterações' : 'Cadastrar produto'} onPress={save} testID="save-product" />
          </View>
        </KeyboardAwareScrollViewCompat>
      </View>
    </Modal>
  );
}

function Field({
  label, colors, ...inputProps
}: {
  label: string; colors: ReturnType<typeof useColors>;
  value: string; onChangeText: (value: string) => void; placeholder: string; keyboardType?: 'default' | 'decimal-pad' | 'number-pad';
}) {
  return (
    <View style={{ gap: 8, marginBottom: 18 }}>
      <Text style={[styles.label, { color: colors.foreground }]}>{label}</Text>
      <TextInput
        {...inputProps}
        placeholderTextColor={colors.mutedForeground}
        style={[styles.input, { backgroundColor: colors.card, color: colors.foreground, borderColor: colors.border }]}
        autoCapitalize="sentences"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  modal: { flex: 1, paddingTop: 20, paddingHorizontal: 20 },
  topline: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingBottom: 20 },
  eyebrow: { fontSize: 10, fontWeight: '800', letterSpacing: 1.3, marginBottom: 5 },
  title: { fontSize: 24, fontWeight: '700', letterSpacing: -0.5 },
  closeButton: { width: 40, height: 40, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  form: { paddingBottom: 36 },
  label: { fontSize: 13, fontWeight: '700', marginBottom: 8 },
  input: { minHeight: 50, borderWidth: 1, borderRadius: 14, paddingHorizontal: 14, fontSize: 16 },
  categories: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 18 },
  category: { borderWidth: 1, paddingHorizontal: 13, paddingVertical: 10, borderRadius: 13 },
  row: { flexDirection: 'row', gap: 12 },
  half: { flex: 1 },
  error: { fontSize: 13, fontWeight: '600', marginBottom: 10 },
});
