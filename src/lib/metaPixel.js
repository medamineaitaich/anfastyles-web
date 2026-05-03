const DEFAULT_CONTENT_TYPE = 'product';
const DEFAULT_CURRENCY = 'USD';
const PURCHASE_TRACKED_STORAGE_KEY = 'anfaMetaPurchaseTrackedOrders';

const normalizeText = (value) => String(value || '').trim();

const normalizeMoney = (value) => {
  const amount = Number(value);
  if (!Number.isFinite(amount)) return null;
  return Math.max(0, amount);
};

const normalizeCurrency = (value) => {
  const text = normalizeText(value);
  return text ? text.toUpperCase() : null;
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

const getMetaPixelId = () => normalizeText(import.meta?.env?.VITE_META_PIXEL_ID);

export const initMetaPixel = () => {
  const pixelId = getMetaPixelId();
  if (!pixelId || typeof window === 'undefined') return false;

  if (window.fbq && window._fbq) {
    return true;
  }

  // Meta base pixel, but with env-provided pixel id and safe no-op when unset.
  // Disable autoConfig to avoid noisy automatic events + Event Setup Tool reliance.
  /* eslint-disable */
  !function(f,b,e,v,n,t,s)
  {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
  n.callMethod.apply(n,arguments):n.queue.push(arguments)};
  if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
  n.queue=[];t=b.createElement(e);t.async=!0;
  t.src=v;s=b.getElementsByTagName(e)[0];
  s.parentNode.insertBefore(t,s)}(window, document,'script',
  'https://connect.facebook.net/en_US/fbevents.js');
  /* eslint-enable */

  // Explicitly disable automatic configuration (helps reduce noisy auto-logged events and avoids relying on Event Setup Tool rules).
  window.fbq('init', pixelId, {}, { autoConfig: 'false' });
  return true;
};

const getFbq = () => {
  if (typeof window === 'undefined') return null;
  return typeof window.fbq === 'function' ? window.fbq : null;
};

export const trackMetaEvent = (eventName, params) => {
  if (!initMetaPixel()) return false;

  const fbq = getFbq();
  if (!fbq) return false;

  try {
    const cleanedParams = compactObject(params);
    if (cleanedParams && Object.keys(cleanedParams).length > 0) {
      fbq('track', eventName, cleanedParams);
    } else {
      fbq('track', eventName);
    }
    return true;
  } catch (error) {
    console.warn(`Meta Pixel track(${eventName}) failed`, error);
    return false;
  }
};

export const trackMetaCustomEvent = (eventName, params) => {
  if (!initMetaPixel()) return false;

  const fbq = getFbq();
  if (!fbq) return false;

  try {
    const cleanedParams = compactObject(params);
    if (cleanedParams && Object.keys(cleanedParams).length > 0) {
      fbq('trackCustom', eventName, cleanedParams);
    } else {
      fbq('trackCustom', eventName);
    }
    return true;
  } catch (error) {
    console.warn(`Meta Pixel trackCustom(${eventName}) failed`, error);
    return false;
  }
};

export const trackMetaPageView = () => trackMetaEvent('PageView');

export const getMetaContentId = (source = {}) => {
  const variationId = Number(source?.variationId ?? source?.variation_id);
  if (Number.isFinite(variationId) && variationId > 0) return String(variationId);

  const productId = normalizeText(source?.productId ?? source?.product_id ?? source?.id);
  if (productId) return productId;

  const sku = normalizeText(source?.sku);
  return sku || null;
};

const buildMetaContents = (items = []) => {
  if (!Array.isArray(items)) return [];

  return items
    .map((item) => {
      const id = getMetaContentId(item);
      if (!id) return null;

      const quantity = Math.max(1, Number.parseInt(item?.quantity, 10) || 1);
      const itemPrice = normalizeMoney(item?.price);

      return compactObject({
        id,
        quantity,
        ...(itemPrice != null ? { item_price: itemPrice } : {}),
      });
    })
    .filter(Boolean);
};

