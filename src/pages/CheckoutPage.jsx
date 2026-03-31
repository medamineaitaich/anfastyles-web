import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Helmet } from 'react-helmet';
import { useNavigate } from 'react-router-dom';
import { CreditCard, Truck, MapPin } from 'lucide-react';
import { CardElement, Elements, PaymentElement, useElements, useStripe } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Separator } from '@/components/ui/separator';
import { useAuth } from '@/contexts/AuthContext.jsx';
import apiServerClient from '@/lib/apiServerClient';
import { readCheckoutProfile, saveCheckoutProfile } from '@/lib/checkoutProfile.js';
import { notifyError, notifySuccess } from '@/lib/notifications.js';
import { normalizeOrderSummary, storeOrderSummary } from '@/lib/orderSummary.js';
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

const SUPPORTED_PAYMENT_METHODS = Object.keys(PAYMENT_METHOD_META);
const EXPRESS_SHIPPING_PATTERN = /express|expedited|priority|overnight|next[\s-]?day|2[\s-]?3/i;

const SHIPPING_METHOD_META = {
  standard: {
    label: 'Standard shipping',
    fallbackCost: (subtotal) => (subtotal >= 75 ? 0 : 10),
  },
  express: {
    label: 'Express shipping',
    fallbackCost: () => 25,
  },
};

const getPaymentMethodLabel = (method) => PAYMENT_METHOD_META[method]?.label || String(method || '')
  .replace(/[_-]+/g, ' ')
  .replace(/\b\w/g, (char) => char.toUpperCase());

const getPaymentMethodDescription = (method) => PAYMENT_METHOD_META[method]?.description || 'Available payment method';

const getShippingMethodLabel = (method) => SHIPPING_METHOD_META[method]?.label || getPaymentMethodLabel(method);

const toMinorAmount = (value) => {
  const amount = Number(value);
  if (!Number.isFinite(amount)) return 0;
  return Math.max(0, Math.round(amount * 100));
};

const fromMinorAmount = (value) => {
  const amount = Number(value);
  if (!Number.isFinite(amount)) return 0;
  return amount / 100;
};

const getShippingFallbackCost = (shippingMethod, subtotal) => {
  const subtotalAmount = Number(subtotal);
  const normalizedSubtotal = Number.isFinite(subtotalAmount) ? subtotalAmount : 0;
  const resolver = SHIPPING_METHOD_META[shippingMethod]?.fallbackCost;

  if (typeof resolver !== 'function') return 0;
  return resolver(normalizedSubtotal);
};

const getShippingRateText = (rate) => [
  rate?.rate_id,
  rate?.name,
  rate?.method_id,
  rate?.description,
  rate?.delivery_time,
].filter(Boolean).join(' ').toLowerCase();

const findShippingSelections = ({ shippingRates, shippingMethod, subtotal }) => {
  if (!Array.isArray(shippingRates) || shippingRates.length === 0) return [];

  const fallbackCostMinor = toMinorAmount(getShippingFallbackCost(shippingMethod, subtotal));

  const findRateForPackage = (pkg) => {
    const rates = Array.isArray(pkg?.shipping_rates) ? pkg.shipping_rates : [];
    if (rates.length === 0) return null;

    const normalizedRates = rates.map((rate) => ({
      rate,
      text: getShippingRateText(rate),
      priceMinor: Math.max(0, Math.round(Number(rate?.price || 0))),
    }));

    if (shippingMethod === 'express') {
      return normalizedRates.find(({ text }) => EXPRESS_SHIPPING_PATTERN.test(text))
        || normalizedRates.find(({ priceMinor }) => priceMinor === fallbackCostMinor)
        || null;
    }

    if (fallbackCostMinor === 0) {
      const freeRate = normalizedRates.find(({ rate, priceMinor, text }) => (
        priceMinor === 0
        || String(rate?.method_id || '').toLowerCase() === 'free_shipping'
        || text.includes('free')
      ));
      if (freeRate) return freeRate;
    }

    return normalizedRates.find(({ text }) => (
      !EXPRESS_SHIPPING_PATTERN.test(text)
      && (
        text.includes('standard')
        || text.includes('ground')
        || text.includes('flat')
        || text.includes('free')
      )
    ))
      || normalizedRates.find(({ priceMinor }) => priceMinor === fallbackCostMinor)
      || normalizedRates.find(({ text }) => !EXPRESS_SHIPPING_PATTERN.test(text))
      || null;
  };

  return shippingRates
    .map((pkg) => {
      const matchedRate = findRateForPackage(pkg);
      if (!matchedRate?.rate?.rate_id) return null;

      return {
        packageId: pkg.package_id,
        rateId: matchedRate.rate.rate_id,
        shippingCost: fromMinorAmount(matchedRate.rate.price),
        shippingTax: fromMinorAmount(matchedRate.rate.taxes),
      };
    })
    .filter(Boolean);
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
const paymentSectionCardClassName = 'bg-card border border-border/60 rounded-2xl p-4 md:p-6';
const paymentSectionHeaderClassName = 'mb-4 flex items-center gap-3 md:mb-5';
const paymentMethodListClassName = 'mt-0.5 overflow-hidden rounded-xl border border-border/60 bg-background/40 md:mt-1';
const paymentMethodOptionClassName = 'flex items-start gap-2.5 px-3 py-2.5 cursor-pointer md:gap-3 md:px-4 md:py-3.5';
const paymentSelectedWrapperClassName = 'mt-3 md:mt-5';
const paymentSelectedPanelClassName = 'rounded-xl bg-muted/30 p-2 md:p-5';
const paymentElementWrapperClassName = 'mt-1.5 rounded-lg bg-background px-1 py-1.5 md:mt-3 md:px-3 md:py-3';
const paymentHelperTextClassName = 'mt-1.5 text-xs text-muted-foreground md:mt-3';
const paymentErrorMessageClassName = 'mt-3 text-sm text-destructive md:mt-4';
const countryOptions = [
  { value: 'US', label: 'United States' },
  { value: 'CA', label: 'Canada' },
  { value: 'UK', label: 'United Kingdom' },
];

const createAddressFormState = (overrides = {}) => ({
  firstName: '',
  lastName: '',
  email: '',
  phone: '',
  address: '',
  city: '',
  state: '',
  zip: '',
  country: 'US',
  ...overrides,
});

const isValidEmail = (value) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(value || '').trim());

