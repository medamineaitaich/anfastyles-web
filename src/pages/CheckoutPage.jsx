import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Helmet } from 'react-helmet';
import { useNavigate } from 'react-router-dom';
import { CreditCard, Truck, MapPin } from 'lucide-react';
import { CardElement, Elements, PaymentElement, useElements, useStripe } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import apiServerClient from '@/lib/apiServerClient';
import Header from '@/components/Header.jsx';
import Footer from '@/components/Footer.jsx';
import CartDrawer from '@/components/CartDrawer.jsx';

const PAYMENT_METHOD_META = {
  stripe: {
    label: 'Credit card',
    description: 'Visa, Mastercard, Amex',
  },
  woocommerce_payments: {
    label: 'WooPayments',
    description: 'Available from WooCommerce',
  },
  cod: {
    label: 'Cash on delivery',
    description: 'Pay when your order arrives',
  },
};

const getPaymentMethodLabel = (method) => PAYMENT_METHOD_META[method]?.label || String(method || '')
  .replace(/[_-]+/g, ' ')
  .replace(/\b\w/g, (char) => char.toUpperCase());

const getPaymentMethodDescription = (method) => PAYMENT_METHOD_META[method]?.description || 'Available payment method';

const toMinorAmount = (value) => {
  const amount = Number(value);
  if (!Number.isFinite(amount)) return 0;
  return Math.max(0, Math.round(amount * 100));
};

const normalizeWooPaymentsLocale = (value) => {
  const locale = String(value || '').trim();
  if (!locale) return undefined;
  return locale.replace('_', '-');
};

const extractCheckoutErrorMessage = (checkoutData, fallback = 'Payment failed') => {
  const details = Array.isArray(checkoutData?.payment_result?.payment_details)
    ? checkoutData.payment_result.payment_details
    : [];
  const detailMessage = details.find((entry) => entry?.key === 'message')?.value;

  return (
    detailMessage ||
    checkoutData?.payment_result?.error_message ||
    checkoutData?.message ||
    fallback
  );
};

const sectionCardClassName = 'bg-card border border-border/60 rounded-2xl p-5 md:p-6';
const optionListClassName = 'mt-1 overflow-hidden rounded-xl border border-border/60 bg-background/40';
const paymentPanelClassName = 'mt-4 rounded-xl bg-muted/30 p-3 md:mt-5 md:p-5';

const StripeElementsBridge = ({ onChange }) => {
  const stripe = useStripe();
  const elements = useElements();

  useEffect(() => {
    onChange({ stripe, elements });

    return () => {
      onChange({ stripe: null, elements: null });
    };
  }, [elements, onChange, stripe]);

  return null;
};

const normalizePaymentMethods = (methods) => {
  if (!Array.isArray(methods)) return [];

  const supportedFirst = ['stripe', 'woocommerce_payments', 'cod'];
  const filtered = methods
    .map((method) => String(method || '').trim())
    .filter(Boolean);

  const unique = [...new Set(filtered)];
  const ordered = [
    ...supportedFirst.filter((method) => unique.includes(method)),
    ...unique.filter((method) => !supportedFirst.includes(method)),
  ];

  return ordered;
};

