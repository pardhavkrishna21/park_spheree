import React from 'react';
import './index.css';

export default function Navbar({ currentTab, setCurrentTab, user, bookingCount }) {
  return (
    <nav id="navbar-root">
      <div className="navbar-container">
        <button
          className="brand-group"
          onClick={() => setCurrentTab(user.role === 'host' ? 'host-listings' : 'find')}
        >
          <div className="brand-logo">P</div>
          <div className="brand-details">
            <h2>ParkSphere</h2>
            <span>{user.role === 'host' ? 'Space Host Console' : 'Community Micro-Parking'}</span>
          </div>
        </button>

        <ul className="nav-items-list">
          {user.role === 'host' ? (
            <>
              <li>
                <button
                  className={`nav-link-btn ${currentTab === 'host-listings' ? 'active' : ''}`}
                  onClick={() => setCurrentTab('host-listings')}
                >
                  ➕ Make Spot Available
                </button>
              </li>
              <li>
                <button
                  className={`nav-link-btn host-revenue-tab ${currentTab === 'host-dashboard' ? 'active' : ''}`}
                  onClick={() => setCurrentTab('host-dashboard')}
                >
                  💰 Revenue Generated
                </button>
              </li>
            </>
          ) : (
            <>
              <li>
                <button
                  className={`nav-link-btn ${currentTab === 'find' ? 'active' : ''}`}
                  onClick={() => setCurrentTab('find')}
                >
                  🔍 Find Spot
                </button>
              </li>
              <li>
                <button
                  className={`nav-link-btn ${currentTab === 'subscription' ? 'active' : ''}`}
                  onClick={() => setCurrentTab('subscription')}
                >
                  ⚡ Subscriptions
                </button>
              </li>
              <li>
                <button
                  className={`nav-link-btn ${currentTab === 'bookings' ? 'active' : ''}`}
                  onClick={() => setCurrentTab('bookings')}
                >
                  📅 My Bookings
                  {bookingCount > 0 && <span className="nav-counter">{bookingCount}</span>}
                </button>
              </li>
            </>
          )}

          <li>
            <button
              className={`nav-link-btn ${currentTab === 'captain' ? 'active' : ''}`}
              onClick={() => setCurrentTab('captain')}
            >
              🔑 Captain Valet <span className="upcoming-tag">Upcoming</span>
            </button>
          </li>

          <li>
            <button
              className="nav-link-btn profile-tag-btn"
              onClick={() => setCurrentTab('auth')}
            >
              👤 {user.name.split(' ')[0]} <span className="role-pill">{user.role}</span>
            </button>
          </li>
        </ul>
      </div>
    </nav>
  );
}