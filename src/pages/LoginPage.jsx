import React, { useState } from 'react';
import { Helmet } from 'react-helmet';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Leaf } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { PasswordInput } from '@/components/ui/password-input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/contexts/AuthContext.jsx';
import { notifyError, notifySuccess } from '@/lib/notifications.js';
import Header from '@/components/Header.jsx';
import Footer from '@/components/Footer.jsx';
import CartDrawer from '@/components/CartDrawer.jsx';

const isValidEmail = (value) => /\S+@\S+\.\S+/.test(String(value || '').trim());

const LoginPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [cartDrawerOpen, setCartDrawerOpen] = useState(false);

  const from = location.state?.from?.pathname || '/account';

  const validateField = (field, value) => {
    if (field === 'email') {
      if (!String(value || '').trim()) return 'Email is required';
      if (!isValidEmail(value)) return 'Enter a valid email address';
      return '';
    }

    if (field === 'password') {
      if (!value) return 'Password is required';
      return '';
    }

    return '';
  };

  const handleFieldBlur = (field, value) => {
    const message = validateField(field, value);
    if (!message) return;

    setErrors((prev) => ({ ...prev, [field]: message }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const newErrors = {};
    const emailError = validateField('email', email);
    const passwordError = validateField('password', password);
    if (emailError) newErrors.email = emailError;
    if (passwordError) newErrors.password = passwordError;

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      notifyError('Please check the highlighted fields', 'Enter your email and password to continue.');
      return;
    }

    setLoading(true);
    try {
      await login(email, password);
      notifySuccess('Welcome back', 'You are now signed in.');
      navigate(from, { replace: true });
    } catch (error) {
      notifyError('Login failed', error.message || 'Please check your credentials and try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Helmet>
        <title>Login - AnfaStyles</title>
        <meta name="description" content="Login to your AnfaStyles account" />
      </Helmet>

      <Header onCartClick={() => setCartDrawerOpen(true)} />
      <CartDrawer open={cartDrawerOpen} onClose={() => setCartDrawerOpen(false)} />

      <main className="py-20">
        <div className="container-custom max-w-md">
          <div className="text-center mb-8">
            <div className="w-16 h-16 rounded-full bg-primary flex items-center justify-center mx-auto mb-4">
              <Leaf className="w-8 h-8 text-primary-foreground" />
            </div>
            <h1 className="text-3xl font-bold mb-2">Welcome back</h1>
            <p className="text-muted-foreground">Login to your account</p>
          </div>

          <form onSubmit={handleSubmit} className="bg-card border border-border rounded-xl p-6 space-y-4">
            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                required
                autoComplete="email"
                aria-invalid={Boolean(errors.email)}
                onChange={(e) => {
                  setEmail(e.target.value);
                  setErrors(prev => ({ ...prev, email: '' }));
                }}
                onBlur={() => handleFieldBlur('email', email)}
              />
              {errors.email && <p className="text-sm text-destructive mt-1">{errors.email}</p>}
            </div>

            <div>
              <Label htmlFor="password">Password</Label>
              <PasswordInput
                id="password"
                value={password}
                required
                autoComplete="current-password"
                aria-invalid={Boolean(errors.password)}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setErrors(prev => ({ ...prev, password: '' }));
                }}
                onBlur={() => handleFieldBlur('password', password)}
              />
              {errors.password && <p className="text-sm text-destructive mt-1">{errors.password}</p>}
            </div>

            <p className="text-right text-sm text-muted-foreground">
              <Link to="/forgot-password" className="text-primary hover:underline font-medium">
                Forgot password?
              </Link>
            </p>

            <Button type="submit" disabled={loading} className="w-full">
              {loading ? 'Logging in...' : 'Login'}
            </Button>

            <p className="text-center text-sm text-muted-foreground">
              Don't have an account?{' '}
              <Link to="/register" className="text-primary hover:underline font-medium">
                Sign up
              </Link>
            </p>
          </form>
        </div>
      </main>

      <Footer />
    </>
  );
};

export default LoginPage;
