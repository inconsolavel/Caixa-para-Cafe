import AsyncStorage from '@react-native-async-storage/async-storage';
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { INITIAL_DATA, type Order, type OrderLine, type PosData, type Product } from '@/types/pos';

const STORAGE_KEY = '@caixa-cafe/data-v1';

type CheckoutResult = { ok: true; order: Order } | { ok: false; message: string };

type CafeContextValue = {
  products: Product[];
  orders: Order[];
  isLoading: boolean;
  storageError: string | null;
  orderIdToEdit: string | null;
  addProduct: (product: Omit<Product, 'id'>) => void;
  updateProduct: (product: Product) => void;
  deleteProduct: (id: string) => void;
  adjustStock: (id: string, delta: number) => void;
  createOrder: (lines: OrderLine[], finalize: boolean) => CheckoutResult;
  createBlankOrder: (label?: string) => Order | null;
  requestOrderEdit: (id: string) => void;
  clearOrderEditRequest: () => void;
  updateOpenOrder: (id: string, lines: OrderLine[], finalize: boolean) => CheckoutResult;
  finalizeOrder: (id: string) => CheckoutResult;
  cancelOpenOrder: (id: string) => void;
};

const CafeContext = createContext<CafeContextValue | null>(null);

function safeLoadedData(raw: string | null): PosData {
  if (!raw) return INITIAL_DATA;
  try {
    const parsed: unknown = JSON.parse(raw);
    if (
      typeof parsed === 'object' &&
      parsed !== null &&
      Array.isArray((parsed as PosData).products) &&
      Array.isArray((parsed as PosData).orders) &&
      typeof (parsed as PosData).nextOrderNumber === 'number'
    ) {
      return parsed as PosData;
    }
  } catch {
    // Invalid saved data is reported by the caller; initial data keeps the app usable.
  }
  return INITIAL_DATA;
}

function makeId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function completionResult(data: PosData, order: Order): CheckoutResult {
  if (!order.lines.length) {
    return { ok: false, message: 'Adicione pelo menos um produto antes de finalizar a comanda.' };
  }
  for (const line of order.lines) {
    const product = data.products.find((item) => item.id === line.productId);
    if (!product || product.stock < line.quantity) {
      return {
        ok: false,
        message: product
          ? `Estoque insuficiente de ${product.name}. Disponível: ${product.stock}.`
          : `${line.name} não está mais cadastrado.`,
      };
    }
  }
  const completedAt = new Date().toISOString();
  const completedOrder: Order = { ...order, status: 'completed', completedAt };
  return {
    ok: true,
    order: completedOrder,
  };
}

