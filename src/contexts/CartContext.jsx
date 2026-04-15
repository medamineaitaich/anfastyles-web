import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext.jsx';
import {
  EMPTY_CART,
  addAccountCartItem,
  clearAccountCart,
  clearCartStorage,
  emitCartUpdated,
  fetchAccountCart,
  mergeAccountCart,
  normalizeCart,
  readCartFromStorage,
  removeAccountCartItem,
  updateAccountCartItem,
  writeCartToStorage,
} from '@/lib/cart';

const CartContext = createContext(null);

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within CartProvider');
  }

  return context;
};

export const CartProvider = ({ children }) => {
  const { authenticated, loading: authLoading, user } = useAuth();
  const [cart, setCart] = useState(EMPTY_CART);
  const [loading, setLoading] = useState(true);

  const applyCart = useCallback((nextCart) => {
    const normalizedCart = normalizeCart(nextCart);
    setCart(normalizedCart);
    emitCartUpdated();
    return normalizedCart;
  }, []);

  const refreshCart = useCallback(async () => {
    if (authLoading) return EMPTY_CART;

    if (!authenticated) {
      return applyCart(readCartFromStorage());
    }

    const savedGuestCart = readCartFromStorage();

    if (savedGuestCart.items.length > 0) {
      const mergedCart = await mergeAccountCart(savedGuestCart);
      clearCartStorage();
      return applyCart(mergedCart);
    }

    const accountCart = await fetchAccountCart();
    return applyCart(accountCart);
  }, [applyCart, authLoading, authenticated]);

  useEffect(() => {
    let cancelled = false;

    const syncCart = async () => {
      if (authLoading) return;

      setLoading(true);
      try {
        await refreshCart();
      } catch (error) {
        console.error('Failed to synchronize cart:', error);
        if (!cancelled) {
          applyCart(authenticated ? EMPTY_CART : readCartFromStorage());
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    syncCart();

    return () => {
      cancelled = true;
    };
  }, [authLoading, authenticated, refreshCart, user?.userId, user?.email]);

  const addItem = useCallback(async (item) => {
    if (authenticated) {
      return applyCart(await addAccountCartItem(item));
    }

    const currentCart = readCartFromStorage();
    const nextCart = writeCartToStorage({
      ...currentCart,
      items: [...currentCart.items, item],
    });

    return applyCart(nextCart);
  }, [applyCart, authenticated]);

  const updateItemQuantity = useCallback(async (lineKey, quantity) => {
    if (quantity < 1) {
      return null;
    }

    if (authenticated) {
      return applyCart(await updateAccountCartItem(lineKey, quantity));
    }

    const currentCart = readCartFromStorage();
    const nextCart = writeCartToStorage({
      ...currentCart,
      items: currentCart.items.map((item) => (
        item.lineKey === lineKey ? { ...item, quantity } : item
      )),
    });

    return applyCart(nextCart);
  }, [applyCart, authenticated]);

  const removeItem = useCallback(async (lineKey) => {
    if (authenticated) {
      return applyCart(await removeAccountCartItem(lineKey));
    }

    const currentCart = readCartFromStorage();
    const nextCart = writeCartToStorage({
      ...currentCart,
      items: currentCart.items.filter((item) => item.lineKey !== lineKey),
    });

    return applyCart(nextCart);
  }, [applyCart, authenticated]);

  const clearCart = useCallback(async () => {
    if (authenticated) {
      return applyCart(await clearAccountCart());
    }

    return applyCart(clearCartStorage());
  }, [applyCart, authenticated]);

  const value = useMemo(() => ({
    cart,
    loading,
    refreshCart,
    addItem,
    updateItemQuantity,
    removeItem,
    clearCart,
  }), [addItem, cart, clearCart, loading, refreshCart, removeItem, updateItemQuantity]);

  return (
    <CartContext.Provider value={value}>
      {children}
    </CartContext.Provider>
  );
};
