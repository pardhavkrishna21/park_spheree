// Place at: src/components/HostValetManager.jsx
import React, { useState } from 'react';
import ValetEvidence from './ValetEvidence';
import {
  STATUS_LABEL,
  activeCount,
  assignCaptain,
  pickCaptain,
  resolveDispute
} from '../utils/valet';
import './valet.css';

const HostValetManager = ({
  captains, // derived from captain accounts: { id (their email), name, phone, available }
  onAddCaptain, // ({ name, email, phone, password, serviceArea }) => { ok, error }
  onToggleCaptain, // (captainId) => void
  onRemoveCaptain, // (captainId) => void
  jobs, // object keyed by bookingId
  onUpdateJob,
  showToast,
  describeBooking = (id) => `Booking #${id}`
}) => {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [area, setArea] = useState('');
  const [openId, setOpenId] = useState(null);
  const [resolutions, setResolutions] = useState({});

  const list = Object.values(jobs).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  const openDisputes = list.filter((j) => j.dispute && !j.dispute.resolvedAt);

  const addCaptain = (e) => {
    e.preventDefault();
    if (!name.trim() || !email.trim() || !password) {
      showToast('Enter the captain name, email and a password');
      return;
    }
    if (password.length < 6) {
      showToast('Password must be at least 6 characters');
      return;
    }
    if (phone.replace(/\D/g, '').length < 10) {
      showToast('Enter a valid phone number');
      return;
    }
    const result = onAddCaptain({
      name: name.trim(),
      email: email.trim(),
      phone: phone.trim(),
      password,
      serviceArea: area.trim() || 'Hyderabad'
    });
    if (!result.ok) {
      showToast(result.error);
      return;
    }
    setName('');
    setEmail('');
    setPhone('');
    setPassword('');
    setArea('');
    showToast('Captain registered. They can log in with this email and password.');
  };

  const toggleAvailable = (id) =>
    onToggleCaptain(id);

  const removeCaptain = (id) => {
    if (activeCount(jobs, id)) {
      showToast('Reassign this captain\u2019s active bookings first');
      return;
    }
    onRemoveCaptain(id);
  };

  const assign = (job, captainId) => {
    const captain = captains.find((c) => c.id === captainId);
    if (!captain) return;
    onUpdateJob(assignCaptain(job, captain));
    showToast(`Assigned ${captain.name}`);
  };

  const autoAssign = (job) => {
    const captain = pickCaptain(captains, jobs);
    if (!captain) {
      showToast('No captain is available right now');
      return;
    }
    assign(job, captain.id);
  };

  return (
    <div>
      <h2 className="cv-heading" style={{ marginBottom: 16 }}>Valet management</h2>

      {/* Disputes */}
      {openDisputes.length > 0 && (
        <div className="hv-section">
          <h3>Open disputes ({openDisputes.length})</h3>
          {openDisputes.map((job) => (
            <div key={job.bookingId} className="hv-detail">
              <ValetEvidence job={job} />
              <textarea
                rows={2}
                style={{ width: '100%', marginTop: 10, padding: 10, border: '1px solid var(--border)', borderRadius: 8 }}
                placeholder="Your decision / resolution notes"
                value={resolutions[job.bookingId] || ''}
                onChange={(e) => setResolutions({ ...resolutions, [job.bookingId]: e.target.value })}
              />
              <div className="cv-actions">
                <button
                  className="btn-primary"
                  onClick={() => {
                    const text = (resolutions[job.bookingId] || '').trim();
                    if (!text) {
                      showToast('Write the resolution first');
                      return;
                    }
                    onUpdateJob(resolveDispute(job, text));
                    showToast('Dispute resolved');
                  }}
                >
                  Resolve dispute
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Captains */}
      <div className="hv-section">
        <h3>Captains ({captains.length})</h3>
        <form className="hv-form" onSubmit={addCaptain}>
          <input placeholder="Captain name" value={name} onChange={(e) => setName(e.target.value)} />
          <input
            placeholder="Email (their login)"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <input
            placeholder="Phone number"
            inputMode="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
          />
          <input
            placeholder="Password (min 6)"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <input placeholder="Service area" value={area} onChange={(e) => setArea(e.target.value)} />
          <button className="btn-primary" type="submit">Register captain</button>
        </form>
        {captains.map((c) => (
          <div className="hv-row" key={c.id}>
            <div className="hv-meta">
              <strong>{c.name}</strong>
              <small>
                {c.id} · {c.phone} · {activeCount(jobs, c.id)} active
              </small>
            </div>
            <div className="hv-tools">
              <button className="btn-secondary" onClick={() => toggleAvailable(c.id)}>
                {c.available ? 'Available' : 'Unavailable'}
              </button>
              <button className="btn-secondary" onClick={() => removeCaptain(c.id)}>Remove</button>
            </div>
          </div>
        ))}
      </div>

      {/* Bookings */}
      <div className="hv-section">
        <h3>Valet bookings ({list.length})</h3>
        {!list.length && <p className="cv-empty">No valet bookings yet.</p>}
        {list.map((job) => {
          const locked = job.status === 'handed_over' || job.status === 'completed';
          return (
            <div key={job.bookingId}>
              <div className="hv-row">
                <div className="hv-meta">
                  <strong>{describeBooking(job.bookingId)}</strong>
                  <small>
                    {STATUS_LABEL[job.status]}
                    {job.captain ? ` · ${job.captain.name}` : ''}
                  </small>
                </div>
                <div className="hv-tools">
                  <select
                    disabled={locked}
                    value={job.captain ? job.captain.id : ''}
                    onChange={(e) => assign(job, e.target.value)}
                  >
                    <option value="" disabled>Choose captain</option>
                    {captains
                      .filter((c) => c.available || (job.captain && job.captain.id === c.id))
                      .map((c) => (
                        <option key={c.id} value={c.id}>{c.name}</option>
                      ))}
                  </select>
                  {job.status === 'requested' && (
                    <button className="btn-primary" onClick={() => autoAssign(job)}>Auto-assign</button>
                  )}
                  <button
                    className="btn-secondary"
                    onClick={() => setOpenId(openId === job.bookingId ? null : job.bookingId)}
                  >
                    {openId === job.bookingId ? 'Hide' : 'Inspection'}
                  </button>
                </div>
              </div>
              {openId === job.bookingId && (
                <div className="hv-detail">
                  <ValetEvidence job={job} />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default HostValetManager;