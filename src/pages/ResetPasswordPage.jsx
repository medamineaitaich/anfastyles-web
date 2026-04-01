import React, { useState } from 'react';
import { Helmet } from 'react-helmet';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { Leaf } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { PasswordInput } from '@/components/ui/password-input';
import { Label } from '@/components/ui/label';
import apiServerClient from '@/lib/apiServerClient';
import { notifyError, notifySuccess } from '@/lib/notifications.js';
import Header from '@/components/Header.jsx';
import Footer from '@/components/Footer.jsx';
import CartDrawer from '@/components/CartDrawer.jsx';

const ResetPasswordPage = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const navigate = useNavigate();

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [cartDrawerOpen, setCartDrawerOpen] = useState(false);

  const validateField = (field, value) => {
    if (field === 'password') {
      if (!value) return 'New password is required';
      if (value.length < 8) return 'Password must be at least 8 characters';
      return '';
    }

    if (field === 'confirmPassword') {
      if (!value) return 'Please confirm your password';
      if (value !== password) return 'Passwords do not match';
      return '';
    }

    return '';
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!token) {
      notifyError('Reset token missing', 'The password reset link is invalid or expired.');
      return;
    }

    const passwordError = validateField('password', password);
    const confirmError = validateField('confirmPassword', confirmPassword);
    if (passwordError || confirmError) {
      setErrors({ password: passwordError, confirmPassword: confirmError });
      notifyError('Validation error', 'Please fix the highlighted fields.');
      return;
    }

    setLoading(true);

    try {
      const response = await apiServerClient.fetch('/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password })
      });

      if (!response.ok) {
        const data = await response.json().catch(() => {});
        throw new Error(data?.error || 'Unable to reset password');
      }

      notifySuccess('Password reset', 'Your password has been changed successfully. Please login.');
      navigate('/login');
    } catch (error) {
      notifyError('Reset failed', error.message || 'Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Helmet>
        <title>Reset Password - AnfaStyles</title>
        <meta name="description" content="Reset your account password" />
      </Helmet>
      <Header onCartClick={() => setCartDrawerOpen(true)} />
      <CartDrawer open={cartDrawerOpen} onClose={() => setCartDrawerOpen(false)} />

      <main className="py-20">
        <div className="container-custom max-w-md">
          <div className="text-center mb-8">
            <div className="w-16 h-16 rounded-full bg-primary flex items-center justify-center mx-auto mb-4">
              <Leaf className="w-8 h-8 text-primary-foreground" />
            </div>
            <h1 className="text-3xl font-bold mb-2">Reset password</h1>
            <p className="text-muted-foreground">
              {token ? 'Set a new password for your account.' : 'Invalid or expired reset link.'}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="bg-card border border-border rounded-xl p-6 space-y-4">
            <div>
              <Label htmlFor="password">New password</Label>
              <PasswordInput
                id="password"
                value={password}
                autoComplete="new-password"
                aria-invalid={!!errors.password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setErrors((prev) => ({ ...prev, password: '' }));
                }}
              />
              {errors.password && <p className="text-sm text-destructive mt-1">{errors.password}</p>}
            </div>

            <div>
              <Label htmlFor="confirmPassword">Confirm password</Label>
              <PasswordInput
                id="confirmPassword"
                value={confirmPassword}
                autoComplete="new-password"
                aria-invalid={!!errors.confirmPassword}
                onChange={(e) => {
                  setConfirmPassword(e.target.value);
                  setErrors((prev) => ({ ...prev, confirmPassword: '' }));
                }}
              />
              {errors.confirmPassword && <p className="text-sm text-destructive mt-1">{errors.confirmPassword}</p>}
            </div>

            <Button type="submit" className="w-full" disabled={loading || !token}>
              {loading ? 'Saving...' : 'Save new password'}
            </Button>

            <p className="text-center text-sm text-muted-foreground">
              <Link to="/login" className="text-primary hover:underline font-medium">
                Back to login
              </Link>
            </p>
          </form>
        </div>
      </main>

      <Footer />
    </>
  );
};

export default ResetPasswordPage;
