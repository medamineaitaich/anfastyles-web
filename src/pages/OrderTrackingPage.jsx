import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet';
import { Link, useParams } from 'react-router-dom';
import { ChevronLeft, Package, Truck, CheckCircle } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import apiServerClient from '@/lib/apiServerClient';
import Header from '@/components/Header.jsx';
import Footer from '@/components/Footer.jsx';
import CartDrawer from '@/components/CartDrawer.jsx';

const OrderTrackingPage = () => {
  const { id } = useParams();
  const [tracking, setTracking] = useState(null);
  const [loading, setLoading] = useState(true);
  const [cartDrawerOpen, setCartDrawerOpen] = useState(false);

  useEffect(() => {
    fetchTracking();
  }, [id]);

  const fetchTracking = async () => {
    try {
      const response = await apiServerClient.fetch(`/orders/${id}/tracking`);
      if (!response.ok) throw new Error('Tracking not found');

      const data = await response.json();
      setTracking(data);
    } catch (error) {
      console.error('Error fetching tracking:', error);
    } finally {
      setLoading(false);
    }
  };

  const statusSteps = [
    { key: 'processing', label: 'Order placed', icon: Package },
    { key: 'shipped', label: 'Shipped', icon: Truck },
    { key: 'delivered', label: 'Delivered', icon: CheckCircle }
  ];

  const currentStepIndex = statusSteps.findIndex(step => step.key === tracking?.status);

  if (loading) {
    return (
      <>
        <Header onCartClick={() => setCartDrawerOpen(true)} />
        <CartDrawer open={cartDrawerOpen} onClose={() => setCartDrawerOpen(false)} />
        <main className="py-12">
          <div className="container-custom max-w-4xl">
            <Skeleton className="h-8 w-48 mb-8" />
            <Skeleton className="h-64 w-full" />
          </div>
        </main>
        <Footer />
      </>
    );
  }

  return (
    <>
      <Helmet>
        <title>Track order - AnfaStyles</title>
        <meta name="description" content="Track your order status" />
      </Helmet>

      <Header onCartClick={() => setCartDrawerOpen(true)} />
      <CartDrawer open={cartDrawerOpen} onClose={() => setCartDrawerOpen(false)} />

      <main className="py-12">
        <div className="container-custom max-w-4xl">
          <Link to={`/orders/${id}`} className="inline-flex items-center text-sm text-muted-foreground hover:text-primary mb-8 transition-colors duration-200">
            <ChevronLeft className="w-4 h-4 mr-1" />
            Back to order details
          </Link>

          <h1 className="text-4xl md:text-5xl font-bold mb-8 text-balance" style={{ letterSpacing: '-0.02em' }}>
            Track your order
          </h1>

          <div className="bg-card border border-border rounded-xl p-8 mb-8">
            <div className="flex justify-between items-center mb-12">
              {statusSteps.map((step, index) => {
                const Icon = step.icon;
                const isActive = index <= currentStepIndex;
                const isCompleted = index < currentStepIndex;

                return (
                  <div key={step.key} className="flex-1 relative">
                    <div className="flex flex-col items-center">
                      <div className={`w-16 h-16 rounded-full flex items-center justify-center mb-3 transition-all duration-300 ${
                        isActive ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
                      }`}>
                        <Icon className="w-8 h-8" />
                      </div>
                      <p className={`text-sm font-medium text-center ${isActive ? 'text-foreground' : 'text-muted-foreground'}`}>
                        {step.label}
                      </p>
                    </div>
                    {index < statusSteps.length - 1 && (
                      <div className={`absolute top-8 left-1/2 w-full h-0.5 transition-all duration-300 ${
                        isCompleted ? 'bg-primary' : 'bg-muted'
                      }`} style={{ transform: 'translateY(-50%)' }} />
                    )}
                  </div>
                );
              })}
            </div>

            {tracking && (
              <div className="space-y-4">
                {tracking.trackingNumber && (
                  <div className="flex justify-between items-center p-4 bg-muted rounded-lg">
                    <span className="text-sm font-medium">Tracking number</span>
                    <span className="font-semibold font-variant-tabular">{tracking.trackingNumber}</span>
                  </div>
                )}

                {tracking.carrier && (
                  <div className="flex justify-between items-center p-4 bg-muted rounded-lg">
                    <span className="text-sm font-medium">Carrier</span>
                    <span className="font-semibold">{tracking.carrier}</span>
                  </div>
                )}

                {tracking.estimatedDelivery && (
                  <div className="flex justify-between items-center p-4 bg-muted rounded-lg">
                    <span className="text-sm font-medium">Estimated delivery</span>
                    <span className="font-semibold">
                      {new Date(tracking.estimatedDelivery).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                    </span>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </main>

      <Footer />
    </>
  );
};

export default OrderTrackingPage;
