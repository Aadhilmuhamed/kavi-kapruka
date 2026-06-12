import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

export interface CartItem {
  id: string;
  name: string;
  price: number;
  image: string;
  currency: string;
  quantity: number;
}

export interface DeliveryInfo {
  city: string;
  deliveryDate: string;
  recipientName: string;
  recipientPhone: string;
  giftMessage: string;
}

export type CheckoutStep =
  | 'idle'
  | 'city'
  | 'date'
  | 'recipient'
  | 'gift'
  | 'confirm'
  | 'done';

interface CartStore {
  // Cart
  items: CartItem[];
  isOpen: boolean;
  addItem: (item: Omit<CartItem, 'quantity'>) => void;
  removeItem: (id: string) => void;
  updateQuantity: (id: string, quantity: number) => void;
  clearCart: () => void;
  totalItems: () => number;
  totalPrice: () => number;
  openCart: () => void;
  closeCart: () => void;
  // Checkout
  step: CheckoutStep;
  delivery: DeliveryInfo;
  payLink: string | null;
  orderNumber: string | null;
  setStep: (step: CheckoutStep) => void;
  setDelivery: (info: Partial<DeliveryInfo>) => void;
  setPayLink: (url: string, orderNumber: string) => void;
  resetCheckout: () => void;
}

const defaultDelivery: DeliveryInfo = {
  city: '',
  deliveryDate: '',
  recipientName: '',
  recipientPhone: '',
  giftMessage: '',
};

export const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
  items: [],
  isOpen: false,
  step: 'idle',
  delivery: defaultDelivery,
  payLink: null,
  orderNumber: null,

  addItem: (newItem) => {
    set((state) => {
      const existing = state.items.find((i) => i.id === newItem.id);
      if (existing) {
        return {
          items: state.items.map((i) =>
            i.id === newItem.id ? { ...i, quantity: i.quantity + 1 } : i
          ),
          isOpen: true,
        };
      }
      return {
        items: [...state.items, { ...newItem, quantity: 1 }],
        isOpen: true,
      };
    });
  },
  removeItem: (id) =>
    set((state) => ({ items: state.items.filter((i) => i.id !== id) })),
  updateQuantity: (id, quantity) =>
    set((state) => ({
      items:
        quantity < 1
          ? state.items.filter((i) => i.id !== id)
          : state.items.map((i) => (i.id === id ? { ...i, quantity } : i)),
    })),
  clearCart: () => set({ items: [] }),
  totalItems: () => get().items.reduce((sum, i) => sum + i.quantity, 0),
  totalPrice: () => get().items.reduce((sum, i) => sum + i.price * i.quantity, 0),
  openCart: () => set({ isOpen: true }),
  closeCart: () => set({ isOpen: false }),

  setStep: (step) => set({ step }),
  setDelivery: (info) =>
    set((state) => ({ delivery: { ...state.delivery, ...info } })),
  setPayLink: (url, orderNumber) =>
    set({ payLink: url, orderNumber, step: 'done' }),
  resetCheckout: () =>
    set({
      step: 'idle',
      delivery: defaultDelivery,
      payLink: null,
      orderNumber: null,
    }),
    }),
    {
      name: 'kavi-cart',
      storage: createJSONStorage(() => localStorage),
      // Persist only the cart items + delivery details, never the open/step UI state.
      partialize: (state) => ({ items: state.items, delivery: state.delivery }),
    }
  )
);
