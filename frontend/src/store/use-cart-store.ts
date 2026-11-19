// frontend/src/store/use-cart-store.ts
import { create } from 'zustand';
import { Product } from '@/types';

export interface CartItem {
  product: Product;
  quantity: number;
  effectivePrice: number; // Contracted price if available, else base price
}

interface CartState {
  vendorId: string | null;
  vendorName: string | null;
  items: CartItem[];
  addItem: (
    product: Product,
    quantity: number,
    vendorId: string,
    vendorName: string,
  ) => boolean;
  removeItem: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
  getTotalItems: () => number;
  getTotalAmount: () => number;
}

export const useCartStore = create<CartState>((set, get) => ({
  vendorId: null,
  vendorName: null,
  items: [],

  addItem: (product, quantity, vendorId, vendorName) => {
    const state = get();

    // Check if cart already has items from a different distributor
    if (state.vendorId && state.vendorId !== vendorId && state.items.length > 0) {
      const confirmSwitch = window.confirm(
        `Sepetinizde "${state.vendorName}" toptancısına ait ürünler bulunuyor. Yeni toptancıdan sipariş vermek için mevcut sepeti temizlemek istiyor musunuz?`,
      );
      if (!confirmSwitch) return false;
      // Reset cart for the new vendor
      set({ vendorId, vendorName, items: [] });
    }

    const price = product.contractedPrice ?? Number(product.basePrice);
    const existingIndex = state.items.findIndex(
      (item) => item.product.id === product.id,
    );

    let updatedItems: CartItem[];
    if (existingIndex > -1) {
      updatedItems = [...state.items];
      updatedItems[existingIndex].quantity += quantity;
    } else {
      updatedItems = [
        ...state.items,
        { product, quantity, effectivePrice: price },
      ];
    }

    set({
      vendorId,
      vendorName,
      items: updatedItems,
    });

    return true;
  },

  removeItem: (productId) => {
    const updated = get().items.filter((item) => item.product.id !== productId);
    set({
      items: updated,
      vendorId: updated.length === 0 ? null : get().vendorId,
      vendorName: updated.length === 0 ? null : get().vendorName,
    });
  },

  updateQuantity: (productId, quantity) => {
    if (quantity <= 0) {
      get().removeItem(productId);
      return;
    }
    const updated = get().items.map((item) =>
      item.product.id === productId ? { ...item, quantity } : item,
    );
    set({ items: updated });
  },

  clearCart: () => {
    set({ vendorId: null, vendorName: null, items: [] });
  },

  getTotalItems: () => {
    return get().items.reduce((total, item) => total + item.quantity, 0);
  },

  getTotalAmount: () => {
    return get().items.reduce(
      (total, item) => total + item.effectivePrice * item.quantity,
      0,
    );
  },
}));