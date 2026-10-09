// Place at: src/components/CaptainProfile.jsx
// The captain's "My profile" page (replaces AccountView for the captain role).
import React, { useState } from 'react';
import './valet.css';

const CaptainProfile = ({ user, setUser, stats, onToggleAvailability, setCurrentTab, showToast }) => {
  const [phone, setPhone] = useState(user.phone || '');
  const [area, setArea] = useState(user.serviceArea || '');
  const available = user.available !== false;

  const save = (e) => {
    e.preventDefault();
    if (phone.replace(/\D/g, '').length < 10) {
      showToast('Please enter a valid phone number.');
      return;
    }
    if (!area.trim()) {
      showToast('Please enter your service area.');
      return;
    }
    setUser({ phone: phone.trim(), serviceArea: area.trim() });
    showToast('Profile updated.');
  };

  return (
    <div className="cp-wrap">
      <div className="cv-card">
        <div className="cp-head">
          <div className="cp-avatar">{(user.name || '?').charAt(0).toUpperCase()}</div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <h2 className="cv-heading">{user.name}</h2>
            <div className="banner-subtext" style={{ overflowWrap: 'anywhere' }}>{user.email}</div>
          </div>
          <span className={`ve-chip ${available ? 've-completed' : ''}`}>
            {available ? 'On duty' : 'Off duty'}
          </span>
        </div>
      </div>

      <div className="cp-stats">
        <div>
          <strong>{stats.active}</strong>
          <span>Active jobs</span>
        </div>
        <div>
          <strong>{stats.done}</strong>
          <span>Completed</span>
        </div>
        <div>
          <strong>★ {user.rating || 4.8}</strong>
          <span>Rating</span>
        </div>
      </div>

      <div className="cv-card">
        <div className="cp-duty">
          <div>
            <strong>{available ? 'You are taking new jobs' : 'You are not taking new jobs'}</strong>
            <div className="banner-subtext">
              Drivers who book Captain Valet are only assigned to captains who are on duty.
            </div>
          </div>
          <button className="btn-secondary" onClick={onToggleAvailability}>
            {available ? 'Go off duty' : 'Go on duty'}
          </button>
        </div>
      </div>

      <form className="cv-card cp-form" onSubmit={save}>
        <h3>Your details</h3>
        <label htmlFor="cp-name">Name</label>
        <input id="cp-name" value={user.name} disabled />
        <label htmlFor="cp-email">Email (your login)</label>
        <input id="cp-email" value={user.email} disabled />
        <label htmlFor="cp-phone">Phone (drivers can call you on this)</label>
        <input id="cp-phone" type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} />
        <label htmlFor="cp-area">Service area</label>
        <input id="cp-area" value={area} onChange={(e) => setArea(e.target.value)} />
        <div className="cv-actions">
          <button className="btn-primary" type="submit">Save changes</button>
          <button className="btn-secondary" type="button" onClick={() => setCurrentTab('captain-dashboard')}>
            Go to my jobs
          </button>
        </div>
      </form>
    </div>
  );
};

export default CaptainProfile;