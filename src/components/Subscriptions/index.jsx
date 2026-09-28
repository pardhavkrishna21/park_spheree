import React from 'react';
import { IconCheck } from '../Icons';
import './index.css';

export default function Subscriptions({ user, setUser, showToast }) {
  const handleUpgrade = (planName) => {
    setUser({ ...user, subscription: planName });
    showToast(`🎉 You are now subscribed to the ${planName}!`);
  };

  return (
    <div className="subs-root">
      <div className="subs-header">
        <span className="pill-tag">DRIVER MEMBERSHIPS & SAVINGS</span>
        <h2>Simple, Rewarding Subscription Plans</h2>
        <p>Save on convenience charges, enjoy complimentary EV top-ups, and get doorstep washes.</p>
      </div>

      <div className="pricing-grid">
        <div className="plan-box">
          <h3>Standard Free</h3>
          <p className="plan-sub">Best for occasional mall & dining visits</p>
          <div className="plan-cost">₹0 <span>/ month</span></div>

          <ul className="plan-perks">
            <li><IconCheck size={16} color="#10b981" /> Standard slot booking</li>
            <li><IconCheck size={16} color="#10b981" /> Live turn-by-turn navigation</li>
            <li><IconCheck size={16} color="#10b981" /> Standard Platform fee (₹10/₹20)</li>
          </ul>

          <button
            className="btn-secondary"
            disabled={user.subscription === 'Free'}
            onClick={() => handleUpgrade('Free')}
          >
            {user.subscription === 'Free' ? 'Current Plan' : 'Select Free'}
          </button>
        </div>

        <div className="plan-box featured">
          <div className="featured-badge">MOST POPULAR</div>
          <h3 style={{ color: '#047857' }}>Pro Frequent Flyer</h3>
          <p className="plan-sub">For regular weekend shoppers & diners</p>
          <div className="plan-cost" style={{ color: '#059669' }}>₹800 <span>/ month</span></div>

          <ul className="plan-perks">
            <li><IconCheck size={16} color="#10b981" /> <strong>3 FREE EV charging sessions</strong>/mo</li>
            <li><IconCheck size={16} color="#10b981" /> <strong>1 FREE Car/Bike Wash</strong>/mo</li>
            <li><IconCheck size={16} color="#10b981" /> Discounted platform fee on all slots</li>
            <li><IconCheck size={16} color="#10b981" /> Priority slot reservation during peak hours</li>
          </ul>

          <button className="btn-primary" onClick={() => handleUpgrade('Pro Plan')}>
            {user.subscription === 'Pro Plan' ? 'Current Active Plan' : 'Upgrade to Pro (₹800)'}
          </button>
        </div>

        <div className="plan-box">
          <h3>Ultimate VIP</h3>
          <p className="plan-sub">Full luxury micro-parking & valet priority</p>
          <div className="plan-cost">₹2,000 <span>/ month</span></div>

          <ul className="plan-perks">
            <li><IconCheck size={16} color="#10b981" /> <strong>UNLIMITED EV Fast Charging</strong></li>
            <li><IconCheck size={16} color="#10b981" /> <strong>5 FREE Premium Washes</strong>/mo</li>
            <li><IconCheck size={16} color="#10b981" /> <strong>₹0 Platform Convenience Fees</strong></li>
            <li><IconCheck size={16} color="#10b981" /> Priority access to Captain Valet</li>
          </ul>

          <button className="btn-primary" style={{ background: '#0f172a' }} onClick={() => handleUpgrade('Ultimate')}>
            {user.subscription === 'Ultimate' ? 'Current Active Plan' : 'Get Ultimate (₹2,000)'}
          </button>
        </div>
      </div>

      <section className="subscription-guide" aria-label="How memberships work">
        <h3>How to use your membership</h3>
        <div className="subscription-guide-grid">
          <div>
            <strong>Choose for your routine</strong>
            <p>Occasional drivers can stay on Free. Regular drivers can compare monthly perks against how often they park.</p>
          </div>
          <div>
            <strong>Book as usual</strong>
            <p>Find an available spot and complete your booking. Membership benefits apply to eligible services and bookings.</p>
          </div>
          <div>
            <strong>Keep track of your plan</strong>
            <p>Your active plan appears in your account. Check the included monthly allowances before using a wash or charging session.</p>
          </div>
        </div>
      </section>
    </div>
  );
}