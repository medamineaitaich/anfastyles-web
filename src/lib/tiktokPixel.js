const DEFAULT_CURRENCY = 'USD';
const DEFAULT_CONTENT_TYPE = 'product';
const PURCHASE_TRACKED_STORAGE_KEY = 'anfaTiktokPurchaseTrackedOrders';

const normalizeCurrency = (currency) => {
  const value = String(currency || '').trim();
  return value ? value.toUpperCase() : DEFAULT_CURRENCY;
};

const normalizeMoney = (value) => {
  const amount = Number(value);
  if (!Number.isFinite(amount)) return 0;
  return Math.max(0, amount);
};

const normalizeQuantity = (value) => {
  const qty = Number.parseInt(value, 10);
  return Number.isFinite(qty) ? Math.max(1, qty) : 1;
};

const normalizeText = (value) => String(value || '').trim();

const toStableContentId = (...values) => {
  for (const value of values) {
    const text = normalizeText(value);
    if (!text) continue;
    return text;
  }

  return null;
};

export const getTikTokContentId = (source = {}) => {
  const variationId = Number(source?.variationId ?? source?.variation_id);
  if (Number.isFinite(variationId) && variationId > 0) {
    return String(variationId);
  }

  return toStableContentId(
    source?.productId,
    source?.product_id,
    source?.id,
    source?.sku
  );
};

export const buildTikTokContents = (items = []) => {
  if (!Array.isArray(items)) return [];

  return items
    .map((item) => {
      const id = getTikTokContentId(item);
      if (!id) return null;

      return {
        id,
        quantity: normalizeQuantity(item?.quantity),
        price: normalizeMoney(item?.price),
      };
    })
    .filter(Boolean);
};

export const trackTikTokEvent = (eventName, payload) => {
  if (typeof window === 'undefined') return false;

  const ttq = window.ttq;
  if (!ttq || typeof ttq.track !== 'function') return false;

  try {
    ttq.track(eventName, payload);
    return true;
  } catch (error) {
    console.warn(`TikTok Pixel track(${eventName}) failed`, error);
    return false;
  }
};

export const trackTikTokViewContent = ({
  contentId,
  contentName,
  value,
  currency,
  contentType,
} = {}) => {
  const normalizedContentId = toStableContentId(contentId);
  if (!normalizedContentId) return false;

  return trackTikTokEvent('ViewContent', {
    content_id: normalizedContentId,
    content_type: normalizeText(contentType) || DEFAULT_CONTENT_TYPE,
    content_name: normalizeText(contentName),
    value: normalizeMoney(value),
    currency: normalizeCurrency(currency),
  });
};

export const trackTikTokAddToCart = ({
  contentId,
  contentName,
  value,
  currency,
  quantity,
  contentType,
  unitPrice,
} = {}) => {
  const normalizedContentId = toStableContentId(contentId);
  if (!normalizedContentId) return false;

  const normalizedQuantity = normalizeQuantity(quantity);
  const normalizedUnitPrice = normalizeMoney(unitPrice);

  return trackTikTokEvent('AddToCart', {
    content_id: normalizedContentId,
    content_type: normalizeText(contentType) || DEFAULT_CONTENT_TYPE,
    content_name: normalizeText(contentName),
    value: normalizeMoney(value),
    currency: normalizeCurrency(currency),
    quantity: normalizedQuantity,
    contents: [{
      id: normalizedContentId,
      quantity: normalizedQuantity,
      price: normalizedUnitPrice,
    }],
  });
};

export const trackTikTokInitiateCheckout = ({
  items,
  value,
  currency,
  contentType,
} = {}) => {
  const contents = buildTikTokContents(items);
  const contentIds = [...new Set(contents.map((entry) => entry.id))];
  if (contentIds.length === 0) return false;

  return trackTikTokEvent('InitiateCheckout', {
    content_type: normalizeText(contentType) || DEFAULT_CONTENT_TYPE,
    content_ids: contentIds,
    contents,
    value: normalizeMoney(value),
    currency: normalizeCurrency(currency),
  });
};

const readTrackedPurchaseOrders = () => {
  if (typeof window === 'undefined') return new Set();

  try {
    const raw = window.sessionStorage.getItem(PURCHASE_TRACKED_STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    if (!Array.isArray(parsed)) return new Set();
    return new Set(parsed.map((value) => normalizeText(value)).filter(Boolean));
  } catch {
    return new Set();
  }
};

const writeTrackedPurchaseOrders = (tracked) => {
  if (typeof window === 'undefined') return;
  window.sessionStorage.setItem(PURCHASE_TRACKED_STORAGE_KEY, JSON.stringify([...tracked]));
};

export const trackTikTokPurchaseOnce = ({
  orderId,
  orderNumber,
  items,
  value,
  currency,
  contentType,
} = {}) => {
  const orderKey = toStableContentId(orderId, orderNumber);
  const trackedOrders = readTrackedPurchaseOrders();

  if (orderKey && trackedOrders.has(orderKey)) {
    return false;
  }

  const contents = buildTikTokContents(items);
  const contentIds = [...new Set(contents.map((entry) => entry.id))];
  if (contentIds.length === 0) return false;

  const didTrack = trackTikTokEvent('Purchase', {
    ...(orderKey ? { order_id: orderKey } : {}),
    content_type: normalizeText(contentType) || DEFAULT_CONTENT_TYPE,
    content_ids: contentIds,
    contents,
    value: normalizeMoney(value),
    currency: normalizeCurrency(currency),
  });

  if (didTrack && orderKey) {
    trackedOrders.add(orderKey);
    writeTrackedPurchaseOrders(trackedOrders);
  }

  return didTrack;
};