const splitFullName = (value) => {
  const parts = String(value || '').trim().split(/\s+/).filter(Boolean);
  return {
    firstName: parts[0] || '',
    lastName: parts.slice(1).join(' '),
  };
};

const mergeAddressFormValues = (currentValues, nextValues = {}) => {
  const merged = { ...currentValues };

  Object.entries(nextValues).forEach(([field, value]) => {
    const normalizedValue = field === 'country'
      ? String(value || '').trim().toUpperCase()
      : String(value || '').trim();

    if (!normalizedValue) return;
    if (String(currentValues?.[field] || '').trim()) return;

    merged[field] = normalizedValue;
  });

  return merged;
};

const getAddressErrorKey = (formKey, field) => `${formKey}.${field}`;
const getAccountErrorKey = (field) => `account.${field}`;

const AddressFields = ({
  formKey,
  values,
  errors,
  onFieldChange,
  onFieldBlur,
  onCountryChange,
  includeEmail,
}) => (
  <div className="grid gap-4 md:grid-cols-2">
    <div>
      <Label htmlFor={`${formKey}-firstName`}>First name *</Label>
      <Input
        id={`${formKey}-firstName`}
        value={values.firstName}
        onChange={(event) => onFieldChange('firstName', event.target.value)}
        onBlur={() => onFieldBlur('firstName')}
        autoComplete={formKey === 'billing' ? 'given-name' : 'shipping given-name'}
        required
        aria-invalid={Boolean(errors[getAddressErrorKey(formKey, 'firstName')])}
      />
      {errors[getAddressErrorKey(formKey, 'firstName')] && <p className="mt-1 text-sm text-destructive">{errors[getAddressErrorKey(formKey, 'firstName')]}</p>}
    </div>

    <div>
      <Label htmlFor={`${formKey}-lastName`}>Last name *</Label>
      <Input
        id={`${formKey}-lastName`}
        value={values.lastName}
        onChange={(event) => onFieldChange('lastName', event.target.value)}
        onBlur={() => onFieldBlur('lastName')}
        autoComplete={formKey === 'billing' ? 'family-name' : 'shipping family-name'}
        required
        aria-invalid={Boolean(errors[getAddressErrorKey(formKey, 'lastName')])}
      />
      {errors[getAddressErrorKey(formKey, 'lastName')] && <p className="mt-1 text-sm text-destructive">{errors[getAddressErrorKey(formKey, 'lastName')]}</p>}
    </div>

    {includeEmail && (
      <div>
        <Label htmlFor={`${formKey}-email`}>Email *</Label>
        <Input
          id={`${formKey}-email`}
          type="email"
          value={values.email}
          onChange={(event) => onFieldChange('email', event.target.value)}
          onBlur={() => onFieldBlur('email')}
          autoComplete="email"
          required
          aria-invalid={Boolean(errors[getAddressErrorKey(formKey, 'email')])}
        />
        {errors[getAddressErrorKey(formKey, 'email')] && <p className="mt-1 text-sm text-destructive">{errors[getAddressErrorKey(formKey, 'email')]}</p>}
      </div>
    )}

    <div>
      <Label htmlFor={`${formKey}-phone`}>Phone</Label>
      <Input
        id={`${formKey}-phone`}
        type="tel"
        value={values.phone}
        onChange={(event) => onFieldChange('phone', event.target.value)}
        autoComplete={formKey === 'billing' ? 'tel' : 'shipping tel'}
      />
    </div>

    <div className="md:col-span-2">
      <Label htmlFor={`${formKey}-address`}>Address *</Label>
      <Input
        id={`${formKey}-address`}
        value={values.address}
        onChange={(event) => onFieldChange('address', event.target.value)}
        onBlur={() => onFieldBlur('address')}
        autoComplete={formKey === 'billing' ? 'address-line1' : 'shipping address-line1'}
        required
        aria-invalid={Boolean(errors[getAddressErrorKey(formKey, 'address')])}
      />
      {errors[getAddressErrorKey(formKey, 'address')] && <p className="mt-1 text-sm text-destructive">{errors[getAddressErrorKey(formKey, 'address')]}</p>}
    </div>

    <div>
      <Label htmlFor={`${formKey}-city`}>City *</Label>
      <Input
        id={`${formKey}-city`}
        value={values.city}
        onChange={(event) => onFieldChange('city', event.target.value)}
        onBlur={() => onFieldBlur('city')}
        autoComplete={formKey === 'billing' ? 'address-level2' : 'shipping address-level2'}
        required
        aria-invalid={Boolean(errors[getAddressErrorKey(formKey, 'city')])}
      />
      {errors[getAddressErrorKey(formKey, 'city')] && <p className="mt-1 text-sm text-destructive">{errors[getAddressErrorKey(formKey, 'city')]}</p>}
    </div>

    <div>
      <Label htmlFor={`${formKey}-state`}>State *</Label>
      <Input
        id={`${formKey}-state`}
        value={values.state}
        onChange={(event) => onFieldChange('state', event.target.value)}
        onBlur={() => onFieldBlur('state')}
        autoComplete={formKey === 'billing' ? 'address-level1' : 'shipping address-level1'}
        required
        aria-invalid={Boolean(errors[getAddressErrorKey(formKey, 'state')])}
      />
      {errors[getAddressErrorKey(formKey, 'state')] && <p className="mt-1 text-sm text-destructive">{errors[getAddressErrorKey(formKey, 'state')]}</p>}
    </div>

    <div>
      <Label htmlFor={`${formKey}-zip`}>ZIP code *</Label>
      <Input
        id={`${formKey}-zip`}
        value={values.zip}
        onChange={(event) => onFieldChange('zip', event.target.value)}
        onBlur={() => onFieldBlur('zip')}
        autoComplete={formKey === 'billing' ? 'postal-code' : 'shipping postal-code'}
        required
        aria-invalid={Boolean(errors[getAddressErrorKey(formKey, 'zip')])}
      />
      {errors[getAddressErrorKey(formKey, 'zip')] && <p className="mt-1 text-sm text-destructive">{errors[getAddressErrorKey(formKey, 'zip')]}</p>}
    </div>

    <div>
      <Label htmlFor={`${formKey}-country`}>Country</Label>
      <Select value={values.country} onValueChange={onCountryChange}>
        <SelectTrigger id={`${formKey}-country`}>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {countryOptions.map((option) => (
            <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  </div>
);

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
  const ordered = supportedFirst.filter((method) => unique.includes(method));

  return ordered.filter((method) => SUPPORTED_PAYMENT_METHODS.includes(method));
};

const CheckoutPage = () => {
  const navigate = useNavigate();
  const { user, authenticated, verifySession } = useAuth();
  const [cart, setCart] = useState({ items: [], subtotal: 0 });
  const [loading, setLoading] = useState(false);
  const [cartDrawerOpen, setCartDrawerOpen] = useState(false);
  const [availablePaymentMethods, setAvailablePaymentMethods] = useState(['stripe']);
  const [paymentMethodsLoading, setPaymentMethodsLoading] = useState(true);
  const [paymentMethodsError, setPaymentMethodsError] = useState('');
  const [wooPaymentsConfig, setWooPaymentsConfig] = useState(null);
  const [wooPaymentsConfigError, setWooPaymentsConfigError] = useState('');
  const [stripeCheckoutContext, setStripeCheckoutContext] = useState({ stripe: null, elements: null });
  const [wooPaymentsCheckoutContext, setWooPaymentsCheckoutContext] = useState({ stripe: null, elements: null });

  const [billingData, setBillingData] = useState(() => createAddressFormState());
  const [shippingData, setShippingData] = useState(() => createAddressFormState());
  const [shippingSameAsBilling, setShippingSameAsBilling] = useState(true);
  const [createAccount, setCreateAccount] = useState(false);
  const [accountPassword, setAccountPassword] = useState('');
  const [accountConfirmPassword, setAccountConfirmPassword] = useState('');
  const [profilePrefillKey, setProfilePrefillKey] = useState('');
  const [formData, setFormData] = useState({
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
    if (!authenticated || !user) return;

    const nextPrefillKey = String(user.userId || user.email || '');
    if (!nextPrefillKey || profilePrefillKey === nextPrefillKey) return;

    let savedProfile = null;
    try {
      savedProfile = readCheckoutProfile({ userId: user.userId, email: user.email });
    } catch (error) {
      console.warn('Failed to read checkout profile:', error);
    }

    const nameParts = splitFullName(user.name);
    const billingDefaults = {
      firstName: savedProfile?.billing?.firstName || nameParts.firstName,
      lastName: savedProfile?.billing?.lastName || nameParts.lastName,
      email: savedProfile?.billing?.email || user.email || '',
      phone: savedProfile?.billing?.phone || '',
      address: savedProfile?.billing?.address || '',
      city: savedProfile?.billing?.city || '',
      state: savedProfile?.billing?.state || '',
      zip: savedProfile?.billing?.zip || '',
      country: savedProfile?.billing?.country || 'US',
    };

    setBillingData((prev) => mergeAddressFormValues(prev, billingDefaults));

    if (savedProfile?.shipping) {
      setShippingData((prev) => mergeAddressFormValues(prev, savedProfile.shipping));
    }

    if (typeof savedProfile?.shippingSameAsBilling === 'boolean') {
      setShippingSameAsBilling(savedProfile.shippingSameAsBilling);
    }

    setProfilePrefillKey(nextPrefillKey);
  }, [authenticated, profilePrefillKey, user]);

  useEffect(() => {
    let cancelled = false;

    const loadPaymentMethods = async () => {
      try {
        setPaymentMethodsLoading(true);
        setPaymentMethodsError('');
        const res = await apiServerClient.fetch('/store/cart');
        const json = await res.json().catch(() => null);
        const methods = normalizePaymentMethods(json?.data?.payment_methods);
        const nextMethods = methods;

        if (cancelled) return;

        setAvailablePaymentMethods(nextMethods);
        setFormData((prev) => ({
          ...prev,
          paymentMethod: nextMethods.includes(prev.paymentMethod) ? prev.paymentMethod : (nextMethods[0] || ''),
        }));
        setPaymentMethodsError(nextMethods.length === 0 ? 'No supported payment methods are currently available.' : '');
      } catch {
        if (!cancelled) {
          setAvailablePaymentMethods([]);
          setPaymentMethodsError('Unable to load payment methods right now. Please try again.');
          setFormData((prev) => ({
            ...prev,
            paymentMethod: '',
          }));
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

  const handleAddressFieldChange = (formKey, field, value) => {
    const setter = formKey === 'billing' ? setBillingData : setShippingData;
    setter((prev) => ({ ...prev, [field]: value }));

    const errorKey = getAddressErrorKey(formKey, field);
    if (errors[errorKey]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[errorKey];
        return next;
      });
    }

    if (formKey === 'billing' && field === 'email' && errors[getAccountErrorKey('email')]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[getAccountErrorKey('email')];
        delete next[getAccountErrorKey('general')];
        return next;
      });
    }
  };

  const handleAddressCountryChange = (formKey, value) => {
    const setter = formKey === 'billing' ? setBillingData : setShippingData;
    setter((prev) => ({ ...prev, country: value }));
  };

  const validateAddressField = (formKey, field, value) => {
    const trimmedValue = String(value || '').trim();

    if (!trimmedValue) {
      return `${getValidationLabel(field)} is required`;
    }

    if (field === 'email' && !isValidEmail(trimmedValue)) {
      return 'Enter a valid email address';
    }

    return '';
  };

  const handleAddressFieldBlur = (formKey, field) => {
    const values = formKey === 'billing' ? billingData : shippingData;
    const nextMessage = validateAddressField(formKey, field, values[field]);
    const errorKey = getAddressErrorKey(formKey, field);

    setErrors((prev) => {
      const next = { ...prev };
      if (nextMessage) {
        next[errorKey] = nextMessage;
      } else {
        delete next[errorKey];
      }
      return next;
    });
  };

  const clearAccountErrors = () => {
    setErrors((prev) => {
      const next = { ...prev };
      Object.keys(next).forEach((key) => {
        if (key.startsWith('account.')) delete next[key];
      });
      return next;
    });
  };

  const handleAccountToggle = (checked) => {
    const nextChecked = checked !== false;
    setCreateAccount(nextChecked);

    if (!nextChecked) {
      clearAccountErrors();
    }
  };

  const handleAccountFieldChange = (field, value) => {
    if (field === 'password') {
      setAccountPassword(value);
    } else {
      setAccountConfirmPassword(value);
    }

    const errorKey = getAccountErrorKey(field);
    if (errors[errorKey]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[errorKey];
        return next;
      });
    }

    if (field === 'password' && errors[getAccountErrorKey('confirmPassword')]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[getAccountErrorKey('confirmPassword')];
        delete next[getAccountErrorKey('general')];
        return next;
      });
    } else if (errors[getAccountErrorKey('general')]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[getAccountErrorKey('general')];
        return next;
      });
    }
  };

  const validateAccountField = (field, value) => {
    const trimmedValue = String(value || '').trim();

    if (!trimmedValue) {
      return field === 'confirmPassword' ? 'Confirm password is required' : 'Password is required';
    }

    if (field === 'password' && trimmedValue.length < 8) {
      return 'Password must be at least 8 characters';
    }

    if (field === 'confirmPassword' && accountPassword && trimmedValue !== accountPassword) {
      return 'Passwords do not match';
    }

    return '';
  };

  const handleAccountFieldBlur = (field) => {
    const value = field === 'password' ? accountPassword : accountConfirmPassword;
    const nextMessage = validateAccountField(field, value);
    const errorKey = getAccountErrorKey(field);

    setErrors((prev) => {
      const next = { ...prev };
      if (nextMessage) {
        next[errorKey] = nextMessage;
      } else {
        delete next[errorKey];
      }
      return next;
    });
  };

  const getValidationLabel = (field) => {
    if (field === 'zip') return 'ZIP code';
    if (field === 'firstName') return 'First name';
    if (field === 'lastName') return 'Last name';
    return field.charAt(0).toUpperCase() + field.slice(1);
  };

  const getAddressValidationErrors = (formKey, values, requiredFields) => {
    const nextErrors = {};

    requiredFields.forEach((field) => {
      const message = validateAddressField(formKey, field, values[field]);
      if (message) {
        nextErrors[getAddressErrorKey(formKey, field)] = message;
      }
    });

    return nextErrors;
  };

  const getShippingFormValues = () => {
    if (!shippingSameAsBilling) return shippingData;

    return {
      ...billingData,
      email: '',
    };
  };

  const validateCheckoutForm = () => {
    const newErrors = {
      ...getAddressValidationErrors('billing', billingData, ['firstName', 'lastName', 'email', 'address', 'city', 'state', 'zip']),
      ...(shippingSameAsBilling ? {} : getAddressValidationErrors('shipping', shippingData, ['firstName', 'lastName', 'address', 'city', 'state', 'zip'])),
    };

    if (!authenticated && createAccount) {
      if (!accountPassword) {
        newErrors[getAccountErrorKey('password')] = 'Password is required';
      } else if (accountPassword.length < 8) {
        newErrors[getAccountErrorKey('password')] = 'Password must be at least 8 characters';
      }

      if (!accountConfirmPassword) {
        newErrors[getAccountErrorKey('confirmPassword')] = 'Confirm password is required';
      } else if (accountPassword !== accountConfirmPassword) {
        newErrors[getAccountErrorKey('confirmPassword')] = 'Passwords do not match';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handlePlaceOrder = async ({ stripe, elements } = {}) => {
    if (!validateCheckoutForm()) {
      notifyError('Please check the highlighted fields', 'Complete the required checkout details before placing your order.');
      return;
    }

    if (!formData.paymentMethod || !SUPPORTED_PAYMENT_METHODS.includes(formData.paymentMethod)) {
      notifyError('Payment unavailable', paymentMethodsError || 'No supported payment method is currently available.');
      return;
    }

    setLoading(true);
    try {
      let paymentData = null;
      let paymentMethodGateway = formData.paymentMethod;
      let checkoutUser = authenticated ? user : null;
      const createAccountDuringCheckout = !authenticated && createAccount;
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
      const shippingFormValues = getShippingFormValues();
      const billing_address = {
        first_name: billingData.firstName,
        last_name: billingData.lastName,
        company: '',
        address_1: billingData.address,
        address_2: '',
        city: billingData.city,
        state: billingData.state,
        postcode: billingData.zip,
        country: billingData.country,
        email: billingData.email,
        phone: billingData.phone || '',
      };
      const shipping_address = {
        first_name: shippingFormValues.firstName,
        last_name: shippingFormValues.lastName,
        company: '',
        address_1: shippingFormValues.address,
        address_2: '',
        city: shippingFormValues.city,
        state: shippingFormValues.state,
        postcode: shippingFormValues.zip,
        country: shippingFormValues.country,
        phone: shippingFormValues.phone || '',
      };

      const createCheckoutAccountIfNeeded = async () => {
        if (!createAccountDuringCheckout) return null;

        clearAccountErrors();

        const response = await apiServerClient.fetch('/auth/register-checkout', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            billing_address,
            shipping_address,
            password: accountPassword,
            confirmPassword: accountConfirmPassword,
          }),
        });

        const data = await response.json().catch(() => null);

        if (!response.ok) {
          const message = data?.error || data?.message || 'Failed to create your account during checkout';
          const nextErrors = {};

          if (/at least 8/i.test(message)) {
            nextErrors[getAccountErrorKey('password')] = message;
          } else if (/match/i.test(message)) {
            nextErrors[getAccountErrorKey('confirmPassword')] = message;
          } else if (/already exists/i.test(message)) {
            nextErrors[getAccountErrorKey('email')] = message;
          } else {
            nextErrors[getAccountErrorKey('general')] = message;
          }

          setErrors((prev) => ({ ...prev, ...nextErrors }));
          throw new Error(message);
        }

        checkoutUser = {
          userId: data?.userId || data?.customerId,
          email: data?.email || billing_address.email,
          name: data?.name || `${billingData.firstName} ${billingData.lastName}`.trim(),
        };

        setAccountPassword('');
        setAccountConfirmPassword('');

        try {
          await verifySession();
        } catch (sessionError) {
          console.warn('Checkout account session refresh failed:', sessionError);
        }

        notifySuccess('Account created', 'Your new account is ready and linked to this checkout.');
        return data;
      };

      const syncCheckoutProfileState = () => {
        try {
          saveCheckoutProfile({
            userId: checkoutUser?.userId,
            email: checkoutUser?.email || billing_address.email,
            billingAddress: billing_address,
            shippingAddress: shippingSameAsBilling ? billing_address : shipping_address,
            shippingSameAsBilling,
          });

          if (authenticated && !createAccountDuringCheckout) {
            notifySuccess('Addresses updated', 'Your saved account addresses were refreshed for future checkouts.');
          }
        } catch (syncError) {
          console.error('Checkout profile sync error:', syncError);

          if (authenticated && !createAccountDuringCheckout) {
            notifyError('Order placed, but profile sync failed', 'Your order went through, but we could not save these addresses to your account.');
          }
        }
      };

      const completeSuccessfulCheckout = (orderSummary) => {
        syncCheckoutProfileState();
        storeOrderSummary(orderSummary);

        localStorage.setItem('anfaCart', JSON.stringify({ items: [], subtotal: 0, itemCount: 0 }));
        window.dispatchEvent(new Event('cartUpdated'));

        navigate(`/order-confirmation?orderId=${orderSummary.orderId}&orderNumber=${orderSummary.orderNumber}`, {
          state: { orderSummary },
        });
      };

      await createCheckoutAccountIfNeeded();

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

        let nextStoreSession = updated?.store || storeSession;
        const shippingSelections = findShippingSelections({
          shippingRates: updated?.data?.shipping_rates,
          shippingMethod: formData.shippingMethod,
          subtotal,
        });

        const needsShipping = Boolean(updated?.data?.needs_shipping);

        if (needsShipping) {
          if (shippingSelections.length === 0) {
            throw new Error(`${getShippingMethodLabel(formData.shippingMethod)} is not available for this address.`);
          }

          for (const selection of shippingSelections) {
            const selectedShippingRate = await storeFetch('/cart/select-shipping-rate', {
              method: 'POST',
              store: nextStoreSession,
              body: {
                package_id: selection.packageId,
                rate_id: selection.rateId,
              },
            });
            nextStoreSession = selectedShippingRate?.store || nextStoreSession;
          }
        }

        return {
          storeSession: nextStoreSession,
          needsShipping,
        };
      };
      const finalizeStoreCheckout = async (checkoutRes, fallbackOrderSummary) => {
        const checkoutData = checkoutRes?.data;
        const paymentStatus = checkoutData?.payment_result?.payment_status;
        if (paymentStatus !== 'success') {
          throw new Error(extractCheckoutErrorMessage(checkoutData));
        }

        const orderSummary = normalizeOrderSummary({
          orderId: checkoutData.order_id,
          orderNumber: checkoutData.order_number || checkoutData.order_id,
          status: checkoutData.status || 'processing',
          date: checkoutData.date_created || new Date().toISOString(),
        }, fallbackOrderSummary);

        completeSuccessfulCheckout(orderSummary);
      };

      const createCheckoutBody = (paymentMethod, paymentDataEntries, needsShipping = false) => ({
        billing_address,
        ...(needsShipping ? { shipping_address } : {}),
        payment_method: paymentMethod,
        payment_data: paymentDataEntries,
      });

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

        const { storeSession, needsShipping } = await buildStoreCheckoutSession();

        // 4) Create a Stripe PaymentMethod (Stripe.js v3+; createSource is not supported in newer Stripe.js builds).
        const { error: paymentMethodError, paymentMethod } = await stripe.createPaymentMethod({
          type: 'card',
          card: cardElement,
          billing_details: {
            name: `${billingData.firstName} ${billingData.lastName}`.trim(),
            email: billingData.email,
            phone: billingData.phone || undefined,
            address: {
              line1: billingData.address,
              city: billingData.city,
              state: billingData.state,
              postal_code: billingData.zip,
              country: billingData.country,
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
          body: createCheckoutBody('stripe', [
            { key: 'billing_email', value: billingData.email },
            { key: 'billing_first_name', value: billingData.firstName },
            { key: 'billing_last_name', value: billingData.lastName },
            { key: 'payment_method', value: 'stripe' },
            { key: 'wc-stripe-payment-method', value: paymentMethod.id },
            { key: 'wc-stripe-is-deferred-intent', value: true },
          ], needsShipping),
        });
        await finalizeStoreCheckout(checkoutRes, {
          items: cart.items,
          billing: billing_address,
          shipping: needsShipping ? shipping_address : billing_address,
          subtotal,
          shippingTotal: shippingCost,
          taxTotal: tax,
          total,
          paymentMethod: paymentMethodGateway,
        });
        return;
      }

      if (formData.paymentMethod === 'cod') {
        const { storeSession, needsShipping } = await buildStoreCheckoutSession();
        const checkoutRes = await storeFetch('/checkout', {
          method: 'POST',
          store: storeSession,
          body: createCheckoutBody('cod', [
            { key: 'payment_method', value: 'cod' },
          ], needsShipping),
        });

        await finalizeStoreCheckout(checkoutRes, {
          items: cart.items,
          billing: billing_address,
          shipping: needsShipping ? shipping_address : billing_address,
          subtotal,
          shippingTotal: shippingCost,
          taxTotal: tax,
          total,
          paymentMethod: paymentMethodGateway,
        });
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
              name: `${billingData.firstName} ${billingData.lastName}`.trim(),
              email: billingData.email,
              phone: billingData.phone || undefined,
              address: {
                line1: billingData.address,
                city: billingData.city,
                state: billingData.state,
                postal_code: billingData.zip,
                country: billingData.country,
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

        const { storeSession, needsShipping } = await buildStoreCheckoutSession();
        const checkoutRes = await storeFetch('/checkout', {
          method: 'POST',
          store: storeSession,
          body: createCheckoutBody('woocommerce_payments', [
            { key: 'payment_method', value: 'card' },
            { key: 'wcpay-payment-method', value: paymentMethod.id },
            { key: 'wcpay-fraud-prevention-token', value: String(window?.wcpayFraudPreventionToken || '') },
            { key: 'wcpay-fingerprint', value: '' },
          ], needsShipping),
        });

        await finalizeStoreCheckout(checkoutRes, {
          items: cart.items,
          billing: billing_address,
          shipping: needsShipping ? shipping_address : billing_address,
          subtotal,
          shippingTotal: shippingCost,
          taxTotal: tax,
          total,
          paymentMethod: paymentMethodGateway,
        });
        return;
      }

      const orderData = {
        cartItems: cart.items.map(item => ({
          productId: item.productId,
          quantity: item.quantity,
          price: parseFloat(item.price)
        })),
        customerInfo: {
          firstName: billingData.firstName,
          lastName: billingData.lastName,
          email: billingData.email,
          phone: billingData.phone,
          address: billingData.address,
          city: billingData.city,
          state: billingData.state,
          zip: billingData.zip,
          country: billingData.country
        },
        shippingAddress: shipping_address,
        shippingMethod: formData.shippingMethod,
        paymentMethod: paymentMethodGateway,
        paymentData,
        totals: {
          subtotal,
          shippingCost,
          tax,
          total,
        },
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
      const orderSummary = normalizeOrderSummary(data, {
        items: cart.items,
        billing: billing_address,
        shipping: shipping_address,
        subtotal,
        shippingTotal: shippingCost,
        taxTotal: tax,
        total,
        paymentMethod: paymentMethodGateway,
      });

      completeSuccessfulCheckout(orderSummary);
    } catch (error) {
      console.error('Order creation error:', error);
      notifyError('Checkout failed', error.message || 'Failed to place order');
    } finally {
      setLoading(false);
    }
  };

  const subtotal = Number(cart?.subtotal) || 0;
  const shippingCost = useMemo(() => getShippingFallbackCost(formData.shippingMethod, subtotal), [formData.shippingMethod, subtotal]);
  const tax = subtotal * 0.08;
  const total = subtotal + shippingCost + tax;
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

  const paymentUnavailableMessage = paymentMethodsError
    || (!formData.paymentMethod ? 'Payment is currently unavailable.' : '')
    || (formData.paymentMethod === 'stripe' && !stripePublishableKey ? 'Stripe is not configured for checkout.' : '')
    || (formData.paymentMethod === 'woocommerce_payments' && wooPaymentsConfigError ? (wooPaymentsConfigError || 'WooPayments is unavailable.') : '');

  const placeOrderDisabled = loading
    || paymentMethodsLoading
    || cart.items.length === 0
    || !formData.paymentMethod
    || !!paymentUnavailableMessage
    || (formData.paymentMethod === 'stripe' && (!stripePublishableKey || !currentPaymentContext?.stripe || !currentPaymentContext?.elements))
    || (formData.paymentMethod === 'woocommerce_payments' && (
      !!wooPaymentsConfigError
      || !wooPaymentsStripePromise
      || !wooPaymentsElementsOptions
      || !currentPaymentContext?.stripe
      || !currentPaymentContext?.elements
    ));

  const placeOrderButtonLabel = loading
    ? 'Processing...'
    : paymentUnavailableMessage
      ? 'Payment unavailable'
      : 'Place order';

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

                  <AddressFields
                    formKey="billing"
                    values={billingData}
                    errors={errors}
                    onFieldChange={(field, value) => handleAddressFieldChange('billing', field, value)}
                    onFieldBlur={(field) => handleAddressFieldBlur('billing', field)}
                    onCountryChange={(value) => handleAddressCountryChange('billing', value)}
                    includeEmail
                  />

                  {!authenticated && (
                    <div className="mt-5 rounded-xl border border-border/60 bg-background/40 px-4 py-4">
                      <div className="flex items-start gap-3">
                        <Checkbox
                          id="createAccount"
                          checked={createAccount}
                          onCheckedChange={handleAccountToggle}
                        />
                        <div className="flex-1 space-y-1">
                          <Label htmlFor="createAccount" className="cursor-pointer font-semibold">
                            Create an account
                          </Label>
                          <p className="text-sm text-muted-foreground">
                            Save your details for faster checkout next time.
                          </p>
                        </div>
                      </div>

                      {createAccount && (
                        <div className="mt-4 grid gap-4 md:grid-cols-2">
                          <div>
                            <Label htmlFor="checkout-password">Password *</Label>
                            <Input
                              id="checkout-password"
                              type="password"
                              value={accountPassword}
                              onChange={(event) => handleAccountFieldChange('password', event.target.value)}
                              onBlur={() => handleAccountFieldBlur('password')}
                              autoComplete="new-password"
                              required
                              aria-invalid={Boolean(errors[getAccountErrorKey('password')])}
                            />
                            {errors[getAccountErrorKey('password')] && (
                              <p className="mt-1 text-sm text-destructive">{errors[getAccountErrorKey('password')]}</p>
                            )}
                          </div>

                          <div>
                            <Label htmlFor="checkout-confirm-password">Confirm password *</Label>
                            <Input
                              id="checkout-confirm-password"
                              type="password"
                              value={accountConfirmPassword}
                              onChange={(event) => handleAccountFieldChange('confirmPassword', event.target.value)}
                              onBlur={() => handleAccountFieldBlur('confirmPassword')}
                              autoComplete="new-password"
                              required
                              aria-invalid={Boolean(errors[getAccountErrorKey('confirmPassword')])}
                            />
                            {errors[getAccountErrorKey('confirmPassword')] && (
                              <p className="mt-1 text-sm text-destructive">{errors[getAccountErrorKey('confirmPassword')]}</p>
                            )}
                          </div>

                          {errors[getAccountErrorKey('email')] && (
                            <div className="md:col-span-2">
                              <p className="text-sm text-destructive">{errors[getAccountErrorKey('email')]}</p>
                            </div>
                          )}

                          {errors[getAccountErrorKey('general')] && (
                            <div className="md:col-span-2">
                              <p className="text-sm text-destructive">{errors[getAccountErrorKey('general')]}</p>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )}

                  <div className="mt-5 flex items-start gap-3 rounded-xl border border-border/60 bg-background/40 px-4 py-3">
                    <Checkbox
                      id="shippingSameAsBilling"
                      checked={shippingSameAsBilling}
                      onCheckedChange={(checked) => {
                        const nextChecked = checked !== false;
                        setShippingSameAsBilling(nextChecked);

                        if (!nextChecked) {
                          setShippingData((prev) => {
                            const hasExistingValues = Object.entries(prev).some(([field, value]) => field !== 'country' && String(value || '').trim());
                            return hasExistingValues ? prev : {
                              ...prev,
                              firstName: billingData.firstName,
                              lastName: billingData.lastName,
                              phone: billingData.phone,
                              address: billingData.address,
                              city: billingData.city,
                              state: billingData.state,
                              zip: billingData.zip,
                              country: billingData.country,
                            };
                          });
                          return;
                        }

                        setErrors((prev) => {
                          const next = { ...prev };
                          Object.keys(next).forEach((key) => {
                            if (key.startsWith('shipping.')) delete next[key];
                          });
                          return next;
                        });
                      }}
                    />
                    <div className="space-y-1">
                      <Label htmlFor="shippingSameAsBilling" className="cursor-pointer font-semibold">
                        Shipping address is the same as billing
                      </Label>
                      <p className="text-sm text-muted-foreground">
                        {shippingSameAsBilling
                          ? 'Your billing details will also be used for delivery.'
                          : 'Enter a separate shipping address for delivery.'}
                      </p>
                    </div>
                  </div>

                </div>

              {!shippingSameAsBilling && (
                <div className={sectionCardClassName}>
                  <div className="mb-6 flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                      <MapPin className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <h2 className="text-xl font-bold">Shipping address</h2>
                      <p className="text-sm text-muted-foreground">We'll use this address for delivery only.</p>
                    </div>
                  </div>

                  <AddressFields
                    formKey="shipping"
                    values={shippingData}
                    errors={errors}
                    onFieldChange={(field, value) => handleAddressFieldChange('shipping', field, value)}
                    onFieldBlur={(field) => handleAddressFieldBlur('shipping', field)}
                    onCountryChange={(value) => handleAddressCountryChange('shipping', value)}
                    includeEmail={false}
                  />
                </div>
              )}

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
                        <span className="font-semibold shrink-0">
                          {getShippingFallbackCost('standard', subtotal) === 0 ? 'Free' : `$${getShippingFallbackCost('standard', subtotal).toFixed(2)}`}
                        </span>
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

              <div className={paymentSectionCardClassName}>
                  <div className={paymentSectionHeaderClassName}>
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
                        <div className={paymentMethodListClassName}>
                          {availablePaymentMethods.map((method, index) => (
                            <div
                              key={method}
                              className={`${paymentMethodOptionClassName} ${
                                index > 0 ? 'border-t border-border/60' : ''
                              }`}
                              onClick={() => setFormData(prev => ({ ...prev, paymentMethod: method }))}
                            >
                              <RadioGroupItem value={method} id={method} />
                               <Label htmlFor={method} className="flex-1 cursor-pointer break-words">
                                 <p className="font-semibold">{getPaymentMethodLabel(method)}</p>
                                 <p className="text-sm text-muted-foreground">{getPaymentMethodDescription(method)}</p>
                               </Label>
                           </div>
                         ))}
                       </div>
                     </RadioGroup>
                   )}

                   {!!paymentMethodsError && (
                     <p className={paymentErrorMessageClassName}>{paymentMethodsError}</p>
                    )}

                    {formData.paymentMethod === 'stripe' && (
                     <div className={paymentSelectedWrapperClassName}>
                        {!stripePublishableKey && (
                           <p className="text-sm text-destructive">Stripe is not configured for checkout.</p>
                       )}

                      {!!stripePromise && (
                        <Elements
                          stripe={stripePromise}
                        >
                          <StripeElementsBridge onChange={handleStripeContextChange} />
                          <div className={paymentSelectedPanelClassName}>
                            <Label className="cursor-default">Card details</Label>
                            <div className={paymentElementWrapperClassName}>
                              <CardElement options={{ hidePostalCode: true }} />
                            </div>
                            <p className={paymentHelperTextClassName}>Test mode: use 4242 4242 4242 4242.</p>
                          </div>
                        </Elements>
                      )}

                      {!stripePromise && null}
                     </div>
                   )}

                    {formData.paymentMethod === 'cod' && (
                      <div className={paymentSelectedWrapperClassName}>
                        <div className={paymentSelectedPanelClassName}>
                          <p className="font-semibold">Cash on delivery</p>
                          <p className="text-sm text-muted-foreground mt-1">Your order will be submitted with WooCommerce Cash on Delivery.</p>
                        </div>
                     </div>
                   )}

                    {formData.paymentMethod === 'woocommerce_payments' && (
                      <div className={paymentSelectedWrapperClassName}>
                         {!!wooPaymentsConfigError && (
                          <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-3 md:p-4">
                            <p className="font-semibold">WooPayments unavailable</p>
                           <p className="text-sm text-muted-foreground mt-1">{wooPaymentsConfigError}</p>
                          </div>
                       )}

                        {!!wooPaymentsStripePromise && !!wooPaymentsElementsOptions && !wooPaymentsConfigError && (
                          <Elements key={`woopayments-${toMinorAmount(total)}`} stripe={wooPaymentsStripePromise} options={wooPaymentsElementsOptions}>
                            <StripeElementsBridge onChange={handleWooPaymentsContextChange} />
                            <div className={paymentSelectedPanelClassName}>
                              <Label className="cursor-default">Card details</Label>
                              <div className={paymentElementWrapperClassName}>
                                <PaymentElement />
                              </div>
                              <p className={paymentHelperTextClassName}>Test mode: use 4242 4242 4242 4242.</p>
                            </div>
                          </Elements>
                        )}

                       {(!wooPaymentsStripePromise || !wooPaymentsElementsOptions) && !wooPaymentsConfigError && (
                         <div className={paymentSelectedPanelClassName}>
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
                    <span className="font-semibold font-variant-tabular">${subtotal.toFixed(2)}</span>
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
                  {placeOrderButtonLabel}
                </Button>

                <div className="mt-4 text-xs text-muted-foreground">
                  <p>By placing this order, you agree to our Terms of Service and Privacy Policy.</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="fixed inset-x-0 bottom-0 z-40 overflow-x-clip border-t border-border/70 bg-background/95 px-4 py-3 backdrop-blur md:hidden">
          <div className="mx-auto flex min-w-0 max-w-5xl items-center gap-3">
            <div className="min-w-0 flex-1">
              <p className="text-xs uppercase tracking-wide text-muted-foreground">Total</p>
              <p className="text-lg font-bold font-variant-tabular">${total.toFixed(2)}</p>
            </div>
            <Button
              onClick={handleCheckoutSubmit}
              disabled={placeOrderDisabled}
              size="lg"
              className="min-w-0 flex-1 whitespace-normal px-4 text-center leading-tight sm:min-w-[170px] sm:flex-none sm:whitespace-nowrap"
            >
              {placeOrderButtonLabel}
            </Button>
          </div>
        </div>
      </main>

      <Footer />
    </>
  );
};


export default CheckoutPage;
