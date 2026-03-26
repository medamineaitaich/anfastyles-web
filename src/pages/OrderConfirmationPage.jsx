import React, { useEffect, useState } from 'react';
import { Helmet } from 'react-helmet';
import { Link, useSearchParams } from 'react-router-dom';
import { CheckCircle, Package, Download, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import apiServerClient from '@/lib/apiServerClient';
import { generateInvoice } from '@/components/InvoiceGenerator.jsx';
import Header from '@/components/Header.jsx';
import Footer from '@/components/Footer.jsx';
import CartDrawer from '@/components/CartDrawer.jsx';

const OrderConfirmationPage = () => {
  const [searchParams] = useSearchParams();
  const orderId = searchParams.get('orderId');
  const orderNumber = searchParams.get('orderNumber');

  const [orderData, setOrderData] = useState(null);
  const [cartDrawerOpen, setCartDrawerOpen] = useState(false);
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    if (orderId) {
      fetchOrderDetails();
    }
  }, [orderId]);

  const fetchOrderDetails = async () => {
    try {
      const response = await apiServerClient.fetch(`/orders/${orderId}`);
      if (response.ok) {
        const data = await response.json();
        setOrderData(data);
      }
    } catch (error) {
      console.error('Failed to fetch order details for invoice:', error);
    }
  };

  const handleDownloadInvoice = async () => {
    if (!orderData && !orderNumber) {
      toast.error('Order details not available yet. Please try again in a moment.');
      return;
    }

    setDownloading(true);
    try {
      const dataToUse = orderData || {
        orderNumber: orderNumber || 'ANF-2026-001',
        date: new Date().toISOString(),
        status: 'processing',
        items: [],
        subtotal: 0,
        total: 0
      };

      await generateInvoice(dataToUse);
      toast.success('Invoice downloaded successfully');
    } catch (error) {
      toast.error('Failed to generate invoice');
      console.error(error);
    } finally {
      setDownloading(false);
    }
  };

  const estimatedDelivery = new Date();
  estimatedDelivery.setDate(estimatedDelivery.getDate() + 7);

  return (
    <>
      <Helmet>
        <title>Order confirmed - AnfaStyles</title>
        <meta name="description" content="Your order has been confirmed" />
      </Helmet>

      <Header onCartClick={() => setCartDrawerOpen(true)} />
      <CartDrawer open={cartDrawerOpen} onClose={() => setCartDrawerOpen(false)} />

      <main className="py-20">
        <div className="container-custom max-w-2xl text-center">
          <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-primary/10">
            <CheckCircle className="h-12 w-12 text-primary" />
          </div>

          <h1
            className="mb-4 text-4xl font-bold text-balance md:text-5xl"
            style={{ letterSpacing: '-0.02em' }}
          >
            Order confirmed
          </h1>

          <p className="mb-8 text-lg text-muted-foreground">
            Thank you for your order. We have sent a confirmation email with your order details.
          </p>

          <div className="mb-8 rounded-xl bg-muted p-6 text-left">
            <div className="grid gap-4 text-sm md:grid-cols-2">
              <div>
                <p className="mb-1 text-muted-foreground">Order number</p>
                <p className="font-semibold">{orderNumber || 'ANF-2026-001'}</p>
              </div>
              <div>
                <p className="mb-1 text-muted-foreground">Estimated delivery</p>
                <p className="font-semibold">
                  {estimatedDelivery.toLocaleDateString('en-US', {
                    month: 'long',
                    day: 'numeric',
                    year: 'numeric'
                  })}
                </p>
              </div>
            </div>
          </div>

          <div className="mb-8 rounded-xl border border-border bg-card p-6 text-left">
            <h2 className="mb-4 font-bold">What happens next?</h2>
            <ul className="space-y-3 text-sm text-muted-foreground">
              <li className="flex items-start gap-3">
                <div className="mt-0.5 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-primary/20">
                  <Package className="h-3 w-3 text-primary" />
                </div>
                <span>Your order is being prepared for shipment</span>
              </li>
              <li className="flex items-start gap-3">
                <div className="mt-0.5 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-primary/20">
                  <Package className="h-3 w-3 text-primary" />
                </div>
                <span>You will receive a shipping confirmation email with tracking information</span>
              </li>
              <li className="flex items-start gap-3">
                <div className="mt-0.5 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-primary/20">
                  <Package className="h-3 w-3 text-primary" />
                </div>
                <span>Track your order status in your account dashboard</span>
              </li>
            </ul>
          </div>

          <div className="flex flex-col justify-center gap-3 sm:flex-row">
            <Button
              onClick={handleDownloadInvoice}
              disabled={downloading}
              className="w-full sm:w-auto"
            >
              {downloading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Download className="mr-2 h-4 w-4" />
              )}
              {downloading ? 'Generating PDF...' : 'Download Invoice'}
            </Button>
            <Link to="/orders" className="w-full sm:w-auto">
              <Button variant="outline" className="w-full">View order details</Button>
            </Link>
            <Link to="/shop" className="w-full sm:w-auto">
              <Button variant="outline" className="w-full">Continue shopping</Button>
            </Link>
          </div>
        </div>
      </main>

      <Footer />
    </>
  );
};

export default OrderConfirmationPage;
