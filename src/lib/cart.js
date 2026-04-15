import apiServerClient from '@/lib/apiServerClient';

export const CART_STORAGE_KEY = 'anfaCart';
export const CART_UPDATED_EVENT = 'cartUpdated';

export const EMPTY_CART = {
  items: [],
  subtotal: 0,
  itemCount: 0,
};

const normalizeSegment = (value) => `${value ?? ''}`
  .trim()
  .toLowerCase()
  .replace(/['"]/g, '')
  .replace(/[^a-z0-9]+/g, '-')
  .replace(/^-+|-+$/g, '');

const addAttributeEntry = (entries, key, value) => {
  const normalizedKey = normalizeSegment(key);
  const normalizedValue = normalizeSegment(value);

  if (!normalizedKey || !normalizedValue || entries.has(normalizedKey)) {
    return;
  }

  entries.set(normalizedKey, normalizedValue);
};

const collectAttributeEntries = (item = {}) => {
  const entries = new Map();

  if (Array.isArray(item.attributes)) {
    item.attributes.forEach((attribute) => {
      addAttributeEntry(entries, attribute?.name || attribute?.slug, attribute?.option || attribute?.value);
    });
  }

  [item.selectedOptions, item.selectedAttributes, item.attributeOptions].forEach((source) => {
    if (source && typeof source === 'object' && !Array.isArray(source)) {
      Object.entries(source).forEach(([key, value]) => {
        addAttributeEntry(entries, key, value);
      });
    }
  });

  addAttributeEntry(entries, 'color', item.color);
  addAttributeEntry(entries, 'size', item.size);

  return [...entries.entries()].sort(([leftKey], [rightKey]) => leftKey.localeCompare(rightKey));
};

export const getCartLineKey = (item = {}) => {
  const variationId = Number(item.variationId);

  if (Number.isFinite(variationId) && variationId > 0) {
    return `variation-${variationId}`;
  }

  const numericProductId = Number(item.productId);
  const productKey = Number.isFinite(numericProductId) && numericProductId > 0
    ? `product-${numericProductId}`
    : `product-${normalizeSegment(item.productId || 'unknown') || 'unknown'}`;

  const attributeKey = collectAttributeEntries(item)
    .map(([key, value]) => `${key}-${value}`)
    .join('__');

  return attributeKey ? `${productKey}__${attributeKey}` : productKey;
};

const normalizeCartItem = (item = {}) => ({
  ...item,
  lineKey: getCartLineKey(item),
  price: Number.parseFloat(item.price) || 0,
  quantity: Math.max(1, Number(item.quantity) || 1),
});

export const normalizeCart = (cart = EMPTY_CART) => {
  const items = Array.isArray(cart.items)
    ? [...cart.items.reduce((itemMap, rawItem) => {
      const item = normalizeCartItem(rawItem);
      const existingItem = itemMap.get(item.lineKey);

      if (existingItem) {
        itemMap.set(item.lineKey, {
          ...existingItem,
          ...item,
          quantity: existingItem.quantity + item.quantity,
        });
      } else {
        itemMap.set(item.lineKey, item);
      }

      return itemMap;
    }, new Map()).values()]
    : [];
  const subtotal = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);

  return {
    ...EMPTY_CART,
    ...cart,
    items,
    subtotal,
    itemCount,
  };
};

export const emitCartUpdated = () => {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new Event(CART_UPDATED_EVENT));
  }
};

export const readCartFromStorage = () => {
  if (typeof window === 'undefined') return EMPTY_CART;

  try {
    const rawCart = window.localStorage.getItem(CART_STORAGE_KEY);
    const parsedCart = rawCart ? JSON.parse(rawCart) : EMPTY_CART;
    const normalizedCart = normalizeCart(parsedCart);

    if (JSON.stringify(parsedCart) !== JSON.stringify(normalizedCart)) {
      window.localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(normalizedCart));
    }

    return normalizedCart;
  } catch {
    window.localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(EMPTY_CART));
    return EMPTY_CART;
  }
};

export const writeCartToStorage = (cart) => {
  if (typeof window === 'undefined') return normalizeCart(cart);

  const normalizedCart = normalizeCart(cart);
  window.localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(normalizedCart));
  return normalizedCart;
};

export const clearCartStorage = () => writeCartToStorage(EMPTY_CART);

const parseJsonResponse = async (response) => {
  try {
    return await response.json();
  } catch {
    return null;
  }
};

const getResponseErrorMessage = (payload, fallback) => (
  payload?.error
  || payload?.message
  || fallback
);

const requestAccountCart = async (path, init = {}, fallbackMessage = 'Cart request failed') => {
  const response = await apiServerClient.fetch(path, {
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...(init.headers || {}),
    },
    ...init,
  });

  const payload = await parseJsonResponse(response);
  if (!response.ok) {
    throw new Error(getResponseErrorMessage(payload, fallbackMessage));
  }

  return normalizeCart(payload?.cart || EMPTY_CART);
};

export const fetchAccountCart = () => (
  requestAccountCart('/cart/account', { method: 'GET' }, 'Unable to load your cart')
);

export const saveAccountCart = (cart) => (
  requestAccountCart('/cart/account', {
    method: 'PUT',
    body: JSON.stringify({ cart: normalizeCart(cart) }),
  }, 'Unable to save your cart')
);

export const mergeAccountCart = (cart) => (
  requestAccountCart('/cart/account/merge', {
    method: 'POST',
    body: JSON.stringify({ cart: normalizeCart(cart) }),
  }, 'Unable to merge your cart')
);

export const addAccountCartItem = (item) => (
  requestAccountCart('/cart/account/items', {
    method: 'POST',
    body: JSON.stringify({ item: normalizeCart({ items: [item] }).items[0] || item }),
  }, 'Unable to add this item to your cart')
);

export const updateAccountCartItem = (lineKey, quantity) => (
  requestAccountCart(`/cart/account/items/${encodeURIComponent(lineKey)}`, {
    method: 'PATCH',
    body: JSON.stringify({ quantity }),
  }, 'Unable to update this cart item')
);

export const removeAccountCartItem = (lineKey) => (
  requestAccountCart(`/cart/account/items/${encodeURIComponent(lineKey)}`, {
    method: 'DELETE',
  }, 'Unable to remove this cart item')
);

export const clearAccountCart = () => (
  requestAccountCart('/cart/account', {
    method: 'DELETE',
  }, 'Unable to clear your cart')
);
