import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet';
import { Link } from 'react-router-dom';
import { User, Package, Settings, LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext.jsx';
import apiServerClient from '@/lib/apiServerClient';
import Header from '@/components/Header.jsx';
import Footer from '@/components/Footer.jsx';
import CartDrawer from '@/components/CartDrawer.jsx';

const AccountDashboard = () => {
  const { user, logout } = useAuth();
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
      setOrders(data.slice(0, 5));
    } catch (error) {
      console.error('Error fetching orders:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    toast.success('Logged out successfully');
  };

  return (
    <>
      <Helmet>
        <title>My account - AnfaStyles</title>
        <meta name="description" content="Manage your AnfaStyles account" />
      </Helmet>

      <Header onCartClick={() => setCartDrawerOpen(true)} />
      <CartDrawer open={cartDrawerOpen} onClose={() => setCartDrawerOpen(false)} />

      <main className="py-12">
        <div className="container-custom">
          <div className="flex justify-between items-center mb-8">
            <h1 className="text-4xl md:text-5xl font-bold text-balance" style={{ letterSpacing: '-0.02em' }}>
              My account
            </h1>
            <Button variant="outline" onClick={handleLogout}>
              <LogOut className="w-4 h-4 mr-2" />
              Logout
            </Button>
          </div>

          <div className="grid md:grid-cols-3 gap-6 mb-12">
            <div className="bg-card border border-border rounded-xl p-6">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                <User className="w-6 h-6 text-primary" />
              </div>
              <h2 className="font-bold mb-2">Profile</h2>
              <p className="text-sm text-muted-foreground mb-4">Manage your personal information</p>
              <p className="text-sm font-medium">{user?.name}</p>
              <p className="text-sm text-muted-foreground">{user?.email}</p>
            </div>

            <Link to="/orders" className="bg-card border border-border rounded-xl p-6 hover:shadow-lg transition-all duration-300">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                <Package className="w-6 h-6 text-primary" />
              </div>
              <h2 className="font-bold mb-2">Orders</h2>
              <p className="text-sm text-muted-foreground">View and track your orders</p>
            </Link>

            <div className="bg-card border border-border rounded-xl p-6">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                <Settings className="w-6 h-6 text-primary" />
              </div>
              <h2 className="font-bold mb-2">Settings</h2>
              <p className="text-sm text-muted-foreground">Update your preferences</p>
            </div>
          </div>

          <div className="bg-card border border-border rounded-xl p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold">Recent orders</h2>
              <Link to="/orders">
                <Button variant="outline" size="sm">View all</Button>
              </Link>
            </div>

            {loading ? (
              <div className="space-y-4">
                {[1, 2, 3].map(i => (
                  <div key={i} className="flex justify-between items-center">
                    <div className="space-y-2">
                      <Skeleton className="h-4 w-32" />
                      <Skeleton className="h-3 w-24" />
                    </div>
                    <Skeleton className="h-4 w-20" />
                  </div>
                ))}
              </div>
            ) : orders.length === 0 ? (
              <div className="text-center py-12">
                <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
                  <Package className="w-8 h-8 text-muted-foreground" />
                </div>
                <h3 className="text-lg font-semibold mb-2">No orders yet</h3>
                <p className="text-sm text-muted-foreground mb-6">Start shopping to see your orders here</p>
                <Link to="/shop">
                  <Button>Browse products</Button>
                </Link>
              </div>
            ) : (
              <div className="space-y-4">
                {orders.map((order) => (
                  <div key={order.id}>
                    <Link to={`/orders/${order.id}`} className="flex justify-between items-center hover:bg-muted p-4 rounded-lg transition-colors duration-200">
                      <div>
                        <p className="font-semibold">Order #{order.orderNumber}</p>
                        <p className="text-sm text-muted-foreground">{new Date(order.date).toLocaleDateString()}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold font-variant-tabular">${order.total.toFixed(2)}</p>
                        <p className="text-sm text-muted-foreground capitalize">{order.status}</p>
                      </div>
                    </Link>
                    <Separator className="mt-4" />
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>

      <Footer />
    </>
  );
};

export default AccountDashboard;
