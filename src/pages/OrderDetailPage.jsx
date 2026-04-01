import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet';
import { Link, useParams } from 'react-router-dom';
import { ChevronLeft, Download, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import apiServerClient from '@/lib/apiServerClient';
import { generateInvoice } from '@/components/InvoiceGenerator.jsx';
import { notifyError, notifySuccess } from '@/lib/notifications.js';
import { normalizeOrderSummary } from '@/lib/orderSummary.js';
import Header from '@/components/Header.jsx';
import Footer from '@/components/Footer.jsx';
import CartDrawer from '@/components/CartDrawer.jsx';

const formatCurrency = (value) => {
  const amount = Number(value);
  return Number.isFinite(amount) ? `$${amount.toFixed(2)}` : '$0.00';
};

const formatOrderDate = (value) => {
  const date = new Date(value || Date.now());
  if (Number.isNaN(date.getTime())) return 'Unknown date';

  return date.toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });
};

const getAddressLines = (address = {}) => {
  const name = [address.firstName, address.lastName].filter(Boolean).join(' ').trim();
  const street = [address.address, address.address2].filter(Boolean).join(', ').trim();
  const locality = [address.city, address.state, address.zip].filter(Boolean).join(' ').trim();
  const lines = [name, street, locality, address.country, address.email].filter(Boolean);

  return lines.length > 0 ? lines : ['Not available'];
};