const sumItemQuantity = (items = []) => (
  Array.isArray(items)
    ? items.reduce((sum, item) => sum + (Number.parseInt(item?.quantity, 10) || 0), 0)
    : 0
);

export const trackMetaViewContent = ({
  contentId,
  contentName,
  value,
  currency,
} = {}) => {
  const id = normalizeText(contentId);
  if (!id) return false;

  const money = normalizeMoney(value);
  const normalizedCurrency = normalizeCurrency(currency) || DEFAULT_CURRENCY;
  const name = normalizeText(contentName);

  return trackMetaEvent('ViewContent', compactObject({
    content_ids: [id],
    content_type: DEFAULT_CONTENT_TYPE,
    ...(name ? { content_name: name } : {}),
    ...(money != null ? { value: money } : {}),
    currency: normalizedCurrency,
  }));
};

export const trackMetaAddToCart = ({
  contentId,
  contentName,
  value,
  currency,
  quantity,
  unitPrice,
} = {}) => {
  const id = normalizeText(contentId);
  if (!id) return false;

  const normalizedQuantity = Math.max(1, Number.parseInt(quantity, 10) || 1);
  const money = normalizeMoney(value);
  const normalizedCurrency = normalizeCurrency(currency) || DEFAULT_CURRENCY;
  const name = normalizeText(contentName);
  const itemPrice = normalizeMoney(unitPrice);

  return trackMetaEvent('AddToCart', compactObject({
    content_ids: [id],
    content_type: DEFAULT_CONTENT_TYPE,
    ...(name ? { content_name: name } : {}),
    ...(money != null ? { value: money } : {}),
    currency: normalizedCurrency,
    num_items: normalizedQuantity,
    contents: [{
      id,
      quantity: normalizedQuantity,
      ...(itemPrice != null ? { item_price: itemPrice } : {}),
    }],
  }));
};

export const trackMetaInitiateCheckout = ({
  items,
  value,
  currency,
} = {}) => {
  const contents = buildMetaContents(items);
  const contentIds = [...new Set(contents.map((entry) => entry.id))];
  if (contentIds.length === 0) return false;

  const numItems = sumItemQuantity(items);
  const money = normalizeMoney(value);
  const normalizedCurrency = normalizeCurrency(currency) || DEFAULT_CURRENCY;

  return trackMetaEvent('InitiateCheckout', compactObject({
    content_ids: contentIds,
    content_type: DEFAULT_CONTENT_TYPE,
    ...(money != null ? { value: money } : {}),
    currency: normalizedCurrency,
    ...(numItems ? { num_items: numItems } : {}),
    contents,
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

export const trackMetaPurchaseOnce = ({
  orderId,
  orderNumber,
  items,
  value,
  currency,
} = {}) => {
  const orderKey = normalizeText(orderId) || normalizeText(orderNumber);
  const trackedOrders = readTrackedPurchaseOrders();

  const contents = buildMetaContents(items);
  const contentIds = [...new Set(contents.map((entry) => entry.id))];
  if (contentIds.length === 0) return false;

  const numItems = sumItemQuantity(items);
  const money = normalizeMoney(value);
  const normalizedCurrency = normalizeCurrency(currency) || DEFAULT_CURRENCY;
  const dedupeKey = orderKey || `purchase:${contentIds.join('|')}:${money ?? ''}:${normalizedCurrency}`;

  if (trackedOrders.has(dedupeKey)) {
    return false;
  }

  const didTrack = trackMetaEvent('Purchase', compactObject({
    content_ids: contentIds,
    content_type: DEFAULT_CONTENT_TYPE,
    ...(money != null ? { value: money } : {}),
    currency: normalizedCurrency,
    ...(numItems ? { num_items: numItems } : {}),
    contents,
    ...(orderKey ? { order_id: orderKey } : {}),
  }));

  if (didTrack) {
    trackedOrders.add(dedupeKey);
    writeTrackedPurchaseOrders(trackedOrders);
  }

  return didTrack;
};
