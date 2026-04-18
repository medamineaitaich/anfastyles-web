const DEFAULT_CURRENCY = 'USD';
const DEFAULT_CONTENT_TYPE = 'product';
const PURCHASE_TRACKED_STORAGE_KEY = 'anfaTiktokPurchaseTrackedOrders';

const hasWebCrypto = () => (
  typeof window !== 'undefined'
  && window.crypto
  && window.crypto.subtle
  && typeof window.crypto.subtle.digest === 'function'
);

const sha256Hex = async (value) => {
  if (!hasWebCrypto()) return null;

  const normalized = String(value || '').trim();
  if (!normalized) return null;

  const encoder = new TextEncoder();
  const data = encoder.encode(normalized);
  const digest = await window.crypto.subtle.digest('SHA-256', data);
  return [...new Uint8Array(digest)].map((byte) => byte.toString(16).padStart(2, '0')).join('');
};

const normalizeEmailForHash = (value) => String(value || '').trim().toLowerCase();

const normalizePhoneForHash = (value) => {
  const raw = String(value || '').trim();
  if (!raw) return '';
  const digits = raw.replace(/[^\d+]/g, '');
  return digits.startsWith('+') ? `+${digits.slice(1).replace(/\D/g, '')}` : digits.replace(/\D/g, '');
};

const compactObject = (value) => {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return value;

  return Object.fromEntries(
    Object.entries(value).filter(([, entry]) => (
      entry !== undefined
      && entry !== null
      && entry !== ''
      && !(Array.isArray(entry) && entry.length === 0)
    ))
  );
};

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

const trackTikTokIdentify = (payload) => {
  if (typeof window === 'undefined') return false;

  const ttq = window.ttq;
  if (!ttq || typeof ttq.identify !== 'function') return false;

  const cleaned = compactObject(payload);
  if (!cleaned || Object.keys(cleaned).length === 0) return false;

  try {
    ttq.identify(cleaned);
    return true;
  } catch (error) {
    console.warn('TikTok Pixel identify() failed', error);
    return false;
  }
};

const buildPageContext = () => {
  if (typeof window === 'undefined') return null;

  const url = String(window.location?.href || '').trim();
  const referrer = String(document?.referrer || '').trim();

  const page = compactObject({
    url: url || undefined,
    referrer: referrer || undefined,
  });

  return page && Object.keys(page).length > 0 ? page : null;
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

  const cleanedName = normalizeText(contentName);

  return trackTikTokEvent('ViewContent', compactObject({
    content_id: normalizedContentId,
    content_type: normalizeText(contentType) || DEFAULT_CONTENT_TYPE,
    ...(cleanedName ? { content_name: cleanedName } : {}),
    value: normalizeMoney(value),
    currency: normalizeCurrency(currency),
    page: buildPageContext() || undefined,
  }));
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
  const cleanedName = normalizeText(contentName);

  return trackTikTokEvent('AddToCart', compactObject({
    content_id: normalizedContentId,
    content_type: normalizeText(contentType) || DEFAULT_CONTENT_TYPE,
    ...(cleanedName ? { content_name: cleanedName } : {}),
    value: normalizeMoney(value),
    currency: normalizeCurrency(currency),
    quantity: normalizedQuantity,
    contents: [{
      id: normalizedContentId,
      quantity: normalizedQuantity,
      price: normalizedUnitPrice,
    }],
    page: buildPageContext() || undefined,
  }));
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

  const normalizedContentType = normalizeText(contentType) || DEFAULT_CONTENT_TYPE;
  const normalizedPage = buildPageContext();

  return trackTikTokEvent('InitiateCheckout', compactObject({
    content_type: normalizedContentType,
    ...(contentIds.length === 1 ? { content_id: contentIds[0] } : { content_ids: contentIds }),
    contents,
    value: normalizeMoney(value),
    currency: normalizeCurrency(currency),
    properties: compactObject({
      content_type: normalizedContentType,
      currency: normalizeCurrency(currency),
    }),
    page: normalizedPage || undefined,
  }));
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

export const trackTikTokPurchaseOnce = async ({
  orderId,
  orderNumber,
  items,
  value,
  currency,
  contentType,
  user,
  page,
} = {}) => {
  const orderKey = toStableContentId(orderId, orderNumber);
  const trackedOrders = readTrackedPurchaseOrders();

  if (orderKey && trackedOrders.has(orderKey)) {
    return false;
  }

  const contents = buildTikTokContents(items);
  const contentIds = [...new Set(contents.map((entry) => entry.id))];
  if (contentIds.length === 0) return false;

  const normalizedContentType = normalizeText(contentType) || DEFAULT_CONTENT_TYPE;
  const normalizedCurrency = normalizeCurrency(currency);
  const normalizedValue = normalizeMoney(value);
  const normalizedPage = compactObject(page) || buildPageContext();

  const email = normalizeEmailForHash(user?.email);
  const phone = normalizePhoneForHash(user?.phone);
  const externalId = normalizeText(user?.external_id || user?.externalId);

  const [hashedEmail, hashedPhone, hashedExternalId] = await Promise.all([
    email ? sha256Hex(email) : Promise.resolve(null),
    phone ? sha256Hex(phone) : Promise.resolve(null),
    externalId ? sha256Hex(externalId) : Promise.resolve(null),
  ]);

  const userPayload = compactObject({
    email: hashedEmail || undefined,
    phone: hashedPhone || undefined,
    external_id: hashedExternalId || undefined,
  });

  if (userPayload && Object.keys(userPayload).length > 0) {
    trackTikTokIdentify(compactObject({
      email: userPayload.email,
      phone_number: userPayload.phone,
      external_id: userPayload.external_id,
    }));
  }

  const contentName = contentIds.length === 1 && Array.isArray(items) && items.length > 0
    ? normalizeText(items[0]?.name)
    : '';
  const singleQuantity = contentIds.length === 1 && Array.isArray(items) && items.length > 0
    ? normalizeQuantity(items[0]?.quantity)
    : null;

  const didTrack = trackTikTokEvent('Purchase', compactObject({
    ...(orderKey ? { order_id: orderKey } : {}),
    content_type: normalizedContentType,
    ...(contentIds.length === 1 ? { content_id: contentIds[0] } : { content_ids: contentIds }),
    contents,
    ...(contentName ? { content_name: contentName } : {}),
    ...(singleQuantity ? { quantity: singleQuantity } : {}),
    value: normalizedValue,
    currency: normalizedCurrency,
    ...(userPayload && Object.keys(userPayload).length > 0 ? { user: userPayload } : {}),
    properties: compactObject({
      currency: normalizedCurrency,
      content_type: normalizedContentType,
    }),
    page: normalizedPage || undefined,
  }));

  if (didTrack && orderKey) {
    trackedOrders.add(orderKey);
    writeTrackedPurchaseOrders(trackedOrders);
  }

  return didTrack;
};
