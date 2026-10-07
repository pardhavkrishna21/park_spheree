import React from 'react';
import './index.css';

const NAV_ITEMS = [
  { label: 'Home', tab: 'find', path: '/home' },
  { label: 'EV Charging', tab: 'services', path: '/evcharging' },
  { label: 'Subscriptions', tab: 'subscription', path: '/subscriptions' },
  { label: 'Captain Valet', tab: 'captain', path: '/captainvalet' },
  { label: 'Bookings', tab: 'bookings', path: '/bookings' },
  { label: 'Help & Feedback', tab: 'help', path: '/help' },
  { label: 'Account Details', tab: 'account', path: '/accountdetails' }
];

const HOST_ITEMS = [
  { label: 'Host Listings', tab: 'host-listings', path: '/hostlistings' },
  { label: 'Host Dashboard', tab: 'host-dashboard', path: '/hostdashboard' }
];

const Footer = ({ currentTab, setCurrentTab, user }) => {
  const handleNavigation = (event, tab) => {
    event.preventDefault();
    setCurrentTab(tab);
  };

  const items = user?.role === 'host' ? HOST_ITEMS : NAV_ITEMS;

  return (
    <footer id="footer-root">
      <div className="footer-inner">
        <div>
          <div className="footer-brand">
            <div className="brand-logo" style={{ width: 30, height: 30, fontSize: 16 }}>
              P
            </div>
            ParkSphere
          </div>

          <p className="footer-desc">
            Transforming private residential garages and vacant driveways into verified micro-parking bays. Easy in, instant out.
          </p>

          <nav
            aria-label="ParkSphere footer navigation"
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: 12,
              marginTop: 18
            }}
          >
            {items.map((item) => (
              <a
                key={item.path}
                href={item.path}
                onClick={(event) => handleNavigation(event, item.tab)}
                aria-current={currentTab === item.tab ? 'page' : undefined}
                style={{
                  fontSize: 13,
                  fontWeight: currentTab === item.tab ? 700 : 500,
                  textDecoration: 'none',
                  cursor: 'pointer'
                }}
              >
                {item.label}
              </a>
            ))}
          </nav>
        </div>

        <div className="footer-links">
          <div>
            <strong>Driver Perks</strong>
            <p>Low-Congestion Micro Bays</p>
            <p>Doorstep Valet Handover</p>
            <p>4-Side Photo Auditing</p>
          </div>

          <div>
            <strong>Space Host Perks</strong>
            <p>Fixed ₹50/hr Car Rate</p>
            <p>Fixed ₹30/hr Bike Rate</p>
            <p>Instant UPI Withdrawals</p>
          </div>
        </div>
      </div>

      <div className="footer-copyright">
        © 2026 ParkSphere Inc. All rights reserved. Built for community micro-parking.
      </div>
    </footer>
  );
};

export default Footer;