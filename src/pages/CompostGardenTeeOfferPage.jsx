import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Helmet } from 'react-helmet';
import { ArrowDown, ChevronLeft, ChevronRight, Gift, Globe2, Heart, Leaf, Minus, Plus, Recycle, Sprout } from 'lucide-react';
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
  'Secure Payment',
  'Tracked Shipping',
  'Made to Order',
];
const BENEFIT_STRIP = [
  {
    title: 'Made for Compost Lovers',
    description: 'Designed for people who get weirdly excited about food scraps.',
    icon: Leaf,
  },
  {
    title: 'Great for Gardeners',
    description: 'An easy everyday tee for digging, planting, and growing.',
    icon: Sprout,
  },
  {
    title: 'Sustainable Mindset',
    description: 'For zero-waste people who believe scraps deserve a second life.',
    icon: Globe2,
  },
  {
    title: 'Thoughtful Gift Idea',
    description: 'A fun, meaningful gift for the compost person in your life.',
    icon: Gift,
  },
];
const TESTIMONIALS = [
  {
    quote: 'This shirt is so me. I get compliments from fellow compost nerds everywhere I go.',
    author: 'Jamie, Gardener',
  },
  {
    quote: 'Soft, comfy, and the design is perfect. It is now my go-to gardening tee.',
    author: 'Taylor, Plant Lover',
  },
  {
    quote: 'Bought this for my composter bestie and she absolutely loved it.',
    author: 'Morgan, Zero-Waste Advocate',
  },
];
const FAQS = [
  {
    question: 'Who is this tee for?',
    answer: 'Gardeners, compost lovers, plant people, zero-waste friends, and anyone who believes food scraps deserve a second life.',
  },
  {
    question: 'Is it a good gift?',
    answer: 'Yes. It is a thoughtful gift for the compost person, gardener, or soil-loving friend in your life.',
  },
  {
    question: 'What colors are available?',
    answer: 'Mint Green, Natural, Light Blue, Pink, Gray, and White, depending on available product options.',
  },
  {
    question: 'How should I choose a color?',
    answer: 'Natural and Mint Green feel the most earthy, Light Blue feels calm, White is clean and classic, Gray is neutral, and Pink adds a playful touch.',
  },
  {
    question: 'Can I wear it casually?',
    answer: 'Yes. It is designed as an easy everyday graphic tee for garden days, market days, weekends, and relaxed casual wear.',
  },
];
const OFFER_ASSET_PATH = '/offers/compost-garden-tee';
const HERO_IMAGE_DESKTOP = `${OFFER_ASSET_PATH}/reference-natural-desktop.jpg`;
const HERO_IMAGE_MOBILE = `${OFFER_ASSET_PATH}/reference-natural-mobile.jpg`;
const GIFT_IMAGE = `${OFFER_ASSET_PATH}/reference-natural-mobile.jpg`;
const SHOWCASE_IMAGE_BY_COLOR = {
  'mint-green': `${OFFER_ASSET_PATH}/mint-green.jpg`,
  pistachio: `${OFFER_ASSET_PATH}/mint-green.jpg`,
  'light-green': `${OFFER_ASSET_PATH}/mint-green.jpg`,
  natural: `${OFFER_ASSET_PATH}/natural.jpg`,
  cream: `${OFFER_ASSET_PATH}/natural.jpg`,
  'light-blue': `${OFFER_ASSET_PATH}/light-blue.jpg`,
  'light-pink': `${OFFER_ASSET_PATH}/pink.jpg`,
  pink: `${OFFER_ASSET_PATH}/pink.jpg`,
  azalea: `${OFFER_ASSET_PATH}/pink.jpg`,
  'ice-grey': `${OFFER_ASSET_PATH}/gray.jpg`,
  'ice-gray': `${OFFER_ASSET_PATH}/gray.jpg`,
  grey: `${OFFER_ASSET_PATH}/gray.jpg`,
  gray: `${OFFER_ASSET_PATH}/gray.jpg`,
  white: `${OFFER_ASSET_PATH}/white.jpg`,
};
const SHOWCASE_COPY_BY_COLOR = {
  'mint-green': 'Fresh, earthy, and easy to pair with everyday denim.',
  pistachio: 'Soft and nature-inspired with a calm garden feel.',
  natural: 'Warm cream tone that brings out the roots-and-leaves artwork beautifully.',
  cream: 'Warm cream tone that keeps the artwork feeling organic.',
  daisy: 'A bright, cheerful option with a sunny lift.',
  'light-blue': 'A calm sky-blue take for soft, relaxed styling.',
  'light-pink': 'A playful pastel option with a fun gardening feel.',
  pink: 'A playful pastel option with a fun gardening feel.',
  azalea: 'A brighter pink for a little extra personality.',
  'ice-grey': 'A clean neutral that keeps the graphic front and center.',
  'ice-gray': 'A clean neutral that keeps the graphic front and center.',
  grey: 'A clean neutral that keeps the graphic front and center.',
  gray: 'A clean neutral that keeps the graphic front and center.',
  white: 'Bright, crisp, and classic for everyday wear.',
};
const COLOR_PRIORITY = ['white', 'ice-grey', 'ice-gray', 'natural', 'cream', 'pistachio', 'daisy', 'mint-green', 'light-blue', 'light-pink', 'azalea'];
const FOOTER_VALUES = [
  { icon: Leaf, text: 'Made for compost lovers' },
  { icon: Heart, text: 'Easy everyday style' },
  { icon: Recycle, text: 'Small choices, big impact' },
  { icon: Gift, text: 'Thoughtful gift idea' },
];
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
const OFFER_CHECKOUT_ROOT_ID = 'compost-garden-tee-offer-checkout';
const OFFER_PLACE_ORDER_BUTTON_ID = 'compost-garden-tee-offer-place-order';

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

