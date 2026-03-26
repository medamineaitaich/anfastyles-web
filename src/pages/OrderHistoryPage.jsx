import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet';
import { Link } from 'react-router-dom';
import { Package, ChevronLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import apiServerClient from '@/lib/apiServerClient';
import Header from '@/components/Header.jsx';
import Footer from '@/components/Footer.jsx';
import CartDrawer from '@/components/CartDrawer.jsx';

const OrderHistoryPage = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [cartDrawerOpen, setCartDrawerOpen] = useState(false);

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      const response = await apiServerClient.fetch('/orders');
      if (!response.ok) throw new Error('Failed to fetch orders');

      const data = await response.json();
      setOrders(data);
    } catch (error) {
      console.error('Error fetching orders:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Helmet>
        <title>Order history - AnfaStyles</title>
        <meta name="description" content="View your order history" />
      </Helmet>

      <Header onCartClick={() => setCartDrawerOpen(true)} />
      <CartDrawer open={cartDrawerOpen} onClose={() => setCartDrawerOpen(false)} />

      <main className="py-12">
        <div className="container-custom max-w-4xl">
          <Link
            to="/account"
            className="mb-8 inline-flex items-center text-sm text-muted-foreground transition-colors duration-200 hover:text-primary"
          >
            <ChevronLeft className="mr-1 h-4 w-4" />
            Back to account
          </Link>

          <h1
            className="mb-8 text-4xl font-bold text-balance md:text-5xl"
            style={{ letterSpacing: '-0.02em' }}
          >
            Order history
          </h1>

          {loading ? (
            <div className="space-y-4">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="rounded-xl border border-border bg-card p-6">
                  <Skeleton className="mb-4 h-6 w-32" />
                  <Skeleton className="mb-2 h-4 w-full" />
                  <Skeleton className="h-4 w-3/4" />
                </div>
              ))}
            </div>
          ) : orders.length === 0 ? (
            <div className="py-20 text-center">
              <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-muted">
                <Package className="h-10 w-10 text-muted-foreground" />
              </div>
              <h2 className="mb-3 text-2xl font-bold">No orders yet</h2>
              <p className="mb-8 text-muted-foreground">Start shopping to see your orders here</p>
              <Link to="/shop">
                <Button size="lg">Browse products</Button>
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {orders.map((order) => (
                <div key={order.id} className="rounded-xl border border-border bg-card p-6">
                  <div className="mb-4 flex items-start justify-between">
                    <div>
                      <h3 className="text-lg font-bold">Order #{order.orderNumber}</h3>
                      <p className="text-sm text-muted-foreground">
                        Placed on{' '}
                        {new Date(order.date).toLocaleDateString('en-US', {
                          month: 'long',
                          day: 'numeric',
                          year: 'numeric'
                        })}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-semibold font-variant-tabular">${order.total.toFixed(2)}</p>
                      <p className="text-sm capitalize text-muted-foreground">{order.status}</p>
                    </div>
                  </div>

                  <Separator className="my-4" />

                  <div className="flex gap-3">
                    <Link to={`/orders/${order.id}`}>
                      <Button variant="outline" size="sm">View details</Button>
                    </Link>
                    {order.status === 'shipped' && (
                      <Link to={`/orders/${order.id}/tracking`}>
                        <Button variant="outline" size="sm">Track order</Button>
                      </Link>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      <Footer />
    </>
  );
};

export default OrderHistoryPage;
