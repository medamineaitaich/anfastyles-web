import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet';
import { Link } from 'react-router-dom';
import { Minus, Plus, Trash2, ShoppingBag } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import Header from '@/components/Header.jsx';
import Footer from '@/components/Footer.jsx';
import CartDrawer from '@/components/CartDrawer.jsx';

const CartPage = () => {
  const [cart, setCart] = useState({ items: [], subtotal: 0, itemCount: 0 });
  const [cartDrawerOpen, setCartDrawerOpen] = useState(false);

  useEffect(() => {
    loadCart();
  }, []);

  const loadCart = () => {
    const savedCart = JSON.parse(localStorage.getItem('anfaCart') || '{"items":[],"subtotal":0,"itemCount":0}');
    setCart(savedCart);
  };

  const updateQuantity = (productId, newQuantity) => {
    if (newQuantity < 1) return;
    
    const updatedItems = cart.items.map(item =>
      item.productId === productId ? { ...item, quantity: newQuantity } : item
    );
    
    const subtotal = updatedItems.reduce((sum, item) => sum + (parseFloat(item.price) * item.quantity), 0);
    const itemCount = updatedItems.reduce((sum, item) => sum + item.quantity, 0);
    
    const updatedCart = { items: updatedItems, subtotal, itemCount };
    localStorage.setItem('anfaCart', JSON.stringify(updatedCart));
    setCart(updatedCart);
    window.dispatchEvent(new Event('cartUpdated'));
  };

  const removeItem = (productId) => {
    const updatedItems = cart.items.filter(item => item.productId !== productId);
    const subtotal = updatedItems.reduce((sum, item) => sum + (parseFloat(item.price) * item.quantity), 0);
    const itemCount = updatedItems.reduce((sum, item) => sum + item.quantity, 0);
    
    const updatedCart = { items: updatedItems, subtotal, itemCount };
    localStorage.setItem('anfaCart', JSON.stringify(updatedCart));
    setCart(updatedCart);
    window.dispatchEvent(new Event('cartUpdated'));
  };

  const shippingCost = cart.subtotal >= 75 ? 0 : 10;
  const tax = cart.subtotal * 0.08;
  const total = cart.subtotal + shippingCost + tax;
  const freeShippingProgress = Math.min((cart.subtotal / 75) * 100, 100);

  return (
    <>
      <Helmet>
        <title>Shopping cart - AnfaStyles</title>
        <meta name="description" content="Review your cart and proceed to checkout" />
      </Helmet>

      <Header onCartClick={() => setCartDrawerOpen(true)} />
      <CartDrawer open={cartDrawerOpen} onClose={() => setCartDrawerOpen(false)} />

      <main className="py-12">
        <div className="container-custom">
          <h1 className="text-4xl md:text-5xl font-bold mb-8 text-balance" style={{ letterSpacing: '-0.02em' }}>
            Shopping cart
          </h1>

          {cart.items.length === 0 ? (
            <div className="text-center py-20">
              <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center mx-auto mb-6">
                <ShoppingBag className="w-10 h-10 text-muted-foreground" />
              </div>
              <h2 className="text-2xl font-bold mb-3">Your cart is empty</h2>
              <p className="text-muted-foreground mb-8">Start adding items to your cart</p>
              <Link to="/shop">
                <Button size="lg">Continue shopping</Button>
              </Link>
            </div>
          ) : (
            <div className="grid lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2">
                {cart.subtotal < 75 && (
                  <div className="bg-muted rounded-xl p-6 mb-6">
                    <p className="text-sm font-medium mb-3">
                      Add ${(75 - cart.subtotal).toFixed(2)} more for free shipping
                    </p>
                    <div className="w-full bg-background rounded-full h-3 overflow-hidden">
                      <div
                        className="bg-primary h-full transition-all duration-300"
                        style={{ width: `${freeShippingProgress}%` }}
                      />
                    </div>
                  </div>
                )}

                <div className="space-y-4">
                  {cart.items.map((item) => (
                    <div key={`${item.productId}-${item.size}-${item.color}`} className="bg-card border border-border rounded-xl p-6">
                      <div className="flex gap-6">
                        <img
                          src={item.image}
                          alt={item.name}
                          className="w-24 h-24 object-cover rounded-lg bg-muted flex-shrink-0"
                        />
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold mb-1 truncate">{item.name}</h3>
                          <div className="text-sm text-muted-foreground space-y-1 mb-3">
                            {item.size && <p>Size: {item.size.toUpperCase()}</p>}
                            {item.color && <p>Color: {item.color}</p>}
                          </div>
                          <div className="flex items-center gap-3">
                            <Button
                              variant="outline"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() => updateQuantity(item.productId, item.quantity - 1)}
                            >
                              <Minus className="w-3 h-3" />
                            </Button>
                            <span className="font-medium w-8 text-center">{item.quantity}</span>
                            <Button
                              variant="outline"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() => updateQuantity(item.productId, item.quantity + 1)}
                            >
                              <Plus className="w-3 h-3" />
                            </Button>
                          </div>
                        </div>
                        <div className="flex flex-col items-end justify-between">
                          <p className="font-semibold text-lg font-variant-tabular">
                            ${(parseFloat(item.price) * item.quantity).toFixed(2)}
                          </p>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-destructive hover:text-destructive"
                            onClick={() => removeItem(item.productId)}
                          >
                            <Trash2 className="w-4 h-4 mr-2" />
                            Remove
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
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
                      <span className="text-muted-foreground">Tax (estimated)</span>
                      <span className="font-semibold font-variant-tabular">${tax.toFixed(2)}</span>
                    </div>
                  </div>

                  <Separator className="my-4" />

                  <div className="flex justify-between mb-6">
                    <span className="font-bold">Total</span>
                    <span className="font-bold text-xl font-variant-tabular">${total.toFixed(2)}</span>
                  </div>

                  <Link to="/checkout">
                    <Button size="lg" className="w-full">
                      Proceed to checkout
                    </Button>
                  </Link>

                  <Link to="/shop">
                    <Button variant="outline" size="lg" className="w-full mt-3">
                      Continue shopping
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>

      <Footer />
    </>
  );
};

export default CartPage;
