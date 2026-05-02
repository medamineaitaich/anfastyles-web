import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Helmet } from 'react-helmet';
import { Minus, Plus, ShoppingCart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import apiServerClient from '@/lib/apiServerClient';
import CheckoutPage from '@/pages/CheckoutPage.jsx';

const COMPOST_PRODUCT_ID = 8572;
const LANDING_SLICES = [
  {
    key: 'hero',
    width: 724,
    height: 650,
    eager: true,
    src: '/offers/compost-pride/slices/hero.png',
    src1080: '/offers/compost-pride/slices/hero@1080.png',
  },
  {
    key: 'benefits',
    width: 724,
    height: 470,
    eager: false,
    src: '/offers/compost-pride/slices/benefits.png',
    src1080: '/offers/compost-pride/slices/benefits@1080.png',
  },
  {
    key: 'comparison',
    width: 724,
    height: 420,
    eager: false,
    src: '/offers/compost-pride/slices/comparison.png',
    src1080: '/offers/compost-pride/slices/comparison@1080.png',
  },
  {
    key: 'lifestyle',
    width: 724,
    height: 430,
    eager: false,
    src: '/offers/compost-pride/slices/lifestyle.png',
    src1080: '/offers/compost-pride/slices/lifestyle@1080.png',
  },
  {
    key: 'cta',
    width: 724,
    height: 202,
    eager: false,
    src: '/offers/compost-pride/slices/cta.png',
    src1080: '/offers/compost-pride/slices/cta@1080.png',
  },
];

const OFFER_CHECKOUT_ROOT_ID = 'compost-pride-offer-checkout';
const OFFER_PLACE_ORDER_BUTTON_ID = 'compost-pride-offer-place-order';

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

export default function CompostPrideImageOfferPage() {
  const purchaseRef = useRef(null);
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
      } catch (error) {
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

  const scrollToPurchase = () => {
    purchaseRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

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
          quantity,
          color: selectedColor,
          size: selectedSize,
        },
      ],
      subtotal,
      itemCount: quantity,
    };
  }, [product, selectedVariation?.id, displayPrice, quantity, selectedColor, selectedSize]);

  return (
    <>
      <Helmet>
        <title>Compost Pride Offer</title>
        <meta name="description" content="Compost Graphic Tee offer" />
      </Helmet>

      <main className="bg-background overflow-x-hidden">
        <div className="w-full bg-[#f6f1e7]">
          <div className="relative mx-auto w-full max-w-[724px]">
            {LANDING_SLICES.map((slice) => (
              <img
                key={slice.key}
                src={slice.src}
                srcSet={`${slice.src} ${slice.width}w, ${slice.src1080} 1080w`}
                sizes="(max-width: 724px) 100vw, 724px"
                width={slice.width}
                height={slice.height}
                alt="Compost Graphic Tee offer creative"
                className="block h-auto w-full"
                loading={slice.eager ? 'eager' : 'lazy'}
                decoding={slice.eager ? 'sync' : 'async'}
                fetchPriority={slice.eager ? 'high' : 'auto'}
              />
            ))}

            {/* Transparent click overlays for the visible SHOP NOW buttons in the creative. */}
            <button
              type="button"
              onClick={scrollToPurchase}
              aria-label="Shop the Compost Graphic Tee"
              className="absolute rounded-md focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
              style={{
                left: '7%',
                top: '16.5%',
                width: '46%',
                height: '4.8%',
                background: 'transparent',
              }}
            />

            <button
              type="button"
              onClick={scrollToPurchase}
              aria-label="Shop the Compost Graphic Tee"
              className="absolute rounded-md focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
              style={{
                left: '7%',
                top: '94.3%',
                width: '52%',
                height: '5.6%',
                background: 'transparent',
              }}
            />
          </div>
        </div>

        {/* Purchase / checkout section (minimal, no extra marketing sections). */}
        <section ref={purchaseRef} className="py-10 pb-24">
          <div className="container-custom max-w-3xl">
            <div className="flex items-end justify-between gap-4">
              <div className="min-w-0">
                <h2 className="text-2xl font-bold text-balance" style={{ letterSpacing: '-0.02em' }}>
                  {product?.name || 'Compost Graphic Tee'}
                </h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  Choose color, size, and quantity—then complete checkout below.
                </p>
              </div>
              <p className="text-2xl font-bold font-variant-tabular">${displayPrice.toFixed(2)}</p>
            </div>

            {loading ? (
              <div className="mt-6 space-y-4">
                <Skeleton className="h-32 w-full rounded-2xl" />
                <Skeleton className="h-64 w-full rounded-2xl" />
              </div>
            ) : (
              <>
                <div className="mt-6 space-y-6">
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
                          const isAvailable = variationEntries.some((entry) => entry.size === size && entry.color === normalizeOptionValue(selectedColor) && entry.inStock);

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
                    className="w-full"
                    size="lg"
                    disabled={!canPurchase}
                    onClick={() => {
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