const CheckoutPage = () => {
  const navigate = useNavigate();
  const [cart, setCart] = useState({ items: [], subtotal: 0 });
  const [loading, setLoading] = useState(false);
  const [cartDrawerOpen, setCartDrawerOpen] = useState(false);
  const [availablePaymentMethods, setAvailablePaymentMethods] = useState(['stripe']);
  const [paymentMethodsLoading, setPaymentMethodsLoading] = useState(true);
  const [wooPaymentsConfig, setWooPaymentsConfig] = useState(null);
  const [wooPaymentsConfigError, setWooPaymentsConfigError] = useState('');
  const [stripeCheckoutContext, setStripeCheckoutContext] = useState({ stripe: null, elements: null });
  const [wooPaymentsCheckoutContext, setWooPaymentsCheckoutContext] = useState({ stripe: null, elements: null });

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    state: '',
    zip: '',
    country: 'US',
    shippingMethod: 'standard',
    paymentMethod: 'stripe'
  });

  const [errors, setErrors] = useState({});
  const envStripePublishableKey = import.meta?.env?.VITE_STRIPE_PUBLISHABLE_KEY;
  const [stripePublishableKey, setStripePublishableKey] = useState(import.meta.env.DEV ? (envStripePublishableKey || '') : '');
  const wpBaseUrl = String(import.meta?.env?.VITE_WP_BASE_URL || 'https://wp.anfastyles.shop').replace(/\/+$/, '');

  useEffect(() => {
    let cancelled = false;

    const loadStripeKey = async () => {
      try {
        const res = await apiServerClient.fetch('/payments/stripe/publishable-key');
        const json = await res.json().catch(() => null);
        if (!res.ok) return;
        const key = String(json?.publishableKey || '').trim();
        if (!key) return;
        if (!cancelled) setStripePublishableKey(key);
      } catch {
        // Fallback to env key.
      }
    };

    loadStripeKey();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    const savedCart = JSON.parse(localStorage.getItem('anfaCart') || '{"items":[],"subtotal":0}');
    if (savedCart.items.length === 0) {
      navigate('/cart');
    }
    setCart(savedCart);
  }, [navigate]);

  useEffect(() => {
    let cancelled = false;

    const loadPaymentMethods = async () => {
      try {
        setPaymentMethodsLoading(true);
        const res = await apiServerClient.fetch('/store/cart');
        const json = await res.json().catch(() => null);
        const methods = normalizePaymentMethods(json?.data?.payment_methods);
        const nextMethods = methods.length > 0 ? methods : ['stripe'];

        if (cancelled) return;

        setAvailablePaymentMethods(nextMethods);
        setFormData((prev) => ({
          ...prev,
          paymentMethod: nextMethods.includes(prev.paymentMethod) ? prev.paymentMethod : nextMethods[0],
        }));
      } catch {
        if (!cancelled) {
          setAvailablePaymentMethods(['stripe']);
        }
      } finally {
        if (!cancelled) {
          setPaymentMethodsLoading(false);
        }
      }
    };

    loadPaymentMethods();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;

    const loadWooPaymentsConfig = async () => {
      if (!availablePaymentMethods.includes('woocommerce_payments')) {
        if (!cancelled) {
          setWooPaymentsConfig(null);
          setWooPaymentsConfigError('');
        }
        return;
      }

      const parseConfigResponse = async (response) => {
        const json = await response.json().catch(() => null);
        if (!response.ok) {
          const message =
            json?.details?.message ||
            json?.error ||
            json?.message ||
            'Failed to load WooPayments checkout config.';
          throw new Error(message);
        }

        if (!json?.ok || !json?.isReady || !json?.config?.publishableKey) {
          throw new Error('WooPayments checkout config is not ready.');
        }

        return json;
      };

      try {
        setWooPaymentsConfigError('');

        let config = null;

        try {
          const apiResponse = await apiServerClient.fetch('/payments/woopayments/config');
          config = await parseConfigResponse(apiResponse);
        } catch (apiError) {
          const directResponse = await fetch(`${wpBaseUrl}/wp-json/anfastyles/v1/woopayments-config`);
          config = await parseConfigResponse(directResponse);
          if (!cancelled) {
            console.warn('WooPayments config loaded from WordPress bridge fallback:', apiError);
          }
        }

        if (!cancelled) {
          setWooPaymentsConfig(config);
        }
      } catch (error) {
        if (!cancelled) {
          setWooPaymentsConfig(null);
          setWooPaymentsConfigError(error.message || 'Failed to load WooPayments checkout config.');
        }
      }
    };

    loadWooPaymentsConfig();

    return () => {
      cancelled = true;
    };
  }, [availablePaymentMethods, wpBaseUrl]);

  const stripePromise = useMemo(() => {
    if (!stripePublishableKey) return null;
    return loadStripe(String(stripePublishableKey).trim());
  }, [stripePublishableKey]);

  const wooPaymentsStripePromise = useMemo(() => {
    const publishableKey = String(wooPaymentsConfig?.config?.publishableKey || '').trim();
    if (!publishableKey) return null;

    const stripeOptions = {};
    const locale = normalizeWooPaymentsLocale(wooPaymentsConfig?.blocksData?.locale || wooPaymentsConfig?.config?.locale);
    const accountId = String(wooPaymentsConfig?.config?.accountId || '').trim();

    if (locale) stripeOptions.locale = locale;
    if (accountId) stripeOptions.stripeAccount = accountId;

    return loadStripe(publishableKey, Object.keys(stripeOptions).length > 0 ? stripeOptions : undefined);
  }, [wooPaymentsConfig]);

  const handleStripeContextChange = useCallback((nextContext) => {
    setStripeCheckoutContext((prev) => (
      prev.stripe === nextContext?.stripe && prev.elements === nextContext?.elements
        ? prev
        : {
          stripe: nextContext?.stripe || null,
          elements: nextContext?.elements || null,
        }
    ));
  }, []);

  const handleWooPaymentsContextChange = useCallback((nextContext) => {
    setWooPaymentsCheckoutContext((prev) => (
      prev.stripe === nextContext?.stripe && prev.elements === nextContext?.elements
        ? prev
        : {
          stripe: nextContext?.stripe || null,
          elements: nextContext?.elements || null,
        }
    ));
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validateCheckoutForm = () => {
    const newErrors = {};
    if (!formData.firstName.trim()) newErrors.firstName = 'First name is required';
    if (!formData.lastName.trim()) newErrors.lastName = 'Last name is required';
    if (!formData.email.trim()) newErrors.email = 'Email is required';
    if (!formData.address.trim()) newErrors.address = 'Address is required';
    if (!formData.city.trim()) newErrors.city = 'City is required';
    if (!formData.state.trim()) newErrors.state = 'State is required';
    if (!formData.zip.trim()) newErrors.zip = 'ZIP code is required';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handlePlaceOrder = async ({ stripe, elements } = {}) => {
    if (!validateCheckoutForm()) {
      toast.error('Please fill in all required fields');
      return;
    }

    setLoading(true);
    try {
      let paymentData = null;
      let paymentMethodGateway = formData.paymentMethod;
      const storeFetch = async (path, { method = 'GET', body, store } = {}) => {
        const headers = { 'Content-Type': 'application/json' };
        if (store?.nonce) headers['x-store-nonce'] = store.nonce;
        if (store?.cartToken) headers['x-store-cart-token'] = store.cartToken;

        const res = await apiServerClient.fetch(`/store${path}`, {
          method,
          headers,
          body: body ? JSON.stringify(body) : undefined,
        });

        const json = await res.json().catch(() => null);
        if (!res.ok) {
          const message =
            json?.details?.message ||
            json?.details?.error ||
            json?.error ||
            json?.message ||
            'Store checkout failed';
          const err = new Error(message);
          err.details = json;
          throw err;
        }

        return json;
      };
      const normalize = (v) => String(v || '').trim().toLowerCase();
      const resolveVariationId = async (cartItem) => {
        if (!cartItem?.productId) throw new Error('Missing productId in cart item');
        if (Number.isFinite(Number(cartItem.variationId))) return Number(cartItem.variationId);

        const productRes = await storeFetch(`/products/${cartItem.productId}`);
        const variations = productRes?.data?.variations || [];

        const color = normalize(cartItem.color);
        const size = normalize(cartItem.size);

        const match = variations.find((v) => {
          const attrs = Array.isArray(v?.attributes) ? v.attributes : [];
          const getAttr = (name) => attrs.find((a) => normalize(a?.name) === normalize(name))?.value;
          const vColor = normalize(getAttr('Colors'));
          const vSize = normalize(getAttr('Sizes'));

          const colorOk = color ? vColor === color : true;
          const sizeOk = size ? vSize === size : true;
          return colorOk && sizeOk;
        });

        if (!match?.id) {
          throw new Error('Selected variant is unavailable. Please re-add the item to your cart.');
        }

        return Number(match.id);
      };
      const billing_address = {
        first_name: formData.firstName,
        last_name: formData.lastName,
        company: '',
        address_1: formData.address,
        address_2: '',
        city: formData.city,
        state: formData.state,
        postcode: formData.zip,
        country: formData.country,
        email: formData.email,
        phone: formData.phone || '',
      };
      const shipping_address = {
        first_name: formData.firstName,
        last_name: formData.lastName,
        company: '',
        address_1: formData.address,
        address_2: '',
        city: formData.city,
        state: formData.state,
        postcode: formData.zip,
        country: formData.country,
        phone: formData.phone || '',
      };

      const buildStoreCheckoutSession = async () => {
        let storeSession = (await storeFetch('/cart'))?.store;

        for (const cartItem of cart.items) {
          const variationId = await resolveVariationId(cartItem);
          const added = await storeFetch('/cart/add-item', {
            method: 'POST',
            store: storeSession,
            body: { id: variationId, quantity: cartItem.quantity },
          });
          storeSession = added?.store || storeSession;
        }

        const updated = await storeFetch('/cart/update-customer', {
          method: 'POST',
          store: storeSession,
          body: { billing_address, shipping_address },
        });

        return updated?.store || storeSession;
      };
      const finalizeStoreCheckout = async (checkoutRes) => {
        const checkoutData = checkoutRes?.data;
        const paymentStatus = checkoutData?.payment_result?.payment_status;
        if (paymentStatus !== 'success') {
          throw new Error(extractCheckoutErrorMessage(checkoutData));
        }

        localStorage.setItem('anfaCart', JSON.stringify({ items: [], subtotal: 0, itemCount: 0 }));
        window.dispatchEvent(new Event('cartUpdated'));

        navigate(`/order-confirmation?orderId=${checkoutData.order_id}&orderNumber=${checkoutData.order_number || checkoutData.order_id}`);
      };

      if (formData.paymentMethod === 'stripe') {
        if (!stripe || !elements) {
          throw new Error('Payment form is not ready. Please refresh the page and try again.');
        }

        const cardElement = elements.getElement(CardElement);
        if (!cardElement) {
          throw new Error('Payment form is not ready. Please refresh the page and try again.');
        }

        if (!stripePublishableKey) {
          throw new Error('Stripe is not configured for checkout.');
        }

        const storeSession = await buildStoreCheckoutSession();

        // 4) Create a Stripe PaymentMethod (Stripe.js v3+; createSource is not supported in newer Stripe.js builds).
        const { error: paymentMethodError, paymentMethod } = await stripe.createPaymentMethod({
          type: 'card',
          card: cardElement,
          billing_details: {
            name: `${formData.firstName} ${formData.lastName}`.trim(),
            email: formData.email,
            phone: formData.phone || undefined,
            address: {
              line1: formData.address,
              city: formData.city,
              state: formData.state,
              postal_code: formData.zip,
              country: formData.country,
            },
          },
        });
        if (paymentMethodError) {
          throw new Error(paymentMethodError.message || 'Card details are invalid');
        }
        if (!paymentMethod?.id) {
          throw new Error('Payment configuration error. Missing Stripe payment method.');
        }

        paymentMethodGateway = 'stripe';
        paymentData = {
          provider: 'stripe',
          stripePaymentMethodId: paymentMethod.id,
        };

        const checkoutRes = await storeFetch('/checkout', {
          method: 'POST',
          store: storeSession,
          body: {
            billing_address,
            shipping_address,
            payment_method: 'stripe',
            payment_data: [
              { key: 'billing_email', value: formData.email },
              { key: 'billing_first_name', value: formData.firstName },
              { key: 'billing_last_name', value: formData.lastName },
              { key: 'payment_method', value: 'stripe' },
              { key: 'wc-stripe-payment-method', value: paymentMethod.id },
              { key: 'wc-stripe-is-deferred-intent', value: true },
            ],
          },
        });
        await finalizeStoreCheckout(checkoutRes);
        return;
      }

      if (formData.paymentMethod === 'cod') {
        const storeSession = await buildStoreCheckoutSession();
        const checkoutRes = await storeFetch('/checkout', {
          method: 'POST',
          store: storeSession,
          body: {
            billing_address,
            shipping_address,
            payment_method: 'cod',
            payment_data: [
              { key: 'payment_method', value: 'cod' },
            ],
          },
        });

        await finalizeStoreCheckout(checkoutRes);
        return;
      }

      if (formData.paymentMethod === 'woocommerce_payments') {
        if (!stripe || !elements) {
          throw new Error('WooPayments is still loading. Please wait a moment and try again.');
        }

        if (!wooPaymentsConfig?.config?.publishableKey) {
          throw new Error(wooPaymentsConfigError || 'WooPayments is not configured for checkout.');
        }

        const submitResult = await elements.submit();
        if (submitResult?.error) {
          throw new Error(submitResult.error.message || 'Invalid payment details.');
        }

        const { error: paymentMethodError, paymentMethod } = await stripe.createPaymentMethod({
          elements,
          params: {
            billing_details: {
              name: `${formData.firstName} ${formData.lastName}`.trim(),
              email: formData.email,
              phone: formData.phone || undefined,
              address: {
                line1: formData.address,
                city: formData.city,
                state: formData.state,
                postal_code: formData.zip,
                country: formData.country,
              },
            },
          },
        });

        if (paymentMethodError) {
          const fallbackMessage = wooPaymentsConfig?.config?.genericErrorMessage || 'Unable to process WooPayments payment details.';
          throw new Error(paymentMethodError.message || fallbackMessage);
        }

        if (!paymentMethod?.id) {
          throw new Error('WooPayments did not return a payment method.');
        }

        const storeSession = await buildStoreCheckoutSession();
        const checkoutRes = await storeFetch('/checkout', {
          method: 'POST',
          store: storeSession,
          body: {
            billing_address,
            shipping_address,
            payment_method: 'woocommerce_payments',
            payment_data: [
              { key: 'payment_method', value: 'card' },
              { key: 'wcpay-payment-method', value: paymentMethod.id },
              { key: 'wcpay-fraud-prevention-token', value: String(window?.wcpayFraudPreventionToken || '') },
              { key: 'wcpay-fingerprint', value: '' },
            ],
          },
        });

        await finalizeStoreCheckout(checkoutRes);
        return;
      }

      const orderData = {
        cartItems: cart.items.map(item => ({
          productId: item.productId,
          quantity: item.quantity,
          price: parseFloat(item.price)
        })),
        customerInfo: {
          firstName: formData.firstName,
          lastName: formData.lastName,
          email: formData.email,
          phone: formData.phone,
          address: formData.address,
          city: formData.city,
          state: formData.state,
          zip: formData.zip,
          country: formData.country
        },
        shippingMethod: formData.shippingMethod,
        paymentMethod: paymentMethodGateway,
        paymentData
      };

      const response = await apiServerClient.fetch('/orders/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(orderData)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Order creation failed');
      }

      const data = await response.json();
      
      localStorage.setItem('anfaCart', JSON.stringify({ items: [], subtotal: 0, itemCount: 0 }));
      window.dispatchEvent(new Event('cartUpdated'));
      
      navigate(`/order-confirmation?orderId=${data.orderId}&orderNumber=${data.orderNumber}`);
    } catch (error) {
      console.error('Order creation error:', error);
      toast.error(error.message || 'Failed to place order');
    } finally {
      setLoading(false);
    }
  };

  const shippingCost = cart.subtotal >= 75 ? 0 : 10;
  const tax = cart.subtotal * 0.08;
  const total = cart.subtotal + shippingCost + tax;
  const wooPaymentsElementsOptions = useMemo(() => {
    if (!wooPaymentsConfig?.config?.publishableKey) return null;

    return {
      mode: total > 0 ? 'payment' : 'setup',
      amount: toMinorAmount(total),
      currency: String(wooPaymentsConfig?.config?.currency || wooPaymentsConfig?.blocksData?.currency || 'usd').trim().toLowerCase(),
      paymentMethodCreation: 'manual',
      paymentMethodTypes: ['card'],
    };
  }, [total, wooPaymentsConfig]);

  const currentPaymentContext = formData.paymentMethod === 'woocommerce_payments'
    ? wooPaymentsCheckoutContext
    : stripeCheckoutContext;

  const placeOrderDisabled = loading
    || paymentMethodsLoading
    || cart.items.length === 0
    || (formData.paymentMethod === 'stripe' && (!stripePublishableKey || !currentPaymentContext?.stripe || !currentPaymentContext?.elements))
    || (formData.paymentMethod === 'woocommerce_payments' && (
      !!wooPaymentsConfigError
      || !wooPaymentsStripePromise
      || !wooPaymentsElementsOptions
      || !currentPaymentContext?.stripe
      || !currentPaymentContext?.elements
    ));

  const handleCheckoutSubmit = () => handlePlaceOrder({
    stripe: currentPaymentContext?.stripe || undefined,
    elements: currentPaymentContext?.elements || undefined,
  });

  return (
    <>
      <Helmet>
        <title>Checkout - AnfaStyles</title>
        <meta name="description" content="Complete your order" />
      </Helmet>

      <Header onCartClick={() => setCartDrawerOpen(true)} />
      <CartDrawer open={cartDrawerOpen} onClose={() => setCartDrawerOpen(false)} />

      <main className="py-8 pb-28 overflow-x-hidden md:py-12 md:pb-12">
        <div className="container-custom max-w-5xl">
          <h1 className="text-4xl md:text-5xl font-bold mb-3 text-balance" style={{ letterSpacing: '-0.02em' }}>
            Checkout
          </h1>
          <p className="mb-8 max-w-2xl text-sm text-muted-foreground md:text-base">
            Complete your details, choose a delivery option, and finish payment in one place.
          </p>

          <div className="grid gap-6 lg:grid-cols-3 lg:gap-8">
            <div className="lg:col-span-2 space-y-6">
              <div className={sectionCardClassName}>
                  <div className="mb-6 flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                      <MapPin className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <h2 className="text-xl font-bold">Contact & billing</h2>
                      <p className="text-sm text-muted-foreground">We’ll use these details for your order and delivery.</p>
                    </div>
                  </div>

                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="firstName">First name *</Label>
                      <Input
                        id="firstName"
                        name="firstName"
                        value={formData.firstName}
                        onChange={handleInputChange}
                        className={errors.firstName ? 'border-destructive' : ''}
                      />
                      {errors.firstName && <p className="text-sm text-destructive mt-1">{errors.firstName}</p>}
                    </div>

                    <div>
                      <Label htmlFor="lastName">Last name *</Label>
                      <Input
                        id="lastName"
                        name="lastName"
                        value={formData.lastName}
                        onChange={handleInputChange}
                        className={errors.lastName ? 'border-destructive' : ''}
                      />
                      {errors.lastName && <p className="text-sm text-destructive mt-1">{errors.lastName}</p>}
                    </div>

                    <div>
                      <Label htmlFor="email">Email *</Label>
                      <Input
                        id="email"
                        name="email"
                        type="email"
                        value={formData.email}
                        onChange={handleInputChange}
                        className={errors.email ? 'border-destructive' : ''}
                      />
                      {errors.email && <p className="text-sm text-destructive mt-1">{errors.email}</p>}
                    </div>

                    <div>
                      <Label htmlFor="phone">Phone</Label>
                      <Input
                        id="phone"
                        name="phone"
                        type="tel"
                        value={formData.phone}
                        onChange={handleInputChange}
                      />
                    </div>

                    <div className="md:col-span-2">
                      <Label htmlFor="address">Address *</Label>
                      <Input
                        id="address"
                        name="address"
                        value={formData.address}
                        onChange={handleInputChange}
                        className={errors.address ? 'border-destructive' : ''}
                      />
                      {errors.address && <p className="text-sm text-destructive mt-1">{errors.address}</p>}
                    </div>

                    <div>
                      <Label htmlFor="city">City *</Label>
                      <Input
                        id="city"
                        name="city"
                        value={formData.city}
                        onChange={handleInputChange}
                        className={errors.city ? 'border-destructive' : ''}
                      />
                      {errors.city && <p className="text-sm text-destructive mt-1">{errors.city}</p>}
                    </div>

                    <div>
                      <Label htmlFor="state">State *</Label>
                      <Input
                        id="state"
                        name="state"
                        value={formData.state}
                        onChange={handleInputChange}
                        className={errors.state ? 'border-destructive' : ''}
                      />
                      {errors.state && <p className="text-sm text-destructive mt-1">{errors.state}</p>}
                    </div>

                    <div>
                      <Label htmlFor="zip">ZIP code *</Label>
                      <Input
                        id="zip"
                        name="zip"
                        value={formData.zip}
                        onChange={handleInputChange}
                        className={errors.zip ? 'border-destructive' : ''}
                      />
                      {errors.zip && <p className="text-sm text-destructive mt-1">{errors.zip}</p>}
                    </div>

                    <div>
                      <Label htmlFor="country">Country</Label>
                      <Select value={formData.country} onValueChange={(value) => setFormData(prev => ({ ...prev, country: value }))}>
                        <SelectTrigger id="country">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="US">United States</SelectItem>
                          <SelectItem value="CA">Canada</SelectItem>
                          <SelectItem value="UK">United Kingdom</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                </div>

              <div className={sectionCardClassName}>
                  <div className="mb-6 flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                      <Truck className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <h2 className="text-xl font-bold">Shipping method</h2>
                      <p className="text-sm text-muted-foreground">Choose how quickly you’d like to receive your order.</p>
                    </div>
                  </div>

                  <RadioGroup value={formData.shippingMethod} onValueChange={(value) => setFormData(prev => ({ ...prev, shippingMethod: value }))}>
                    <div className={optionListClassName}>
                      <div className="flex items-start justify-between gap-3 px-4 py-3.5 sm:items-center">
                        <div className="flex min-w-0 items-start gap-3 sm:items-center">
                          <RadioGroupItem value="standard" id="standard" />
                          <Label htmlFor="standard" className="cursor-pointer break-words">
                            <p className="font-semibold">Standard shipping</p>
                            <p className="text-sm text-muted-foreground">5-7 business days</p>
                          </Label>
                        </div>
                        <span className="font-semibold shrink-0">{cart.subtotal >= 75 ? 'Free' : '$10.00'}</span>
                      </div>

                      <div className="flex items-start justify-between gap-3 border-t border-border/60 px-4 py-3.5 sm:items-center">
                        <div className="flex min-w-0 items-start gap-3 sm:items-center">
                          <RadioGroupItem value="express" id="express" />
                          <Label htmlFor="express" className="cursor-pointer break-words">
                            <p className="font-semibold">Express shipping</p>
                            <p className="text-sm text-muted-foreground">2-3 business days</p>
                          </Label>
                        </div>
                        <span className="font-semibold shrink-0">$25.00</span>
                      </div>
                    </div>
                  </RadioGroup>

                </div>

              <div className={sectionCardClassName}>
                  <div className="mb-5 flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                      <CreditCard className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <h2 className="text-xl font-bold">Payment</h2>
                      <p className="text-sm text-muted-foreground">Choose a payment method and enter the required details.</p>
                    </div>
                  </div>

                   {paymentMethodsLoading ? (
                     <p className="text-sm text-muted-foreground">Loading payment methods...</p>
                   ) : (
                     <RadioGroup value={formData.paymentMethod} onValueChange={(value) => setFormData(prev => ({ ...prev, paymentMethod: value }))}>
                       <div className={optionListClassName}>
                         {availablePaymentMethods.map((method, index) => (
                           <div
                             key={method}
                             className={`flex items-start gap-3 px-4 py-3.5 ${
                               index > 0 ? 'border-t border-border/60' : ''
                             }`}
                           >
                             <RadioGroupItem value={method} id={method} />
                              <Label htmlFor={method} className="cursor-pointer break-words">
                                <p className="font-semibold">{getPaymentMethodLabel(method)}</p>
                                <p className="text-sm text-muted-foreground">{getPaymentMethodDescription(method)}</p>
                              </Label>
                           </div>
                         ))}
                       </div>
                     </RadioGroup>
                   )}

                   {formData.paymentMethod === 'stripe' && (
                     <div className="mt-5">
                       {!stripePublishableKey && (
                         <p className="text-sm text-destructive">Stripe is not configured for checkout.</p>
                      )}

                      {!!stripePromise && (
                        <Elements
                          stripe={stripePromise}
                        >
                          <StripeElementsBridge onChange={handleStripeContextChange} />
                          <div className={paymentPanelClassName}>
                            <Label className="cursor-default">Card details</Label>
                            <div className="mt-3 rounded-lg bg-background px-2 py-2.5 md:px-3 md:py-3">
                              <CardElement options={{ hidePostalCode: true }} />
                            </div>
                            <p className="text-xs text-muted-foreground mt-3">Test mode: use 4242 4242 4242 4242.</p>
                          </div>
                        </Elements>
                      )}

                      {!stripePromise && null}
                     </div>
                   )}

                   {formData.paymentMethod === 'cod' && (
                     <div className="mt-5">
                       <div className={paymentPanelClassName}>
                         <p className="font-semibold">Cash on delivery</p>
                         <p className="text-sm text-muted-foreground mt-1">Your order will be submitted with WooCommerce Cash on Delivery.</p>
                       </div>
                     </div>
                   )}

                   {formData.paymentMethod === 'woocommerce_payments' && (
                     <div className="mt-5">
                       {!!wooPaymentsConfigError && (
                         <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-4">
                           <p className="font-semibold">WooPayments unavailable</p>
                           <p className="text-sm text-muted-foreground mt-1">{wooPaymentsConfigError}</p>
                         </div>
                       )}

                       {!!wooPaymentsStripePromise && !!wooPaymentsElementsOptions && !wooPaymentsConfigError && (
                         <Elements stripe={wooPaymentsStripePromise} options={wooPaymentsElementsOptions}>
                           <StripeElementsBridge onChange={handleWooPaymentsContextChange} />
                           <div className={paymentPanelClassName}>
                             <Label className="cursor-default">Card details</Label>
                             <div className="mt-3 rounded-lg bg-background px-2 py-2.5 md:px-3 md:py-3">
                               <PaymentElement />
                             </div>
                             <p className="text-xs text-muted-foreground mt-3">Test mode: use 4242 4242 4242 4242.</p>
                           </div>
                         </Elements>
                       )}

                       {(!wooPaymentsStripePromise || !wooPaymentsElementsOptions) && !wooPaymentsConfigError && (
                         <div className={paymentPanelClassName}>
                           <p className="font-semibold">WooPayments</p>
                           <p className="text-sm text-muted-foreground mt-1">Loading secure WooPayments form...</p>
                         </div>
                       )}

                       {!!wooPaymentsConfigError && null}
                     </div>
                   )}
                 </div>
            </div>

            <div className="lg:col-span-1">
              <div className="sticky top-24 rounded-2xl border border-border/60 bg-card p-5 md:p-6">
                <h2 className="text-xl font-bold mb-4">Order summary</h2>

                {cart.items.length > 0 && (
                  <div className="space-y-4 mb-6">
                    {cart.items.map((item) => {
                      const unitPrice = parseFloat(item.price) || 0;
                      const lineTotal = unitPrice * item.quantity;

                      return (
                        <div key={`${item.productId}-${item.size || ''}-${item.color || ''}`} className="flex gap-3">
                          <img
                            src={item.image || 'https://images.unsplash.com/photo-1618815909724-861120595390'}
                            alt={item.name || 'Cart item'}
                            className="w-12 h-12 object-cover rounded-lg bg-muted"
                          />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">{item.name || 'Item'}</p>
                            <p className="text-xs text-muted-foreground">Qty: {item.quantity}</p>
                          </div>
                          <p className="text-sm font-semibold font-variant-tabular">${lineTotal.toFixed(2)}</p>
                        </div>
                      );
                    })}
                  </div>
                )}
                
                <div className="space-y-3 mb-4">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Subtotal</span>
                    <span className="font-semibold font-variant-tabular">${cart.subtotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Shipping</span>
                    <span className="font-semibold font-variant-tabular">
                      {shippingCost === 0 ? 'Free' : `$${shippingCost.toFixed(2)}`}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Tax</span>
                    <span className="font-semibold font-variant-tabular">${tax.toFixed(2)}</span>
                  </div>
                </div>

                <Separator className="my-4" />

                <div className="flex justify-between mb-4">
                  <span className="font-bold">Total</span>
                  <span className="font-bold text-xl font-variant-tabular">${total.toFixed(2)}</span>
                </div>

                <Button
                  onClick={handleCheckoutSubmit}
                  disabled={placeOrderDisabled}
                  size="lg"
                  className="hidden w-full md:inline-flex"
                >
                  {loading ? 'Processing...' : 'Place order'}
                </Button>

                <div className="mt-4 text-xs text-muted-foreground">
                  <p>By placing this order, you agree to our Terms of Service and Privacy Policy.</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="fixed inset-x-0 bottom-0 z-40 border-t border-border/70 bg-background/95 px-4 py-3 backdrop-blur md:hidden">
          <div className="mx-auto flex max-w-5xl items-center gap-3">
            <div className="min-w-0 flex-1">
              <p className="text-xs uppercase tracking-wide text-muted-foreground">Total</p>
              <p className="text-lg font-bold font-variant-tabular">${total.toFixed(2)}</p>
            </div>
            <Button
              onClick={handleCheckoutSubmit}
              disabled={placeOrderDisabled}
              size="lg"
              className="min-w-[152px] sm:min-w-[170px]"
            >
              {loading ? 'Processing...' : 'Place order'}
            </Button>
          </div>
        </div>
      </main>

      <Footer />
    </>
  );
};


export default CheckoutPage;
