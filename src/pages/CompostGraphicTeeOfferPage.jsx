import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Helmet } from 'react-helmet';
import { ArrowDown, CheckCircle2, Leaf, Minus, Plus, Recycle, Sprout } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import apiServerClient from '@/lib/apiServerClient';
import { getCartLineKey } from '@/lib/cart';
import { notifyError } from '@/lib/notifications.js';
import Header from '@/components/Header.jsx';
import Footer from '@/components/Footer.jsx';
import CartDrawer from '@/components/CartDrawer.jsx';
import SizeGuideDialog from '@/components/SizeGuideDialog.jsx';
import CheckoutPage from '@/pages/CheckoutPage.jsx';

const COMPOST_PRODUCT_ID = 8572;
const TRUST_BADGES = [
  '30-Day Refund',
  'Secure Checkout',
  'Tracked Shipping',
  'Made to Order',
];
const BENEFITS = [
  {
    title: 'Fun compost-inspired graphic design',
    description: 'A playful earthy design for people who see food scraps as garden treasure.',
    icon: Leaf,
  },
  {
    title: 'For gardeners and zero-waste friends',
    description: 'Great for gardeners, plant lovers, compost fans, and sustainability-minded gift giving.',
    icon: Sprout,
  },
  {
    title: 'Easy everyday tee',
    description: 'Wear it for market days, garden days, around the house, and casual everyday plans.',
    icon: Recycle,
  },
  {
    title: 'Nature-inspired colors',
    description: 'Available in soft colors that keep the soil-and-plants artwork feeling warm and wearable.',
    icon: CheckCircle2,
  },
];
const FAQS = [
  {
    question: 'Is this tee made to order?',
    answer: 'Yes. It is produced after your order is placed to help reduce unnecessary overproduction.',
  },
  {
    question: 'Who is this shirt for?',
    answer: 'It is made for compost lovers, gardeners, plant people, zero-waste friends, and anyone who loves soil and sustainability.',
  },
  {
    question: 'Can I return it?',
    answer: 'Eligible items follow our 30-day refund policy.',
  },
  {
    question: 'Is checkout secure?',
    answer: 'Yes. Payments are processed through the existing secure checkout flow.',
  },
  {
    question: 'How do I choose the right size?',
    answer: 'Select your preferred size before checkout and use the size guide if needed.',
  },
];
const SHOWCASE_IMAGES = [
  {
    key: 'natural',
    label: 'Natural',
    description: 'A warm earthy base that keeps the compost artwork feeling organic.',
    src: '/offers/compost/compost-natural.jpg',
    matchKeys: ['natural', 'cream'],
  },
  {
    key: 'mint-green',
    label: 'Light Green',
    description: 'Soft and nature-inspired without overpowering the graphic.',
    src: '/offers/compost/compost-mint-green.jpg',
    matchKeys: ['mint-green', 'pistachio', 'light-green'],
  },
  {
    key: 'light-blue',
    label: 'Light Blue',
    description: 'A calm secondary color for an easy everyday tee.',
    src: '/offers/compost/compost-light-blue.jpg',
    matchKeys: ['light-blue'],
  },
  {
    key: 'white',
    label: 'White',
    description: 'Bright, crisp, and classic for everyday wear.',
    src: '/offers/compost/compost-white.jpg',
    matchKeys: ['white'],
  },
  {
    key: 'ice-grey',
    label: 'Grey',
    description: 'A quiet neutral option that keeps the graphic front and center.',
    src: '/offers/compost/compost-grey.jpg',
    matchKeys: ['ice-grey', 'ice-gray', 'grey', 'gray'],
  },
];
const SHOWCASE_IMAGE_BY_COLOR = {
  'mint-green': '/offers/compost/compost-mint-green.jpg',
  pistachio: '/offers/compost/compost-mint-green.jpg',
  natural: '/offers/compost/compost-natural.jpg',
  cream: '/offers/compost/compost-natural.jpg',
  'light-blue': '/offers/compost/compost-light-blue.jpg',
  'light-pink': '/offers/compost/compost-pink.jpg',
  azalea: '/offers/compost/compost-pink.jpg',
  'ice-grey': '/offers/compost/compost-grey.jpg',
  'ice-gray': '/offers/compost/compost-grey.jpg',
  white: '/offers/compost/compost-white.jpg',
};
const COLOR_SWATCH_MAP = {
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
};
const ATTRIBUTE_KIND_ALIASES = {
  size: new Set(['size', 'sizes', 'pa-size', 'pa_size']),
  color: new Set(['color', 'colors', 'colour', 'colours', 'pa-color', 'pa-colour', 'pa_color', 'pa_colour']),
};
const OFFER_CHECKOUT_ROOT_ID = 'compost-graphic-tee-offer-checkout';
const OFFER_PLACE_ORDER_BUTTON_ID = 'compost-graphic-tee-offer-place-order';

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
  if (['xs', 's', 'm', 'l', 'xl', '2xl', '3xl', '4xl', '5xl'].includes(normalized)) {
    return normalized.toUpperCase();
  }

  return text
    .replace(/[_-]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
};

