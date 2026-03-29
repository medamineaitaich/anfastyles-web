import React, { useState, useEffect, useMemo } from 'react';
import { Helmet } from 'react-helmet';
import { useNavigate } from 'react-router-dom';
import { CreditCard, Truck, MapPin } from 'lucide-react';
import { CardElement, Elements, ElementsConsumer } from '@stripe/react-stripe-js';
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

const CheckoutPage = () => {
  const navigate = useNavigate();
  const [cart, setCart] = useState({ items: [], subtotal: 0 });
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [cartDrawerOpen, setCartDrawerOpen] = useState(false);

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
    paymentMethod: 'credit_card'
  });

  const [errors, setErrors] = useState({});
  const envStripePublishableKey = import.meta?.env?.VITE_STRIPE_PUBLISHABLE_KEY;
  const [stripePublishableKey, setStripePublishableKey] = useState(import.meta.env.DEV ? (envStripePublishableKey || '') : '');

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

  const stripePromise = useMemo(() => {
    if (!stripePublishableKey) return null;
    return loadStripe(String(stripePublishableKey).trim());
  }, [stripePublishableKey]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validateStep1 = () => {
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

  const handleNextStep = () => {
    if (step === 1 && !validateStep1()) {
      toast.error('Please fill in all required fields');
      return;
    }
    setStep(step + 1);
  };

  const handlePlaceOrder = async ({ stripe, elements } = {}) => {
    setLoading(true);
    try {
      let paymentData = null;
      let paymentMethodGateway = formData.paymentMethod;

      if (formData.paymentMethod === 'credit_card') {
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

        // --- WooCommerce Store API cart-token flow (guest) ---
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

        // 1) Start Store API session (nonce + cart-token)
        let storeSession = (await storeFetch('/cart'))?.store;

        // 2) Add local cart items into Store API cart
        for (const cartItem of cart.items) {
          const variationId = await resolveVariationId(cartItem);
          const added = await storeFetch('/cart/add-item', {
            method: 'POST',
            store: storeSession,
            body: { id: variationId, quantity: cartItem.quantity },
          });
          storeSession = added?.store || storeSession;
        }

        // 3) Persist customer addresses (so shipping/tax can be calculated)
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

        const updated = await storeFetch('/cart/update-customer', {
          method: 'POST',
          store: storeSession,
          body: { billing_address, shipping_address },
        });
        storeSession = updated?.store || storeSession;

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

        const checkoutData = checkoutRes?.data;
        const paymentStatus = checkoutData?.payment_result?.payment_status;
        if (paymentStatus !== 'success') {
          const msg = checkoutData?.payment_result?.payment_details?.find((d) => d?.key === 'message')?.value;
          throw new Error(msg || 'Payment failed');
        }

        localStorage.setItem('anfaCart', JSON.stringify({ items: [], subtotal: 0, itemCount: 0 }));
        window.dispatchEvent(new Event('cartUpdated'));

        navigate(`/order-confirmation?orderId=${checkoutData.order_id}&orderNumber=${checkoutData.order_number || checkoutData.order_id}`);
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

  return (
    <>
      <Helmet>
        <title>Checkout - AnfaStyles</title>
        <meta name="description" content="Complete your order" />
      </Helmet>

      <Header onCartClick={() => setCartDrawerOpen(true)} />
      <CartDrawer open={cartDrawerOpen} onClose={() => setCartDrawerOpen(false)} />

      <main className="py-12">
        <div className="container-custom max-w-5xl">
          <h1 className="text-4xl md:text-5xl font-bold mb-8 text-balance" style={{ letterSpacing: '-0.02em' }}>
            Checkout
          </h1>

          <div className="flex gap-2 mb-8">
            {[1, 2, 3].map((s) => (
              <div
                key={s}
                className={`flex-1 h-2 rounded-full transition-all duration-300 ${
                  s <= step ? 'bg-primary' : 'bg-muted'
                }`}
              />
            ))}
          </div>

          <div className="grid lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2">
              {step === 1 && (
                <div className="bg-card border border-border rounded-xl p-6">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                      <MapPin className="w-5 h-5 text-primary" />
                    </div>
                    <h2 className="text-xl font-bold">Shipping information</h2>
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

                  <Button onClick={handleNextStep} size="lg" className="w-full mt-6">
                    Continue to shipping
                  </Button>
                </div>
              )}

              {step === 2 && (
                <div className="bg-card border border-border rounded-xl p-6">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                      <Truck className="w-5 h-5 text-primary" />
                    </div>
                    <h2 className="text-xl font-bold">Shipping method</h2>
                  </div>

                  <RadioGroup value={formData.shippingMethod} onValueChange={(value) => setFormData(prev => ({ ...prev, shippingMethod: value }))}>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between p-4 border border-border rounded-lg">
                        <div className="flex items-center gap-3">
                          <RadioGroupItem value="standard" id="standard" />
                          <Label htmlFor="standard" className="cursor-pointer">
                            <p className="font-semibold">Standard shipping</p>
                            <p className="text-sm text-muted-foreground">5-7 business days</p>
                          </Label>
                        </div>
                        <span className="font-semibold">{cart.subtotal >= 75 ? 'Free' : '$10.00'}</span>
                      </div>

                      <div className="flex items-center justify-between p-4 border border-border rounded-lg">
                        <div className="flex items-center gap-3">
                          <RadioGroupItem value="express" id="express" />
                          <Label htmlFor="express" className="cursor-pointer">
                            <p className="font-semibold">Express shipping</p>
                            <p className="text-sm text-muted-foreground">2-3 business days</p>
                          </Label>
                        </div>
                        <span className="font-semibold">$25.00</span>
                      </div>
                    </div>
                  </RadioGroup>

                  <div className="flex gap-3 mt-6">
                    <Button onClick={() => setStep(1)} variant="outline" size="lg" className="flex-1">
                      Back
                    </Button>
                    <Button onClick={handleNextStep} size="lg" className="flex-1">
                      Continue to payment
                    </Button>
                  </div>
                </div>
              )}

              {step === 3 && (
                <div className="bg-card border border-border rounded-xl p-6">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                      <CreditCard className="w-5 h-5 text-primary" />
                    </div>
                    <h2 className="text-xl font-bold">Payment method</h2>
                  </div>

                  <RadioGroup value={formData.paymentMethod} onValueChange={(value) => setFormData(prev => ({ ...prev, paymentMethod: value }))}>
                    <div className="space-y-3">
                      <div className="flex items-center gap-3 p-4 border border-border rounded-lg">
                        <RadioGroupItem value="credit_card" id="credit_card" />
                        <Label htmlFor="credit_card" className="cursor-pointer">
                          <p className="font-semibold">Credit card</p>
                          <p className="text-sm text-muted-foreground">Visa, Mastercard, Amex</p>
                        </Label>
                      </div>
                    </div>
                  </RadioGroup>

                  {formData.paymentMethod === 'credit_card' && (
                    <div className="mt-6">
                      {!stripePublishableKey && (
                        <p className="text-sm text-destructive">Stripe is not configured for checkout.</p>
                      )}

                      {!!stripePromise && (
                        <Elements
                          stripe={stripePromise}
                        >
                          <div className="p-4 border border-border rounded-lg">
                            <Label className="cursor-default">Card details</Label>
                            <div className="mt-3 rounded-lg border border-border bg-background p-3">
                              <CardElement options={{ hidePostalCode: true }} />
                            </div>
                            <p className="text-xs text-muted-foreground mt-3">Test mode: use 4242 4242 4242 4242.</p>
                          </div>

                          <ElementsConsumer>
                            {({ stripe, elements }) => (
                              <div className="flex gap-3 mt-6">
                                <Button onClick={() => setStep(2)} variant="outline" size="lg" className="flex-1">
                                  Back
                                </Button>
                                <Button
                                  onClick={() => handlePlaceOrder({ stripe, elements })}
                                  disabled={loading || !stripe || !elements}
                                  size="lg"
                                  className="flex-1"
                                >
                                  {loading ? 'Processing...' : 'Place order'}
                                </Button>
                              </div>
                            )}
                          </ElementsConsumer>
                        </Elements>
                      )}

                      {!stripePromise && (
                        <div className="flex gap-3 mt-6">
                          <Button onClick={() => setStep(2)} variant="outline" size="lg" className="flex-1">
                            Back
                          </Button>
                          <Button disabled size="lg" className="flex-1">
                            Place order
                          </Button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="lg:col-span-1">
              <div className="bg-card border border-border rounded-xl p-6 sticky top-24">
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

                <div className="text-xs text-muted-foreground">
                  <p>By placing this order, you agree to our Terms of Service and Privacy Policy.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </>
  );
};

export default CheckoutPage;
