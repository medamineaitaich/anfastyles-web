import { trackMetaCustomEvent, trackMetaViewContent } from '@/lib/metaPixel.js';
import { trackTikTokEvent, trackTikTokViewContent } from '@/lib/tiktokPixel.js';

const DEFAULT_CURRENCY = 'USD';
const DEFAULT_CONTENT_NAME = 'Compost Graphic Tee';

const normalizeText = (value) => String(value || '').trim();

const normalizeMoney = (value) => {
  const amount = Number(value);
  if (!Number.isFinite(amount)) return null;
  const normalized = Math.max(0, amount);
  return normalized > 0 ? normalized : null;
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

export const trackOfferViewContentOnce = ({
  trackedRef,
  productId,
  contentName = DEFAULT_CONTENT_NAME,
  value,
  currency = DEFAULT_CURRENCY,
} = {}) => {
  if (!trackedRef || trackedRef.current) return false;

  const id = normalizeText(productId);
  if (!id) return false;

  trackedRef.current = true;
  const money = normalizeMoney(value);

  trackMetaViewContent({
    contentId: id,
    contentName,
    ...(money != null ? { value: money } : {}),
    currency,
  });

  trackTikTokViewContent({
    contentId: id,
    contentName,
    ...(money != null ? { value: money } : {}),
    currency,
  });

  return true;
};

export const trackOfferCTA = ({
  offerSlug,
  ctaLabel,
  productId,
  contentName = DEFAULT_CONTENT_NAME,
  value,
  currency = DEFAULT_CURRENCY,
} = {}) => {
  const id = normalizeText(productId);
  const label = normalizeText(ctaLabel);
  if (!id || !label) return false;

  const money = normalizeMoney(value);

  trackMetaCustomEvent('OfferCTA', compactObject({
    offer_slug: normalizeText(offerSlug) || undefined,
    cta_label: label,
    content_ids: [id],
    content_name: contentName,
    ...(money != null ? { value: money } : {}),
    currency,
  }));

  trackTikTokEvent('ClickButton', compactObject({
    offer_slug: normalizeText(offerSlug) || undefined,
    cta_label: label,
    content_id: id,
    content_type: 'product',
    content_name: contentName,
    ...(money != null ? { value: money } : {}),
    currency,
  }));

  return true;
};

export const trackOfferScroll50Once = ({
  trackedRef,
  offerSlug,
  productId,
  contentName = DEFAULT_CONTENT_NAME,
  value,
  currency = DEFAULT_CURRENCY,
} = {}) => {
  if (!trackedRef || trackedRef.current) return false;

  const id = normalizeText(productId);
  if (!id) return false;

  trackedRef.current = true;
  const money = normalizeMoney(value);

  trackMetaCustomEvent('OfferScroll50', compactObject({
    offer_slug: normalizeText(offerSlug) || undefined,
    content_ids: [id],
    content_name: contentName,
    ...(money != null ? { value: money } : {}),
    currency,
  }));

  trackTikTokEvent('OfferScroll50', compactObject({
    offer_slug: normalizeText(offerSlug) || undefined,
    content_id: id,
    content_type: 'product',
    content_name: contentName,
    ...(money != null ? { value: money } : {}),
    currency,
  }));

  return true;
};
