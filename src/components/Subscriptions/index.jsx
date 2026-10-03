import React, { useState } from 'react';
import { IconCheck } from '../Icons';
import './index.css';

const PLAN_PRICES = { Free: 0, 'Pro Plan': 800, Ultimate: 2000 };
const PLAN_LABELS = { Free: 'Standard Free', 'Pro Plan': 'Pro Frequent Flyer', Ultimate: 'Ultimate VIP' };

// Ring colours match the profile avatar border: cement, green, blue.
const PLANS = [
  {
    key: 'Free',
    tone: 'free',
    name: 'Standard Free',
    tag: 'Cement ring',
    sub: 'Best for occasional mall and dining visits',
    price: '₹0',
    perks: ['Standard slot booking', 'Live turn-by-turn navigation', 'Standard platform fee (₹10 bike / ₹20 car per hour)', 'Pay-as-you-go EV charging and washes']
  },
  {
    key: 'Pro Plan',
    tone: 'pro',
    name: 'Pro Frequent Flyer',
    tag: 'Green ring',
    sub: 'For regular weekend shoppers and diners',
    price: '₹800',
    badge: 'MOST POPULAR',
    perks: ['3 free EV charging sessions a month', '1 free car or bike wash a month', '₹10 off the platform fee on every booking', 'Priority slot reservation at peak hours']
  },
  {
    key: 'Ultimate',
    tone: 'vip',
    name: 'Ultimate VIP',
    tag: 'Blue ring',
    sub: 'Full luxury micro-parking and valet priority',
    price: '₹2,000',
    badge: 'BEST VALUE',
    perks: ['Unlimited EV fast charging', '5 free premium washes a month', '₹0 platform convenience fees', 'Priority access to Captain Valet']
  }
];

const COMPARE = [
  ['Monthly price', '₹0', '₹800', '₹2,000'],
  ['Free EV charging sessions', '—', '3 / month', 'Unlimited'],
  ['Free washes', '—', '1 / month', '5 / month'],
  ['Platform fee', 'Standard', '₹10 off', '₹0'],
  ['Captain Valet', 'Standard fare', 'Standard fare', 'Priority access'],
  ['Profile ring colour', 'Cement', 'Green', 'Blue']
];

function Avatar({ tone }) {
  return (
    <span className={`sp-avatar ${tone}`}>
      <svg width="26" height="26" viewBox="0 0 24 24" fill="#78716c" aria-hidden="true">
        <circle cx="12" cy="8" r="4.5" />
        <path d="M3.5 21c0-4.6 3.8-7.5 8.5-7.5s8.5 2.9 8.5 7.5z" />
      </svg>
    </span>
  );
}

