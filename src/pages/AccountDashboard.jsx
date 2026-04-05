import React, { useMemo, useState } from 'react';
import { Helmet } from 'react-helmet';
import { Link } from 'react-router-dom';
import { ChevronRight, LogOut, Package, Settings, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { notifySuccess } from '@/lib/notifications.js';
import { useAuth } from '@/contexts/AuthContext.jsx';
import Header from '@/components/Header.jsx';
import Footer from '@/components/Footer.jsx';
import CartDrawer from '@/components/CartDrawer.jsx';

const AccountDashboard = () => {
  const { logout } = useAuth();
  const [cartDrawerOpen, setCartDrawerOpen] = useState(false);

  const cards = useMemo(() => ([
    {
      title: 'Profile',
      description: 'Review and update your personal account details.',
      icon: User,
      to: '/account/profile',
    },
    {
      title: 'Orders',
      description: 'View your order history and open order details.',
      icon: Package,
      to: '/orders',
    },
    {
      title: 'Settings',
      description: 'Manage password and account security settings.',
      icon: Settings,
      to: '/account/settings',
    },
  ]), []);

  const handleLogout = async () => {
    await logout();
    notifySuccess('Logged out successfully', 'You are now signed out.');
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
        <div className="container-custom max-w-5xl">
          <div className="mb-10 flex flex-wrap items-center justify-between gap-4">
            <div>
              <h1 className="text-4xl font-bold text-balance md:text-5xl" style={{ letterSpacing: '-0.02em' }}>
                My account
              </h1>
              <p className="mt-2 text-muted-foreground">Choose where you want to go next.</p>
            </div>

            <Button variant="outline" onClick={handleLogout}>
              <LogOut className="mr-2 h-4 w-4" />
              Logout
            </Button>
          </div>

          <div className="grid gap-6 md:grid-cols-3">
            {cards.map(({ title, description, icon: Icon, to }) => (
              <Link
                key={title}
                to={to}
                className="group rounded-xl border border-border bg-card p-6 transition-all duration-200 hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
              >
                <div className="mb-4 flex items-start justify-between gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                    <Icon className="h-6 w-6 text-primary" />
                  </div>
                  <ChevronRight className="h-5 w-5 text-muted-foreground transition-transform duration-200 group-hover:translate-x-1 group-hover:text-primary" />
                </div>

                <h2 className="mb-2 text-lg font-bold">{title}</h2>
                <p className="text-sm text-muted-foreground">{description}</p>
              </Link>
            ))}
          </div>
        </div>
      </main>

      <Footer />
    </>
  );
};

export default AccountDashboard;
