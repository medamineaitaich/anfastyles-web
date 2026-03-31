export const CART_STORAGE_KEY = 'anfaCart';

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

export const readCartFromStorage = () => {
  try {
    const rawCart = localStorage.getItem(CART_STORAGE_KEY);
    const parsedCart = rawCart ? JSON.parse(rawCart) : EMPTY_CART;
    const normalizedCart = normalizeCart(parsedCart);

    if (JSON.stringify(parsedCart) !== JSON.stringify(normalizedCart)) {
      localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(normalizedCart));
    }

    return normalizedCart;
  } catch (error) {
    localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(EMPTY_CART));
    return EMPTY_CART;
  }
};

export const writeCartToStorage = (cart) => {
  const normalizedCart = normalizeCart(cart);
  localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(normalizedCart));
  return normalizedCart;
};
