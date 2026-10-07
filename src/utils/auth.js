// Frontend-only auth helpers. Accounts live in localStorage ("ps_accounts").
// NOTE: the hash below only keeps passwords from sitting in plain text.
// It is NOT real security. Real auth needs a backend.

export const DEMO_DRIVER_EMAIL = 'arjun@parksphere.io';
export const DEMO_HOST_EMAIL = 'vikram@host.io';

export const DEMO_CREDENTIALS = {
  driver: { email: DEMO_DRIVER_EMAIL, password: 'arjun123' },
  host: { email: DEMO_HOST_EMAIL, password: 'vikram123' }
};

export const normalizeEmail = (email) => String(email || '').trim().toLowerCase();

// Small synchronous string hash (cyrb53), salted with the email.
function cyrb53(str, seed = 0) {
  let h1 = 0xdeadbeef ^ seed;
  let h2 = 0x41c6ce57 ^ seed;
  for (let i = 0; i < str.length; i++) {
    const ch = str.charCodeAt(i);
    h1 = Math.imul(h1 ^ ch, 2654435761);
    h2 = Math.imul(h2 ^ ch, 1597334677);
  }
  h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909);
  h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909);
  return 4294967296 * (2097151 & h2) + (h1 >>> 0);
}

export const hashPassword = (email, password) =>
  cyrb53(`${normalizeEmail(email)}::${password}`).toString(36);

export const accountKey = (role, email) => `${role}:${normalizeEmail(email)}`;

// Builds a per-account localStorage key, e.g. ps_userBookings:arjun@parksphere.io
export const userKey = (base, email) => `${base}:${normalizeEmail(email)}`;

// Your original static users become demo accounts, so their data is never lost.
export const SEED_ACCOUNTS = [
  {
    role: 'driver',
    email: DEMO_DRIVER_EMAIL,
    passwordHash: hashPassword(DEMO_DRIVER_EMAIL, DEMO_CREDENTIALS.driver.password),
    profile: {
      name: 'Arjun Rao',
      email: DEMO_DRIVER_EMAIL,
      role: 'driver',
      phone: '+91 98765 43210',
      vehiclePlate: 'TS 09 EZ 4088',
      subscription: 'Pro Plan'
    }
  },
  {
    role: 'host',
    email: DEMO_HOST_EMAIL,
    passwordHash: hashPassword(DEMO_HOST_EMAIL, DEMO_CREDENTIALS.host.password),
    profile: {
      name: 'Vikram Sharma',
      email: DEMO_HOST_EMAIL,
      role: 'host',
      phone: '+91 99887 66554',
      companyName: 'Smart Bay Homes'
    }
  }
];

export function findAccount(accounts, role, email) {
  const key = accountKey(role, email);
  return accounts.find((a) => accountKey(a.role, a.email) === key) || null;
}

export function authenticate(accounts, role, email, password) {
  const roleLabel = role === 'host' ? 'host' : 'driver';
  const account = findAccount(accounts, role, email);
  if (!account) {
    return { ok: false, error: `No ${roleLabel} account found with this email. Please sign up first.` };
  }
  if (account.passwordHash !== hashPassword(email, password)) {
    return { ok: false, error: 'Incorrect password. Please try again.' };
  }
  return { ok: true, account };
}

export function registerAccount(accounts, profile, password) {
  const roleLabel = profile.role === 'host' ? 'host' : 'driver';
  const email = normalizeEmail(profile.email);
  if (findAccount(accounts, profile.role, email)) {
    return { ok: false, error: `A ${roleLabel} account with this email already exists. Please log in.` };
  }
  const account = {
    role: profile.role,
    email,
    passwordHash: hashPassword(email, password),
    profile: { ...profile, email }
  };
  return { ok: true, account, accounts: [...accounts, account] };
}