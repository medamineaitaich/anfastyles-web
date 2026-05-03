import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Helmet } from 'react-helmet';
import { Minus, Plus, ShoppingCart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import apiServerClient from '@/lib/apiServerClient';
import { trackMetaInitiateCheckout } from '@/lib/metaPixel.js';
import { trackTikTokInitiateCheckout } from '@/lib/tiktokPixel.js';
import { trackOfferCTA, trackOfferScroll50Once, trackOfferViewContentOnce } from '@/lib/offerTracking.js';
import CheckoutPage from '@/pages/CheckoutPage.jsx';

const COMPOST_PRODUCT_ID = 8572;
const OFFER_SLUG = 'compost-believe';
const CREATIVE = {
  src: '/offers/compost-believe/landing.webp',
  width: 715,
  height: 4768,
};

const OFFER_CHECKOUT_ROOT_ID = 'compost-believe-offer-checkout';
const OFFER_PLACE_ORDER_BUTTON_ID = 'compost-believe-offer-place-order';
const TEE_THUMBNAIL_FALLBACK = '/offers/compost/compost-white.jpg';

const TEE_THUMBNAIL_BY_COLOR = {
  white: '/offers/compost/compost-white.jpg',
  natural: '/offers/compost/compost-natural.jpg',
  cream: '/offers/compost/compost-natural.jpg',
  pistachio: '/offers/compost/compost-mint-green.jpg',
  'mint-green': '/offers/compost/compost-mint-green.jpg',
  'light-green': '/offers/compost/compost-mint-green.jpg',
  'light-blue': '/offers/compost/compost-light-blue.jpg',
  'light-pink': '/offers/compost/compost-pink.jpg',
  azalea: '/offers/compost/compost-pink.jpg',
  grey: '/offers/compost/compost-grey.jpg',
  gray: '/offers/compost/compost-grey.jpg',
  'ice-grey': '/offers/compost/compost-grey.jpg',
  'ice-gray': '/offers/compost/compost-grey.jpg',
};

const normalizeOptionValue = (value) => String(value || '')
  .trim()
  .toLowerCase()
  .replace(/^pa_/, '')
  .replace(/['"]/g, '')
  .replace(/&/g, ' and ')
  .replace(/[^a-z0-9]+/g, '-')
  .replace(/^-+|-+$/g, '');

const formatOptionLabel = (value) => {
  const text = String(value || '').trim();
  if (!text) return '';

  const normalized = normalizeOptionValue(text);
  if (['xs', 's', 'm', 'l', 'xl', '2xl', '3xl', '4xl', '5xl', 'xxl', 'xxxl'].includes(normalized)) {
    return normalized.toUpperCase();
  }

  return text
    .replace(/[_-]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
};

const getRawVariationSelections = (variation) => {
  if (Array.isArray(variation?.attributeSelections) && variation.attributeSelections.length > 0) {
    return variation.attributeSelections;
  }

  if (Array.isArray(variation?.attributes)) {
    return variation.attributes;
  }

  if (variation?.attributes && typeof variation.attributes === 'object') {
    return Object.entries(variation.attributes).map(([name, option]) => ({ name, option }));
  }

  return [];
};

const getVariationAttributePairs = (variation) => getRawVariationSelections(variation)
  .map((selection) => ({
    key: normalizeOptionValue(selection?.slug || selection?.name || selection?.attribute || selection?.key || ''),
    value: normalizeOptionValue(selection?.option || selection?.value || selection?.name_value || selection?.option_name || ''),
  }))
  .filter((pair) => pair.key && pair.value);

const pickFromPairs = (pairs, kindSet) => {
  for (const pair of pairs) {
    if (kindSet.has(pair.key)) return pair.value;
  }
  return '';
};

const ATTRIBUTE_ALIASES = {
  size: new Set(['size', 'sizes', 'pa-size', 'pa_size']),
  color: new Set(['color', 'colors', 'colour', 'colours', 'pa-color', 'pa-colour', 'pa_color', 'pa_colour']),
};

const buildVariationEntries = (product) => {
  const variations = Array.isArray(product?.variations) ? product.variations : [];

  return variations.map((variation) => {
    const pairs = getVariationAttributePairs(variation);
    const color = pickFromPairs(pairs, ATTRIBUTE_ALIASES.color);
    const size = pickFromPairs(pairs, ATTRIBUTE_ALIASES.size);

    const priceValue = Number.parseFloat(variation?.price ?? variation?.display_price ?? product?.price ?? 0);
    const inStock = variation?.in_stock ?? variation?.inStock ?? variation?.stock_status === 'instock' ?? true;

    return {
      id: Number(variation?.id ?? variation?.variation_id ?? 0) || null,
      color,
      size,
      inStock: Boolean(inStock),
      price: Number.isFinite(priceValue) ? priceValue : 0,
      raw: variation,
    };
  }).filter((entry) => entry.id);
};

const uniqueNonEmpty = (values) => {
  const seen = new Set();
  const output = [];

  for (const value of values) {
    const normalized = normalizeOptionValue(value);
    if (!normalized || seen.has(normalized)) continue;
    seen.add(normalized);
    output.push(normalized);
  }

  return output;
};

const colorToSwatch = (value) => {
  const key = normalizeOptionValue(value);
  const map = {
    white: '#f8fafc',
    natural: '#f3ede0',
    cream: '#f5f1df',
    daisy: '#f5dc4d',
    pistachio: '#a8b98f',
    'light-green': '#a8b98f',
    'mint-green': '#a7d8c3',
    'light-blue': '#bfd8f4',
    'light-pink': '#f4c7d7',
    azalea: '#ee7aa9',
    'ice-grey': '#d1d5db',
    'ice-gray': '#d1d5db',
    grey: '#d1d5db',
    gray: '#d1d5db',
    black: '#111827',
  };

  return map[key] || '#e5e7eb';
};

const resolveTeeThumbnail = (colorValue) => {
  const normalized = normalizeOptionValue(colorValue);
  return TEE_THUMBNAIL_BY_COLOR[normalized] || TEE_THUMBNAIL_FALLBACK;
};

export default function CompostBelieveImageOfferPage() {
  const purchaseRef = useRef(null);
  const viewContentTrackedRef = useRef(false);
  const initiateCheckoutTrackedRef = useRef(false);
  const scroll50TrackedRef = useRef(false);

  const [loading, setLoading] = useState(true);
  const [product, setProduct] = useState(null);
  const [variationEntries, setVariationEntries] = useState([]);
  const [selectedColor, setSelectedColor] = useState('');
  const [selectedSize, setSelectedSize] = useState('');
  const [quantity, setQuantity] = useState(1);

  useEffect(() => {
    let cancelled = false;

    const loadProduct = async () => {
      setLoading(true);
      try {
        const res = await apiServerClient.fetch(`/products/${COMPOST_PRODUCT_ID}`);
        const data = await res.json();
        const storeProduct = data?.product || data?.data || data;

        if (cancelled) return;

        setProduct(storeProduct || null);
        const entries = buildVariationEntries(storeProduct);
        setVariationEntries(entries);

        const colors = uniqueNonEmpty(entries.map((entry) => entry.color));
        const sizes = uniqueNonEmpty(entries.map((entry) => entry.size));

        setSelectedColor(colors[0] || '');
        setSelectedSize(sizes[0] || '');
      } catch {
        if (!cancelled) {
          setProduct(null);
          setVariationEntries([]);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    loadProduct();
    return () => { cancelled = true; };
  }, []);

  const colors = useMemo(() => uniqueNonEmpty(variationEntries.map((entry) => entry.color)), [variationEntries]);
  const sizes = useMemo(() => uniqueNonEmpty(variationEntries.map((entry) => entry.size)), [variationEntries]);

  const selectedVariation = useMemo(() => {
    const targetColor = normalizeOptionValue(selectedColor);
    const targetSize = normalizeOptionValue(selectedSize);

    return variationEntries.find((entry) => entry.color === targetColor && entry.size === targetSize) || null;
  }, [variationEntries, selectedColor, selectedSize]);

  const canPurchase = Boolean(selectedVariation?.id) && Boolean(selectedVariation?.inStock);
  const displayPrice = selectedVariation?.price || Number.parseFloat(product?.price ?? 0) || 0;

  const cartOverride = useMemo(() => {
    if (!product || !selectedVariation?.id) {
      return { items: [], subtotal: 0, itemCount: 0 };
    }

    const subtotal = (Number(displayPrice) || 0) * (Number(quantity) || 1);

    return {
      items: [
        {
          productId: product?.id || COMPOST_PRODUCT_ID,
          variationId: selectedVariation.id,
          name: product?.name || 'Compost Graphic Tee',
          price: Number(displayPrice) || 0,
          image: resolveTeeThumbnail(selectedColor),
          quantity,
          color: selectedColor,
          size: selectedSize,
        },
      ],
      subtotal,
      itemCount: quantity,
    };
  }, [product, selectedVariation?.id, displayPrice, quantity, selectedColor, selectedSize]);

  const ensureInitiateCheckoutTracked = () => {
    if (initiateCheckoutTrackedRef.current) return false;
    if (!cartOverride?.items || cartOverride.items.length === 0) return false;

    initiateCheckoutTrackedRef.current = true;
    const value = Number(cartOverride?.subtotal);

    trackMetaInitiateCheckout({
      items: cartOverride.items,
      ...(Number.isFinite(value) ? { value } : {}),
      currency: 'USD',
    });

    trackTikTokInitiateCheckout({
      items: cartOverride.items,
      ...(Number.isFinite(value) ? { value } : {}),
      currency: 'USD',
    });

    return true;
  };

  const scrollToPurchase = (ctaLabel = '') => {
    if (ctaLabel) {
      trackOfferCTA({
        offerSlug: OFFER_SLUG,
        ctaLabel,
        productId: COMPOST_PRODUCT_ID,
        contentName: product?.name || 'Compost Graphic Tee',
        value: displayPrice || undefined,
        currency: 'USD',
      });
    }

    purchaseRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    ensureInitiateCheckoutTracked();
  };

  useEffect(() => {
    if (loading) return;
    if (!displayPrice || displayPrice <= 0) return;
    trackOfferViewContentOnce({
      trackedRef: viewContentTrackedRef,
      productId: COMPOST_PRODUCT_ID,
      contentName: product?.name || 'Compost Graphic Tee',
      value: displayPrice || undefined,
      currency: 'USD',
    });
  }, [loading, product?.name, displayPrice]);

  useEffect(() => {
    if (initiateCheckoutTrackedRef.current) return;
    if (!purchaseRef.current) return;

    const target = purchaseRef.current;
    const observer = new IntersectionObserver((entries) => {
      if (entries.some((entry) => entry.isIntersecting)) {
        ensureInitiateCheckoutTracked();
      }
    }, { threshold: 0.15 });

    observer.observe(target);
    return () => observer.disconnect();
  }, [cartOverride]);

  useEffect(() => {
    const onScroll = () => {
      if (scroll50TrackedRef.current) return;
      const doc = document.documentElement;
      const maxScroll = Math.max(1, doc.scrollHeight - doc.clientHeight);
      const progress = (window.scrollY || doc.scrollTop || 0) / maxScroll;
      if (progress < 0.5) return;

      trackOfferScroll50Once({
        trackedRef: scroll50TrackedRef,
        offerSlug: OFFER_SLUG,
        productId: COMPOST_PRODUCT_ID,
        contentName: product?.name || 'Compost Graphic Tee',
        value: displayPrice || undefined,
        currency: 'USD',
      });
    };

    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener('scroll', onScroll);
  }, [product?.name, displayPrice]);

  return (
    <>
      <Helmet>
        <title>Compost Offer</title>
        <meta name="description" content="Compost Graphic Tee offer" />
        <meta name="robots" content="noindex,nofollow" />
      </Helmet>

      <main className="bg-background overflow-x-hidden">
        <div className="w-full bg-[#0f172a]">
          <div className="relative mx-auto w-full max-w-[715px]">
            <img
              src={CREATIVE.src}
              width={CREATIVE.width}
              height={CREATIVE.height}
              alt="Compost Graphic Tee offer creative"
              className="block h-auto w-full"
              loading="eager"
              decoding="sync"
              fetchPriority="high"
            />

            {/* CTA overlays (transparent) */}
            <button
              type="button"
              onClick={() => scrollToPurchase('Order Now (Hero)')}
              aria-label="Order the Compost Graphic Tee"
              className="absolute rounded-md focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
              style={{
                left: '27%',
                top: '12.2%',
                width: '46%',
                height: '2.6%',
                background: 'transparent',
              }}
            />

            <button
              type="button"
              onClick={() => scrollToPurchase('Order Now (Mid)')}
              aria-label="Order the Compost Graphic Tee"
              className="absolute rounded-md focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
              style={{
                left: '27%',
                top: '41.9%',
                width: '46%',
                height: '2.6%',
                background: 'transparent',
              }}
            />

            <button
              type="button"
              onClick={() => scrollToPurchase('Order Now (Bottom)')}
              aria-label="Order the Compost Graphic Tee"
              className="absolute rounded-md focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
              style={{
                left: '20%',
                top: '96.6%',
                width: '60%',
                height: '2.7%',
                background: 'transparent',
              }}
            />
          </div>
        </div>

        <section ref={purchaseRef} className="py-10 pb-24">
          <div className="container-custom max-w-3xl">
            <div className="flex items-end justify-between gap-4">
              <div className="min-w-0">
                <h2 className="text-2xl font-bold text-balance" style={{ letterSpacing: '-0.02em' }}>
                  {product?.name || 'Compost Graphic Tee'}
                </h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  Choose your color, size, and quantity, then checkout securely.
                </p>
              </div>
              <div className="text-right">
                {loading ? (
                  <Skeleton className="h-8 w-24" />
                ) : (
                  <p className="text-2xl font-bold">${Number(displayPrice || 0).toFixed(2)}</p>
                )}
              </div>
            </div>

            {loading ? (
              <div className="mt-8 space-y-4">
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
              </div>
            ) : (
              <>
                <div className="mt-8 rounded-3xl border border-border bg-background p-6 shadow-sm">
                  <div className="grid gap-6 sm:grid-cols-2">
                    <div>
                      <p className="text-sm font-semibold">Color</p>
                      <div className="mt-3 flex flex-wrap gap-2">
                        {colors.map((color) => {
                          const isActive = normalizeOptionValue(selectedColor) === color;
                          const isAvailable = variationEntries.some((entry) => entry.color === color && entry.inStock);

                          return (
                            <button
                              key={color}
                              type="button"
                              onClick={() => setSelectedColor(color)}
                              disabled={!isAvailable}
                              aria-label={`Select color ${formatOptionLabel(color)}`}
                              className={`h-10 w-10 rounded-xl border transition-all duration-200 ${
                                isActive ? 'border-primary ring-2 ring-primary/25' : 'border-border'
                              } ${isAvailable ? 'hover:border-primary/60' : 'cursor-not-allowed opacity-40'}`}
                              style={{ backgroundColor: colorToSwatch(color) }}
                            />
                          );
                        })}
                      </div>
                    </div>

                    <div>
                      <p className="text-sm font-semibold">Size</p>
                      <div className="mt-3 flex flex-wrap gap-2">
                        {sizes.map((size) => {
                          const label = formatOptionLabel(size);
                          const isActive = normalizeOptionValue(selectedSize) === size;
                          const isAvailable = variationEntries.some(
                            (entry) => entry.size === size && entry.color === normalizeOptionValue(selectedColor) && entry.inStock
                          );

                          return (
                            <button
                              key={size}
                              type="button"
                              onClick={() => setSelectedSize(size)}
                              disabled={!isAvailable}
                              className={`min-w-[3.25rem] rounded-xl border px-3 py-2 text-sm font-semibold transition-all duration-200 ${
                                isActive ? 'border-primary bg-primary/5' : 'border-border bg-background hover:border-primary/50 hover:bg-primary/5'
                              } ${isAvailable ? '' : 'cursor-not-allowed opacity-40'}`}
                            >
                              {label}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    <div className="sm:col-span-2">
                      <p className="text-sm font-semibold">Quantity</p>
                      <div className="mt-3 flex items-center gap-3">
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => setQuantity((current) => Math.max(1, current - 1))}
                        >
                          <Minus className="h-4 w-4" />
                        </Button>
                        <span className="w-12 text-center text-lg font-semibold">{quantity}</span>
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => setQuantity((current) => Math.min(50, current + 1))}
                        >
                          <Plus className="h-4 w-4" />
                        </Button>
                        {!canPurchase && (
                          <p className="ml-2 text-sm text-muted-foreground">
                            Select an available color/size combination.
                          </p>
                        )}
                      </div>
                    </div>
                  </div>

                  <Button
                    className="mt-6 w-full"
                    size="lg"
                    disabled={!canPurchase}
                    onClick={() => {
                      ensureInitiateCheckoutTracked();
                      const el = document.getElementById(OFFER_CHECKOUT_ROOT_ID);
                      el?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                    }}
                  >
                    <ShoppingCart className="mr-2 h-5 w-5" />
                    Continue to checkout
                  </Button>
                </div>

                <div className="mt-6 rounded-2xl bg-background/95">
                  <CheckoutPage
                    embedded
                    cartOverride={cartOverride}
                    cartLoadingOverride={loading}
                    clearCartOverride={async () => ({ items: [], subtotal: 0, itemCount: 0 })}
                    embeddedRootId={OFFER_CHECKOUT_ROOT_ID}
                    embeddedSubmitButtonId={OFFER_PLACE_ORDER_BUTTON_ID}
                    disableInitiateCheckoutTracking
                  />
                </div>
              </>
            )}
          </div>
        </section>
      </main>
    </>
  );
}
