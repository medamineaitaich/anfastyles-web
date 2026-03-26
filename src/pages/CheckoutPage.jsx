import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet';
import { useNavigate } from 'react-router-dom';
import { CreditCard, Truck, MapPin } from 'lucide-react';
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

  useEffect(() => {
    const savedCart = JSON.parse(localStorage.getItem('anfaCart') || '{"items":[],"subtotal":0}');
    if (savedCart.items.length === 0) {
      navigate('/cart');
    }
    setCart(savedCart);
  }, [navigate]);

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

  const handlePlaceOrder = async () => {
    setLoading(true);
    try {
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
        paymentMethod: formData.paymentMethod
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

                      <div className="flex items-center gap-3 p-4 border border-border rounded-lg">
                        <RadioGroupItem value="paypal" id="paypal" />
                        <Label htmlFor="paypal" className="cursor-pointer">
                          <p className="font-semibold">PayPal</p>
                          <p className="text-sm text-muted-foreground">Pay with your PayPal account</p>
                        </Label>
                      </div>
                    </div>
                  </RadioGroup>

                  <div className="flex gap-3 mt-6">
                    <Button onClick={() => setStep(2)} variant="outline" size="lg" className="flex-1">
                      Back
                    </Button>
                    <Button onClick={handlePlaceOrder} disabled={loading} size="lg" className="flex-1">
                      {loading ? 'Processing...' : 'Place order'}
                    </Button>
                  </div>
                </div>
              )}
            </div>

            <div className="lg:col-span-1">
              <div className="bg-card border border-border rounded-xl p-6 sticky top-24">
                <h2 className="text-xl font-bold mb-4">Order summary</h2>
                
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
