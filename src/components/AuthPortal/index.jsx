import React, { useState } from 'react';
import './index.css';
import { DEMO_CREDENTIALS } from '../../utils/auth';

export default function AuthPortal({
  onLogin,
  onSignup,
  showToast,
  initialRole = 'driver',
  initialMode = 'login'
}) {
  const [role, setRole] = useState(initialRole);
  const [authMode, setAuthMode] = useState(initialMode);
  const [error, setError] = useState('');

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [vehiclePlate, setVehiclePlate] = useState('');

  const roleLabel = role === 'host' ? 'Host' : 'Driver';

  const clearFields = () => {
    setName('');
    setEmail('');
    setPassword('');
    setPhone('');
    setCompanyName('');
    setVehiclePlate('');
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
    const demo = DEMO_CREDENTIALS[role];
    setAuthMode('login');
    setEmail(demo.email);
    setPassword(demo.password);
    setError('');
  };

  const handleAuth = (e) => {
    e.preventDefault();
    setError('');

    const trimmedEmail = email.trim();

    if (authMode === 'login') {
      if (!trimmedEmail || !password) {
        setError('Please enter your email and password.');
        return;
      }
      const result = onLogin(role, trimmedEmail, password);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      showToast?.(`Logged in successfully as ${role === 'host' ? 'Space Host' : 'Vehicle Driver'}: ${result.account.profile.name}`);
      return;
    }

    // SIGN UP
    const trimmedName = name.trim();
    if (!trimmedName || !trimmedEmail || !password) {
      setError('Please fill in all required details before continuing.');
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
      setError('Please enter your space / company name.');
      return;
    }
    if (role === 'driver' && !vehiclePlate.trim()) {
      setError('Please enter your vehicle plate.');
      return;
    }

    const profile = role === 'host'
      ? { name: trimmedName, email: trimmedEmail, role, phone: phone.trim(), companyName: companyName.trim() }
      : { name: trimmedName, email: trimmedEmail, role, phone: phone.trim(), vehiclePlate: vehiclePlate.trim(), subscription: 'Free' };

    const result = onSignup(profile, password);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    showToast?.(`Account created successfully as ${role === 'host' ? 'Space Host' : 'Vehicle Driver'}: ${trimmedName}`);
  };

  return (
    <div className="auth-box">

      <div className="auth-header">
        <span className="auth-badge">
          ParkSphere Access
        </span>

        <h2>
          {authMode === 'login' ? `Login as ${roleLabel}` : `Sign Up as ${roleLabel}`}
        </h2>
      </div>

      <p>
        {authMode === 'login'
          ? `Welcome back ${role === 'host' ? 'host' : 'driver'}. Login to access your ParkSphere account.`
          : `Create your ${role === 'host' ? 'host' : 'driver'} account and get started with ParkSphere.`}
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

      <form onSubmit={handleAuth} className="auth-form">

        {/* SIGNUP ONLY: FULL NAME */}
        {authMode === 'signup' && (
          <div className="input-group">
            <label htmlFor="auth-full-name">Full Name</label>
            <input
              id="auth-full-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={role === 'host' ? 'Vikram Sharma' : 'Arjun Rao'}
              required
            />
          </div>
        )}

        {/* EMAIL */}
        <div className="input-group">
          <label htmlFor="auth-email-address">Email Address</label>
          <input
            id="auth-email-address"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            required
          />
        </div>

        {/* SIGNUP ONLY FIELDS */}
        {authMode === 'signup' && (
          <>
            <div className="input-group">
              <label htmlFor="auth-phone">Phone Number</label>
              <input
                id="auth-phone"
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder={role === 'host' ? '+91 99887 66554' : '+91 98765 43210'}
                required
              />
            </div>

            {role === 'host' ? (
              <div className="input-group">
                <label htmlFor="auth-company">Space / Company Name</label>
                <input
                  id="auth-company"
                  type="text"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  placeholder="Smart Bay Homes"
                  required
                />
              </div>
            ) : (
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
          </>
        )}

        {/* PASSWORD */}
        <div className="input-group">
          <label htmlFor="auth-password">Password</label>
          <input
            id="auth-password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder={authMode === 'login' ? 'Enter your password' : 'Create a password (min 6 characters)'}
            required
          />
        </div>

        {error && (
          <p role="alert" style={{ color: '#b91c1c', background: '#fee2e2', border: '1px solid #fca5a5', borderRadius: 8, padding: '8px 12px', fontSize: 13, margin: '4px 0 12px' }}>
            {error}
          </p>
        )}

        {/* SUBMIT */}
        <button type="submit" className="btn-auth-submit">
          {authMode === 'login' ? `Login as ${roleLabel}` : `Create ${roleLabel} Account`}
        </button>

        {/* SIGNUP / LOGIN SWITCH */}
        <p className="auth-footer-text">
          {authMode === 'login' ? (
            <>
              Don't have a {roleLabel} account?{' '}
              <button type="button" className="auth-link-button" onClick={switchToSignup}>
                Sign up as {roleLabel}
              </button>
            </>
          ) : (
            <>
              Already have a {roleLabel} account?{' '}
              <button type="button" className="auth-link-button" onClick={switchToLogin}>
                Login as {roleLabel}
              </button>
            </>
          )}
        </p>

        {/* DEMO ACCOUNT HINT */}
        {authMode === 'login' && (
          <p className="auth-footer-text" style={{ fontSize: 12 }}>
            Want to look around first?{' '}
            <button type="button" className="auth-link-button" onClick={fillDemo}>
              Use the demo {roleLabel.toLowerCase()} account
            </button>
          </p>
        )}

      </form>

    </div>
  );
}