export type Product = {
  id: string;
  name: string;
  category: string;
  price: number;
  stock: number;
  lowStockAt: number;
};

export type OrderLine = {
  productId: string;
  name: string;
  price: number;
  quantity: number;
};

export type Order = {
  id: string;
  number: number;
  label?: string;
  status: 'open' | 'completed';
  createdAt: string;
  completedAt?: string;
  lines: OrderLine[];
  total: number;
};

export type PosData = {
  products: Product[];
  orders: Order[];
  nextOrderNumber: number;
};

export const INITIAL_DATA: PosData = {
  products: [
    { id: 'espresso', name: 'Espresso', category: 'Cafés', price: 7.5, stock: 42, lowStockAt: 8 },
    { id: 'cappuccino', name: 'Cappuccino', category: 'Cafés', price: 12, stock: 26, lowStockAt: 8 },
    { id: 'latte', name: 'Latte', category: 'Cafés', price: 13.5, stock: 18, lowStockAt: 6 },
    { id: 'coado', name: 'Café coado', category: 'Cafés', price: 9, stock: 30, lowStockAt: 8 },
    { id: 'pao-queijo', name: 'Pão de queijo', category: 'Comidas', price: 8, stock: 20, lowStockAt: 5 },
    { id: 'croissant', name: 'Croissant', category: 'Comidas', price: 11, stock: 12, lowStockAt: 4 },
    { id: 'bolo', name: 'Fatia de bolo', category: 'Comidas', price: 14, stock: 3, lowStockAt: 5 },
    { id: 'cha', name: 'Chá da casa', category: 'Chás', price: 8.5, stock: 16, lowStockAt: 4 },
  ],
  orders: [
    {
      id: 'demo-open',
      number: 102,
      status: 'open',
      createdAt: new Date(Date.now() - 1000 * 60 * 18).toISOString(),
      lines: [
        { productId: 'cappuccino', name: 'Cappuccino', price: 12, quantity: 2 },
        { productId: 'croissant', name: 'Croissant', price: 11, quantity: 1 },
      ],
      total: 35,
    },
    {
      id: 'demo-done',
      number: 101,
      status: 'completed',
      createdAt: new Date(Date.now() - 1000 * 60 * 52).toISOString(),
      completedAt: new Date(Date.now() - 1000 * 60 * 48).toISOString(),
      lines: [{ productId: 'espresso', name: 'Espresso', price: 7.5, quantity: 2 }],
      total: 15,
    },
  ],
  nextOrderNumber: 103,
};
