import React, { useEffect, useRef, useState } from 'react';
import { Helmet } from 'react-helmet';
import { useParams, Link } from 'react-router-dom';
import { Minus, Plus, ShoppingCart, ChevronLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import apiServerClient from '@/lib/apiServerClient';
import { getCartLineKey } from '@/lib/cart';
import { getMetaContentId, trackMetaAddToCart, trackMetaViewContent } from '@/lib/metaPixel.js';
import { getTikTokContentId, trackTikTokAddToCart, trackTikTokViewContent } from '@/lib/tiktokPixel.js';
import { useCart } from '@/contexts/CartContext.jsx';
import { notifyError, notifySuccess } from '@/lib/notifications.js';
import Header from '@/components/Header.jsx';
import Footer from '@/components/Footer.jsx';
import CartDrawer from '@/components/CartDrawer.jsx';
import ProductRatingStars from '@/components/ProductRatingStars.jsx';
import SizeGuideDialog from '@/components/SizeGuideDialog.jsx';

const FALLBACK_DESCRIPTION = 'Sustainably crafted with eco-friendly materials. Made-to-order to reduce waste and support conscious creation.';
const DESCRIPTION_PREVIEW_LENGTH = 220;
const ADD_TO_CART_TOAST_ID = 'add-to-cart-success';
const TRUST_BADGES = [
  '30-Day Refund',
  'Secure Checkout',
  'Tracked Shipping',
  'Made to Order',
];
const COLOR_SWATCH_MAP = {
  black: '#111827',
  white: '#f8fafc',
  natural: '#f3ede0',
  daisy: '#f5dc4d',
  yellow: '#eab308',
  gold: '#ca8a04',
  mustard: '#d4a017',
  red: '#dc2626',
  cardinal: '#b91c1c',
  maroon: '#7f1d1d',
  burgundy: '#7f1d1d',
  orange: '#f97316',
  coral: '#f97316',
  pink: '#ec4899',
  purple: '#7c3aed',
  blue: '#2563eb',
  royal: '#1d4ed8',
  navy: '#1e3a8a',
  teal: '#0f766e',
  turquoise: '#0f766e',
  green: '#15803d',
  'irish-green': '#009a44',
  'military-green': '#66724a',
  olive: '#556b2f',
  'forest-green': '#166534',
  sage: '#93a084',
  mint: '#a7d8c3',
  brown: '#8b5e3c',
  tan: '#d2b48c',
  gray: '#6b7280',
  grey: '#6b7280',
  ash: '#d1d5db',
  charcoal: '#4b5563',
  graphite: '#374151',
  heather: '#9ca3af',
  'sport-grey': '#b6bcc6',
  'sport-gray': '#b6bcc6',
  silver: '#94a3b8',
  beige: '#d6c7a1',
  cream: '#f5f1df',
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
  const allowedTags = new Set([
    'p',
    'br',
    'ul',
    'ol',
    'li',
    'strong',
    'em',
    'b',
    'i',
    'a',
    'h1',
    'h2',
    'h3',
    'h4',
    'h5',
    'h6',
    'hr',
    'blockquote',
    'table',
    'thead',
    'tbody',
    'tfoot',
    'tr',
    'th',
    'td',
    'caption',
    'colgroup',
    'col',
  ]);
  const allowedAttributes = new Map([
    ['a', new Set(['href'])],
    ['th', new Set(['colspan', 'rowspan', 'scope'])],
    ['td', new Set(['colspan', 'rowspan'])],
    ['col', new Set(['span'])],
  ]);
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
        const attrName = attribute.name.toLowerCase();
        const allowedForTag = allowedAttributes.get(tagName);

        if (tagName === 'a' && attrName === 'href') {
          const href = attribute.value.trim();
          if (/^(https?:|mailto:|tel:|#)/i.test(href)) continue;
        }

        if (allowedForTag && allowedForTag.has(attrName)) {
          if (attrName === 'colspan' || attrName === 'rowspan' || attrName === 'span') {
            const numericValue = Number.parseInt(attribute.value, 10);
            if (Number.isInteger(numericValue) && numericValue > 0) continue;
          } else {
            continue;
          }
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

  return ['color', 'size']
    .map((kind) => groups.get(kind))
    .filter((group) => group && group.options.length > 0);
};

const getColorSwatchStyle = (colorLabel) => {
  const normalized = normalizeOptionValue(colorLabel);
  const directMatch = COLOR_SWATCH_MAP[normalized];
  if (directMatch) return { background: directMatch };

  const normalizedTokens = normalized.split('-').filter(Boolean);

  for (const [token, color] of Object.entries(COLOR_SWATCH_MAP)) {
    if (normalized.includes(token)) return { background: color };

    const tokenParts = token.split('-').filter(Boolean);
    if (tokenParts.every((part) => normalizedTokens.includes(part))) {
      return { background: color };
    }
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
  const [selectionErrorVisible, setSelectionErrorVisible] = useState(false);
  const { cart, addItem } = useCart();
  const tiktokViewContentTrackedRef = useRef('');

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

  useEffect(() => {
    const productId = product?.id;
    if (!productId) return;

    const contentId = getTikTokContentId({ productId });
    if (!contentId || tiktokViewContentTrackedRef.current === contentId) return;

    tiktokViewContentTrackedRef.current = contentId;
    trackTikTokViewContent({
      contentId,
      contentName: product?.name || '',
      value: Number.parseFloat(product?.price) || 0,
      currency: 'USD',
    });

    trackMetaViewContent({
      contentId: getMetaContentId({ productId }),
      contentName: product?.name || '',
      value: Number.parseFloat(product?.price) || undefined,
      currency: 'USD',
    });
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
      setSelectionErrorVisible(false);
      setQuantity(1);
      fetchRelatedProducts(data);
    } catch (error) {
      console.error('Error fetching product:', error);
      notifyError('Unable to load this product', 'Please refresh the page or try another item.');
    } finally {
      setLoading(false);
    }
  };

  const fetchRelatedProducts = async (currentProduct) => {
    try {
      const productId = currentProduct?.id;
      const category = getCategoryFilterValue(currentProduct);
      const TARGET_COUNT = 12;
      const POOL_SIZE = 36;

      const shuffle = (items) => {
        const copy = [...items];
        for (let i = copy.length - 1; i > 0; i -= 1) {
          const j = Math.floor(Math.random() * (i + 1));
          [copy[i], copy[j]] = [copy[j], copy[i]];
        }
        return copy;
      };

      const buildPath = (categoryValue) => {
        const params = new URLSearchParams({
          page: '1',
          perPage: String(POOL_SIZE),
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

      const categoryProducts = category ? await readProducts(buildPath(category)) : [];
      const fallbackProducts = await readProducts(buildPath(null));
      const seenIds = new Set();
      const merged = [];

      const pushUnique = (items) => {
        for (const item of items) {
          if (!item?.id) continue;
          if (item.id === productId) continue;
          if (seenIds.has(item.id)) continue;
          seenIds.add(item.id);
          merged.push(item);
        }
      };

      pushUnique(categoryProducts);
      pushUnique(fallbackProducts);

      setRelatedProducts(shuffle(merged).slice(0, TARGET_COUNT));
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

  const missingSelections = requiredAttributeKinds.filter((kind) => !selectedValues[kind]);
  const missingSelectionLabel = missingSelections.join(' and ');
  const canClearSelections = hasRealVariationData && Boolean(selectedSize || selectedColor);
  const canAddToCart = hasRealVariationData
    ? Boolean(selectedVariation?.id) && selectedVariation.inStock && missingSelections.length === 0
    : productInStock;

  useEffect(() => {
    if (missingSelections.length === 0) {
      setSelectionErrorVisible(false);
    }
  }, [missingSelections.length]);

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
    setSelectionErrorVisible(false);
  };

  const addToCart = async () => {
    if (!product || !canAddToCart) {
      setSelectionErrorVisible(Boolean(hasRealVariationData));
      notifyError(
        hasRealVariationData ? 'Choose your product options first' : 'Product unavailable',
        hasRealVariationData
          ? `Select ${missingSelectionLabel} before adding this item to your cart.`
          : 'This product is currently unavailable.'
      );
      return;
    }

    const cartLineKey = getCartLineKey({
      productId: product.id,
      variationId: selectedVariation?.id || null,
      size: selectedSize,
      color: selectedColor,
    });
    const itemPrice = parseFloat(displayPrice);
    const itemImage = images[selectedImage] || images[0] || 'https://images.unsplash.com/photo-1618815909724-861120595390';
    const existingItem = cart.items.find((item) => item.lineKey === cartLineKey);
    const existingQuantity = Number(existingItem?.quantity) || 0;
    const nextQuantity = Math.min(existingQuantity + quantity, maxQuantity);
    const quantityToAdd = nextQuantity - existingQuantity;

    if (quantityToAdd < 1) {
      setSelectionErrorVisible(false);
      setCartDrawerOpen(true);
      return;
    }

    try {
      await addItem({
        lineKey: cartLineKey,
        productId: product.id,
        variationId: selectedVariation?.id || null,
        sku: selectedVariation?.sku || product?.sku || '',
        name: product.name,
        price: itemPrice,
        image: itemImage,
        quantity: quantityToAdd,
        size: selectedSize,
        color: selectedColor,
      });
      setSelectionErrorVisible(false);
      notifySuccess('Added to cart', {
        description: `${product.name} is ready in your cart.`,
        id: ADD_TO_CART_TOAST_ID,
        duration: 2200,
      });
      trackTikTokAddToCart({
        contentId: getTikTokContentId({ productId: product.id, variationId: selectedVariation?.id || null }),
        contentName: product?.name || '',
        quantity: quantityToAdd,
        unitPrice: itemPrice,
        value: itemPrice * quantityToAdd,
        currency: 'USD',
      });
      trackMetaAddToCart({
        contentId: getMetaContentId({ productId: product.id, variationId: selectedVariation?.id || null, sku: selectedVariation?.sku || product?.sku || '' }),
        contentName: product?.name || '',
        quantity: quantityToAdd,
        unitPrice: itemPrice,
        value: itemPrice * quantityToAdd,
        currency: 'USD',
      });
      setCartDrawerOpen(true);
    } catch (error) {
      notifyError('Unable to add this item', error.message || 'Please try again.');
    }
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
                <div className="flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                  {[1, 2, 3, 4].map((item) => (
                    <Skeleton key={item} className="h-20 w-20 shrink-0 rounded-lg" />
                  ))}
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

      <main className="overflow-x-hidden py-12 pb-28 md:pb-20">
        <div className="container-custom">
          <Link
            to="/shop"
            className="mb-8 inline-flex items-center text-sm text-muted-foreground transition-colors duration-200 hover:text-primary"
          >
            <ChevronLeft className="mr-1 h-4 w-4" />
            Back to shop
          </Link>

          <div className="grid min-w-0 gap-8 md:grid-cols-2 lg:grid-cols-[minmax(18rem,0.78fr)_minmax(0,1.55fr)] lg:items-start lg:gap-16">
            <section className="order-1 min-w-0 md:col-start-2 lg:pr-4">
              <h1
                className="break-words text-3xl font-bold text-balance md:text-4xl"
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

              <ProductRatingStars className="mt-3" starClassName="h-4 w-4" showLabel label="5.0 rating" />

              <p className="mt-3 text-sm font-medium text-muted-foreground">
                {availabilityText}
              </p>
            </section>

            <section className="order-2 mx-auto w-full min-w-0 max-w-[30rem] md:col-start-1 md:row-start-1 md:row-span-3 lg:max-w-[24rem] xl:max-w-[26rem]">
              <div className="mb-3 aspect-[4/5] max-h-[32rem] w-full max-w-full overflow-hidden rounded-xl bg-muted sm:aspect-square md:aspect-[4/5]">
                <img
                  src={images[selectedImage] || 'https://images.unsplash.com/photo-1618815909724-861120595390'}
                  alt={product.name}
                  className="h-full w-full object-cover"
                />
              </div>

              {images.length > 1 && (
                <div className="flex w-full max-w-full gap-2.5 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                  {images.map((img, index) => (
                    <button
                      key={`${img}-${index}`}
                      type="button"
                      onClick={() => setSelectedImage(index)}
                      className={`h-20 w-20 shrink-0 overflow-hidden rounded-lg border-2 bg-muted transition-all duration-200 ${
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
              <div className="min-w-0 overflow-hidden rounded-2xl border border-border/70 bg-background/95 p-5 shadow-sm backdrop-blur lg:sticky lg:top-24">
                {hasRealVariationData && (
                  <div className="mb-4 flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-sm font-semibold">Choose your options</p>
                      <p className="text-xs text-muted-foreground">Select an available color and size before adding to cart.</p>
                    </div>
                    <button
                      type="button"
                      onClick={handleClearSelections}
                      disabled={!canClearSelections}
                      className="shrink-0 text-sm font-semibold text-primary transition-colors duration-200 hover:text-primary/80 disabled:cursor-not-allowed disabled:text-muted-foreground"
                    >
                      Clear
                    </button>
                  </div>
                )}

                <div className="space-y-5">
                  {colorOptions.length > 0 && (
                    <div>
                      <label className={`mb-2 block text-sm font-semibold ${selectionErrorVisible && !selectedColor ? 'text-destructive' : ''}`}>Color</label>
                      <div className={`grid grid-cols-2 gap-2 rounded-xl transition-colors sm:grid-cols-3 ${selectionErrorVisible && !selectedColor ? 'border border-destructive/40 bg-destructive/5 p-2' : ''}`}>
                        {colorOptions.map((option) => {
                          const isSelected = selectedColor === option.label;

                          return (
                            <button
                              key={option.label}
                              type="button"
                              disabled={option.disabled}
                              onClick={() => {
                                setSelectedColor(option.label);
                                setSelectionErrorVisible(false);
                              }}
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

                  {sizeOptions.length > 0 && (
                    <div>
                      <div className="mb-2 flex items-center justify-between gap-3">
                        <label className={`block text-sm font-semibold ${selectionErrorVisible && !selectedSize ? 'text-destructive' : ''}`}>Size</label>
                        <SizeGuideDialog />
                      </div>
                      <div className={`flex flex-wrap gap-2 rounded-xl transition-colors ${selectionErrorVisible && !selectedSize ? 'border border-destructive/40 bg-destructive/5 p-2' : ''}`}>
                        {sizeOptions.map((option) => {
                          const isSelected = selectedSize === option.label;

                          return (
                            <button
                              key={option.label}
                              type="button"
                              disabled={option.disabled}
                              onClick={() => {
                                setSelectedSize(option.label);
                                setSelectionErrorVisible(false);
                              }}
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

                  {selectionErrorVisible && missingSelections.length > 0 && (
                    <p className="text-sm text-destructive">
                      Select {missingSelectionLabel} to continue.
                    </p>
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

                <div className="mt-5 grid grid-cols-2 justify-items-center gap-3 sm:grid-cols-4 md:grid-cols-4">
                  {TRUST_BADGES.map((text) => (
                    <div
                      key={text}
                      className="grid aspect-square w-full max-w-[5.9rem] place-items-center rounded-full bg-primary p-1 [clip-path:polygon(50%_0%,56%_7%,63%_2%,68%_10%,76%_6%,80%_15%,89%_14%,91%_24%,98%_31%,93%_39%,100%_50%,93%_61%,98%_69%,91%_76%,89%_86%,80%_85%,76%_94%,68%_90%,63%_98%,56%_93%,50%_100%,44%_93%,37%_98%,32%_90%,24%_94%,20%_85%,11%_86%,9%_76%,2%_69%,7%_61%,0%_50%,7%_39%,2%_31%,9%_24%,11%_14%,20%_15%,24%_6%,32%_10%,37%_2%,44%_7%)]"
                    >
                      <div className="grid h-full w-full place-items-center rounded-full border border-primary/30 bg-background px-1.5 text-center shadow-sm">
                        <span className="text-[0.62rem] font-semibold uppercase leading-tight tracking-[0.1em] text-foreground">
                          {text}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>

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
                  <div className="overflow-x-auto">
                    <div
                      className="space-y-4 leading-relaxed text-muted-foreground [&_a]:text-primary [&_a]:underline [&_a]:underline-offset-4 [&_blockquote]:border-l-2 [&_blockquote]:border-border/60 [&_blockquote]:pl-4 [&_blockquote]:text-muted-foreground [&_caption]:text-left [&_caption]:text-sm [&_caption]:text-muted-foreground [&_h1]:text-lg [&_h1]:font-semibold [&_h1]:text-foreground [&_h2]:text-lg [&_h2]:font-semibold [&_h2]:text-foreground [&_h3]:text-base [&_h3]:font-semibold [&_h3]:text-foreground [&_h4]:text-base [&_h4]:font-semibold [&_h4]:text-foreground [&_h5]:text-sm [&_h5]:font-semibold [&_h5]:text-foreground [&_h6]:text-sm [&_h6]:font-semibold [&_h6]:text-foreground [&_hr]:border-border/60 [&_li]:mb-1 [&_ol]:list-decimal [&_ol]:pl-5 [&_p]:mb-4 [&_strong]:font-semibold [&_table]:w-full [&_table]:min-w-[520px] [&_table]:border-collapse [&_table]:text-sm [&_td]:border [&_td]:border-border/60 [&_td]:px-3 [&_td]:py-2 [&_td]:align-top [&_th]:border [&_th]:border-border/60 [&_th]:bg-muted/40 [&_th]:px-3 [&_th]:py-2 [&_th]:text-left [&_th]:font-semibold [&_ul]:list-disc [&_ul]:pl-5"
                      dangerouslySetInnerHTML={{ __html: sanitizedDescriptionHtml }}
                    />
                  </div>
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
              <div className="grid grid-cols-2 gap-0.5 md:grid-cols-4 lg:gap-6">
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
                      <ProductRatingStars className="mb-2" showLabel />
                      <p className="font-semibold font-variant-tabular">${formatPrice(relatedProduct.price)}</p>
                    </div>
                  </Link>
                ))}
              </div>
            </section>
          )}
        </div>
      </main>

      <div className="fixed inset-x-0 bottom-0 z-40 overflow-x-clip border-t border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80 md:hidden">
        <div className="mx-auto flex w-full max-w-7xl min-w-0 items-center gap-2 px-4 py-3 sm:px-6">
          <div className="min-w-0 flex-1">
            <p className="truncate text-lg font-semibold font-variant-tabular">${formatPrice(displayPrice)}</p>
            <p className="text-xs text-muted-foreground">{availabilityText}</p>
          </div>
          <Button onClick={addToCart} size="lg" className="shrink-0 px-4 sm:px-5" disabled={!canAddToCart}>
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
