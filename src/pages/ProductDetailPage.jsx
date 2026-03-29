import React, { useEffect, useState } from 'react';
import { Helmet } from 'react-helmet';
import { useParams, Link } from 'react-router-dom';
import { Minus, Plus, ShoppingCart, ChevronLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import apiServerClient from '@/lib/apiServerClient';
import Header from '@/components/Header.jsx';
import Footer from '@/components/Footer.jsx';
import CartDrawer from '@/components/CartDrawer.jsx';

const FALLBACK_DESCRIPTION = 'Sustainably crafted with eco-friendly materials. Made-to-order to reduce waste and support conscious creation.';
const DESCRIPTION_PREVIEW_LENGTH = 220;
const COLOR_SWATCH_MAP = {
  black: '#111827',
  white: '#f8fafc',
  red: '#dc2626',
  green: '#15803d',
  yellow: '#eab308',
  blue: '#2563eb',
  brown: '#8b5e3c',
  orange: '#f97316',
  pink: '#ec4899',
  purple: '#7c3aed',
  gray: '#6b7280',
  grey: '#6b7280',
  beige: '#d6c7a1',
  cream: '#f5f1df',
  navy: '#1e3a8a',
  maroon: '#7f1d1d',
  olive: '#556b2f',
  teal: '#0f766e',
  gold: '#ca8a04',
  silver: '#94a3b8',
  tan: '#d2b48c',
  burgundy: '#7f1d1d',
  'forest-green': '#166534',
  'earth-brown': '#8b5e3c',
};
const ATTRIBUTE_KIND_ALIASES = {
  size: new Set(['size', 'sizes', 'pa-size', 'pa_size']),
  color: new Set(['color', 'colors', 'colour', 'colours', 'pa-color', 'pa-colour', 'pa_color', 'pa_colour']),
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
  if (['xs', 's', 'm', 'l', 'xl', 'xxl', 'xxxl'].includes(normalized)) {
    return normalized.toUpperCase();
  }

  return text
    .replace(/[_-]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
};

const uniqueLabels = (values) => {
  const seen = new Set();
  const output = [];

  for (const value of values) {
    const label = formatOptionLabel(value);
    const normalized = normalizeOptionValue(label);
    if (!label || seen.has(normalized)) continue;
    seen.add(normalized);
    output.push(label);
  }

  return output;
};

const uniqueValues = (values) => {
  const seen = new Set();
  const output = [];

  for (const value of values) {
    const text = String(value || '').trim();
    if (!text || seen.has(text)) continue;
    seen.add(text);
    output.push(text);
  }

  return output;
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

const extractTextFromHtml = (value) => {
  if (typeof value !== 'string' || !value.trim()) return '';

  if (typeof DOMParser !== 'undefined') {
    const parser = new DOMParser();
    const doc = parser.parseFromString(value, 'text/html');
    return (doc.body.textContent || '').replace(/\s+/g, ' ').trim();
  }

  return value.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
};

const sanitizeDescriptionHtml = (value) => {
  if (typeof value !== 'string' || !value.trim()) return '';
  if (typeof DOMParser === 'undefined') return value;

  const parser = new DOMParser();
  const doc = parser.parseFromString(value, 'text/html');
  const allowedTags = new Set(['p', 'br', 'ul', 'ol', 'li', 'strong', 'em', 'b', 'i', 'a']);
  const elementNode = 1;
  const commentNode = 8;

  const cleanNode = (node) => {
    for (const child of [...node.childNodes]) {
      if (child.nodeType === commentNode) {
        child.remove();
        continue;
      }

      if (child.nodeType !== elementNode) continue;

      const tagName = child.tagName.toLowerCase();
      if (!allowedTags.has(tagName)) {
        if (tagName === 'script' || tagName === 'style') {
          child.remove();
          continue;
        }

        cleanNode(child);
        child.replaceWith(...child.childNodes);
        continue;
      }

      for (const attribute of [...child.attributes]) {
        if (tagName === 'a' && attribute.name === 'href') {
          const href = attribute.value.trim();
          if (/^(https?:|mailto:|tel:|#)/i.test(href)) continue;
        }

        child.removeAttribute(attribute.name);
      }

      if (tagName === 'a') {
        child.setAttribute('rel', 'noreferrer');
        child.setAttribute('target', '_blank');
      }

      cleanNode(child);
    }
  };

  cleanNode(doc.body);
  return doc.body.innerHTML.trim();
};

const getCategoryFilterValue = (product) => {
  const categories = product?.categories;
  if (!Array.isArray(categories) || categories.length === 0) return null;

  const first = categories[0];
  if (typeof first === 'string' && first.trim()) return first.trim();
  if (first && typeof first === 'object') {
    return first.slug || first.id || first.name || null;
  }

  return null;
};

const getImageUrl = (value) => {
  if (typeof value === 'string') return value;
  if (value && typeof value === 'object') return value.src || value.url || null;
  return null;
};

const normalizeImages = (imagesValue, fallbackImage) => {
  if (Array.isArray(imagesValue)) {
    return imagesValue.map(getImageUrl).filter(Boolean);
  }

  const one = getImageUrl(fallbackImage);
  return one ? [one] : [];
};

const resolveBaseProductInStock = (product) => {
  if (typeof product?.inStock === 'boolean') return product.inStock;

  const stockQuantity = Number(product?.stockQuantity);
  if (Number.isFinite(stockQuantity)) return stockQuantity > 0;

  return true;
};

const resolveVariationInStock = (variation) => {
  const stockStatus = variation?.stockStatus || variation?.stock_status;
  if (stockStatus) return stockStatus === 'instock';
  if (typeof variation?.inStock === 'boolean') return variation.inStock;
  if (typeof variation?.is_in_stock === 'boolean') return variation.is_in_stock;

  const stockQuantity = Number(variation?.stockQuantity ?? variation?.stock_quantity);
  if (Number.isFinite(stockQuantity)) return stockQuantity > 0;

  return true;
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
    const attributeSelections = [];
    const attributesByKind = {};

    for (const selection of getRawVariationSelections(variation)) {
      const attributeName = selection?.name || selection?.slug || selection?.attribute || selection?.key || '';
      const attributeSlug = selection?.slug || selection?.name || selection?.attribute || '';
      const optionValue = selection?.option || selection?.value || selection?.name_value || selection?.option_name || '';
      const label = formatOptionLabel(optionValue);
      const kind = getAttributeKind(attributeSlug, attributeName);

      if (!kind || !label) continue;

      const normalizedOption = normalizeOptionValue(label);
      attributesByKind[kind] = {
        label,
        normalized: normalizedOption,
      };
      attributeSelections.push({
        kind,
        name: selection?.name || (kind === 'color' ? 'Color' : 'Size'),
        slug: selection?.slug || attributeSlug || attributeName,
        option: label,
        normalizedOption,
      });
    }

    const stockQuantityValue = Number(variation?.stockQuantity ?? variation?.stock_quantity);

    return {
      id: variation?.id,
      sku: variation?.sku || '',
      price: variation?.price ?? '',
      regularPrice: variation?.regularPrice ?? variation?.regular_price ?? '',
      salePrice: variation?.salePrice ?? variation?.sale_price ?? '',
      stockStatus: variation?.stockStatus || variation?.stock_status || (resolveVariationInStock(variation) ? 'instock' : 'outofstock'),
      stockQuantity: Number.isFinite(stockQuantityValue) ? stockQuantityValue : null,
      image: getImageUrl(variation?.image),
      inStock: resolveVariationInStock(variation),
      attributeSelections,
      attributesByKind,
    };
  }).filter((variation) => Object.keys(variation.attributesByKind).length > 0);
};

const buildAttributeGroups = (product, variationEntries) => {
  const groups = new Map();

  const ensureGroup = (kind, defaults = {}) => {
    if (!groups.has(kind)) {
      groups.set(kind, {
        kind,
        name: defaults.name || (kind === 'color' ? 'Color' : 'Size'),
        slug: defaults.slug || '',
        options: [],
      });
    }

    const group = groups.get(kind);
    if (!group.name && defaults.name) group.name = defaults.name;
    if (!group.slug && defaults.slug) group.slug = defaults.slug;
    return group;
  };

  const pushOptions = (group, values) => {
    const nextLabels = uniqueLabels(values);
    const seen = new Set(group.options.map((option) => normalizeOptionValue(option)));

    for (const option of nextLabels) {
      const normalized = normalizeOptionValue(option);
      if (!normalized || seen.has(normalized)) continue;
      seen.add(normalized);
      group.options.push(option);
    }
  };

  const productAttributes = Array.isArray(product?.attributes) ? product.attributes : [];

  for (const attribute of productAttributes) {
    const kind = getAttributeKind(attribute?.slug, attribute?.name, attribute?.attribute);
    if (!kind) continue;

    const group = ensureGroup(kind, {
      name: attribute?.name || (kind === 'color' ? 'Color' : 'Size'),
      slug: attribute?.slug || '',
    });

    pushOptions(group, Array.isArray(attribute?.options) ? attribute.options : []);
  }

  for (const variation of variationEntries) {
    for (const selection of variation.attributeSelections) {
      const group = ensureGroup(selection.kind, {
        name: selection.name,
        slug: selection.slug,
      });

      pushOptions(group, [selection.option]);
    }
  }

  return ['size', 'color']
    .map((kind) => groups.get(kind))
    .filter((group) => group && group.options.length > 0);
};

const getColorSwatchStyle = (colorLabel) => {
  const normalized = normalizeOptionValue(colorLabel);
  const directMatch = COLOR_SWATCH_MAP[normalized];
  if (directMatch) return { background: directMatch };

  for (const [token, color] of Object.entries(COLOR_SWATCH_MAP)) {
    if (normalized.includes(token)) return { background: color };
  }

  return {
    backgroundImage: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 45%, #cbd5e1 45%, #cbd5e1 55%, #94a3b8 55%, #64748b 100%)',
  };
};

const ProductDetailPage = () => {
  const { id } = useParams();
  const [product, setProduct] = useState(null);
  const [relatedProducts, setRelatedProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [selectedSize, setSelectedSize] = useState('');
  const [selectedColor, setSelectedColor] = useState('');
  const [descriptionExpanded, setDescriptionExpanded] = useState(false);
  const [cartDrawerOpen, setCartDrawerOpen] = useState(false);

  const formatPrice = (value) => {
    const n = Number(value);
    return Number.isFinite(n) ? n.toFixed(2) : '0.00';
  };

  useEffect(() => {
    fetchProduct();
  }, [id]);

  useEffect(() => {
    setDescriptionExpanded(false);
  }, [product?.id]);

  const fetchProduct = async () => {
    setLoading(true);
    setRelatedProducts([]);

    try {
      const response = await apiServerClient.fetch(`/products/${id}`);
      if (!response.ok) throw new Error('Product not found');

      const data = await response.json();
      setProduct(data);
      setSelectedImage(0);
      setSelectedSize('');
      setSelectedColor('');
      setQuantity(1);
      fetchRelatedProducts(data);
    } catch (error) {
      console.error('Error fetching product:', error);
      toast.error('Failed to load product');
    } finally {
      setLoading(false);
    }
  };

  const fetchRelatedProducts = async (currentProduct) => {
    try {
      const productId = currentProduct?.id;
      const category = getCategoryFilterValue(currentProduct);

      const buildPath = (categoryValue) => {
        const params = new URLSearchParams({
          page: '1',
          perPage: '8',
          sort: 'popularity',
        });

        if (categoryValue) params.set('category', String(categoryValue));
        return `/products?${params.toString()}`;
      };

      const readProducts = async (path) => {
        const response = await apiServerClient.fetch(path);
        if (!response.ok) return [];

        const data = await response.json();
        const products = Array.isArray(data) ? data : (data?.products || []);
        return products.filter((item) => item?.id != null && item.id !== productId);
      };

      let products = category ? await readProducts(buildPath(category)) : [];

      if (products.length < 4) {
        const fallbackProducts = await readProducts(buildPath(null));
        const seenIds = new Set(products.map((item) => item.id));

        for (const item of fallbackProducts) {
          if (products.length >= 4) break;
          if (seenIds.has(item.id)) continue;
          products.push(item);
          seenIds.add(item.id);
        }
      }

      setRelatedProducts(products.slice(0, 4));
    } catch (error) {
      console.error('Error fetching related products:', error);
      setRelatedProducts([]);
    }
  };

  const variationEntries = buildVariationEntries(product);
  const attributeGroups = buildAttributeGroups(product, variationEntries);
  const requiredAttributeKinds = attributeGroups.map((attribute) => attribute.kind);
  const hasRealVariationData = variationEntries.length > 0 && requiredAttributeKinds.length > 0;
  const baseProductInStock = resolveBaseProductInStock(product);
  const productInStock = variationEntries.length > 0
    ? variationEntries.some((variation) => variation.inStock)
    : baseProductInStock;

  const selectedValues = {
    size: normalizeOptionValue(selectedSize),
    color: normalizeOptionValue(selectedColor),
  };

  const matchesSelectedAttributes = (variation, override = {}) => {
    for (const kind of requiredAttributeKinds) {
      const expected = override[kind] ?? selectedValues[kind];
      if (!expected) continue;

      const variationValue = variation.attributesByKind[kind]?.normalized;
      if (variationValue !== expected) return false;
    }

    return true;
  };

  const fullySelected = requiredAttributeKinds.every((kind) => selectedValues[kind]);
  const selectedVariation = fullySelected
    ? variationEntries.find((variation) => variation.inStock && matchesSelectedAttributes(variation))
      || variationEntries.find((variation) => matchesSelectedAttributes(variation))
      || null
    : null;

  const getPreferredVariationImage = () => {
    if (selectedVariation?.image) return selectedVariation.image;
    if (!selectedValues.color) return null;

    const exactColorMatch = variationEntries.find((variation) => (
      variation.inStock
      && variation.image
      && variation.attributesByKind.color?.normalized === selectedValues.color
      && (!selectedValues.size || variation.attributesByKind.size?.normalized === selectedValues.size)
    ));

    if (exactColorMatch?.image) return exactColorMatch.image;

    const colorMatch = variationEntries.find((variation) => (
      variation.image && variation.attributesByKind.color?.normalized === selectedValues.color
    ));

    return colorMatch?.image || null;
  };

  const preferredVariationImage = getPreferredVariationImage();
  const baseImages = normalizeImages(product?.images, product?.image);
  const images = uniqueValues([preferredVariationImage, ...baseImages]).filter(Boolean);

  useEffect(() => {
    setSelectedImage(0);
  }, [preferredVariationImage, product?.id]);

  useEffect(() => {
    if (selectedImage >= images.length) {
      setSelectedImage(0);
    }
  }, [images.length, selectedImage]);

  const findOptionState = (kind, label) => {
    const target = normalizeOptionValue(label);

    const available = variationEntries.some((variation) => (
      variation.inStock && matchesSelectedAttributes(variation, { [kind]: target })
    ));

    return {
      label,
      disabled: !available,
    };
  };

  const sizeGroup = attributeGroups.find((attribute) => attribute.kind === 'size');
  const colorGroup = attributeGroups.find((attribute) => attribute.kind === 'color');
  const sizeOptions = sizeGroup ? sizeGroup.options.map((label) => findOptionState('size', label)) : [];
  const colorOptions = colorGroup ? colorGroup.options.map((label) => findOptionState('color', label)) : [];

  const selectedSizeDisabled = selectedSize
    ? !sizeOptions.some((option) => option.label === selectedSize && !option.disabled)
    : false;

  const selectedColorDisabled = selectedColor
    ? !colorOptions.some((option) => option.label === selectedColor && !option.disabled)
    : false;

  useEffect(() => {
    if (selectedSizeDisabled) setSelectedSize('');
  }, [selectedSizeDisabled]);

  useEffect(() => {
    if (selectedColorDisabled) setSelectedColor('');
  }, [selectedColorDisabled]);

  const displayPrice = selectedVariation?.price || product?.price;
  const displayRegularPrice = selectedVariation?.regularPrice || product?.regularPrice;
  const displaySalePrice = selectedVariation?.salePrice || product?.salePrice;
  const hasSalePrice = Number(displaySalePrice) > 0 && Number(displayRegularPrice || displayPrice) > Number(displayPrice);
  const stockQuantityValue = Number(selectedVariation?.stockQuantity ?? product?.stockQuantity);
  const stockQuantity = Number.isFinite(stockQuantityValue) ? stockQuantityValue : null;
  const maxQuantity = stockQuantity && stockQuantity > 0 ? Math.min(stockQuantity, 99) : 99;

  useEffect(() => {
    setQuantity((currentQuantity) => Math.min(Math.max(1, currentQuantity), maxQuantity));
  }, [maxQuantity]);

  const missingSelections = requiredAttributeKinds.filter((kind) => !selectedValues[kind]);
  const missingSelectionLabel = missingSelections.join(' and ');
  const canClearSelections = hasRealVariationData && Boolean(selectedSize || selectedColor);
  const canAddToCart = hasRealVariationData
    ? Boolean(selectedVariation?.id) && selectedVariation.inStock && missingSelections.length === 0
    : productInStock;

  const availabilityText = (() => {
    if (!productInStock) return 'Out of stock';
    if (hasRealVariationData && missingSelections.length > 0) return `Select ${missingSelectionLabel}`;
    if (selectedVariation && !selectedVariation.inStock) return 'Selected combination is unavailable';
    if (selectedVariation && Number.isFinite(stockQuantity) && stockQuantity > 0) {
      return stockQuantity <= 5 ? `Only ${stockQuantity} left` : `${stockQuantity} in stock`;
    }
    if (selectedVariation?.inStock) return 'In stock';
    if (hasRealVariationData) return `${variationEntries.filter((variation) => variation.inStock).length} available combinations`;
    return 'In stock';
  })();

  const addToCartLabel = !productInStock
    ? 'Out of stock'
    : hasRealVariationData && missingSelections.length > 0
      ? `Select ${missingSelectionLabel}`
      : 'Add to cart';

  const handleClearSelections = () => {
    setSelectedSize('');
    setSelectedColor('');
  };

  const addToCart = () => {
    if (!product || !canAddToCart) {
      toast.error(hasRealVariationData ? 'Please choose an available size and color first' : 'This product is currently unavailable');
      return;
    }

    const cart = JSON.parse(localStorage.getItem('anfaCart') || '{"items":[],"subtotal":0,"itemCount":0}');
    const cartLineKey = selectedVariation?.id ? `variation-${selectedVariation.id}` : `product-${product.id}`;
    const itemPrice = parseFloat(displayPrice);
    const itemImage = images[selectedImage] || images[0] || 'https://images.unsplash.com/photo-1618815909724-861120595390';

    const existingItemIndex = cart.items.findIndex((item) => {
      const existingKey = item.variationId ? `variation-${item.variationId}` : `product-${item.productId}`;
      return existingKey === cartLineKey;
    });

    if (existingItemIndex > -1) {
      const existingQuantity = Number(cart.items[existingItemIndex].quantity) || 0;
      const nextQuantity = Math.min(existingQuantity + quantity, maxQuantity);
      cart.items[existingItemIndex] = {
        ...cart.items[existingItemIndex],
        quantity: nextQuantity,
        price: itemPrice,
        image: itemImage,
      };
    } else {
      cart.items.push({
        productId: product.id,
        variationId: selectedVariation?.id || null,
        sku: selectedVariation?.sku || product?.sku || '',
        name: product.name,
        price: itemPrice,
        image: itemImage,
        quantity,
        size: selectedSize,
        color: selectedColor,
      });
    }

    cart.subtotal = cart.items.reduce((sum, item) => sum + (parseFloat(item.price) * item.quantity), 0);
    cart.itemCount = cart.items.reduce((sum, item) => sum + item.quantity, 0);

    localStorage.setItem('anfaCart', JSON.stringify(cart));
    window.dispatchEvent(new Event('cartUpdated'));
    toast.success('Added to cart');
    setCartDrawerOpen(true);
  };

  const descriptionSource = product?.description || FALLBACK_DESCRIPTION;
  const descriptionText = extractTextFromHtml(descriptionSource) || FALLBACK_DESCRIPTION;
  const sanitizedDescriptionHtml = sanitizeDescriptionHtml(descriptionSource) || `<p>${FALLBACK_DESCRIPTION}</p>`;
  const hasLongDescription = descriptionText.length > DESCRIPTION_PREVIEW_LENGTH;
  const collapsedDescription = hasLongDescription
    ? `${descriptionText.slice(0, DESCRIPTION_PREVIEW_LENGTH).trimEnd()}...`
    : descriptionText;

  if (loading) {
    return (
      <>
        <Header onCartClick={() => setCartDrawerOpen(true)} />
        <CartDrawer open={cartDrawerOpen} onClose={() => setCartDrawerOpen(false)} />
        <main className="py-12 pb-28 md:pb-20">
          <div className="container-custom">
            <div className="grid gap-12 md:grid-cols-2 lg:grid-cols-[minmax(0,0.82fr)_minmax(0,1.45fr)]">
              <div className="space-y-4">
                <Skeleton className="aspect-[4/5] w-full rounded-xl sm:aspect-square md:aspect-[4/5]" />
                <div className="grid grid-cols-4 gap-2 sm:grid-cols-5 md:grid-cols-4">
                  {[1, 2, 3, 4].map((item) => <Skeleton key={item} className="aspect-square rounded-lg" />)}
                </div>
              </div>
              <div className="space-y-6">
                <Skeleton className="h-8 w-3/4" />
                <Skeleton className="h-6 w-1/4" />
                <Skeleton className="h-24 w-full" />
              </div>
            </div>
          </div>
        </main>
        <Footer />
      </>
    );
  }

  if (!product) {
    return (
      <>
        <Header onCartClick={() => setCartDrawerOpen(true)} />
        <CartDrawer open={cartDrawerOpen} onClose={() => setCartDrawerOpen(false)} />
        <main className="py-20">
          <div className="container-custom text-center">
            <h1 className="mb-4 text-2xl font-bold">Product not found</h1>
            <Link to="/shop">
              <Button>Continue shopping</Button>
            </Link>
          </div>
        </main>
        <Footer />
      </>
    );
  }

  return (
    <>
      <Helmet>
        <title>{`${product.name} - AnfaStyles`}</title>
        <meta
          name="description"
          content={descriptionText.substring(0, 160) || `Shop ${product.name} at AnfaStyles`}
        />
      </Helmet>

      <Header onCartClick={() => setCartDrawerOpen(true)} />
      <CartDrawer open={cartDrawerOpen} onClose={() => setCartDrawerOpen(false)} />

      <main className="py-12 pb-28 md:pb-20">
        <div className="container-custom">
          <Link
            to="/shop"
            className="mb-8 inline-flex items-center text-sm text-muted-foreground transition-colors duration-200 hover:text-primary"
          >
            <ChevronLeft className="mr-1 h-4 w-4" />
            Back to shop
          </Link>

          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-[minmax(18rem,0.78fr)_minmax(0,1.55fr)] lg:items-start lg:gap-16">
            <section className="order-1 min-w-0 md:col-start-2 lg:pr-4">
              <h1
                className="text-3xl font-bold text-balance md:text-4xl"
                style={{ letterSpacing: '-0.02em' }}
              >
                {product.name}
              </h1>

              <div className="mt-4 flex flex-wrap items-end gap-3">
                <p className="text-3xl font-bold font-variant-tabular">
                  ${formatPrice(displayPrice)}
                </p>
                {hasSalePrice && (
                  <p className="text-lg font-medium text-muted-foreground line-through font-variant-tabular">
                    ${formatPrice(displayRegularPrice)}
                  </p>
                )}
              </div>

              <p className="mt-3 text-sm font-medium text-muted-foreground">
                {availabilityText}
              </p>
            </section>

            <section className="order-2 mx-auto w-full max-w-[30rem] md:col-start-1 md:row-start-1 md:row-span-3 lg:max-w-[24rem] xl:max-w-[26rem]">
              <div className="mb-3 aspect-[4/5] max-h-[32rem] overflow-hidden rounded-xl bg-muted sm:aspect-square md:aspect-[4/5]">
                <img
                  src={images[selectedImage] || 'https://images.unsplash.com/photo-1618815909724-861120595390'}
                  alt={product.name}
                  className="h-full w-full object-cover"
                />
              </div>

              {images.length > 1 && (
                <div className="grid grid-cols-4 gap-2.5 sm:grid-cols-5 md:grid-cols-4">
                  {images.map((img, index) => (
                    <button
                      key={`${img}-${index}`}
                      type="button"
                      onClick={() => setSelectedImage(index)}
                      className={`aspect-square overflow-hidden rounded-lg border-2 bg-muted transition-all duration-200 ${
                        selectedImage === index ? 'border-primary' : 'border-transparent hover:border-border'
                      }`}
                    >
                      <img src={img} alt={`${product.name} view ${index + 1}`} className="h-full w-full object-cover" />
                    </button>
                  ))}
                </div>
              )}
            </section>

            <section className="order-3 min-w-0 md:col-start-2 lg:pr-4">
              <div className="rounded-2xl border border-border/70 bg-background/95 p-5 shadow-sm backdrop-blur lg:sticky lg:top-24">
                {hasRealVariationData && (
                  <div className="mb-4 flex items-center justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold">Choose your options</p>
                      <p className="text-xs text-muted-foreground">Select an available size and color before adding to cart.</p>
                    </div>
                    <button
                      type="button"
                      onClick={handleClearSelections}
                      disabled={!canClearSelections}
                      className="text-sm font-semibold text-primary transition-colors duration-200 hover:text-primary/80 disabled:cursor-not-allowed disabled:text-muted-foreground"
                    >
                      Clear
                    </button>
                  </div>
                )}

                <div className="space-y-5">
                  {sizeOptions.length > 0 && (
                    <div>
                      <label className="mb-2 block text-sm font-semibold">Size</label>
                      <div className="flex flex-wrap gap-2">
                        {sizeOptions.map((option) => {
                          const isSelected = selectedSize === option.label;

                          return (
                            <button
                              key={option.label}
                              type="button"
                              disabled={option.disabled}
                              onClick={() => setSelectedSize(option.label)}
                              aria-pressed={isSelected}
                              className={`min-w-[3.25rem] rounded-xl border px-3 py-2 text-sm font-semibold transition-all duration-200 ${
                                option.disabled
                                  ? 'cursor-not-allowed border-border/60 bg-muted/40 text-muted-foreground opacity-50'
                                  : isSelected
                                    ? 'border-primary bg-primary/10 text-primary shadow-sm'
                                    : 'border-border bg-background hover:border-primary/50 hover:bg-primary/5'
                              }`}
                            >
                              {option.label}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {colorOptions.length > 0 && (
                    <div>
                      <label className="mb-2 block text-sm font-semibold">Color</label>
                      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                        {colorOptions.map((option) => {
                          const isSelected = selectedColor === option.label;

                          return (
                            <button
                              key={option.label}
                              type="button"
                              disabled={option.disabled}
                              onClick={() => setSelectedColor(option.label)}
                              aria-pressed={isSelected}
                              className={`flex items-center gap-3 rounded-xl border px-3 py-2.5 text-left text-sm transition-all duration-200 ${
                                option.disabled
                                  ? 'cursor-not-allowed border-border/60 bg-muted/40 text-muted-foreground opacity-50'
                                  : isSelected
                                    ? 'border-primary bg-primary/10 shadow-sm'
                                    : 'border-border bg-background hover:border-primary/50 hover:bg-primary/5'
                              }`}
                            >
                              <span
                                className={`h-5 w-5 shrink-0 rounded-full border border-black/10 ${option.disabled ? 'opacity-70' : ''}`}
                                style={getColorSwatchStyle(option.label)}
                              />
                              <span className="truncate font-medium">
                                {option.label}
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  <div>
                    <label className="mb-2 block text-sm font-semibold">Quantity</label>
                    <div className="flex items-center gap-3">
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => setQuantity((currentQuantity) => Math.max(1, currentQuantity - 1))}
                      >
                        <Minus className="h-4 w-4" />
                      </Button>
                      <span className="w-12 text-center text-lg font-semibold">{quantity}</span>
                      <Button
                        variant="outline"
                        size="icon"
                        disabled={quantity >= maxQuantity}
                        onClick={() => setQuantity((currentQuantity) => Math.min(maxQuantity, currentQuantity + 1))}
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>

                <Button onClick={addToCart} size="lg" className="mt-5 hidden w-full md:flex" disabled={!canAddToCart}>
                  <ShoppingCart className="mr-2 h-5 w-5" />
                  {addToCartLabel}
                </Button>

                <div className="mt-5 rounded-lg bg-muted p-4">
                  <ul className="space-y-2 text-sm text-muted-foreground">
                    <li>- Free shipping on orders over $75</li>
                    <li>- Made-to-order, ships in 3-7 business days</li>
                    <li>- 30-day satisfaction guarantee</li>
                    <li>- Sustainable materials, eco-friendly production</li>
                  </ul>
                </div>
              </div>
            </section>

            <section className="order-4 min-w-0 md:col-start-2 lg:pr-4">
              <div className="max-w-prose">
                {descriptionExpanded ? (
                  <div
                    className="space-y-4 leading-relaxed text-muted-foreground [&_a]:text-primary [&_a]:underline [&_a]:underline-offset-4 [&_li]:mb-1 [&_ol]:list-decimal [&_ol]:pl-5 [&_p]:mb-4 [&_strong]:font-semibold [&_ul]:list-disc [&_ul]:pl-5"
                    dangerouslySetInnerHTML={{ __html: sanitizedDescriptionHtml }}
                  />
                ) : (
                  <p
                    className="leading-relaxed text-muted-foreground"
                    style={{
                      display: '-webkit-box',
                      WebkitBoxOrient: 'vertical',
                      WebkitLineClamp: 3,
                      overflow: 'hidden',
                    }}
                  >
                    {collapsedDescription}
                  </p>
                )}

                {hasLongDescription && (
                  <button
                    type="button"
                    onClick={() => setDescriptionExpanded((current) => !current)}
                    className="mt-3 text-sm font-semibold text-primary transition-colors duration-200 hover:text-primary/80"
                  >
                    {descriptionExpanded ? 'Read less' : 'Read more'}
                  </button>
                )}
              </div>
            </section>
          </div>

          {relatedProducts.length > 0 && (
            <section className="mt-20">
              <h2 className="mb-6 text-2xl font-bold">You might also like</h2>
              <div className="grid grid-cols-2 gap-6 md:grid-cols-4">
                {relatedProducts.map((relatedProduct) => (
                  <Link key={relatedProduct.id} to={`/product/${relatedProduct.id}`} className="card-product block">
                    <div className="aspect-square overflow-hidden bg-muted">
                      <img
                        src={getImageUrl(relatedProduct.image) || getImageUrl(relatedProduct.images?.[0]) || 'https://images.unsplash.com/photo-1618815909724-861120595390'}
                        alt={relatedProduct.name}
                        className="h-full w-full object-cover transition-transform duration-300 hover:scale-105"
                      />
                    </div>
                    <div className="p-4">
                      <h3 className="mb-1 truncate text-sm font-semibold">{relatedProduct.name}</h3>
                      <p className="font-semibold font-variant-tabular">${formatPrice(relatedProduct.price)}</p>
                    </div>
                  </Link>
                ))}
              </div>
            </section>
          )}
        </div>
      </main>

      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80 md:hidden">
        <div className="container-custom flex items-center gap-3 py-3">
          <div className="min-w-0 flex-1">
            <p className="truncate text-lg font-semibold font-variant-tabular">${formatPrice(displayPrice)}</p>
            <p className="text-xs text-muted-foreground">{availabilityText}</p>
          </div>
          <Button onClick={addToCart} size="lg" className="shrink-0 px-5" disabled={!canAddToCart}>
            <ShoppingCart className="mr-2 h-5 w-5" />
            {canAddToCart ? 'Add to cart' : addToCartLabel}
          </Button>
        </div>
      </div>

      <Footer />
    </>
  );
};

export default ProductDetailPage;
