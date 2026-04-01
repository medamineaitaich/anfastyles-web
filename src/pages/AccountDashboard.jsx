import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet';
import { Link } from 'react-router-dom';
import { User, Package, Settings, LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { PasswordInput } from '@/components/ui/password-input';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { notifyError, notifySuccess } from '@/lib/notifications.js';
import { useAuth } from '@/contexts/AuthContext.jsx';
import apiServerClient from '@/lib/apiServerClient';
import Header from '@/components/Header.jsx';
import Footer from '@/components/Footer.jsx';
import CartDrawer from '@/components/CartDrawer.jsx';

const AccountDashboard = () => {
  const { user, logout, updateProfile, changePassword } = useAuth();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [cartDrawerOpen, setCartDrawerOpen] = useState(false);

  const [name, setName] = useState(user?.name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileErrors, setProfileErrors] = useState({});

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordErrors, setPasswordErrors] = useState({});

  const normalizeOrders = (data) => {
    const raw = Array.isArray(data) ? data : (Array.isArray(data?.orders) ? data.orders : []);

    return raw.map((order) => ({
      id: order?.id,
      orderNumber: order?.orderNumber ?? order?.number ?? order?.id,
      status: order?.status || 'processing',
      total: Number(order?.total) || 0,
      date: order?.date || order?.date_created || order?.createdAt || new Date().toISOString(),
    }));
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  useEffect(() => {
    if (user) {
      setName(user.name || '');
      setEmail(user.email || '');
    }
  }, [user]);

  const fetchOrders = async () => {
    try {
      const response = await apiServerClient.fetch('/orders');
      if (!response.ok) throw new Error('Failed to fetch orders');

      const data = await response.json();
      setOrders(normalizeOrders(data).slice(0, 5));
    } catch (error) {
      console.error('Error fetching orders:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveProfile = async (event) => {
    event.preventDefault();
    const nextErrors = {};

    if (!name.trim()) {
      nextErrors.name = 'Name is required';
    }
    if (!email.trim()) {
      nextErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(email.trim())) {
      nextErrors.email = 'Enter a valid email address';
    }

    if (Object.keys(nextErrors).length) {
      setProfileErrors(nextErrors);
      notifyError('Cannot save profile', 'Fix validation errors first.');
      return;
    }

    setProfileLoading(true);
    try {
      await updateProfile({ name: name.trim(), email: email.trim() });
      notifySuccess('Profile updated', 'Your account details have been saved.');
      setProfileErrors({});
    } catch (error) {
      notifyError('Save failed', error.message || 'Unable to update profile.');
    } finally {
      setProfileLoading(false);
    }
  };

  const handleChangePassword = async (event) => {
    event.preventDefault();
    const nextErrors = {};

    if (!currentPassword) {
      nextErrors.currentPassword = 'Current password is required';
    }
    if (!newPassword) {
      nextErrors.newPassword = 'New password is required';
    } else if (newPassword.length < 8) {
      nextErrors.newPassword = 'Password must be at least 8 characters';
    }
    if (!confirmNewPassword) {
      nextErrors.confirmNewPassword = 'Please confirm new password';
    } else if (confirmNewPassword !== newPassword) {
      nextErrors.confirmNewPassword = 'Passwords do not match';
    }

    if (Object.keys(nextErrors).length) {
      setPasswordErrors(nextErrors);
      notifyError('Cannot change password', 'Fix validation errors first.');
      return;
    }

    setPasswordLoading(true);
    try {
      await changePassword({
        currentPassword,
        newPassword,
        confirmPassword: confirmNewPassword,
      });
      notifySuccess('Password changed', 'Your password has been updated successfully.');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmNewPassword('');
      setPasswordErrors({});
    } catch (error) {
      notifyError('Password change failed', error.message || 'Please try again later.');
    } finally {
      setPasswordLoading(false);
    }
  };

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

          <div className="bg-card border border-border rounded-xl p-6 mb-6">
            <h2 className="text-2xl font-bold mb-4">Account details</h2>
            <form onSubmit={handleSaveProfile} className="grid gap-4">
              <div>
                <label htmlFor="account-name" className="block text-sm font-medium mb-1">Full name</label>
                <Input
                  id="account-name"
                  value={name}
                  onChange={(e) => {
                    setName(e.target.value);
                    setProfileErrors((prev) => ({ ...prev, name: '' }));
                  }}
                  aria-invalid={Boolean(profileErrors.name)}
                />
                {profileErrors.name && <p className="text-destructive text-sm mt-1">{profileErrors.name}</p>}
              </div>

              <div>
                <label htmlFor="account-email" className="block text-sm font-medium mb-1">Email</label>
                <Input
                  id="account-email"
                  type="email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    setProfileErrors((prev) => ({ ...prev, email: '' }));
                  }}
                  aria-invalid={Boolean(profileErrors.email)}
                />
                {profileErrors.email && <p className="text-destructive text-sm mt-1">{profileErrors.email}</p>}
              </div>

              <Button type="submit" disabled={profileLoading} className="w-full md:w-auto">
                {profileLoading ? 'Saving...' : 'Save account details'}
              </Button>
            </form>
          </div>

          <div className="bg-card border border-border rounded-xl p-6 mb-8">
            <h2 className="text-2xl font-bold mb-4">Change password</h2>
            <form onSubmit={handleChangePassword} className="grid gap-4">
              <div>
                <label htmlFor="current-password" className="block text-sm font-medium mb-1">Current password</label>
                <PasswordInput
                  id="current-password"
                  value={currentPassword}
                  onChange={(e) => {
                    setCurrentPassword(e.target.value);
                    setPasswordErrors((prev) => ({ ...prev, currentPassword: '' }));
                  }}
                  aria-invalid={Boolean(passwordErrors.currentPassword)}
                />
                {passwordErrors.currentPassword && <p className="text-destructive text-sm mt-1">{passwordErrors.currentPassword}</p>}
              </div>

              <div>
                <label htmlFor="new-password" className="block text-sm font-medium mb-1">New password</label>
                <PasswordInput
                  id="new-password"
                  value={newPassword}
                  onChange={(e) => {
                    setNewPassword(e.target.value);
                    setPasswordErrors((prev) => ({ ...prev, newPassword: '' }));
                  }}
                  aria-invalid={Boolean(passwordErrors.newPassword)}
                />
                {passwordErrors.newPassword && <p className="text-destructive text-sm mt-1">{passwordErrors.newPassword}</p>}
              </div>

              <div>
                <label htmlFor="confirm-new-password" className="block text-sm font-medium mb-1">Confirm new password</label>
                <PasswordInput
                  id="confirm-new-password"
                  value={confirmNewPassword}
                  onChange={(e) => {
                    setConfirmNewPassword(e.target.value);
                    setPasswordErrors((prev) => ({ ...prev, confirmNewPassword: '' }));
                  }}
                  aria-invalid={Boolean(passwordErrors.confirmNewPassword)}
                />
                {passwordErrors.confirmNewPassword && <p className="text-destructive text-sm mt-1">{passwordErrors.confirmNewPassword}</p>}
              </div>

              <Button type="submit" disabled={passwordLoading} className="w-full md:w-auto">
                {passwordLoading ? 'Saving...' : 'Save new password'}
              </Button>
            </form>
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