const OrderDetailPage = () => {
  const { id } = useParams();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);
  const [cartDrawerOpen, setCartDrawerOpen] = useState(false);

  useEffect(() => {
    fetchOrder();
  }, [id]);

  const fetchOrder = async () => {
    try {
      const response = await apiServerClient.fetch(`/orders/${id}`);
      if (!response.ok) throw new Error('Order not found');

      const data = await response.json();
      setOrder(normalizeOrderSummary(data));
    } catch (error) {
      console.error('Error fetching order:', error);
      notifyError('Unable to load order details', error.message || 'Please try again in a moment.');
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadInvoice = async () => {
    if (!order) return;

    setDownloading(true);
    try {
      await generateInvoice(order);
      notifySuccess('Invoice downloaded', 'Your invoice PDF is ready.');
    } catch (error) {
      console.error(error);
      notifyError('Invoice download failed', error.message || 'Failed to generate invoice.');
    } finally {
      setDownloading(false);
    }
  };

  if (loading) {
    return (
      <>
        <Header onCartClick={() => setCartDrawerOpen(true)} />
        <CartDrawer open={cartDrawerOpen} onClose={() => setCartDrawerOpen(false)} />
        <main className="py-12">
          <div className="container-custom max-w-4xl">
            <Skeleton className="mb-8 h-8 w-48" />
            <Skeleton className="h-64 w-full" />
          </div>
        </main>
        <Footer />
      </>
    );
  }

  if (!order) {
    return (
      <>
        <Header onCartClick={() => setCartDrawerOpen(true)} />
        <CartDrawer open={cartDrawerOpen} onClose={() => setCartDrawerOpen(false)} />
        <main className="py-20">
          <div className="container-custom text-center">
            <h1 className="mb-4 text-2xl font-bold">Order not found</h1>
            <Link to="/orders">
              <Button>Back to orders</Button>
            </Link>
          </div>
        </main>
        <Footer />
      </>
    );
  }

  const items = Array.isArray(order.items) ? order.items : [];
  const shippingLines = getAddressLines(order.shipping);
  const billingLines = getAddressLines(order.billing);

  return (
    <>
      <Helmet>
        <title>{`Order #${order.orderNumber} - AnfaStyles`}</title>
        <meta name="description" content="View your order details" />
      </Helmet>

      <Header onCartClick={() => setCartDrawerOpen(true)} />
      <CartDrawer open={cartDrawerOpen} onClose={() => setCartDrawerOpen(false)} />

      <main className="py-12">
        <div className="container-custom max-w-4xl">
          <Link
            to="/orders"
            className="mb-8 inline-flex items-center text-sm text-muted-foreground transition-colors duration-200 hover:text-primary"
          >
            <ChevronLeft className="mr-1 h-4 w-4" />
            Back to orders
          </Link>

          <div className="mb-8 flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
            <div>
              <h1 className="mb-2 text-4xl font-bold">Order #{order.orderNumber}</h1>
              <p className="text-muted-foreground">
                Placed on {formatOrderDate(order.date)}
              </p>
            </div>
            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={handleDownloadInvoice}
                disabled={downloading}
              >
                {downloading ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Download className="mr-2 h-4 w-4" />
                )}
                Invoice
              </Button>
              {order.status === 'shipped' && (
                <Link to={`/orders/${id}/tracking`}>
                  <Button>Track order</Button>
                </Link>
              )}
            </div>
          </div>

          <div className="mb-8 grid gap-6 md:grid-cols-3">
            <div className="rounded-xl border border-border bg-card p-6">
              <h3 className="mb-3 font-semibold">Order status</h3>
              <p className="text-2xl font-bold capitalize">{order.status}</p>
            </div>

            <div className="rounded-xl border border-border bg-card p-6">
              <h3 className="mb-3 font-semibold">Total amount</h3>
              <p className="text-2xl font-bold font-variant-tabular">{formatCurrency(order.total)}</p>
            </div>

            <div className="rounded-xl border border-border bg-card p-6">
              <h3 className="mb-3 font-semibold">Payment method</h3>
              <p className="capitalize">{order.paymentMethod || 'Credit card'}</p>
            </div>
          </div>

          <div className="mb-6 rounded-xl border border-border bg-card p-6">
            <h2 className="mb-4 text-xl font-bold">Order items</h2>
            <div className="space-y-4">
              {items.length > 0 ? items.map((item, index) => (
                <div key={index} className="flex gap-4">
                  <div className="h-20 w-20 flex-shrink-0 overflow-hidden rounded-lg bg-muted">
                    {item.image && (
                      <img src={item.image} alt={item.name} className="h-full w-full object-cover" />
                    )}
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold">{item.name}</h3>
                    <p className="text-sm text-muted-foreground">Quantity: {item.quantity}</p>
                    {item.size && <p className="text-sm text-muted-foreground">Size: {item.size.toUpperCase()}</p>}
                    {item.color && <p className="text-sm text-muted-foreground">Color: {item.color}</p>}
                  </div>
                  <p className="font-semibold font-variant-tabular">{formatCurrency(item.total ?? item.price * item.quantity)}</p>
                </div>
              )) : (
                <p className="text-sm text-muted-foreground">No order items were returned for this order.</p>
              )}
            </div>

            <Separator className="my-6" />

            <div className="ml-auto max-w-xs space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Subtotal</span>
                <span className="font-variant-tabular">{formatCurrency(order.subtotal)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Shipping</span>
                <span className="font-variant-tabular">{formatCurrency(order.shippingTotal)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Tax</span>
                <span className="font-variant-tabular">{formatCurrency(order.taxTotal)}</span>
              </div>
              <Separator className="my-2" />
              <div className="flex justify-between font-bold">
                <span>Total</span>
                <span className="font-variant-tabular">{formatCurrency(order.total)}</span>
              </div>
            </div>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            <div className="rounded-xl border border-border bg-card p-6">
              <h2 className="mb-4 text-xl font-bold">Shipping address</h2>
              <div className="space-y-1 text-sm">
                {shippingLines.map((line, index) => (
                  <p key={`shipping-line-${index}`}>{line}</p>
                ))}
              </div>
            </div>

            <div className="rounded-xl border border-border bg-card p-6">
              <h2 className="mb-4 text-xl font-bold">Billing address</h2>
              <div className="space-y-1 text-sm">
                {billingLines.map((line, index) => (
                  <p key={`billing-line-${index}`}>{line}</p>
                ))}
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </>
  );
};

export default OrderDetailPage;
