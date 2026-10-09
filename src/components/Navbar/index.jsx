
import React, { useState, useRef, useEffect } from 'react';
import './index.css';

export default function Navbar({
  currentTab,
  setCurrentTab,
  user,
  bookingCount,
  hostBookingCount = 0,
  violationCount = 0,
  captainActiveCount = 0,
  captainDoneCount = 0,
  hostValetAlerts = 0,
  onToggleAvailability,
  onLogout,
}) {
  const [stage, setStage] = useState(0);
  const menuRef = useRef(null);

  useEffect(() => {
    const onDown = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setStage(0);
      }
    };

    document.addEventListener('mousedown', onDown);
    document.addEventListener('touchstart', onDown);

    return () => {
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('touchstart', onDown);
    };
  }, []);

  const isDriver = user.role === 'driver';
  const isHost = user.role === 'host';
  const isCaptain = user.role === 'captain';
  const captainAvailable = user.available !== false;

  const ringColor =
    isDriver && user.subscription === 'Ultimate'
      ? '#2563eb'
      : isDriver && user.subscription === 'Pro Plan'
        ? '#16a34a'
        : 'transparent';

  const planName =
    user.subscription === 'Ultimate'
      ? 'VIP'
      : user.subscription === 'Pro Plan'
        ? 'PRO'
        : 'FREE';

  const badgeColor =
    ringColor === 'transparent' ? '#78716c' : ringColor;

  const slotsBooked = isDriver ? bookingCount : hostBookingCount;

  const homeTab = isHost
    ? 'host-listings'
    : isCaptain
      ? 'captain-dashboard'
      : 'find';

  const subtitle = isHost
    ? 'Space Host Console'
    : isCaptain
      ? 'Captain Console'
      : 'Community Micro-Parking';

  const go = (tab) => {
    setStage(0);
    setCurrentTab(tab);
  };

  return (
    <nav id="navbar-root">
      <div className="navbar-container">
        <button
          className="brand-group"
          onClick={() => go(homeTab)}
        >
          <div className="brand-logo">P</div>

          <div className="brand-details">
            <h2>ParkSphere</h2>
            <span>{subtitle}</span>
          </div>
        </button>

        <ul className="nav-items-list">
          {/* HOST NAVIGATION */}
          {isHost ? (
            <>
              <li>
                <button
                  className={`nav-link-btn host-listings-tab ${
                    currentTab === 'host-listings' ? 'active' : ''
                  }`}
                  aria-current={
                    currentTab === 'host-listings' ? 'page' : undefined
                  }
                  onClick={() => go('host-listings')}
                >
                  ➕ Make Spot Available
                </button>
              </li>

              <li>
                <button
                  className={`nav-link-btn host-revenue-tab ${
                    currentTab === 'host-dashboard' ? 'active' : ''
                  }`}
                  aria-current={
                    currentTab === 'host-dashboard' ? 'page' : undefined
                  }
                  onClick={() => go('host-dashboard')}
                >
                  💰 Revenue Generated
                </button>
              </li>

              <li>
                <button
                  className={`nav-link-btn ${
                    currentTab === 'host-valet' ? 'active' : ''
                  }`}
                  aria-current={
                    currentTab === 'host-valet' ? 'page' : undefined
                  }
                  onClick={() => go('host-valet')}
                >
                  🧑‍✈️ Valet Management

                  {hostValetAlerts > 0 && (
                    <span className="nav-counter">
                      {hostValetAlerts}
                    </span>
                  )}
                </button>
              </li>
            </>
          ) : isCaptain ? (
            /* CAPTAIN NAVIGATION */
            <>
              <li>
                <button
                  className={`nav-link-btn ${
                    currentTab === 'captain-dashboard' ? 'active' : ''
                  }`}
                  aria-current={
                    currentTab === 'captain-dashboard'
                      ? 'page'
                      : undefined
                  }
                  onClick={() => go('captain-dashboard')}
                >
                  📋 My Jobs

                  {captainActiveCount > 0 && (
                    <span className="nav-counter">
                      {captainActiveCount}
                    </span>
                  )}
                </button>
              </li>

              <li>
                <button
                  className={`nav-link-btn ${
                    currentTab === 'account' ? 'active' : ''
                  }`}
                  aria-current={
                    currentTab === 'account' ? 'page' : undefined
                  }
                  onClick={() => go('account')}
                >
                  👤 My Profile
                </button>
              </li>
            </>
          ) : (
            /* DRIVER NAVIGATION */
            <>
              <li>
                <button
                  className={`nav-link-btn ${
                    currentTab === 'find' ? 'active' : ''
                  }`}
                  onClick={() => go('find')}
                >
                  🔍 Find Spot
                </button>
              </li>

              <li>
                <button
                  className={`nav-link-btn ${
                    currentTab === 'services' ? 'active' : ''
                  }`}
                  onClick={() => go('services')}
                >
                  ⚡ EV &amp; Wash
                </button>
              </li>

              <li>
                <button
                  className={`nav-link-btn ${
                    currentTab === 'subscription' ? 'active' : ''
                  }`}
                  onClick={() => go('subscription')}
                >
                  ⚡ Subscriptions
                </button>
              </li>

              <li>
                <button
                  className={`nav-link-btn ${
                    currentTab === 'bookings' ? 'active' : ''
                  }`}
                  onClick={() => go('bookings')}
                >
                  📅 My Bookings

                  {bookingCount > 0 && (
                    <span className="nav-counter">
                      {bookingCount}
                    </span>
                  )}
                </button>
              </li>
            </>
          )}

          {/* DRIVER-FACING CAPTAIN VALET PAGE */}
          {!isCaptain && (
            <li>
              <button
                className={`nav-link-btn ${
                  currentTab === 'captain' ? 'active' : ''
                }`}
                onClick={() => go('captain')}
              >
                🔑 Captain Valet
              </button>
            </li>
          )}

          {/* PROFILE MENU */}
          <li
            ref={menuRef}
            style={{ position: 'relative' }}
          >
            <button
              aria-label="Profile"
              aria-expanded={stage > 0}
              onClick={() => setStage((s) => (s + 1) % 3)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                height: 46,
                padding: stage === 0 ? 0 : '0 14px 0 0',
                width: stage === 0 ? 46 : 'auto',
                borderRadius: 999,
                border: `3px solid ${ringColor}`,
                background: stage === 0 ? '#d6d3d1' : '#f5f5f4',
                cursor: 'pointer',
                boxShadow:
                  ringColor === 'transparent'
                    ? 'none'
                    : `0 0 0 3px ${ringColor}33`,
                transition: 'all 0.25s ease',
                overflow: 'hidden',
              }}
            >
              <span
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: '50%',
                  background: '#d6d3d1',
                  display: 'grid',
                  placeItems: 'center',
                  flexShrink: 0,
                  margin: stage === 0 ? '0 auto' : 0,
                }}
              >
                <svg
                  width="22"
                  height="22"
                  viewBox="0 0 24 24"
                  fill="#78716c"
                  aria-hidden="true"
                >
                  <circle cx="12" cy="8" r="4.5" />
                  <path d="M3.5 21c0-4.6 3.8-7.5 8.5-7.5s8.5 2.9 8.5 7.5z" />
                </svg>
              </span>

              {stage > 0 && (
                <>
                  <strong
                    style={{
                      fontSize: 14,
                      color: '#0f172a',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {user.name.split(' ')[0]}
                  </strong>

                  {isDriver && (
                    <span
                      style={{
                        padding: '2px 10px',
                        borderRadius: 20,
                        fontSize: 11,
                        fontWeight: 800,
                        color: '#fff',
                        background: badgeColor,
                      }}
                    >
                      {planName}
                    </span>
                  )}

                  {isCaptain && (
                    <span
                      style={{
                        padding: '2px 10px',
                        borderRadius: 20,
                        fontSize: 11,
                        fontWeight: 800,
                        color: '#fff',
                        background: captainAvailable
                          ? '#16a34a'
                          : '#78716c',
                      }}
                    >
                      {captainAvailable ? 'ON DUTY' : 'OFF DUTY'}
                    </span>
                  )}
                </>
              )}
            </button>

            {stage === 2 && (
              <div className="pm-card">
                <div className="pm-head">
                  <div
                    className="pm-avatar"
                    style={{
                      borderColor:
                        ringColor === 'transparent'
                          ? '#d6d3d1'
                          : ringColor,
                    }}
                  >
                    <svg
                      width="22"
                      height="22"
                      viewBox="0 0 24 24"
                      fill="#78716c"
                      aria-hidden="true"
                    >
                      <circle cx="12" cy="8" r="4.5" />
                      <path d="M3.5 21c0-4.6 3.8-7.5 8.5-7.5s8.5 2.9 8.5 7.5z" />
                    </svg>
                  </div>

                  <div className="pm-id">
                    <strong>{user.name}</strong>
                    <small>{user.email}</small>
                  </div>

                  {isDriver && (
                    <span
                      className="pm-plan"
                      style={{ background: badgeColor }}
                    >
                      {planName}
                    </span>
                  )}

                  {isCaptain && (
                    <span
                      className="pm-plan"
                      style={{ background: '#0f172a' }}
                    >
                      CAPTAIN
                    </span>
                  )}
                </div>

                <div className="pm-stats">
                  <div>
                    <strong>
                      {isCaptain ? captainActiveCount : slotsBooked}
                    </strong>
                    <span>
                      {isDriver
                        ? 'Slots booked'
                        : isCaptain
                          ? 'Active jobs'
                          : 'Bookings'}
                    </span>
                  </div>

                  {isCaptain && (
                    <div>
                      <strong>{captainDoneCount}</strong>
                      <span>Completed</span>
                    </div>
                  )}

                  <div>
                    <strong>★ {user.rating || 4.8}</strong>
                    <span>Rating</span>
                  </div>

                  {isDriver && (
                    <div>
                      <strong
                        style={{
                          color:
                            violationCount > 0 ? '#dc2626' : '#16a34a',
                        }}
                      >
                        {violationCount}/3
                      </strong>
                      <span>Violations</span>
                    </div>
                  )}
                </div>

                <div className="pm-menu">
                  {isCaptain && onToggleAvailability && (
                    <button onClick={() => onToggleAvailability()}>
                      <span>{captainAvailable ? '🟢' : '⚪'}</span>
                      {captainAvailable
                        ? 'Available for new jobs'
                        : 'Not taking new jobs'}
                      <i>⟳</i>
                    </button>
                  )}

                  <button onClick={() => go('account')}>
                    <span>👤</span>
                    {isCaptain ? 'My profile' : 'Account details'}
                    <i>›</i>
                  </button>

                  <button onClick={() => go('help')}>
                    <span>❓</span>
                    Help &amp; feedback
                    <i>›</i>
                  </button>

                  <button
                    className="danger"
                    onClick={() => {
                      setStage(0);
                      onLogout?.();
                    }}
                  >
                    <span>↪</span>
                    Logout
                    <i>›</i>
                  </button>
                </div>
              </div>
            )}
          </li>
        </ul>
      </div>
    </nav>
  );
}