const CompostGardenTeeOfferPage = () => {
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
  const giftSectionRef = useRef(null);
  const colorSectionRef = useRef(null);
  const sizeSectionRef = useRef(null);
  const checkoutSectionRef = useRef(null);
  const showcaseCarouselRef = useRef(null);

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
  const orderedColorOptions = useMemo(() => {
    const options = Array.isArray(colorOptions) ? [...colorOptions] : [];
    return options.sort((a, b) => {
      const aKey = normalizeOptionValue(a.label);
      const bKey = normalizeOptionValue(b.label);
      const aIndex = COLOR_PRIORITY.indexOf(aKey);
      const bIndex = COLOR_PRIORITY.indexOf(bKey);
      const aRank = aIndex === -1 ? Number.MAX_SAFE_INTEGER : aIndex;
      const bRank = bIndex === -1 ? Number.MAX_SAFE_INTEGER : bIndex;
      if (aRank !== bRank) return aRank - bRank;
      return a.label.localeCompare(b.label);
    });
  }, [colorOptions]);
  const showcaseSlides = useMemo(() => orderedColorOptions.map((option) => {
    const key = normalizeOptionValue(option.label);
    return {
      key,
      label: option.label,
      src: SHOWCASE_IMAGE_BY_COLOR[key] || null,
      description: SHOWCASE_COPY_BY_COLOR[key] || 'A soft everyday color option for relaxed casual wear.',
      disabled: option.disabled,
    };
  }), [orderedColorOptions]);
  const heroImage = SHOWCASE_IMAGE_BY_COLOR[selectedColorKey] || HERO_IMAGE_DESKTOP;
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
  const scrollShowcase = (direction) => {
    const container = showcaseCarouselRef.current;
    if (!container) return;
    const amount = Math.max(280, Math.floor(container.clientWidth * 0.82));
    container.scrollBy({ left: direction * amount, behavior: 'smooth' });
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
        <title>Compost Graphic Tee for Gardeners & Compost Lovers</title>
        <meta
          name="description"
          content="A playful compost graphic tee for gardeners, plant lovers, zero-waste friends, and anyone who believes food scraps are future soil."
        />
      </Helmet>

      <Header onCartClick={() => setCartDrawerOpen(true)} />
      <CartDrawer open={cartDrawerOpen} onClose={() => setCartDrawerOpen(false)} />

      <main className="overflow-x-hidden bg-[linear-gradient(180deg,_rgba(250,247,240,0.98)_0%,_rgba(247,243,233,0.86)_48%,_rgba(255,255,255,1)_100%)] pb-28 md:pb-16">
        <section className="border-b border-border/50">
          <div className="container-custom grid gap-10 py-10 md:py-14 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)] lg:items-center lg:gap-14">
            <div className="order-2 space-y-6 lg:order-1">
              <div className="inline-flex items-center gap-2 rounded-full border border-primary/15 bg-primary/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-primary/85">
                <Leaf className="h-3.5 w-3.5" />
                Compost graphic tee offer
              </div>

              <div className="space-y-4">
                <h1 className="max-w-3xl text-4xl font-bold leading-tight text-balance md:text-5xl lg:text-6xl" style={{ letterSpacing: '-0.03em' }}>
                  Wear Your Compost Pride
                </h1>
                <p className="max-w-2xl text-lg leading-relaxed text-muted-foreground md:text-xl">
                  Food scraps are future soil. This soft compost graphic tee is made for gardeners, soil lovers, and zero-waste folks who like wearing their values in a simple, playful way.
                </p>
              </div>

              <div className="flex flex-wrap items-end gap-5">
                <div className="rounded-3xl border border-border/60 bg-card px-5 py-4 shadow-sm">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary/75">Price</p>
                  <p className="mt-2 text-4xl font-bold text-foreground">
                    {loading ? <span className="text-2xl">Loading...</span> : `$${formatPrice(displayPrice)}`}
                  </p>
                </div>
                <div className="space-y-1 text-sm text-muted-foreground">
                  <p>Available in multiple soft colors.</p>
                  <p>Choose your color, size, and quantity below.</p>
                </div>
              </div>

              <div className="flex flex-col gap-3 sm:flex-row">
                <Button size="lg" className="min-w-[220px] rounded-full px-7" onClick={scrollToOrderSection}>
                  Shop the Tee
                  <ArrowDown className="ml-2 h-4 w-4" />
                </Button>
                <Button variant="outline" size="lg" className="rounded-full px-7" onClick={() => scrollToRef(giftSectionRef)}>
                  Gift This Tee
                </Button>
              </div>

            </div>

            <div className="order-1 lg:order-2">
              <div className="rounded-[2rem] border border-border/60 bg-card/90 p-4 shadow-[0_20px_60px_-28px_rgba(86,102,66,0.4)] backdrop-blur">
                {loading ? (
                  <Skeleton className="aspect-[4/5] w-full rounded-[1.5rem]" />
                ) : (
                  <img
                    src={HERO_IMAGE_DESKTOP}
                    alt="Compost graphic tee lifestyle image"
                    className="hidden aspect-[4/5] w-full rounded-[1.5rem] object-cover object-right md:block"
                    width="1122"
                    height="1402"
                  />
                )}
                {!loading && (
                  <img
                    src={HERO_IMAGE_MOBILE}
                    alt="Compost graphic tee lifestyle image"
                    className="aspect-[4/5] w-full rounded-[1.5rem] object-cover object-right md:hidden"
                    width="864"
                    height="1742"
                  />
                )}
              </div>
            </div>
          </div>
        </section>

        <section className="border-y border-border/40 bg-[#f7f2e7]/75">
          <div className="container-custom grid gap-5 py-5 md:grid-cols-4 md:gap-6 md:py-6">
            {BENEFIT_STRIP.map((item) => {
              const Icon = item.icon;
              return (
                <div key={item.title} className="flex items-start gap-3 md:border-l md:border-border/40 md:pl-6 first:md:border-l-0 first:md:pl-0">
                  <div className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-primary/25 text-primary">
                    <Icon className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="font-semibold text-foreground">{item.title}</p>
                    <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{item.description}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        <section className="container-custom py-10 md:py-14">
          <div className="mb-6 flex items-end justify-between gap-4">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-primary/80">Color carousel</p>
              <h2 className="mt-2 text-3xl font-bold text-balance md:text-4xl">Pick Your Favorite Color</h2>
            </div>
            <div className="hidden items-center gap-2 md:flex">
              <button
                type="button"
                onClick={() => scrollShowcase(-1)}
                className="flex h-10 w-10 items-center justify-center rounded-full border border-border/60 bg-background/80 text-foreground transition hover:border-primary/40 hover:text-primary"
                aria-label="Scroll colors left"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={() => scrollShowcase(1)}
                className="flex h-10 w-10 items-center justify-center rounded-full border border-border/60 bg-background/80 text-foreground transition hover:border-primary/40 hover:text-primary"
                aria-label="Scroll colors right"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>

          <div
            ref={showcaseCarouselRef}
            className="flex snap-x snap-mandatory gap-4 overflow-x-auto pb-3 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          >
            {showcaseSlides.map((slide) => {
              const isActive = selectedColorKey === slide.key;
              return (
                <button
                  key={slide.label}
                  type="button"
                  onClick={() => {
                    if (!slide.disabled) {
                      setSelectedColor(slide.label);
                    }
                    scrollToOrderSection();
                  }}
                  className={`shrink-0 basis-[44%] snap-start text-left sm:basis-[30%] lg:basis-[22%] xl:basis-[18%] ${
                    slide.disabled ? 'opacity-50' : ''
                  }`}
                >
                  <div className={`overflow-hidden rounded-[1.5rem] border bg-background/90 transition ${isActive ? 'border-primary/60 shadow-[0_16px_40px_-28px_rgba(86,102,66,0.55)]' : 'border-border/60'}`}>
                    {slide.src ? (
                      <img
                        src={slide.src}
                        alt={`${slide.label} Compost Graphic Tee`}
                        className="aspect-[4/4.9] w-full object-cover"
                        loading="lazy"
                        width="900"
                        height="1100"
                      />
                    ) : (
                      <div className="grid aspect-[4/4.9] place-items-center bg-[linear-gradient(180deg,_rgba(248,246,239,0.95),_rgba(239,234,220,0.9))] px-6">
                        <div className="text-center">
                          <div className="mx-auto h-16 w-16 rounded-full border border-black/10 shadow-inner" style={getColorSwatchStyle(slide.label)} />
                          <p className="mt-4 text-sm font-semibold text-foreground">{slide.label}</p>
                        </div>
                      </div>
                    )}
                  </div>
                  <p className="mt-3 text-sm font-semibold text-foreground">{slide.label}</p>
                </button>
              );
            })}
          </div>
          <div className="mt-6 flex justify-center">
            <Button className="rounded-full px-8" onClick={scrollToOrderSection}>
              Shop All Colors
            </Button>
          </div>
        </section>

        <section className="container-custom py-10 md:py-14">
          <div className="mb-6 text-center">
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-primary/80">Loved by Compost People</p>
          </div>
          <div className="flex snap-x snap-mandatory gap-5 overflow-x-auto pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden md:grid md:grid-cols-3 md:overflow-visible">
            {TESTIMONIALS.map((testimonial) => (
              <div key={testimonial.author} className="min-w-[82%] shrink-0 snap-start rounded-[1.5rem] bg-white/70 p-5 shadow-[0_18px_40px_-34px_rgba(86,102,66,0.55)] md:min-w-0">
                <p className="text-primary">★★★★★</p>
                <p className="mt-4 text-base leading-relaxed text-foreground/90">"{testimonial.quote}"</p>
                <p className="mt-4 text-sm font-medium text-muted-foreground">- {testimonial.author}</p>
              </div>
            ))}
          </div>
        </section>

        <section ref={giftSectionRef} className="container-custom py-6 md:py-12">
          <div className="grid gap-6 overflow-hidden rounded-[2rem] bg-[linear-gradient(135deg,rgba(244,239,227,0.9),rgba(250,247,240,0.98))] p-5 shadow-[0_20px_50px_-38px_rgba(86,102,66,0.55)] md:grid-cols-[minmax(0,0.92fr)_minmax(0,1.08fr)] md:items-center md:p-8">
            <img
              src={GIFT_IMAGE}
              alt="Compost graphic tee gift section"
              className="aspect-[4/3] w-full rounded-[1.5rem] object-cover object-right"
              loading="lazy"
              width="864"
              height="1742"
            />
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-primary/80">Gift idea</p>
              <h2 className="mt-3 text-3xl font-bold text-balance md:text-4xl">A Thoughtful Gift for the Compost Person in Your Life</h2>
              <p className="mt-4 text-base leading-relaxed text-muted-foreground md:text-lg">
                Know someone who talks about soil, scraps, and garden beds like it is a love language? This tee says, “I get you.”
              </p>
              <Button className="mt-6 rounded-full px-7" onClick={scrollToOrderSection}>
                Gift This Tee
              </Button>
            </div>
          </div>
        </section>

        <section ref={orderSectionRef} className="container-custom scroll-mt-24 py-10 md:py-14">
          <div className="mb-8 max-w-3xl">
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-primary/80">Order section</p>
            <h2 className="mt-2 text-3xl font-bold text-balance md:text-4xl">Choose your tee and complete checkout here</h2>
            <p className="mt-3 text-base leading-relaxed text-muted-foreground">
              Pick your favorite color, choose your size, and complete checkout below.
            </p>
          </div>

          <div className="mb-8 grid grid-cols-2 gap-4 sm:grid-cols-4">
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

        <section className="mt-2 bg-primary text-primary-foreground">
          <div className="container-custom grid gap-4 py-4 text-sm md:grid-cols-4">
            {FOOTER_VALUES.map((item) => {
              const Icon = item.icon;
              return (
                <div key={item.text} className="flex items-center justify-center gap-3 md:justify-start">
                  <Icon className="h-4 w-4 shrink-0" />
                  <span>{item.text}</span>
                </div>
              );
            })}
          </div>
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

export default CompostGardenTeeOfferPage;