export function CafeProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<PosData>(INITIAL_DATA);
  const dataRef = useRef<PosData>(INITIAL_DATA);
  const [isLoading, setIsLoading] = useState(true);
  const [storageLoaded, setStorageLoaded] = useState(false);
  const [storageError, setStorageError] = useState<string | null>(null);
  const [orderIdToEdit, setOrderIdToEdit] = useState<string | null>(null);

  const commit = useCallback((next: PosData) => {
    dataRef.current = next;
    setData(next);
  }, []);

  useEffect(() => {
    let active = true;
    void AsyncStorage.getItem(STORAGE_KEY)
      .then((raw) => {
        if (!active) return;
        const loaded = safeLoadedData(raw);
        dataRef.current = loaded;
        setData(loaded);
        if (raw && loaded === INITIAL_DATA) {
          setStorageError('Não foi possível ler os dados salvos. Os dados iniciais foram carregados.');
        }
      })
      .catch(() => {
        if (active) setStorageError('Não foi possível carregar os dados salvos neste aparelho.');
      })
      .finally(() => {
        if (active) {
          setStorageLoaded(true);
          setIsLoading(false);
        }
      });
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (isLoading || !storageLoaded) return;
    void AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(data)).catch(() => {
      setStorageError('Falha ao salvar. Verifique o espaço disponível no aparelho.');
    });
  }, [data, isLoading, storageLoaded]);

  const addProduct = useCallback((product: Omit<Product, 'id'>) => {
    const current = dataRef.current;
    commit({ ...current, products: [...current.products, { ...product, id: makeId() }] });
  }, [commit]);

  const updateProduct = useCallback((product: Product) => {
    const current = dataRef.current;
    commit({ ...current, products: current.products.map((item) => item.id === product.id ? product : item) });
  }, [commit]);

  const deleteProduct = useCallback((id: string) => {
    const current = dataRef.current;
    commit({ ...current, products: current.products.filter((product) => product.id !== id) });
  }, [commit]);

  const adjustStock = useCallback((id: string, delta: number) => {
    const current = dataRef.current;
    commit({
      ...current,
      products: current.products.map((product) =>
        product.id === id ? { ...product, stock: Math.max(0, product.stock + delta) } : product,
      ),
    });
  }, [commit]);

  const createOrder = useCallback((lines: OrderLine[], finalize: boolean): CheckoutResult => {
    if (!lines.length) return { ok: false, message: 'Adicione pelo menos um produto ao pedido.' };
    const current = dataRef.current;
    const order: Order = {
      id: makeId(),
      number: current.nextOrderNumber,
      status: 'open',
      createdAt: new Date().toISOString(),
      lines,
      total: lines.reduce((sum, line) => sum + line.price * line.quantity, 0),
    };
    if (finalize) {
      const result = completionResult(current, order);
      if (!result.ok) return result;
      commit({
        ...current,
        nextOrderNumber: current.nextOrderNumber + 1,
        orders: [result.order, ...current.orders],
        products: current.products.map((product) => {
          const line = lines.find((item) => item.productId === product.id);
          return line ? { ...product, stock: product.stock - line.quantity } : product;
        }),
      });
      return result;
    }
    commit({
      ...current,
      nextOrderNumber: current.nextOrderNumber + 1,
      orders: [order, ...current.orders],
    });
    return { ok: true, order };
  }, [commit]);

  const createBlankOrder = useCallback((label?: string): Order | null => {
    const current = dataRef.current;
    const order: Order = {
      id: makeId(),
      number: current.nextOrderNumber,
      label: label?.trim() || undefined,
      status: 'open',
      createdAt: new Date().toISOString(),
      lines: [],
      total: 0,
    };
    commit({
      ...current,
      nextOrderNumber: current.nextOrderNumber + 1,
      orders: [order, ...current.orders],
    });
    setOrderIdToEdit(order.id);
    return order;
  }, [commit]);

  const requestOrderEdit = useCallback((id: string) => {
    const order = dataRef.current.orders.find((item) => item.id === id);
    if (order?.status === 'open') setOrderIdToEdit(id);
  }, []);

  const clearOrderEditRequest = useCallback(() => {
    setOrderIdToEdit(null);
  }, []);

  const updateOpenOrder = useCallback((id: string, lines: OrderLine[], finalize: boolean): CheckoutResult => {
    const current = dataRef.current;
    const existingOrder = current.orders.find((item) => item.id === id);
    if (!existingOrder || existingOrder.status !== 'open') {
      return { ok: false, message: 'Esta comanda não está mais em aberto.' };
    }
    const updatedOrder: Order = {
      ...existingOrder,
      lines,
      total: lines.reduce((sum, line) => sum + line.price * line.quantity, 0),
    };
    if (!finalize) {
      commit({
        ...current,
        orders: current.orders.map((item) => item.id === id ? updatedOrder : item),
      });
      return { ok: true, order: updatedOrder };
    }
    const result = completionResult(current, updatedOrder);
    if (!result.ok) return result;
    commit({
      ...current,
      orders: current.orders.map((item) => item.id === id ? result.order : item),
      products: current.products.map((product) => {
        const line = lines.find((item) => item.productId === product.id);
        return line ? { ...product, stock: product.stock - line.quantity } : product;
      }),
    });
    return result;
  }, [commit]);

  const finalizeOrder = useCallback((id: string): CheckoutResult => {
    const current = dataRef.current;
    const order = current.orders.find((item) => item.id === id);
    if (!order || order.status !== 'open') {
      return { ok: false, message: 'Este pedido não está mais em aberto.' };
    }
    const result = completionResult(current, order);
    if (!result.ok) return result;
    commit({
      ...current,
      orders: current.orders.map((item) => item.id === id ? result.order : item),
      products: current.products.map((product) => {
        const line = order.lines.find((item) => item.productId === product.id);
        return line ? { ...product, stock: product.stock - line.quantity } : product;
      }),
    });
    return result;
  }, [commit]);

  const cancelOpenOrder = useCallback((id: string) => {
    const current = dataRef.current;
    commit({
      ...current,
      orders: current.orders.filter((item) => item.id !== id || item.status !== 'open'),
    });
    setOrderIdToEdit((selected) => selected === id ? null : selected);
  }, [commit]);

  const value = useMemo<CafeContextValue>(() => ({
    products: data.products,
    orders: data.orders,
    isLoading,
    storageError,
    orderIdToEdit,
    addProduct,
    updateProduct,
    deleteProduct,
    adjustStock,
    createOrder,
    createBlankOrder,
    requestOrderEdit,
    clearOrderEditRequest,
    updateOpenOrder,
    finalizeOrder,
    cancelOpenOrder,
  }), [data, isLoading, storageError, orderIdToEdit, addProduct, updateProduct, deleteProduct, adjustStock, createOrder, createBlankOrder, requestOrderEdit, clearOrderEditRequest, updateOpenOrder, finalizeOrder, cancelOpenOrder]);

  return <CafeContext.Provider value={value}>{children}</CafeContext.Provider>;
}

export function useCafe() {
  const context = useContext(CafeContext);
  if (!context) throw new Error('useCafe precisa estar dentro de CafeProvider.');
  return context;
}
