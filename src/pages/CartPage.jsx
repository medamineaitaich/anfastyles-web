import React, { useState } from 'react';
import { Helmet } from 'react-helmet';
import { Link } from 'react-router-dom';
import { Minus, Plus, Trash2, ShoppingBag } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { useCart } from '@/contexts/CartContext.jsx';
import { notifyError, notifyInfo } from '@/lib/notifications.js';
import Header from '@/components/Header.jsx';
import Footer from '@/components/Footer.jsx';
import CartDrawer from '@/components/CartDrawer.jsx';

const CartPage = () => {
  const { cart, loading: cartLoading, updateItemQuantity, removeItem: removeCartItem } = useCart();
  const [cartDrawerOpen, setCartDrawerOpen] = useState(false);

  const updateQuantity = async (lineKey, newQuantity) => {
    if (newQuantity < 1) return;
    try {
      await updateItemQuantity(lineKey, newQuantity);
    } catch (error) {
      notifyError('Unable to update cart', error.message || 'Please try again.');
    }
  };

  const removeItem = async (lineKey) => {
    const removedItem = cart.items.find((item) => item.lineKey === lineKey);
    try {
      await removeCartItem(lineKey);
    } catch (error) {
      notifyError('Unable to remove item', error.message || 'Please try again.');
      return;
    }

    if (removedItem) {
      notifyInfo('Item removed', `${removedItem.name} was removed from your cart.`);
    }
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

      <main className="py-10 md:py-12 overflow-x-hidden lg:overflow-visible">
        <div className="container-custom">
          <h1 className="text-4xl md:text-5xl font-bold mb-8 text-balance" style={{ letterSpacing: '-0.02em' }}>
            Shopping cart
          </h1>

          {cart.items.length === 0 ? (
            cartLoading ? (
              <div className="text-center py-20">
                <h2 className="text-2xl font-bold mb-3">Loading your cart...</h2>
                <p className="text-muted-foreground">Please wait a moment.</p>
              </div>
            ) : (
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
            )
          ) : (
            <div className="grid gap-6 md:grid-cols-[minmax(0,1fr)_320px] md:items-start md:gap-8 xl:grid-cols-[minmax(0,1fr)_360px]">
              <div className="min-w-0">
                {cart.subtotal < 75 && (
                  <div className="bg-muted rounded-xl p-4 sm:p-6 mb-6">
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
                    <div key={item.lineKey} className="bg-card border border-border rounded-xl p-4 sm:p-6">
                      <div className="flex flex-col gap-4 sm:flex-row sm:gap-6">
                        <img
                          src={item.image}
                          alt={item.name}
                          className="w-20 h-20 sm:w-24 sm:h-24 object-cover rounded-lg bg-muted flex-shrink-0"
                        />
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold mb-1 truncate">{item.name}</h3>
                          <div className="text-sm text-muted-foreground space-y-1 mb-3">
                            {item.size && <p>Size: {item.size.toUpperCase()}</p>}
                            {item.color && <p>Color: {item.color}</p>}
                          </div>
                          <div className="flex flex-wrap items-center gap-3">
                            <Button
                              variant="outline"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() => updateQuantity(item.lineKey, item.quantity - 1)}
                            >
                              <Minus className="w-3 h-3" />
                            </Button>
                            <span className="font-medium w-8 text-center">{item.quantity}</span>
                            <Button
                              variant="outline"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() => updateQuantity(item.lineKey, item.quantity + 1)}
                            >
                              <Plus className="w-3 h-3" />
                            </Button>
                          </div>
                        </div>
                        <div className="flex items-center justify-between gap-3 sm:flex-col sm:items-end sm:justify-between sm:gap-0">
                          <p className="font-semibold text-lg font-variant-tabular">
                            ${(parseFloat(item.price) * item.quantity).toFixed(2)}
                          </p>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-destructive hover:text-destructive"
                            onClick={() => removeItem(item.lineKey)}
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

              <aside className="min-w-0 self-start md:sticky md:top-24">
                <div className="bg-card border border-border rounded-xl p-4 sm:p-6 md:max-h-[calc(100vh-7rem)] md:overflow-y-auto">
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

                  <div className="mt-6 border-t border-border/60 bg-card pt-4 md:sticky md:bottom-0 md:-mx-6 md:px-6 md:pb-1">
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
              </aside>
            </div>
          )}
        </div>
      </main>

      <Footer />
    </>
  );
};

export default CartPage;