const getAttributeKind = (...values) => {
  for (const value of values) {
    const normalized = normalizeOptionValue(value);
    if (!normalized) continue;

    for (const [kind, aliases] of Object.entries(ATTRIBUTE_KIND_ALIASES)) {
      if (aliases.has(normalized)) return kind;
    }
  }

  return null;
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

const buildVariationEntries = (product) => {
  const variations = Array.isArray(product?.variations) ? product.variations : [];

  return variations.map((variation) => {
    const attributesByKind = {};

    for (const selection of getRawVariationSelections(variation)) {
      const attributeName = selection?.name || selection?.slug || selection?.attribute || selection?.key || '';
      const attributeSlug = selection?.slug || selection?.name || selection?.attribute || '';
      const optionValue = selection?.option || selection?.value || selection?.name_value || selection?.option_name || '';
      const label = formatOptionLabel(optionValue);
      const kind = getAttributeKind(attributeSlug, attributeName);

      if (!kind || !label) continue;

      attributesByKind[kind] = {
        label,
        normalized: normalizeOptionValue(label),
      };
    }

    return {
      id: variation?.id,
      sku: variation?.sku || '',
      price: variation?.price ?? '',
      image: variation?.image || '',
      inStock: variation?.stockStatus === 'instock' || variation?.inStock === true || variation?.is_in_stock === true,
      attributesByKind,
    };
  }).filter((variation) => variation.attributesByKind.color || variation.attributesByKind.size);
};

const collectAttributeOptions = (product, variationEntries, kind) => {
  const labels = [];
  const seen = new Set();
  const productAttributes = Array.isArray(product?.attributes) ? product.attributes : [];

  const pushLabel = (value) => {
    const label = formatOptionLabel(value);
    const normalized = normalizeOptionValue(label);
    if (!label || seen.has(normalized)) return;
    seen.add(normalized);
    labels.push(label);
  };

  productAttributes.forEach((attribute) => {
    if (getAttributeKind(attribute?.slug, attribute?.name, attribute?.attribute) !== kind) return;
    (Array.isArray(attribute?.options) ? attribute.options : []).forEach(pushLabel);
  });

  variationEntries.forEach((variation) => {
    pushLabel(variation.attributesByKind[kind]?.label);
  });

  return labels;
};

const formatPrice = (value) => {
  const numberValue = Number(value);
  return Number.isFinite(numberValue) ? numberValue.toFixed(2) : '0.00';
};

const getColorSwatchStyle = (label) => {
  const normalized = normalizeOptionValue(label);
  const directMatch = COLOR_SWATCH_MAP[normalized];
  if (directMatch) return { background: directMatch };

  return {
    backgroundImage: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 45%, #cbd5e1 45%, #cbd5e1 55%, #94a3b8 55%, #64748b 100%)',
  };
};

const ProductOptionsPanel = ({
  displayPrice,
  selectedColor,
  selectedSize,
  quantity,
  colorOptions,
  sizeOptions,
  onColorChange,
  onSizeChange,
  onQuantityChange,
  colorSectionRef,
  sizeSectionRef,
}) => (
  <div className="rounded-[2rem] border border-border/70 bg-card p-5 shadow-sm sm:p-6 lg:p-7">
    <div className="flex flex-wrap items-start justify-between gap-4">
      <div>
        <p className="text-sm font-semibold uppercase tracking-[0.16em] text-primary/80">Order your tee</p>
        <h3 className="mt-2 text-2xl font-bold">Choose your color, size, and quantity</h3>
        <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
          Pick your favorite color, find your size, and make it yours.
        </p>
      </div>
      <div className="rounded-2xl bg-primary px-4 py-3 text-primary-foreground shadow-sm">
        <p className="text-xs uppercase tracking-[0.16em] text-primary-foreground/80">Current price</p>
        <p className="mt-1 text-2xl font-bold">${formatPrice(displayPrice)}</p>
      </div>
    </div>

    <div className="mt-8 grid gap-8 lg:grid-cols-[minmax(0,1fr)_220px]">
      <div className="space-y-8">
        <div ref={colorSectionRef}>
          <div className="mb-3 flex items-center justify-between gap-3">
            <label className="text-sm font-semibold">Color</label>
            <p className="text-sm text-muted-foreground">{selectedColor || 'Select a color'}</p>
          </div>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {colorOptions.map((option) => {
              const isSelected = option.label === selectedColor;

              return (
                <button
                  key={option.label}
                  type="button"
                  onClick={() => !option.disabled && onColorChange(option.label)}
                  disabled={option.disabled}
                  className={`rounded-2xl border px-3 py-3 text-left transition ${
                    isSelected
                      ? 'border-primary bg-primary/5 shadow-sm'
                      : 'border-border/70 bg-background hover:border-primary/50'
                  } ${option.disabled ? 'cursor-not-allowed opacity-40' : ''}`}
                >
                  <span className="flex items-center gap-3">
                    <span
                      className="h-7 w-7 rounded-full border border-black/10 shadow-inner"
                      style={getColorSwatchStyle(option.label)}
                    />
                    <span className="min-w-0">
                      <span className="block truncate text-sm font-semibold">{option.label}</span>
                      <span className="block text-xs text-muted-foreground">
                        {option.disabled ? 'Unavailable' : 'Available'}
                      </span>
                    </span>
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        <div ref={sizeSectionRef}>
          <div className="mb-3 flex items-center justify-between gap-3">
            <label className="text-sm font-semibold">Size</label>
            <SizeGuideDialog />
          </div>
          <div className="flex flex-wrap gap-2.5">
            {sizeOptions.map((option) => {
              const isSelected = option.label === selectedSize;

              return (
                <button
                  key={option.label}
                  type="button"
                  onClick={() => !option.disabled && onSizeChange(option.label)}
                  disabled={option.disabled}
                  className={`min-w-[3.25rem] rounded-xl border px-4 py-2 text-sm font-semibold transition ${
                    isSelected
                      ? 'border-primary bg-primary text-primary-foreground'
                      : 'border-border/70 bg-background hover:border-primary/50'
                  } ${option.disabled ? 'cursor-not-allowed opacity-40' : ''}`}
                >
                  {option.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-border/70 bg-background/70 p-4">
        <label className="text-sm font-semibold">Quantity</label>
        <div className="mt-3 flex items-center justify-between rounded-2xl border border-border/70 bg-card px-3 py-2">
          <button
            type="button"
            onClick={() => onQuantityChange(Math.max(1, quantity - 1))}
            className="rounded-full p-2 text-muted-foreground transition hover:bg-muted hover:text-foreground"
            aria-label="Decrease quantity"
          >
            <Minus className="h-4 w-4" />
          </button>
          <span className="text-lg font-semibold font-variant-tabular">{quantity}</span>
          <button
            type="button"
            onClick={() => onQuantityChange(Math.min(99, quantity + 1))}
            className="rounded-full p-2 text-muted-foreground transition hover:bg-muted hover:text-foreground"
            aria-label="Increase quantity"
          >
            <Plus className="h-4 w-4" />
          </button>
        </div>

        <p className="mt-3 text-xs leading-relaxed text-muted-foreground">
          Select the combination that feels right for you, then finish your order below.
        </p>
      </div>
    </div>
  </div>
);

const CompostGraphicTeeOfferPage = () => {
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedColor, setSelectedColor] = useState('');
  const [selectedSize, setSelectedSize] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [cartDrawerOpen, setCartDrawerOpen] = useState(false);
  const [checkoutStatus, setCheckoutStatus] = useState({
    requiredFieldsComplete: false,
    canPlaceOrder: false,
  });
  const orderSectionRef = useRef(null);
  const colorSectionRef = useRef(null);
  const sizeSectionRef = useRef(null);
  const checkoutSectionRef = useRef(null);

  useEffect(() => {
    let cancelled = false;

    const loadProduct = async () => {
      setLoading(true);

      try {
        const response = await apiServerClient.fetch(`/products/${COMPOST_PRODUCT_ID}`);
        if (!response.ok) {
          throw new Error('Unable to load the Compost Graphic Tee offer right now.');
        }

        const data = await response.json();
        if (!cancelled) {
          setProduct(data);
        }
      } catch (error) {
        console.error('Failed to load Compost offer product:', error);
        if (!cancelled) {
          notifyError('Offer unavailable', error.message || 'Please refresh the page and try again.');
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    loadProduct();

    return () => {
      cancelled = true;
    };
  }, []);

  const variationEntries = useMemo(() => buildVariationEntries(product), [product]);
  const allColors = useMemo(() => collectAttributeOptions(product, variationEntries, 'color'), [product, variationEntries]);
  const allSizes = useMemo(() => collectAttributeOptions(product, variationEntries, 'size'), [product, variationEntries]);
  const selectedValues = useMemo(() => ({
    color: normalizeOptionValue(selectedColor),
    size: normalizeOptionValue(selectedSize),
  }), [selectedColor, selectedSize]);

  const matchesSelection = (variation, overrides = {}) => {
    const expectedColor = overrides.color ?? selectedValues.color;
    const expectedSize = overrides.size ?? selectedValues.size;

    if (expectedColor && variation.attributesByKind.color?.normalized !== expectedColor) {
      return false;
    }

    if (expectedSize && variation.attributesByKind.size?.normalized !== expectedSize) {
      return false;
    }

    return true;
  };

  const colorOptions = useMemo(() => allColors.map((label) => ({
    label,
    disabled: !variationEntries.some((variation) => variation.inStock && matchesSelection(variation, {
      color: normalizeOptionValue(label),
      size: selectedValues.size || undefined,
    })),
  })), [allColors, selectedValues.size, variationEntries]);

  const sizeOptions = useMemo(() => allSizes.map((label) => ({
    label,
    disabled: !variationEntries.some((variation) => variation.inStock && matchesSelection(variation, {
      color: selectedValues.color || undefined,
      size: normalizeOptionValue(label),
    })),
  })), [allSizes, selectedValues.color, variationEntries]);

  useEffect(() => {
    if (!selectedColor) return;
    const current = colorOptions.find((option) => option.label === selectedColor);
    if (current && !current.disabled) return;

    const fallback = colorOptions.find((option) => !option.disabled);
    if (fallback) {
      setSelectedColor(fallback.label);
    }
  }, [colorOptions, selectedColor]);

  useEffect(() => {
    if (!selectedSize) return;
    const current = sizeOptions.find((option) => option.label === selectedSize);
    if (current && !current.disabled) return;

    const fallback = sizeOptions.find((option) => !option.disabled);
    if (fallback) {
      setSelectedSize(fallback.label);
    }
  }, [selectedSize, sizeOptions]);

  const selectedVariation = useMemo(() => {
    if (!selectedValues.color || !selectedValues.size) return null;

    return variationEntries.find((variation) => variation.inStock && matchesSelection(variation))
      || variationEntries.find((variation) => matchesSelection(variation))
      || null;
  }, [selectedValues.color, selectedValues.size, variationEntries]);

  const displayPrice = selectedVariation?.price || product?.price || '0.00';
  const selectedColorKey = normalizeOptionValue(selectedColor);
  const heroImage = SHOWCASE_IMAGE_BY_COLOR[selectedColorKey]
    || selectedVariation?.image
    || product?.images?.[0]
    || '/offers/compost/compost-natural.jpg';
  const offerCart = useMemo(() => {
    const unitPrice = Number(selectedVariation?.price || product?.price);
    if (!product?.id || !selectedVariation?.id || !Number.isFinite(unitPrice)) {
      return { items: [], subtotal: 0 };
    }

    const lineKey = getCartLineKey({
      productId: product.id,
      variationId: selectedVariation.id,
      size: selectedSize,
      color: selectedColor,
    });

    return {
      items: [
        {
          lineKey,
          productId: product.id,
          variationId: selectedVariation.id,
          sku: selectedVariation.sku || product?.sku || '',
          name: product.name,
          price: unitPrice,
          image: heroImage,
          quantity,
          size: selectedSize,
          color: selectedColor,
        },
      ],
      subtotal: unitPrice * quantity,
    };
  }, [heroImage, product, quantity, selectedColor, selectedSize, selectedVariation]);

  const scrollToOrderSection = () => {
    orderSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const scrollToRef = (ref) => {
    ref.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const stickyCtaState = useMemo(() => {
    if (loading) {
      return {
        label: 'Loading offer',
        action: () => {},
        disabled: true,
      };
    }

    if (!selectedSize) {
      return {
        label: 'Select Size',
        action: () => scrollToRef(sizeSectionRef),
        disabled: false,
      };
    }

    if (!selectedColor) {
      return {
        label: 'Select Color',
        action: () => scrollToRef(colorSectionRef),
        disabled: false,
      };
    }

    if (!checkoutStatus.requiredFieldsComplete) {
      return {
        label: 'Complete Checkout',
        action: () => scrollToRef(checkoutSectionRef),
        disabled: false,
      };
    }

    return {
      label: 'Place Order',
      action: () => {
        const submitButton = document.getElementById(OFFER_PLACE_ORDER_BUTTON_ID);
        submitButton?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      },
      disabled: false,
    };
  }, [checkoutStatus.requiredFieldsComplete, loading, selectedColor, selectedSize]);

  return (
    <>
      <Helmet>
        <title>Compost Graphic Tee - AnfaStyles</title>
        <meta
          name="description"
          content="Shop the Compost Graphic Tee, a playful earthy tee for compost lovers, gardeners, and zero-waste friends."
        />
      </Helmet>

      <Header onCartClick={() => setCartDrawerOpen(true)} />
      <CartDrawer open={cartDrawerOpen} onClose={() => setCartDrawerOpen(false)} />

      <main className="overflow-x-hidden bg-[radial-gradient(circle_at_top,_rgba(160,198,150,0.18),_transparent_40%),linear-gradient(180deg,_rgba(250,247,240,0.98)_0%,_rgba(247,243,233,0.92)_48%,_rgba(255,255,255,1)_100%)] pb-28 md:pb-16">
        <section className="border-b border-border/50">
          <div className="container-custom grid gap-10 py-10 md:py-14 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)] lg:items-center lg:gap-14">
            <div className="order-2 space-y-6 lg:order-1">
              <div className="inline-flex items-center gap-2 rounded-full border border-primary/15 bg-primary/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-primary/85">
                <Leaf className="h-3.5 w-3.5" />
                Compost graphic tee offer
              </div>

              <div className="space-y-4">
                <h1 className="max-w-3xl text-4xl font-bold leading-tight text-balance md:text-5xl lg:text-6xl" style={{ letterSpacing: '-0.03em' }}>
                  Compost Graphic Tee
                </h1>
                <p className="max-w-2xl text-lg leading-relaxed text-muted-foreground md:text-xl">
                  A playful earthy tee for compost lovers, gardeners, and anyone who believes food scraps deserve a second life.
                </p>
              </div>

              <div className="flex flex-wrap items-end gap-5">
                <div className="rounded-3xl border border-border/60 bg-card px-5 py-4 shadow-sm">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary/75">Offer price</p>
                  <p className="mt-2 text-4xl font-bold text-foreground">
                    {loading ? <span className="text-2xl">Loading...</span> : `$${formatPrice(displayPrice)}`}
                  </p>
                </div>
                <div className="space-y-1 text-sm text-muted-foreground">
                  <p>Price, color, size, and stock come from the real WooCommerce product.</p>
                  <p>Choose your tee and complete checkout on this page.</p>
                </div>
              </div>

              <div className="flex flex-col gap-3 sm:flex-row">
                <Button size="lg" className="min-w-[220px] rounded-full px-7" onClick={scrollToOrderSection}>
                  Add to Cart
                  <ArrowDown className="ml-2 h-4 w-4" />
                </Button>
                <Button variant="outline" size="lg" className="rounded-full px-7" onClick={scrollToOrderSection}>
                  Pick your color and size
                </Button>
              </div>

            </div>

            <div className="order-1 lg:order-2">
              <div className="rounded-[2rem] border border-border/60 bg-card/90 p-4 shadow-[0_20px_60px_-28px_rgba(86,102,66,0.4)] backdrop-blur">
                {loading ? (
                  <Skeleton className="aspect-[4/5] w-full rounded-[1.5rem]" />
                ) : (
                  <img
                    src={heroImage}
                    alt={product?.name || 'Compost Graphic Tee'}
                    className="aspect-[4/5] w-full rounded-[1.5rem] object-cover"
                  />
                )}
              </div>
            </div>
          </div>
        </section>

        <section className="container-custom py-10 md:py-14">
          <div className="mb-8 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-primary/80">Color showcase</p>
              <h2 className="mt-2 text-3xl font-bold text-balance md:text-4xl">Choose the look that fits your garden mood</h2>
            </div>
            <p className="max-w-xl text-sm leading-relaxed text-muted-foreground">
              Explore the colors and choose the one that feels most like you.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3 md:grid-cols-3 md:gap-4 xl:grid-cols-3">
            {SHOWCASE_IMAGES.map((image) => {
              const matchKeys = image.matchKeys || [image.key];
              const matchingColorOption = colorOptions.find((option) => matchKeys.includes(normalizeOptionValue(option.label)));
              const isActive = matchKeys.includes(selectedColorKey);

              return (
                <button
                  key={image.key}
                  type="button"
                  onClick={() => {
                    if (matchingColorOption) {
                      setSelectedColor(matchingColorOption.label);
                    }
                    scrollToOrderSection();
                  }}
                  className={`overflow-hidden rounded-[1.75rem] border bg-card text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg ${
                    isActive ? 'border-primary/60 ring-2 ring-primary/20' : 'border-border/60'
                  }`}
                >
                  <img src={image.src} alt={`${image.label} Compost Graphic Tee`} className="aspect-[4/4.9] w-full object-cover md:aspect-[4/4.6]" />
                  <div className="space-y-2 px-3.5 py-3.5 md:px-5 md:py-4">
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-sm font-semibold md:text-base">{image.label}</p>
                      <span className="text-[0.65rem] uppercase tracking-[0.16em] text-primary/80 md:text-xs">{isActive ? 'Selected' : 'Preview'}</span>
                    </div>
                    <p className="text-xs leading-relaxed text-muted-foreground md:text-sm">{image.description}</p>
                  </div>
                </button>
              );
            })}
          </div>
        </section>

        <section className="container-custom grid gap-6 py-4 md:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)] md:py-10">
          <div className="rounded-[2rem] border border-border/60 bg-card p-6 shadow-sm md:p-8">
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-primary/80">Product story</p>
            <p className="mt-4 text-lg leading-relaxed text-foreground/90 md:text-xl">
              For the people who save coffee grounds, veggie scraps, and banana peels like they are garden treasure. This compost graphic tee is made for gardeners, plant lovers, zero-waste folks, and anyone who knows that good soil starts with small everyday choices.
            </p>
            <p className="mt-4 text-base leading-relaxed text-muted-foreground">
              Wear it to the farmers market, in the garden, around the house, or gift it to the compost-obsessed person in your life.
            </p>
          </div>

          <div className="rounded-[2rem] border border-border/60 bg-[linear-gradient(135deg,rgba(92,122,68,0.08),rgba(190,213,172,0.16))] p-6 shadow-sm md:p-8">
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-primary/80">Made to order</p>
            <p className="mt-4 text-base leading-relaxed text-foreground/85">
              Made when you order, this tee helps avoid unnecessary overproduction while giving you a fresh everyday piece made just for you.
            </p>
          </div>
        </section>

        <section className="container-custom py-10 md:py-14">
          <div className="mb-8 max-w-2xl">
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-primary/80">Why it works</p>
            <h2 className="mt-2 text-3xl font-bold text-balance md:text-4xl">A thoughtful tee for soil-minded people</h2>
          </div>

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {BENEFITS.map((benefit) => {
              const Icon = benefit.icon;

              return (
                <div key={benefit.title} className="rounded-[1.75rem] border border-border/60 bg-card p-5 shadow-sm">
                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                    <Icon className="h-5 w-5" />
                  </div>
                  <h3 className="mt-5 text-lg font-semibold">{benefit.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{benefit.description}</p>
                </div>
              );
            })}
          </div>
        </section>

        <section className="container-custom py-4 md:py-10">
          <div className="grid gap-6 lg:grid-cols-[minmax(0,0.88fr)_minmax(0,1.12fr)] lg:items-start">
            <div className="rounded-[2rem] border border-border/60 bg-card p-6 shadow-sm md:p-8">
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-primary/80">Trust seals</p>
              <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-4 lg:grid-cols-2">
                {TRUST_BADGES.map((text) => (
                  <div
                    key={text}
                    className="grid aspect-square w-full max-w-[6.5rem] place-items-center justify-self-center rounded-full bg-primary p-1 [clip-path:polygon(50%_0%,56%_7%,63%_2%,68%_10%,76%_6%,80%_15%,89%_14%,91%_24%,98%_31%,93%_39%,100%_50%,93%_61%,98%_69%,91%_76%,89%_86%,80%_85%,76%_94%,68%_90%,63%_98%,56%_93%,50%_100%,44%_93%,37%_98%,32%_90%,24%_94%,20%_85%,11%_86%,9%_76%,2%_69%,7%_61%,0%_50%,7%_39%,2%_31%,9%_24%,11%_14%,20%_15%,24%_6%,32%_10%,37%_2%,44%_7%)]"
                  >
                    <div className="grid h-full w-full place-items-center rounded-full border border-primary/30 bg-background px-1.5 text-center shadow-sm">
                      <span className="text-[0.62rem] font-semibold uppercase leading-tight tracking-[0.1em] text-foreground">{text}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-[2rem] border border-border/60 bg-card p-6 shadow-sm md:p-8">
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-primary/80">FAQ</p>
              <div className="mt-6 divide-y divide-border/60 rounded-[1.5rem] border border-border/60 bg-background/70">
                {FAQS.map((faq) => (
                  <div key={faq.question} className="px-5 py-4 md:px-6">
                    <h3 className="text-base font-semibold">{faq.question}</h3>
                    <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{faq.answer}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section ref={orderSectionRef} className="container-custom scroll-mt-24 py-10 md:py-14">
          <div className="mb-8 max-w-3xl">
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-primary/80">Order section</p>
            <h2 className="mt-2 text-3xl font-bold text-balance md:text-4xl">Choose your tee and complete checkout here</h2>
            <p className="mt-3 text-base leading-relaxed text-muted-foreground">
              Choose your color, size, and quantity, then complete your order below.
            </p>
          </div>

          {loading ? (
            <div className="space-y-6">
              <Skeleton className="h-[22rem] w-full rounded-[2rem]" />
              <Skeleton className="h-[38rem] w-full rounded-[2rem]" />
            </div>
          ) : (
            <div className="space-y-8">
              <ProductOptionsPanel
                displayPrice={displayPrice}
                selectedColor={selectedColor}
                selectedSize={selectedSize}
                quantity={quantity}
                colorOptions={colorOptions}
                sizeOptions={sizeOptions}
                onColorChange={setSelectedColor}
                onSizeChange={setSelectedSize}
                onQuantityChange={setQuantity}
                colorSectionRef={colorSectionRef}
                sizeSectionRef={sizeSectionRef}
              />

              <div ref={checkoutSectionRef} className="rounded-[2rem] border border-border/60 bg-card/80 p-1 shadow-sm">
                <CheckoutPage
                  embedded
                  cartOverride={offerCart}
                  cartLoadingOverride={loading}
                  clearCartOverride={async () => ({ items: [], subtotal: 0 })}
                  embeddedRootId={OFFER_CHECKOUT_ROOT_ID}
                  embeddedSubmitButtonId={OFFER_PLACE_ORDER_BUTTON_ID}
                  onEmbeddedStateChange={setCheckoutStatus}
                />
              </div>
            </div>
          )}
        </section>
      </main>

      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-border/70 bg-background/95 px-4 py-3 backdrop-blur supports-[padding:max(0px)]:pb-[max(0.75rem,env(safe-area-inset-bottom))] md:hidden">
        <div className="mx-auto max-w-5xl">
          <Button
            size="lg"
            className="w-full rounded-full"
            onClick={stickyCtaState.action}
            disabled={stickyCtaState.disabled}
          >
            {stickyCtaState.label}
          </Button>
        </div>
      </div>

      <Footer />
    </>
  );
};

export default CompostGraphicTeeOfferPage;
