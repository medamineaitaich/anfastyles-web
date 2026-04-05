import React, { useState } from 'react';
import { Helmet } from 'react-helmet';
import { Link } from 'react-router-dom';
import { Leaf } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import apiServerClient from '@/lib/apiServerClient';
import { notifyError, notifySuccess } from '@/lib/notifications.js';
import Header from '@/components/Header.jsx';
import Footer from '@/components/Footer.jsx';
import CartDrawer from '@/components/CartDrawer.jsx';

const isValidEmail = (value) => /\S+@\S+\.\S+/.test(String(value || '').trim());
const FORGOT_PASSWORD_SUCCESS_MESSAGE = 'If an account exists for this email, a password reset link has been sent.';

const ForgotPasswordPage = () => {
  const [email, setEmail] = useState('');
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [cartDrawerOpen, setCartDrawerOpen] = useState(false);

  const validateField = (value) => {
    if (!String(value || '').trim()) return 'Email is required';
    if (!isValidEmail(value)) return 'Enter a valid email address';
    return '';
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const emailError = validateField(email);
    if (emailError) {
      setErrors({ email: emailError });
      notifyError('Validation error', 'Please enter a valid email address.');
      return;
    }

    setLoading(true);
    try {
      const response = await apiServerClient.fetch('/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });

      if (!response.ok) {
        const data = await response.json().catch(() => {});
        throw new Error(data?.error || 'Unable to send reset link');
      }

      setSent(true);
      notifySuccess('Check your email', FORGOT_PASSWORD_SUCCESS_MESSAGE);
    } catch (error) {
      notifyError('Unable to send reset link', error.message || 'Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Helmet>
        <title>Forgot Password - AnfaStyles</title>
        <meta name="description" content="Request a password reset link" />
      </Helmet>
      <Header onCartClick={() => setCartDrawerOpen(true)} />
      <CartDrawer open={cartDrawerOpen} onClose={() => setCartDrawerOpen(false)} />

      <main className="py-20">
        <div className="container-custom max-w-md">
          <div className="text-center mb-8">
            <div className="w-16 h-16 rounded-full bg-primary flex items-center justify-center mx-auto mb-4">
              <Leaf className="w-8 h-8 text-primary-foreground" />
            </div>
            <h1 className="text-3xl font-bold mb-2">Forgot password</h1>
            <p className="text-muted-foreground">Enter your email and we’ll send reset instructions.</p>
          </div>

          <form onSubmit={handleSubmit} className="bg-card border border-border rounded-xl p-6 space-y-4">
            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                autoComplete="email"
                aria-invalid={!!errors.email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  setErrors((prev) => ({ ...prev, email: '' }));
                }}
              />
              {errors.email && <p className="text-sm text-destructive mt-1">{errors.email}</p>}
            </div>

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? 'Sending...' : 'Send reset link'}
            </Button>

            {sent && (
              <p className="text-sm text-success mt-1">{FORGOT_PASSWORD_SUCCESS_MESSAGE}</p>
            )}

            <p className="text-center text-sm text-muted-foreground">
              Remembered your password?{' '}
              <Link to="/login" className="text-primary hover:underline font-medium">
                Sign in
              </Link>
            </p>
          </form>
        </div>
      </main>

      <Footer />
    </>
  );
};

export default ForgotPasswordPage;
