export const ORDER_SUMMARY_STORAGE_KEY = 'anfaLatestOrderSummary';

const toNumber = (value, fallback = 0) => {
  const parsed = Number.parseFloat(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const normalizeText = (value) => String(value || '').trim();

const normalizeAddress = (address = {}) => ({
  firstName: normalizeText(address.firstName ?? address.first_name),
  lastName: normalizeText(address.lastName ?? address.last_name),
  email: normalizeText(address.email),
  phone: normalizeText(address.phone),
  company: normalizeText(address.company),
  address: normalizeText(address.address ?? address.address_1),
  address2: normalizeText(address.address2 ?? address.address_2),
  city: normalizeText(address.city),
  state: normalizeText(address.state),
  zip: normalizeText(address.zip ?? address.postcode),
  country: normalizeText(address.country) || 'US',
});

const normalizeItem = (item = {}) => {
  const quantity = Math.max(1, Number.parseInt(item.quantity, 10) || 1);
  const price = toNumber(item.price);
  const subtotal = toNumber(item.subtotal, price * quantity);
  const total = toNumber(item.total, subtotal);

  return {
    id: item.id ?? null,
    productId: item.productId ?? item.product_id ?? null,
    variationId: item.variationId ?? item.variation_id ?? null,
    name: normalizeText(item.name ?? item.productName) || 'Product',
    quantity,
    price,
    subtotal,
    total,
    sku: normalizeText(item.sku),
    size: normalizeText(item.size),
    color: normalizeText(item.color),
    image: normalizeText(item.image),
  };
};

export const normalizeOrderSummary = (order, fallback = {}) => {
  const source = order || {};
  const fallbackSource = fallback || {};
  const itemsSource = source.items || source.lineItems || fallbackSource.items || fallbackSource.lineItems || [];
  const items = Array.isArray(itemsSource) ? itemsSource.map(normalizeItem) : [];

  const billing = normalizeAddress(
    source.billing || source.billingAddress || fallbackSource.billing || fallbackSource.billingAddress || {}
  );
  const shipping = normalizeAddress(
    source.shipping || source.shippingAddress || fallbackSource.shipping || fallbackSource.shippingAddress || billing
  );

  const subtotal = source.subtotal ?? source.totals?.subtotal ?? fallbackSource.subtotal ?? fallbackSource.totals?.subtotal;
  const shippingTotal = source.shippingTotal ?? source.shipping_total ?? source.shippingCost ?? source.totals?.shippingCost
    ?? fallbackSource.shippingTotal ?? fallbackSource.shipping_total ?? fallbackSource.shippingCost ?? fallbackSource.totals?.shippingCost;
  const taxTotal = source.taxTotal ?? source.total_tax ?? source.tax ?? source.totals?.tax
    ?? fallbackSource.taxTotal ?? fallbackSource.total_tax ?? fallbackSource.tax ?? fallbackSource.totals?.tax;
  const total = source.total ?? source.totalAmount ?? source.totals?.total
    ?? fallbackSource.total ?? fallbackSource.totalAmount ?? fallbackSource.totals?.total;

  return {
    orderId: source.orderId ?? source.id ?? source.order_id ?? fallbackSource.orderId ?? fallbackSource.id ?? fallbackSource.order_id ?? null,
    orderNumber: normalizeText(source.orderNumber ?? source.number ?? source.order_number ?? fallbackSource.orderNumber ?? fallbackSource.number ?? fallbackSource.order_number),
    status: normalizeText(source.status ?? source.orderStatus ?? fallbackSource.status ?? fallbackSource.orderStatus) || 'processing',
    date: source.date ?? source.orderDate ?? source.date_created ?? fallbackSource.date ?? fallbackSource.orderDate ?? new Date().toISOString(),
    items,
    billing,
    shipping,
    subtotal: toNumber(subtotal, items.reduce((sum, item) => sum + item.subtotal, 0)),
    shippingTotal: toNumber(shippingTotal),
    taxTotal: toNumber(taxTotal),
    total: toNumber(total, items.reduce((sum, item) => sum + item.total, 0) + toNumber(shippingTotal) + toNumber(taxTotal)),
    paymentMethod: normalizeText(source.paymentMethod ?? source.payment_method ?? fallbackSource.paymentMethod ?? fallbackSource.payment_method),
  };
};

export const storeOrderSummary = (orderSummary) => {
  if (typeof window === 'undefined' || !orderSummary) return;
  window.sessionStorage.setItem(ORDER_SUMMARY_STORAGE_KEY, JSON.stringify(orderSummary));
};

export const readStoredOrderSummary = ({ orderId, orderNumber } = {}) => {
  if (typeof window === 'undefined') return null;

  try {
    const raw = window.sessionStorage.getItem(ORDER_SUMMARY_STORAGE_KEY);
    if (!raw) return null;

    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object') return null;

    const normalized = normalizeOrderSummary(parsed);
    const matchesId = orderId == null || String(normalized.orderId || '') === String(orderId);
    const matchesNumber = !orderNumber || normalized.orderNumber === orderNumber;

    return matchesId && matchesNumber ? normalized : null;
  } catch {
    return null;
  }
};
