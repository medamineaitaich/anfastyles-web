import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { X, Minus, Plus, Trash2 } from 'lucide-react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';

const CartDrawer = ({ open, onClose }) => {
  const [cart, setCart] = useState({ items: [], subtotal: 0, itemCount: 0 });

  useEffect(() => {
    if (open) {
      loadCart();
    }
  }, [open]);

  const loadCart = () => {
    const savedCart = JSON.parse(localStorage.getItem('anfaCart') || '{"items":[],"subtotal":0,"itemCount":0}');
    setCart(savedCart);
  };

  const updateQuantity = (productId, newQuantity) => {
    if (newQuantity < 1) return;
    
    const updatedItems = cart.items.map(item =>
      item.productId === productId ? { ...item, quantity: newQuantity } : item
    );
    
    const subtotal = updatedItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const itemCount = updatedItems.reduce((sum, item) => sum + item.quantity, 0);
    
    const updatedCart = { items: updatedItems, subtotal, itemCount };
    localStorage.setItem('anfaCart', JSON.stringify(updatedCart));
    setCart(updatedCart);
    window.dispatchEvent(new Event('cartUpdated'));
  };

  const removeItem = (productId) => {
    const updatedItems = cart.items.filter(item => item.productId !== productId);
    const subtotal = updatedItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const itemCount = updatedItems.reduce((sum, item) => sum + item.quantity, 0);
    
    const updatedCart = { items: updatedItems, subtotal, itemCount };
    localStorage.setItem('anfaCart', JSON.stringify(updatedCart));
    setCart(updatedCart);
    window.dispatchEvent(new Event('cartUpdated'));
  };

  return (
    <Sheet open={open} onOpenChange={onClose}>
      <SheetContent side="right" className="w-full sm:max-w-lg flex flex-col">
        <SheetHeader>
          <SheetTitle>Shopping cart</SheetTitle>
        </SheetHeader>

        {cart.items.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center text-center py-12">
            <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
              <X className="w-8 h-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-semibold mb-2">Your cart is empty</h3>
            <p className="text-sm text-muted-foreground mb-6">Add items to get started</p>
            <Link to="/shop" onClick={onClose}>
              <Button>Continue shopping</Button>
            </Link>
          </div>
        ) : (
          <>
            <div className="flex-1 overflow-y-auto py-6">
              <div className="space-y-4">
                {cart.items.map((item) => (
                  <div key={item.productId} className="flex gap-4">
                    <img
                      src={item.image}
                      alt={item.name}
                      className="w-20 h-20 object-cover rounded-lg bg-muted"
                    />
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium text-sm truncate">{item.name}</h4>
                      <p className="text-sm text-muted-foreground font-variant-tabular">
                        ${item.price.toFixed(2)}
                      </p>
                      <div className="flex items-center gap-2 mt-2">
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-7 w-7"
                          onClick={() => updateQuantity(item.productId, item.quantity - 1)}
                        >
                          <Minus className="w-3 h-3" />
                        </Button>
                        <span className="text-sm font-medium w-8 text-center">{item.quantity}</span>
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-7 w-7"
                          onClick={() => updateQuantity(item.productId, item.quantity + 1)}
                        >
                          <Plus className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>
                    <div className="flex flex-col items-end justify-between">
                      <p className="font-semibold text-sm font-variant-tabular">
                        ${(item.price * item.quantity).toFixed(2)}
                      </p>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-destructive hover:text-destructive"
                        onClick={() => removeItem(item.productId)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="border-t border-border pt-4 space-y-4">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Subtotal</span>
                <span className="font-semibold font-variant-tabular">${cart.subtotal.toFixed(2)}</span>
              </div>
              
              {cart.subtotal < 75 && (
                <div className="bg-muted rounded-lg p-3 text-sm">
                  <p className="text-muted-foreground mb-2">
                    Add ${(75 - cart.subtotal).toFixed(2)} more for free shipping
                  </p>
                  <div className="w-full bg-background rounded-full h-2 overflow-hidden">
                    <div
                      className="bg-primary h-full transition-all duration-300"
                      style={{ width: `${Math.min((cart.subtotal / 75) * 100, 100)}%` }}
                    />
                  </div>
                </div>
              )}

              <Separator />

              <div className="space-y-2">
                <Link to="/cart" onClick={onClose}>
                  <Button variant="outline" className="w-full">
                    View cart
                  </Button>
                </Link>
                <Link to="/checkout" onClick={onClose}>
                  <Button className="w-full">
                    Checkout
                  </Button>
                </Link>
              </div>
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
};

export default CartDrawer;
