
import React, { useState } from 'react';
import './index.css';

export default function AuthPortal({
  user,
  profiles,
  setUser,
  setCurrentTab,
  showToast
}) {
  const [role, setRole] = useState(user?.role || 'driver');
  const [authMode, setAuthMode] = useState('login');

  const [name, setName] = useState(
    user?.name || (role === 'host' ? 'Vikram Sharma' : 'Arjun Rao')
  );

  const [email, setEmail] = useState(
    user?.email || (role === 'host' ? 'vikram@host.io' : 'arjun@parksphere.io')
  );

  const [password, setPassword] = useState('');

  const [phone, setPhone] = useState(
    user?.phone || (role === 'host' ? '+91 99887 66554' : '+91 98765 43210')
  );

  const [companyName, setCompanyName] = useState(
    user?.companyName || ''
  );

  const [vehiclePlate, setVehiclePlate] = useState(
    user?.vehiclePlate || ''
  );

  const handleRoleChange = (newRole) => {
    setRole(newRole);
    setAuthMode('login');
    setPassword('');

    const target = profiles?.[newRole] || {};
    setName(target.name || '');
    setEmail(target.email || '');
    setPhone(target.phone || '');
    setCompanyName(target.companyName || '');
    setVehiclePlate(target.vehiclePlate || '');
  };

  const switchToSignup = () => {
    setAuthMode('signup');
    setPassword('');
  };

  const switchToLogin = () => {
    setAuthMode('login');
    setPassword('');
  };

  const handleAuth = (e) => {
    e.preventDefault();

    const trimmedName = name.trim();
    const trimmedEmail = email.trim();

    if (!trimmedName || !trimmedEmail || !password.trim()) {
      showToast?.(
        'Please fill in all required details before continuing.'
      );
      return;
    }

    // Start from this role's own profile so driver and host data never mix.
    const base = profiles?.[role] || {};
    const updatedUser = role === 'host'
      ? { ...base, name: trimmedName, email: trimmedEmail, role, phone, companyName }
      : { ...base, name: trimmedName, email: trimmedEmail, role, phone, vehiclePlate, subscription: base.subscription || 'Free' };

    setUser?.(updatedUser);

    const message =
      authMode === 'login'
        ? `Logged in successfully as ${
            role === 'host' ? 'Space Host' : 'Vehicle Driver'
          }: ${trimmedName}`
        : `Account created successfully as ${
            role === 'host' ? 'Space Host' : 'Vehicle Driver'
          }: ${trimmedName}`;

    showToast?.(message);

    setCurrentTab?.(
      role === 'host' ? 'host-listings' : 'find'
    );
  };

  return (
    <div className="auth-box">

      <div className="auth-header">
        <span className="auth-badge">
          ParkSphere Access
        </span>

        <h2>
          {authMode === 'login'
            ? `Login as ${role === 'host' ? 'Host' : 'Driver'}`
            : `Sign Up as ${role === 'host' ? 'Host' : 'Driver'}`}
        </h2>
        {role === 'driver' && profiles?.driver && (
          <span style={{ display: 'inline-block', marginTop: 8, padding: '3px 12px', borderRadius: 20, fontSize: 12, fontWeight: 700, color: '#fff', background: profiles.driver.subscription === 'Ultimate' ? '#6d28d9' : profiles.driver.subscription === 'Pro Plan' ? '#059669' : '#64748b' }}>
            Current plan: {profiles.driver.subscription === 'Pro Plan' ? 'Pro' : profiles.driver.subscription === 'Ultimate' ? 'Ultimate VIP' : 'Free'}
          </span>
        )}
      </div>

      <p>
        {authMode === 'login'
          ? `Welcome back ${
              role === 'host' ? 'host' : 'driver'
            }. Login to access your ParkSphere account.`
          : `Create your ${
              role === 'host' ? 'host' : 'driver'
            } account and get started with ParkSphere.`}
      </p>

      {/* ROLE SELECTION */}
      <div className="role-switch">

        <button
          type="button"
          className={role === 'driver' ? 'active' : ''}
          onClick={() => handleRoleChange('driver')}
        >
          🚗 Driver
        </button>

        <button
          type="button"
          className={role === 'host' ? 'active' : ''}
          onClick={() => handleRoleChange('host')}
        >
          🏠 Host
        </button>

      </div>

      <form
        onSubmit={handleAuth}
        className="auth-form"
      >

        {/* FULL NAME */}
        <div className="input-group">

          <label htmlFor="auth-full-name">
            Full Name
          </label>

          <input
            id="auth-full-name"
            type="text"
            value={name}
            onChange={(e) =>
              setName(e.target.value)
            }
            placeholder={
              role === 'host'
                ? 'Vikram Sharma'
                : 'Arjun Rao'
            }
            required
          />

        </div>

        {/* EMAIL */}
        <div className="input-group">

          <label htmlFor="auth-email-address">
            Email Address
          </label>

          <input
            id="auth-email-address"
            type="email"
            value={email}
            onChange={(e) =>
              setEmail(e.target.value)
            }
            placeholder="you@example.com"
            required
          />

        </div>

        {/* SIGNUP ONLY FIELDS */}
        {authMode === 'signup' && (
          <>
            <div className="input-group">

              <label htmlFor="auth-phone">
                Phone Number
              </label>

              <input
                id="auth-phone"
                type="tel"
                value={phone}
                onChange={(e) =>
                  setPhone(e.target.value)
                }
                placeholder={
                  role === 'host'
                    ? '+91 99887 66554'
                    : '+91 98765 43210'
                }
                required
              />

            </div>

            {role === 'host' ? (

              <div className="input-group">

                <label htmlFor="auth-company">
                  Space / Company Name
                </label>

                <input
                  id="auth-company"
                  type="text"
                  value={companyName}
                  onChange={(e) =>
                    setCompanyName(e.target.value)
                  }
                  placeholder="Smart Bay Homes"
                  required
                />

              </div>

            ) : (

              <div className="input-group">

                <label htmlFor="auth-vehicle">
                  Vehicle Plate
                </label>

                <input
                  id="auth-vehicle"
                  type="text"
                  value={vehiclePlate}
                  onChange={(e) =>
                    setVehiclePlate(e.target.value)
                  }
                  placeholder="TS 09 EZ 4088"
                  required
                />

              </div>

            )}
          </>
        )}

        {/* PASSWORD */}
        <div className="input-group">

          <label htmlFor="auth-password">
            Password
          </label>

          <input
            id="auth-password"
            type="password"
            value={password}
            onChange={(e) =>
              setPassword(e.target.value)
            }
            placeholder={
              authMode === 'login'
                ? 'Enter your password'
                : 'Create a strong password'
            }
            required
          />

        </div>

        {/* SUBMIT */}
        <button
          type="submit"
          className="btn-auth-submit"
        >
          {authMode === 'login'
            ? `Login as ${
                role === 'host' ? 'Host' : 'Driver'
              }`
            : `Create ${
                role === 'host' ? 'Host' : 'Driver'
              } Account`}
        </button>

        {/* CORRESPONDING SIGNUP / LOGIN */}
        <p className="auth-footer-text">

          {authMode === 'login' ? (
            <>
              Don't have a{' '}
              {role === 'host' ? 'Host' : 'Driver'} account?

              {' '}

              <button
                type="button"
                className="auth-link-button"
                onClick={switchToSignup}
              >
                Sign up as {role === 'host' ? 'Host' : 'Driver'}
              </button>
            </>
          ) : (
            <>
              Already have a{' '}
              {role === 'host' ? 'Host' : 'Driver'} account?

              {' '}

              <button
                type="button"
                className="auth-link-button"
                onClick={switchToLogin}
              >
                Login as {role === 'host' ? 'Host' : 'Driver'}
              </button>
            </>
          )}

        </p>

      </form>

    </div>
  );
}