export default function Subscriptions({ user, setUser, showToast }) {
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [payStatus, setPayStatus] = useState('idle');

  const currentPlan = PLANS.find((p) => p.key === user.subscription) || PLANS[0];
  const selected = PLANS.find((p) => p.key === selectedPlan);

  const closeModal = () => {
    setSelectedPlan(null);
    setPayStatus('idle');
  };

  const handlePay = () => {
    const plan = selectedPlan;
    setPayStatus('success');
    setTimeout(() => {
      setUser({ ...user, subscription: plan });
      setPayStatus('activated');
      showToast(`🎉 ${PLAN_LABELS[plan]} is now active on your account!`);
    }, 2000);
  };

  return (
    <div className="sp-root">
      <section className="sp-hero">
        <div className="sp-hero-text">
          <span className="sp-pill">DRIVER MEMBERSHIPS &amp; SAVINGS</span>
          <h2>Pick the plan that fits how you park</h2>
          <p>Free washes, complimentary EV charging and lower fees. Your plan also colours your profile ring so everyone sees your status.</p>
          <div className="sp-current">
            <Avatar tone={currentPlan.tone} />
            <div>
              <small>Your current plan</small>
              <strong>{currentPlan.name}</strong>
            </div>
          </div>
        </div>
        <div className="sp-rings" aria-hidden="true">
          {PLANS.map((p) => (
            <div key={p.key} className={`sp-ring-item ${p.tone}`}>
              <Avatar tone={p.tone} />
              <span>{p.key === 'Pro Plan' ? 'Pro' : p.key === 'Ultimate' ? 'VIP' : 'Free'}</span>
            </div>
          ))}
        </div>
      </section>

      <div className="sp-grid">
        {PLANS.map((p) => {
          const isCurrent = user.subscription === p.key;
          return (
            <article key={p.key} className={`sp-card ${p.tone} ${isCurrent ? 'current' : ''} ${selectedPlan === p.key ? 'picked' : ''}`}>
              {p.badge && <span className="sp-badge">{p.badge}</span>}
              {isCurrent && <span className="sp-active">✓ Your plan</span>}

              <div className="sp-card-head">
                <Avatar tone={p.tone} />
                <div>
                  <h3>{p.name}</h3>
                  <small>{p.tag}</small>
                </div>
              </div>

              <p className="sp-sub">{p.sub}</p>
              <div className="sp-price">{p.price}<span> / month</span></div>

              <ul className="sp-perks">
                {p.perks.map((perk) => (
                  <li key={perk}><IconCheck size={16} /> {perk}</li>
                ))}
              </ul>

              <button className="sp-cta" disabled={isCurrent} onClick={() => setSelectedPlan(p.key)}>
                {isCurrent ? 'Current active plan' : p.key === 'Free' ? 'Switch to Free' : `Choose ${p.key === 'Pro Plan' ? 'Pro' : 'VIP'} · ${p.price}`}
              </button>
            </article>
          );
        })}
      </div>

      <section className="sp-compare">
        <h3>Compare plans</h3>
        <div className="sp-table-wrap">
          <table>
            <thead>
              <tr>
                <th />
                <th className="free">Free</th>
                <th className="pro">Pro</th>
                <th className="vip">VIP</th>
              </tr>
            </thead>
            <tbody>
              {COMPARE.map(([label, a, b, c]) => (
                <tr key={label}>
                  <td>{label}</td>
                  <td>{a}</td>
                  <td>{b}</td>
                  <td>{c}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="sp-steps" aria-label="How memberships work">
        <div><span>1</span><strong>Choose your plan</strong><p>Occasional drivers can stay on Free. Regular drivers can compare the monthly perks against how often they park.</p></div>
        <div><span>2</span><strong>Pay and activate</strong><p>Confirm the payment and your plan activates within moments. Your profile ring changes colour straight away.</p></div>
        <div><span>3</span><strong>Book as usual</strong><p>Free washes, EV sessions and fee savings are applied automatically at checkout and tracked on the EV &amp; Wash page.</p></div>
      </section>

      {selected && (
        <div className="sp-backdrop" onClick={payStatus === 'idle' ? closeModal : undefined}>
          <div className={`sp-modal ${selected.tone}`} onClick={(e) => e.stopPropagation()}>
            <div className="sp-modal-top">
              <Avatar tone={selected.tone} />
            </div>
            {payStatus === 'idle' && (
              <>
                <h3>{selected.name}</h3>
                <p className="sp-muted">Amount payable</p>
                <div className="sp-modal-price">₹{PLAN_PRICES[selectedPlan]} <small>/ month</small></div>
                <div className="sp-modal-actions">
                  <button className="sp-ghost" onClick={closeModal}>Cancel</button>
                  <button className="sp-cta" onClick={handlePay}>Pay ₹{PLAN_PRICES[selectedPlan]}</button>
                </div>
              </>
            )}
            {payStatus === 'success' && (
              <>
                <div className="sp-big">✅</div>
                <h3>Payment successful</h3>
                <p className="sp-muted">You successfully upgraded to {selected.name}. Activating your plan...</p>
              </>
            )}
            {payStatus === 'activated' && (
              <>
                <div className="sp-big">🎉</div>
                <h3>{selected.name} activated</h3>
                <p className="sp-muted">Your plan is active. Your profile ring is now <strong>{selected.tag.toLowerCase()}</strong>.</p>
                <button className="sp-cta" onClick={closeModal}>Done</button>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
