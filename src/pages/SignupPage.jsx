import React, { useState } from 'react';
import { Helmet } from 'react-helmet';
import { Link, useNavigate } from 'react-router-dom';
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

const SignupPage = () => {
  const navigate = useNavigate();
  const { register } = useAuth();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [cartDrawerOpen, setCartDrawerOpen] = useState(false);

  const validateField = (field, value) => {
    if (field === 'name') {
      if (!String(value || '').trim()) return 'Name is required';
      return '';
    }

    if (field === 'email') {
      if (!String(value || '').trim()) return 'Email is required';
      if (!isValidEmail(value)) return 'Enter a valid email address';
      return '';
    }

    if (field === 'password') {
      if (!value) return 'Password is required';
      if (String(value).length < 8) return 'Password must be at least 8 characters';
      return '';
    }

    if (field === 'confirmPassword') {
      if (!value) return 'Confirm password is required';
      if (value !== password) return 'Passwords do not match';
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
    const nameError = validateField('name', name);
    const emailError = validateField('email', email);
    const passwordError = validateField('password', password);
    const confirmPasswordError = validateField('confirmPassword', confirmPassword);

    if (nameError) newErrors.name = nameError;
    if (emailError) newErrors.email = emailError;
    if (passwordError) newErrors.password = passwordError;
    if (confirmPasswordError) newErrors.confirmPassword = confirmPasswordError;

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      notifyError('Please check the highlighted fields', 'Complete the required account details to continue.');
      return;
    }

    setLoading(true);
    try {
      await register(name, email, password);
      notifySuccess('Account created successfully', 'Your account is ready to use.');
      navigate('/account');
    } catch (error) {
      notifyError('Registration failed', error.message || 'Please review your details and try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Helmet>
        <title>Sign up - AnfaStyles</title>
        <meta name="description" content="Create your AnfaStyles account" />
      </Helmet>

      <Header onCartClick={() => setCartDrawerOpen(true)} />
      <CartDrawer open={cartDrawerOpen} onClose={() => setCartDrawerOpen(false)} />

      <main className="py-20">
        <div className="container-custom max-w-md">
          <div className="text-center mb-8">
            <div className="w-16 h-16 rounded-full bg-primary flex items-center justify-center mx-auto mb-4">
              <Leaf className="w-8 h-8 text-primary-foreground" />
            </div>
            <h1 className="text-3xl font-bold mb-2">Join the Soil Community</h1>
            <p className="text-muted-foreground">Create your account</p>
          </div>

          <form onSubmit={handleSubmit} className="bg-card border border-border rounded-xl p-6 space-y-4">
            <div>
              <Label htmlFor="name">Full name</Label>
              <Input
                id="name"
                value={name}
                required
                autoComplete="name"
                aria-invalid={Boolean(errors.name)}
                onChange={(e) => {
                  setName(e.target.value);
                  setErrors(prev => ({ ...prev, name: '' }));
                }}
                onBlur={() => handleFieldBlur('name', name)}
              />
              {errors.name && <p className="text-sm text-destructive mt-1">{errors.name}</p>}
            </div>

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
                autoComplete="new-password"
                aria-invalid={Boolean(errors.password)}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setErrors(prev => ({ ...prev, password: '' }));
                }}
                onBlur={() => handleFieldBlur('password', password)}
              />
              {errors.password && <p className="text-sm text-destructive mt-1">{errors.password}</p>}
            </div>

            <div>
              <Label htmlFor="confirmPassword">Confirm password</Label>
              <PasswordInput
                id="confirmPassword"
                value={confirmPassword}
                required
                autoComplete="new-password"
                aria-invalid={Boolean(errors.confirmPassword)}
                onChange={(e) => {
                  setConfirmPassword(e.target.value);
                  setErrors(prev => ({ ...prev, confirmPassword: '' }));
                }}
                onBlur={() => handleFieldBlur('confirmPassword', confirmPassword)}
              />
              {errors.confirmPassword && <p className="text-sm text-destructive mt-1">{errors.confirmPassword}</p>}
            </div>

            <Button type="submit" disabled={loading} className="w-full">
              {loading ? 'Creating account...' : 'Create account'}
            </Button>

            <p className="text-center text-sm text-muted-foreground">
              Already have an account?{' '}
              <Link to="/login" className="text-primary hover:underline font-medium">
                Login
              </Link>
            </p>
          </form>
        </div>
      </main>

      <Footer />
    </>
  );
};

export default SignupPage;

