
import React, { useState } from 'react';
import './index.css';
import { DEMO_CREDENTIALS } from '../../utils/auth';

const ROLE_INFO = {
  driver: {
    label: 'Driver',
    long: 'Vehicle Driver',
    icon: '🚗',
    name: 'Arjun Rao',
    phone: '+91 98765 43210',
  },
  host: {
    label: 'Host',
    long: 'Space Host',
    icon: '🏠',
    name: 'Vikram Sharma',
    phone: '+91 99887 66554',
  },
  captain: {
    label: 'Captain',
    long: 'Valet Captain',
    icon: '🧑‍✈️',
    name: 'Ravi Kumar',
    phone: '+91 90000 00001',
  },
};

const WELCOME = {
  driver: 'driver',
  host: 'host',
  captain: 'captain',
};

export default function AuthPortal({
  onLogin,
  onSignup,
  showToast,
  initialRole = 'driver',
  initialMode = 'login',
}) {
  const [role, setRole] = useState(
    ROLE_INFO[initialRole] ? initialRole : 'driver'
  );
  const [authMode, setAuthMode] = useState(
    initialMode === 'signup' ? 'signup' : 'login'
  );
  const [error, setError] = useState('');

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [vehiclePlate, setVehiclePlate] = useState('');
  const [serviceArea, setServiceArea] = useState('');

  const info = ROLE_INFO[role];
  const roleLabel = info.label;
  const isSignup = authMode === 'signup';

  const clearFields = () => {
    setName('');
    setEmail('');
    setPassword('');
    setPhone('');
    setCompanyName('');
    setVehiclePlate('');
    setServiceArea('');
    setError('');
  };

  const handleRoleChange = (newRole) => {
    setRole(newRole);
    setAuthMode('login');
    clearFields();
  };

  const switchToSignup = () => {
    setAuthMode('signup');
    setPassword('');
    setError('');
  };

  const switchToLogin = () => {
    setAuthMode('login');
    setPassword('');
    setError('');
  };

  const fillDemo = () => {
    const demo = DEMO_CREDENTIALS?.[role];

    if (!demo) {
      setError(`Demo credentials are not configured for ${roleLabel}.`);
      return;
    }

    setAuthMode('login');
    setEmail(demo.email);
    setPassword(demo.password);
    setError('');
  };

  const handleAuth = (e) => {
    e.preventDefault();
    setError('');

    const trimmedEmail = email.trim();

    if (!trimmedEmail || !password) {
      setError('Please enter your email and password.');
      return;
    }

    if (!isSignup) {
      const result = onLogin(role, trimmedEmail, password);

      if (!result?.ok) {
        setError(result?.error || 'Login failed. Please check your details.');
        return;
      }

      showToast?.(
        `Logged in successfully as ${info.long}: ${result.account.profile.name}`
      );
      return;
    }

    const trimmedName = name.trim();

    if (!trimmedName) {
      setError('Please enter your full name.');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }

    if (phone.replace(/\D/g, '').length < 10) {
      setError('Please enter a valid phone number.');
      return;
    }

    if (role === 'host' && !companyName.trim()) {
      setError('Please enter your space or company name.');
      return;
    }

    if (role === 'driver' && !vehiclePlate.trim()) {
      setError('Please enter your vehicle plate.');
      return;
    }

    if (role === 'captain' && !serviceArea.trim()) {
      setError('Please enter your captain service area.');
      return;
    }

    const base = {
      name: trimmedName,
      email: trimmedEmail,
      role,
      phone: phone.trim(),
    };

    let profile;

    if (role === 'host') {
      profile = {
        ...base,
        companyName: companyName.trim(),
      };
    } else if (role === 'captain') {
      profile = {
        ...base,
        serviceArea: serviceArea.trim(),
        available: true,
      };
    } else {
      profile = {
        ...base,
        vehiclePlate: vehiclePlate.trim(),
        subscription: 'Free',
      };
    }

    const result = onSignup(profile, password);

    if (!result?.ok) {
      setError(result?.error || 'Signup failed. Please try again.');
      return;
    }

    showToast?.(
      `Account created successfully as ${info.long}: ${trimmedName}`
    );
  };

  return (
    <div className="auth-box">
      <div className="auth-header">
        <span className="auth-badge">ParkSphere Access</span>

        <h2>
          {isSignup ? 'Sign Up' : 'Login'} as {roleLabel}
        </h2>
      </div>

      <p>
        {isSignup
          ? `Create your ${WELCOME[role]} account and get started with ParkSphere.`
          : `Welcome back ${WELCOME[role]}. Login to access your ParkSphere account.`}
      </p>

      {/* DRIVER, HOST AND CAPTAIN ROLE SELECTOR */}
      <div
        className="role-switch"
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
          gap: '8px',
          width: '100%',
          boxSizing: 'border-box',
        }}
      >
        {Object.entries(ROLE_INFO).map(([roleId, roleInfo]) => (
          <button
            key={roleId}
            type="button"
            aria-pressed={role === roleId}
            className={role === roleId ? 'active' : ''}
            onClick={() => handleRoleChange(roleId)}
            style={{
              minWidth: 0,
              padding: '12px 4px',
              whiteSpace: 'normal',
              cursor: 'pointer',
              fontWeight: 700,
              borderRadius: '10px',
              border:
                role === roleId
                  ? '2px solid #10b981'
                  : '1px solid #dbe3ee',
              background:
                role === roleId ? '#ecfdf5' : '#ffffff',
              color: '#065f46',
            }}
          >
            <span>{roleInfo.icon}</span>{' '}
            <span>{roleInfo.label}</span>
          </button>
        ))}
      </div>

      <form onSubmit={handleAuth} className="auth-form">
        {isSignup && (
          <div className="input-group">
            <label htmlFor="auth-full-name">Full Name</label>
            <input
              id="auth-full-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={info.name}
              required
            />
          </div>
        )}

        <div className="input-group">
          <label htmlFor="auth-email-address">Email Address</label>
          <input
            id="auth-email-address"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            autoComplete="email"
            required
          />
        </div>

        {isSignup && (
          <>
            <div className="input-group">
              <label htmlFor="auth-phone">Phone Number</label>
              <input
                id="auth-phone"
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder={info.phone}
                autoComplete="tel"
                required
              />
            </div>

            {role === 'host' && (
              <div className="input-group">
                <label htmlFor="auth-company">
                  Space / Company Name
                </label>
                <input
                  id="auth-company"
                  type="text"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  placeholder="Smart Bay Homes"
                  required
                />
              </div>
            )}

            {role === 'driver' && (
              <div className="input-group">
                <label htmlFor="auth-vehicle">Vehicle Plate</label>
                <input
                  id="auth-vehicle"
                  type="text"
                  value={vehiclePlate}
                  onChange={(e) => setVehiclePlate(e.target.value)}
                  placeholder="TS 09 EZ 4088"
                  required
                />
              </div>
            )}

            {role === 'captain' && (
              <div className="input-group">
                <label htmlFor="auth-area">Service Area</label>
                <input
                  id="auth-area"
                  type="text"
                  value={serviceArea}
                  onChange={(e) => setServiceArea(e.target.value)}
                  placeholder="Hyderabad, Gachibowli"
                  required
                />
              </div>
            )}
          </>
        )}

        <div className="input-group">
          <label htmlFor="auth-password">Password</label>
          <input
            id="auth-password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder={
              isSignup
                ? 'Create a password (min 6 characters)'
                : 'Enter your password'
            }
            autoComplete={isSignup ? 'new-password' : 'current-password'}
            required
          />
        </div>

        {error && (
          <p
            role="alert"
            style={{
              color: '#b91c1c',
              background: '#fee2e2',
              border: '1px solid #fca5a5',
              borderRadius: 8,
              padding: '8px 12px',
              fontSize: 13,
              margin: '4px 0 12px',
            }}
          >
            {error}
          </p>
        )}

        <button type="submit" className="btn-auth-submit">
          {isSignup
            ? `Create ${roleLabel} Account`
            : `Login as ${roleLabel}`}
        </button>

        <p className="auth-footer-text">
          {isSignup ? (
            <>
              Already have a {roleLabel} account?{' '}
              <button
                type="button"
                className="auth-link-button"
                onClick={switchToLogin}
              >
                Login as {roleLabel}
              </button>
            </>
          ) : (
            <>
              Don't have a {roleLabel} account?{' '}
              <button
                type="button"
                className="auth-link-button"
                onClick={switchToSignup}
              >
                Sign up as {roleLabel}
              </button>
            </>
          )}
        </p>

        {!isSignup && (
          <p className="auth-footer-text" style={{ fontSize: 12 }}>
            Want to look around first?{' '}
            <button
              type="button"
              className="auth-link-button"
              onClick={fillDemo}
            >
              Use the demo {roleLabel.toLowerCase()} account
            </button>
          </p>
        )}
      </form>
    </div>
  );
}
