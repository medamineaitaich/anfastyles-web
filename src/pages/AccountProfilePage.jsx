import React, { useEffect, useMemo, useState } from 'react';
import { Helmet } from 'react-helmet';
import { Link } from 'react-router-dom';
import { ChevronLeft, LogOut, Settings, Shield, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { PasswordInput } from '@/components/ui/password-input';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import { notifyError, notifySuccess } from '@/lib/notifications.js';
import { useAuth } from '@/contexts/AuthContext.jsx';
import apiServerClient from '@/lib/apiServerClient';
import Header from '@/components/Header.jsx';
import Footer from '@/components/Footer.jsx';
import CartDrawer from '@/components/CartDrawer.jsx';

const emptyProfileForm = {
  firstName: '',
  lastName: '',
  email: '',
};

const emptyPasswordForm = {
  currentPassword: '',
  newPassword: '',
  confirmNewPassword: '',
};

const buildDisplayName = (firstName, lastName, email) => {
  const fullName = `${String(firstName || '').trim()} ${String(lastName || '').trim()}`.trim();
  return fullName || String(email || '').trim();
};

const isValidEmail = (value) => /\S+@\S+\.\S+/.test(String(value || '').trim());

const AccountProfilePage = ({ section = 'profile' }) => {
  const { updateProfile, changePassword, logout } = useAuth();
  const [cartDrawerOpen, setCartDrawerOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [profileForm, setProfileForm] = useState(emptyProfileForm);
  const [profileErrors, setProfileErrors] = useState({});
  const [profileLoading, setProfileLoading] = useState(false);
  const [passwordForm, setPasswordForm] = useState(emptyPasswordForm);
  const [passwordErrors, setPasswordErrors] = useState({});
  const [passwordLoading, setPasswordLoading] = useState(false);

  const isSettingsView = section === 'settings';
  const pageTitle = isSettingsView ? 'Account settings' : 'Profile details';
  const pageDescription = isSettingsView
    ? 'Manage your password and account preferences in one place.'
    : 'Update the personal details tied to your AnfaStyles account.';
  const displayName = useMemo(
    () => buildDisplayName(profileForm.firstName, profileForm.lastName, profileForm.email),
    [profileForm.email, profileForm.firstName, profileForm.lastName]
  );

  useEffect(() => {
    const loadProfile = async () => {
      try {
        const response = await apiServerClient.fetch('/auth/me-profile');
        if (!response.ok) {
          const data = await response.json().catch(() => null);
          throw new Error(data?.error || 'Unable to load your profile');
        }

        const data = await response.json();
        setProfileForm({
          firstName: data?.firstName || '',
          lastName: data?.lastName || '',
          email: data?.email || '',
        });
      } catch (error) {
        notifyError('Unable to load account details', error.message || 'Please refresh and try again.');
      } finally {
        setLoading(false);
      }
    };

    loadProfile();
  }, []);

  const handleProfileFieldChange = (field, value) => {
    setProfileForm((prev) => ({ ...prev, [field]: value }));
    setProfileErrors((prev) => ({ ...prev, [field]: '' }));
  };

  const handlePasswordFieldChange = (field, value) => {
    setPasswordForm((prev) => ({ ...prev, [field]: value }));
    setPasswordErrors((prev) => ({ ...prev, [field]: '' }));
  };

  const validateProfileForm = () => {
    const nextErrors = {};

    if (!profileForm.firstName.trim()) {
      nextErrors.firstName = 'First name is required';
    }

    if (!profileForm.lastName.trim()) {
      nextErrors.lastName = 'Last name is required';
    }

    if (!profileForm.email.trim()) {
      nextErrors.email = 'Email is required';
    } else if (!isValidEmail(profileForm.email)) {
      nextErrors.email = 'Enter a valid email address';
    }

    setProfileErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const validatePasswordForm = () => {
    const nextErrors = {};

    if (!passwordForm.currentPassword) {
      nextErrors.currentPassword = 'Current password is required';
    }

    if (!passwordForm.newPassword) {
      nextErrors.newPassword = 'New password is required';
    } else if (passwordForm.newPassword.length < 8) {
      nextErrors.newPassword = 'Password must be at least 8 characters';
    }

    if (!passwordForm.confirmNewPassword) {
      nextErrors.confirmNewPassword = 'Please confirm new password';
    } else if (passwordForm.confirmNewPassword !== passwordForm.newPassword) {
      nextErrors.confirmNewPassword = 'Passwords do not match';
    }

    setPasswordErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSaveProfile = async (event) => {
    event.preventDefault();

    if (!validateProfileForm()) {
      notifyError('Cannot save profile', 'Fix the highlighted fields first.');
      return;
    }

    setProfileLoading(true);
    try {
      await updateProfile({
        firstName: profileForm.firstName.trim(),
        lastName: profileForm.lastName.trim(),
        email: profileForm.email.trim(),
      });
      notifySuccess('Profile updated', 'Your account details have been saved.');
    } catch (error) {
      notifyError('Save failed', error.message || 'Unable to update profile.');
    } finally {
      setProfileLoading(false);
    }
  };

  const handleChangePassword = async (event) => {
    event.preventDefault();

    if (!validatePasswordForm()) {
      notifyError('Cannot change password', 'Fix the highlighted fields first.');
      return;
    }

    setPasswordLoading(true);
    try {
      await changePassword({
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword,
        confirmPassword: passwordForm.confirmNewPassword,
      });
      notifySuccess('Password changed', 'Your password has been updated successfully.');
      setPasswordForm(emptyPasswordForm);
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

  const profileSection = (
    <section className="rounded-xl border border-border bg-card p-6">
      <div className="mb-6 flex items-start gap-4">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
          <User className="h-6 w-6 text-primary" />
        </div>
        <div>
          <h2 className="text-2xl font-bold">Account details</h2>
          <p className="text-sm text-muted-foreground">Update the name and email used across your account.</p>
        </div>
      </div>

      {loading ? (
        <div className="space-y-4">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
        </div>
      ) : (
        <form onSubmit={handleSaveProfile} className="grid gap-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <Label htmlFor="account-first-name">First name</Label>
              <Input
                id="account-first-name"
                value={profileForm.firstName}
                onChange={(event) => handleProfileFieldChange('firstName', event.target.value)}
                aria-invalid={Boolean(profileErrors.firstName)}
              />
              {profileErrors.firstName && <p className="mt-1 text-sm text-destructive">{profileErrors.firstName}</p>}
            </div>

            <div>
              <Label htmlFor="account-last-name">Last name</Label>
              <Input
                id="account-last-name"
                value={profileForm.lastName}
                onChange={(event) => handleProfileFieldChange('lastName', event.target.value)}
                aria-invalid={Boolean(profileErrors.lastName)}
              />
              {profileErrors.lastName && <p className="mt-1 text-sm text-destructive">{profileErrors.lastName}</p>}
            </div>
          </div>

          <div>
            <Label htmlFor="account-email">Email</Label>
            <Input
              id="account-email"
              type="email"
              value={profileForm.email}
              onChange={(event) => handleProfileFieldChange('email', event.target.value)}
              aria-invalid={Boolean(profileErrors.email)}
            />
            {profileErrors.email && <p className="mt-1 text-sm text-destructive">{profileErrors.email}</p>}
          </div>

          <div className="rounded-lg border border-border bg-muted/30 p-4">
            <p className="text-sm font-medium">Display name preview</p>
            <p className="mt-1 text-sm text-muted-foreground">{displayName || 'Your display name will appear here'}</p>
          </div>

          <div className="flex flex-wrap gap-3">
            <Button type="submit" disabled={profileLoading}>
              {profileLoading ? 'Saving...' : 'Save account details'}
            </Button>
            <Button type="button" variant="outline" asChild>
              <Link to="/account/settings">Manage password</Link>
            </Button>
          </div>
        </form>
      )}
    </section>
  );

  const securitySection = (
    <section className="rounded-xl border border-border bg-card p-6">
      <div className="mb-6 flex items-start gap-4">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
          <Shield className="h-6 w-6 text-primary" />
        </div>
        <div>
          <h2 className="text-2xl font-bold">Password & security</h2>
          <p className="text-sm text-muted-foreground">Change your password without leaving the account area.</p>
        </div>
      </div>

      <form onSubmit={handleChangePassword} className="grid gap-4">
        <div>
          <Label htmlFor="current-password">Current password</Label>
          <PasswordInput
            id="current-password"
            value={passwordForm.currentPassword}
            onChange={(event) => handlePasswordFieldChange('currentPassword', event.target.value)}
            aria-invalid={Boolean(passwordErrors.currentPassword)}
          />
          {passwordErrors.currentPassword && <p className="mt-1 text-sm text-destructive">{passwordErrors.currentPassword}</p>}
        </div>

        <div>
          <Label htmlFor="new-password">New password</Label>
          <PasswordInput
            id="new-password"
            value={passwordForm.newPassword}
            onChange={(event) => handlePasswordFieldChange('newPassword', event.target.value)}
            aria-invalid={Boolean(passwordErrors.newPassword)}
          />
          {passwordErrors.newPassword && <p className="mt-1 text-sm text-destructive">{passwordErrors.newPassword}</p>}
        </div>

        <div>
          <Label htmlFor="confirm-new-password">Confirm new password</Label>
          <PasswordInput
            id="confirm-new-password"
            value={passwordForm.confirmNewPassword}
            onChange={(event) => handlePasswordFieldChange('confirmNewPassword', event.target.value)}
            aria-invalid={Boolean(passwordErrors.confirmNewPassword)}
          />
          {passwordErrors.confirmNewPassword && <p className="mt-1 text-sm text-destructive">{passwordErrors.confirmNewPassword}</p>}
        </div>

        <Button type="submit" disabled={passwordLoading} className="w-full md:w-auto">
          {passwordLoading ? 'Saving...' : 'Save new password'}
        </Button>
      </form>
    </section>
  );

  return (
    <>
      <Helmet>
        <title>{pageTitle} - AnfaStyles</title>
        <meta name="description" content={pageDescription} />
      </Helmet>

      <Header onCartClick={() => setCartDrawerOpen(true)} />
      <CartDrawer open={cartDrawerOpen} onClose={() => setCartDrawerOpen(false)} />

      <main className="py-12">
        <div className="container-custom max-w-4xl">
          <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
            <div>
              <Link
                to="/account"
                className="mb-3 inline-flex items-center text-sm text-muted-foreground transition-colors duration-200 hover:text-primary"
              >
                <ChevronLeft className="mr-1 h-4 w-4" />
                Back to account
              </Link>
              <h1 className="text-4xl font-bold text-balance md:text-5xl" style={{ letterSpacing: '-0.02em' }}>
                {pageTitle}
              </h1>
              <p className="mt-2 text-muted-foreground">{pageDescription}</p>
            </div>

            <Button variant="outline" onClick={handleLogout}>
              <LogOut className="mr-2 h-4 w-4" />
              Logout
            </Button>
          </div>

          <div className="mb-8 flex flex-wrap gap-3">
            <Button variant={isSettingsView ? 'outline' : 'default'} asChild>
              <Link to="/account/profile">
                <User className="mr-2 h-4 w-4" />
                Profile
              </Link>
            </Button>
            <Button variant={isSettingsView ? 'default' : 'outline'} asChild>
              <Link to="/account/settings">
                <Settings className="mr-2 h-4 w-4" />
                Settings
              </Link>
            </Button>
            <Button variant="ghost" asChild>
              <Link to="/orders">View orders</Link>
            </Button>
          </div>

          <div className="space-y-6">
            {isSettingsView ? (
              <>
                {securitySection}
                <Separator />
                {profileSection}
              </>
            ) : (
              <>
                {profileSection}
                <Separator />
                {securitySection}
              </>
            )}
          </div>
        </div>
      </main>

      <Footer />
    </>
  );
};

export default AccountProfilePage;
