const USER_PROFILE_STORAGE_KEY = 'anfaCheckoutProfiles';
const PENDING_PROFILE_STORAGE_KEY = 'anfaPendingCheckoutProfiles';

const normalizeText = (value) => String(value || '').trim();
const normalizeEmail = (value) => normalizeText(value).toLowerCase();

const readStorageMap = (key) => {
  if (typeof window === 'undefined') return {};

  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return {};

    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch {
    return {};
  }
};

const writeStorageMap = (key, value) => {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(key, JSON.stringify(value));
};

const normalizeAddress = (address = {}) => ({
  firstName: normalizeText(address.firstName ?? address.first_name),
  lastName: normalizeText(address.lastName ?? address.last_name),
  email: normalizeText(address.email),
  phone: normalizeText(address.phone),
  address: normalizeText(address.address ?? address.address_1),
  city: normalizeText(address.city),
  state: normalizeText(address.state),
  zip: normalizeText(address.zip ?? address.postcode),
  country: normalizeText(address.country) || 'US',
});

const buildCheckoutProfile = ({
  billingAddress,
  shippingAddress,
  shippingSameAsBilling = true,
}) => ({
  billing: normalizeAddress(billingAddress),
  shipping: normalizeAddress(shippingAddress || billingAddress),
  shippingSameAsBilling: Boolean(shippingSameAsBilling),
  updatedAt: new Date().toISOString(),
});

export const readCheckoutProfile = ({ userId, email } = {}) => {
  const normalizedUserId = normalizeText(userId);
  if (normalizedUserId) {
    const profiles = readStorageMap(USER_PROFILE_STORAGE_KEY);
    if (profiles[normalizedUserId]) {
      return profiles[normalizedUserId];
    }
  }

  const normalizedEmail = normalizeEmail(email);
  if (!normalizedEmail) return null;

  const pendingProfiles = readStorageMap(PENDING_PROFILE_STORAGE_KEY);
  return pendingProfiles[normalizedEmail] || null;
};

export const saveCheckoutProfile = ({
  userId,
  email,
  billingAddress,
  shippingAddress,
  shippingSameAsBilling = true,
}) => {
  const profile = buildCheckoutProfile({
    billingAddress,
    shippingAddress,
    shippingSameAsBilling,
  });

  const normalizedUserId = normalizeText(userId);
  const normalizedEmail = normalizeEmail(email || billingAddress?.email);

  if (normalizedUserId) {
    const profiles = readStorageMap(USER_PROFILE_STORAGE_KEY);
    profiles[normalizedUserId] = profile;
    writeStorageMap(USER_PROFILE_STORAGE_KEY, profiles);

    if (normalizedEmail) {
      const pendingProfiles = readStorageMap(PENDING_PROFILE_STORAGE_KEY);
      if (pendingProfiles[normalizedEmail]) {
        delete pendingProfiles[normalizedEmail];
        writeStorageMap(PENDING_PROFILE_STORAGE_KEY, pendingProfiles);
      }
    }

    return profile;
  }

  if (normalizedEmail) {
    const pendingProfiles = readStorageMap(PENDING_PROFILE_STORAGE_KEY);
    pendingProfiles[normalizedEmail] = profile;
    writeStorageMap(PENDING_PROFILE_STORAGE_KEY, pendingProfiles);
  }

  return profile;
};

export const claimPendingCheckoutProfile = ({ userId, email } = {}) => {
  const normalizedUserId = normalizeText(userId);
  const normalizedEmail = normalizeEmail(email);

  if (!normalizedUserId || !normalizedEmail) return null;

  const pendingProfiles = readStorageMap(PENDING_PROFILE_STORAGE_KEY);
  const pendingProfile = pendingProfiles[normalizedEmail];
  if (!pendingProfile) return null;

  const profiles = readStorageMap(USER_PROFILE_STORAGE_KEY);
  profiles[normalizedUserId] = pendingProfile;
  writeStorageMap(USER_PROFILE_STORAGE_KEY, profiles);

  delete pendingProfiles[normalizedEmail];
  writeStorageMap(PENDING_PROFILE_STORAGE_KEY, pendingProfiles);

  return pendingProfile;
};
