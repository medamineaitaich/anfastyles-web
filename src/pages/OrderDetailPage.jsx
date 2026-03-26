import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet';
import { Link, useParams } from 'react-router-dom';
import { ChevronLeft, Download, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import apiServerClient from '@/lib/apiServerClient';
import { generateInvoice } from '@/components/InvoiceGenerator.jsx';
import Header from '@/components/Header.jsx';
import Footer from '@/components/Footer.jsx';
import CartDrawer from '@/components/CartDrawer.jsx';

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
      setOrder(data);
    } catch (error) {
      console.error('Error fetching order:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadInvoice = async () => {
    if (!order) return;

    setDownloading(true);
    try {
      await generateInvoice(order);
      toast.success('Invoice downloaded successfully');
    } catch (error) {
      toast.error('Failed to generate invoice');
      console.error(error);
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
                Placed on{' '}
                {new Date(order.date).toLocaleDateString('en-US', {
                  month: 'long',
                  day: 'numeric',
                  year: 'numeric'
                })}
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
              <p className="text-2xl font-bold font-variant-tabular">${order.total.toFixed(2)}</p>
            </div>

            <div className="rounded-xl border border-border bg-card p-6">
              <h3 className="mb-3 font-semibold">Payment method</h3>
              <p className="capitalize">{order.paymentMethod || 'Credit card'}</p>
            </div>
          </div>

          <div className="mb-6 rounded-xl border border-border bg-card p-6">
            <h2 className="mb-4 text-xl font-bold">Order items</h2>
            <div className="space-y-4">
              {order.items?.map((item, index) => (
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
                  <p className="font-semibold font-variant-tabular">${(item.price * item.quantity).toFixed(2)}</p>
                </div>
              ))}
            </div>

            <Separator className="my-6" />

            <div className="ml-auto max-w-xs space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Subtotal</span>
                <span className="font-variant-tabular">${(order.subtotal || order.total * 0.9).toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Shipping</span>
                <span className="font-variant-tabular">${(order.shippingCost || 0).toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Tax</span>
                <span className="font-variant-tabular">${(order.tax || order.total * 0.1).toFixed(2)}</span>
              </div>
              <Separator className="my-2" />
              <div className="flex justify-between font-bold">
                <span>Total</span>
                <span className="font-variant-tabular">${order.total.toFixed(2)}</span>
              </div>
            </div>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            <div className="rounded-xl border border-border bg-card p-6">
              <h2 className="mb-4 text-xl font-bold">Shipping address</h2>
              <div className="space-y-1 text-sm">
                <p>{order.shipping?.firstName} {order.shipping?.lastName}</p>
                <p>{order.shipping?.address}</p>
                <p>{order.shipping?.city}, {order.shipping?.state} {order.shipping?.zip}</p>
                <p>{order.shipping?.country}</p>
              </div>
            </div>

            <div className="rounded-xl border border-border bg-card p-6">
              <h2 className="mb-4 text-xl font-bold">Billing address</h2>
              <div className="space-y-1 text-sm">
                <p>{order.billing?.firstName} {order.billing?.lastName}</p>
                <p>{order.billing?.address}</p>
                <p>{order.billing?.city}, {order.billing?.state} {order.billing?.zip}</p>
                <p>{order.billing?.country}</p>
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
