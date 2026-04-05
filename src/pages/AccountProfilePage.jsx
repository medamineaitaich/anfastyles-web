import React, { useEffect, useMemo, useState } from 'react';
import { Helmet } from 'react-helmet';
import { Link } from 'react-router-dom';
import { ChevronLeft, LogOut, MapPin, Settings, Shield, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { PasswordInput } from '@/components/ui/password-input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import { countryOptions, getRegionFieldLabel, getRegionOptions, getRegionPlaceholder, normalizeCountryCode } from '@/lib/addressFields.js';
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

const emptyAddressForm = {
  firstName: '',
  lastName: '',
  company: '',
  address1: '',
  address2: '',
  city: '',
  state: '',
  zip: '',
  country: 'US',
  phone: '',
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

const mapCustomerAddressToForm = (address = {}, fallbacks = {}) => ({
  firstName: String(address?.first_name || fallbacks.firstName || '').trim(),
  lastName: String(address?.last_name || fallbacks.lastName || '').trim(),
  company: String(address?.company || '').trim(),
  address1: String(address?.address_1 || '').trim(),
  address2: String(address?.address_2 || '').trim(),
  city: String(address?.city || '').trim(),
  state: String(address?.state || '').trim(),
  zip: String(address?.postcode || '').trim(),
  country: normalizeCountryCode(address?.country || fallbacks.country || 'US') || 'US',
  phone: String(address?.phone || '').trim(),
});

const toProfileAddressPayload = (values = {}, options = {}) => ({
  firstName: String(values.firstName || '').trim(),
  lastName: String(values.lastName || '').trim(),
  company: String(values.company || '').trim(),
  address1: String(values.address1 || '').trim(),
  address2: String(values.address2 || '').trim(),
  city: String(values.city || '').trim(),
  state: String(values.state || '').trim(),
  zip: String(values.zip || '').trim(),
  country: normalizeCountryCode(values.country || 'US') || 'US',
  ...(options.includePhone ? { phone: String(values.phone || '').trim() } : {}),
  ...(options.email ? { email: String(options.email).trim() } : {}),
});

const AddressSection = ({
  title,
  description,
  formKey,
  values,
  errors,
  includePhone = false,
  loading = false,
  onFieldChange,
  onCountryChange,
  onSubmit,
}) => {
  const country = normalizeCountryCode(values.country);
  const regionOptions = getRegionOptions(country);
  const usesRegionSelect = Array.isArray(regionOptions) && regionOptions.length > 0;
  const regionLabel = getRegionFieldLabel(country);
  const regionPlaceholder = getRegionPlaceholder(country);

  return (
    <section className="rounded-xl border border-border bg-card p-6">
      <div className="mb-6 flex items-start gap-4">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
          <MapPin className="h-6 w-6 text-primary" />
        </div>
        <div>
          <h2 className="text-2xl font-bold">{title}</h2>
          <p className="text-sm text-muted-foreground">{description}</p>
        </div>
      </div>

      {loading ? (
        <div className="space-y-4">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
        </div>
      ) : (
        <form onSubmit={onSubmit} className="grid gap-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <Label htmlFor={`${formKey}-first-name`}>First name</Label>
              <Input
                id={`${formKey}-first-name`}
                value={values.firstName}
                onChange={(event) => onFieldChange('firstName', event.target.value)}
                aria-invalid={Boolean(errors.firstName)}
              />
              {errors.firstName && <p className="mt-1 text-sm text-destructive">{errors.firstName}</p>}
            </div>

            <div>
              <Label htmlFor={`${formKey}-last-name`}>Last name</Label>
              <Input
                id={`${formKey}-last-name`}
                value={values.lastName}
                onChange={(event) => onFieldChange('lastName', event.target.value)}
                aria-invalid={Boolean(errors.lastName)}
              />
              {errors.lastName && <p className="mt-1 text-sm text-destructive">{errors.lastName}</p>}
            </div>
          </div>

          <div>
            <Label htmlFor={`${formKey}-company`}>Company</Label>
            <Input
              id={`${formKey}-company`}
              value={values.company}
              onChange={(event) => onFieldChange('company', event.target.value)}
            />
          </div>

          <div>
            <Label htmlFor={`${formKey}-address1`}>Address line 1</Label>
            <Input
              id={`${formKey}-address1`}
              value={values.address1}
              onChange={(event) => onFieldChange('address1', event.target.value)}
              aria-invalid={Boolean(errors.address1)}
            />
            {errors.address1 && <p className="mt-1 text-sm text-destructive">{errors.address1}</p>}
          </div>

          <div>
            <Label htmlFor={`${formKey}-address2`}>Address line 2</Label>
            <Input
              id={`${formKey}-address2`}
              value={values.address2}
              onChange={(event) => onFieldChange('address2', event.target.value)}
            />
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <Label htmlFor={`${formKey}-city`}>City</Label>
              <Input
                id={`${formKey}-city`}
                value={values.city}
                onChange={(event) => onFieldChange('city', event.target.value)}
                aria-invalid={Boolean(errors.city)}
              />
              {errors.city && <p className="mt-1 text-sm text-destructive">{errors.city}</p>}
            </div>

            <div>
              <Label htmlFor={`${formKey}-state`}>{regionLabel}</Label>
              {usesRegionSelect ? (
                <Select value={values.state} onValueChange={(nextValue) => onFieldChange('state', nextValue)}>
                  <SelectTrigger
                    id={`${formKey}-state`}
                    aria-invalid={Boolean(errors.state)}
                    className={errors.state ? 'border-destructive ring-2 ring-destructive/20 focus:ring-destructive/30' : ''}
                  >
                    <SelectValue placeholder={regionPlaceholder} />
                  </SelectTrigger>
                  <SelectContent>
                    {regionOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <Input
                  id={`${formKey}-state`}
                  value={values.state}
                  onChange={(event) => onFieldChange('state', event.target.value)}
                  aria-invalid={Boolean(errors.state)}
                />
              )}
              {errors.state && <p className="mt-1 text-sm text-destructive">{errors.state}</p>}
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <Label htmlFor={`${formKey}-zip`}>ZIP / postal code</Label>
              <Input
                id={`${formKey}-zip`}
                value={values.zip}
                onChange={(event) => onFieldChange('zip', event.target.value)}
                aria-invalid={Boolean(errors.zip)}
              />
              {errors.zip && <p className="mt-1 text-sm text-destructive">{errors.zip}</p>}
            </div>

            <div>
              <Label htmlFor={`${formKey}-country`}>Country</Label>
              <Select value={values.country} onValueChange={onCountryChange}>
                <SelectTrigger id={`${formKey}-country`} aria-invalid={Boolean(errors.country)}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {countryOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.country && <p className="mt-1 text-sm text-destructive">{errors.country}</p>}
            </div>
          </div>

          {includePhone && (
            <div>
              <Label htmlFor={`${formKey}-phone`}>Phone</Label>
              <Input
                id={`${formKey}-phone`}
                type="tel"
                value={values.phone}
                onChange={(event) => onFieldChange('phone', event.target.value)}
              />
            </div>
          )}

          <Button type="submit" disabled={loading} className="w-full md:w-auto">
            {loading ? 'Saving...' : `Save ${title.toLowerCase()}`}
          </Button>
        </form>
      )}
    </section>
  );
};

const AccountProfilePage = ({ section = 'profile' }) => {
  const { updateProfile, changePassword, logout } = useAuth();
  const [cartDrawerOpen, setCartDrawerOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [profileForm, setProfileForm] = useState(emptyProfileForm);
  const [profileErrors, setProfileErrors] = useState({});
  const [profileLoading, setProfileLoading] = useState(false);
  const [billingForm, setBillingForm] = useState(emptyAddressForm);
  const [billingErrors, setBillingErrors] = useState({});
  const [billingLoading, setBillingLoading] = useState(false);
  const [shippingForm, setShippingForm] = useState(emptyAddressForm);
  const [shippingErrors, setShippingErrors] = useState({});
  const [shippingLoading, setShippingLoading] = useState(false);
  const [passwordForm, setPasswordForm] = useState(emptyPasswordForm);
  const [passwordErrors, setPasswordErrors] = useState({});
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [persistedEmail, setPersistedEmail] = useState('');

  const isSettingsView = section === 'settings';
  const pageTitle = isSettingsView ? 'Account settings' : 'Profile details';
  const pageDescription = isSettingsView
    ? 'Manage your password and saved account addresses in one place.'
    : 'Update your account details, billing address, and shipping address.';
  const displayName = useMemo(
    () => buildDisplayName(profileForm.firstName, profileForm.lastName, profileForm.email),
    [profileForm.email, profileForm.firstName, profileForm.lastName]
  );

  const applyProfileData = (data = {}) => {
    const nextProfileForm = {
      firstName: String(data?.firstName || '').trim(),
      lastName: String(data?.lastName || '').trim(),
      email: String(data?.email || '').trim(),
    };
    const billingFallbacks = {
      firstName: nextProfileForm.firstName,
      lastName: nextProfileForm.lastName,
      country: data?.shipping?.country || 'US',
    };
    const shippingFallbacks = {
      firstName: data?.billing?.first_name || nextProfileForm.firstName,
      lastName: data?.billing?.last_name || nextProfileForm.lastName,
      country: data?.billing?.country || 'US',
    };

    setProfileForm(nextProfileForm);
    setBillingForm(mapCustomerAddressToForm(data?.billing, billingFallbacks));
    setShippingForm(mapCustomerAddressToForm(data?.shipping, shippingFallbacks));
    setPersistedEmail(nextProfileForm.email);
  };

  useEffect(() => {
    const loadProfile = async () => {
      try {
        const response = await apiServerClient.fetch('/auth/me-profile');
        if (!response.ok) {
          const data = await response.json().catch(() => null);
          throw new Error(data?.error || 'Unable to load your profile');
        }

        const data = await response.json();
        applyProfileData(data);
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

  const createAddressFieldChangeHandler = (setter, errorSetter) => (field, value) => {
    setter((prev) => ({ ...prev, [field]: value }));
    errorSetter((prev) => ({ ...prev, [field]: '' }));
  };

  const createAddressCountryHandler = (setter, errorSetter) => (value) => {
    const nextCountry = normalizeCountryCode(value);
    const regionOptions = getRegionOptions(nextCountry);
    const allowedValues = regionOptions ? new Set(regionOptions.map((option) => option.value)) : null;

    setter((prev) => ({
      ...prev,
      country: nextCountry,
      state: allowedValues && prev.state && !allowedValues.has(String(prev.state).trim()) ? '' : prev.state,
    }));

    errorSetter((prev) => ({ ...prev, state: '', country: '' }));
  };

  const handleBillingFieldChange = createAddressFieldChangeHandler(setBillingForm, setBillingErrors);
  const handleShippingFieldChange = createAddressFieldChangeHandler(setShippingForm, setShippingErrors);
  const handleBillingCountryChange = createAddressCountryHandler(setBillingForm, setBillingErrors);
  const handleShippingCountryChange = createAddressCountryHandler(setShippingForm, setShippingErrors);

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

  const validateAddressForm = (values, { includePhone = false } = {}) => {
    const nextErrors = {};

    ['firstName', 'lastName', 'address1', 'city', 'state', 'zip', 'country'].forEach((field) => {
      if (!String(values[field] || '').trim()) {
        const labels = {
          firstName: 'First name',
          lastName: 'Last name',
          address1: 'Address line 1',
          city: 'City',
          state: getRegionFieldLabel(values.country),
          zip: 'ZIP / postal code',
          country: 'Country',
        };
        nextErrors[field] = `${labels[field]} is required`;
      }
    });

    if (includePhone && values.phone && !String(values.phone).trim()) {
      nextErrors.phone = 'Phone is required';
    }

    const regionOptions = getRegionOptions(values.country);
    if (String(values.state || '').trim() && Array.isArray(regionOptions) && regionOptions.length > 0) {
      const allowed = regionOptions.some((option) => option.value === String(values.state || '').trim());
      if (!allowed) {
        nextErrors.state = normalizeCountryCode(values.country) === 'CA' ? 'Select a valid province' : 'Select a valid state';
      }
    }

    return nextErrors;
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
      const data = await updateProfile({
        firstName: profileForm.firstName.trim(),
        lastName: profileForm.lastName.trim(),
        email: profileForm.email.trim(),
      });
      applyProfileData(data?.user || data);
      notifySuccess('Profile updated', 'Your account details have been saved.');
    } catch (error) {
      notifyError('Save failed', error.message || 'Unable to update profile.');
    } finally {
      setProfileLoading(false);
    }
  };

  const handleSaveBilling = async (event) => {
    event.preventDefault();

    const nextErrors = validateAddressForm(billingForm, { includePhone: false });
    setBillingErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) {
      notifyError('Cannot save billing address', 'Fix the highlighted fields first.');
      return;
    }

    const billingEmail = isValidEmail(profileForm.email) ? profileForm.email.trim() : persistedEmail;
    if (!billingEmail) {
      notifyError('Cannot save billing address', 'Save a valid account email before updating billing details.');
      return;
    }

    setBillingLoading(true);
    try {
      const data = await updateProfile({
        billing: toProfileAddressPayload(billingForm, {
          includePhone: true,
          email: billingEmail,
        }),
      });
      applyProfileData(data?.user || data);
      setBillingErrors({});
      notifySuccess('Billing address updated', 'Your billing address has been saved.');
    } catch (error) {
      notifyError('Save failed', error.message || 'Unable to update billing address.');
    } finally {
      setBillingLoading(false);
    }
  };

  const handleSaveShipping = async (event) => {
    event.preventDefault();

    const nextErrors = validateAddressForm(shippingForm);
    setShippingErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) {
      notifyError('Cannot save shipping address', 'Fix the highlighted fields first.');
      return;
    }

    setShippingLoading(true);
    try {
      const data = await updateProfile({
        shipping: toProfileAddressPayload(shippingForm),
      });
      applyProfileData(data?.user || data);
      setShippingErrors({});
      notifySuccess('Shipping address updated', 'Your shipping address has been saved.');
    } catch (error) {
      notifyError('Save failed', error.message || 'Unable to update shipping address.');
    } finally {
      setShippingLoading(false);
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

  const billingSection = (
    <AddressSection
      title="Billing address"
      description="Keep your billing details ready for future checkouts and invoices."
      formKey="billing-address"
      values={billingForm}
      errors={billingErrors}
      includePhone
      loading={loading || billingLoading}
      onFieldChange={handleBillingFieldChange}
      onCountryChange={handleBillingCountryChange}
      onSubmit={handleSaveBilling}
    />
  );

  const shippingSection = (
    <AddressSection
      title="Shipping address"
      description="Update the default address used for shipping and delivery."
      formKey="shipping-address"
      values={shippingForm}
      errors={shippingErrors}
      loading={loading || shippingLoading}
      onFieldChange={handleShippingFieldChange}
      onCountryChange={handleShippingCountryChange}
      onSubmit={handleSaveShipping}
    />
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
                {billingSection}
                <Separator />
                {shippingSection}
                <Separator />
                {profileSection}
              </>
            ) : (
              <>
                {profileSection}
                <Separator />
                {billingSection}
                <Separator />
                {shippingSection}
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
