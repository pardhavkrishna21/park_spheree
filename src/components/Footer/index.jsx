import React from 'react';
import { Link } from 'react-router-dom';
import './index.css';

const NAV_ITEMS = [
  { label: 'Home', path: '/home' },
  { label: 'EV Charging', path: '/evcharging' },
  { label: 'Subscriptions', path: '/subscriptions' },
  { label: 'Captain Valet', path: '/captainvalet' },
  { label: 'Bookings', path: '/bookings' },
  { label: 'Help & Feedback', path: '/help' },
  { label: 'Account Details', path: '/accountdetails' }
];

const HOST_ITEMS = [
  { label: 'Host Listings', path: '/hostlistings' },
  { label: 'Host Dashboard', path: '/hostdashboard' }
];

const Footer = ({ user }) => {
  const items = user?.role === 'host' ? HOST_ITEMS : NAV_ITEMS;

  return (
    <footer id="footer-root">
      <div className="footer-inner">
        <div>
          <div className="footer-brand">
            <div className="brand-logo" style={{ width: 30, height: 30, fontSize: 16 }}>P</div>
            ParkSphere
          </div>
          <p className="footer-desc">
            Transforming private residential garages and vacant driveways into verified micro-parking bays. Easy in, instant out.
          </p>
          <nav aria-label="ParkSphere footer navigation" style={{ display: 'flex', flexWrap: 'wrap', gap: 12, marginTop: 18 }}>
            {items.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                style={{ fontSize: 13, fontWeight: 500, textDecoration: 'none', cursor: 'pointer' }}
              >
                {item.label}
              </Link>
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