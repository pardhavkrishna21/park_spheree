import React, { useState } from 'react';
import './index.css';

import ValetPicker from '../ValetPicker';
import { PRICES } from '../../utils/plans';
import { todayStr, toRange, fmtTime, TIME_OPTIONS } from '../../utils/bookingTime';
import { getAvailability } from '../../utils/availability';

const STATUS_COLORS = {
  Confirmed: '#059669',
  Parked: '#2563eb',
  Completed: '#475569',
  Cancelled: '#dc2626'
};

const BookingsView = ({
  bookings,
  spots = [],
  setCurrentTab,
  onCancel,
  onModify,
  onEstimate,
  onCheckIn,
  onCompleteSlot,
  feedbacks = [],
  onFeedback,
  now = Date.now(),
  violations = { count: 0, max: 3, holdUntil: null },
  holdUntilText = ''
}) => {
  const [editingId, setEditingId] = useState(null);
  const [draft, setDraft] = useState(null);
  const [cancelBookingId, setCancelBookingId] = useState(null);
  const [cancelReason, setCancelReason] = useState('');
  const [feedbackBookingId, setFeedbackBookingId] = useState(null);
  const [feedbackRating, setFeedbackRating] = useState(5);
  const [feedbackComment, setFeedbackComment] = useState('');

  const startEdit = (b) => {
    setEditingId(b.id);
    setDraft({
      hours: b.hours,
      date: b.date,
      startTime: b.startTime,
      needEV: Boolean(b.needEV),
      needWash: Boolean(b.needWash),
      needValet: Boolean(b.needValet),
      valetPickup: b.valetPickup || '',
      valetKm: b.valetKm || 0
    });
  };

  const saveEdit = (id) => {
    onModify(id, draft);
    setEditingId(null);
  };

  const openCancellation = (id) => {
    setCancelBookingId(id);
    setCancelReason('');
  };

  const submitCancellation = (id) => {
    onCancel(id, cancelReason);
    setCancelBookingId(null);
    setCancelReason('');
  };

  const submitFeedback = (bookingId) => {
    if (feedbackComment.trim().length < 5) return;
    onFeedback?.({ bookingId, rating: feedbackRating, comment: feedbackComment.trim() });
    setFeedbackBookingId(null);
    setFeedbackComment('');
    setFeedbackRating(5);
  };

  return (
    <div className="bookings-container">
      <h2>My Parking Reservations</h2>
      <p style={{ color: '#64748b', fontSize: 14, marginBottom: 20 }}>
        Present this entry OTP to the host upon reaching the reserved space.
      </p>

      <div
        style={{
          marginBottom: 20,
          padding: 16,
          borderRadius: 14,
          background: violations.holdUntil ? '#fef2f2' : violations.count > 0 ? '#fffbeb' : '#f0fdf4',
          border: `1px solid ${violations.holdUntil ? '#f87171' : violations.count > 0 ? '#fcd34d' : '#bbf7d0'}`
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
          <strong>Booking rules &amp; your violations</strong>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontWeight: 700 }}>
            {Array.from({ length: violations.max }, (_, i) => (
              <i
                key={i}
                style={{
                  width: 14,
                  height: 14,
                  borderRadius: '50%',
                  background: i < violations.count ? '#dc2626' : '#d1d5db',
                  display: 'inline-block'
                }}
              />
            ))}
            {violations.count} of {violations.max} used
          </span>
        </div>

        {violations.holdUntil && (
          <p style={{ margin: '8px 0 0', color: '#991b1b', fontWeight: 600 }}>
            Your account is on hold until {holdUntilText}. You cannot make new bookings during this time.
          </p>
        )}

        <ul style={{ margin: '10px 0 0', paddingLeft: 18, fontSize: 13, color: '#475569', display: 'flex', flexDirection: 'column', gap: 4 }}>
          <li>If you book a slot and do not park in it, that is a <strong>violation</strong>.</li>
          <li>After <strong>3 violations</strong>, your account is put on hold for <strong>3 months</strong>.</li>
          <li>If you no longer need a slot, please <strong>cancel or modify it here</strong> before it ends. A cancelled booking is not a violation.</li>
          <li>Check in with "I've parked" once you arrive so your slot is not counted as missed.</li>
        </ul>
      </div>

      {bookings.length === 0 ? (
        <div className="empty-box">
          <p>No active reservations yet.</p>
          <button className="btn-primary" onClick={() => setCurrentTab('find')}>
            Find a Spot
          </button>
        </div>
      ) : (
        bookings.map((b) => (
          <div key={b.id} className="pass-card">
            <div className="pass-top">
              <div>
                <span className="status-badge" style={{ background: STATUS_COLORS[b.status], color: '#fff' }}>
                  {b.status}
                </span>
                <h3>{b.spotName}</h3>
                <small>Host: {b.hostName}</small>
              </div>
              <div className="otp-block">
                <span>ENTRY OTP</span>
                <strong>{b.otpCode}</strong>
              </div>
            </div>

            <div className="pass-meta">
              <div><span>TIMING</span> <strong>{b.timeSlot}</strong></div>
              <div><span>VEHICLE</span> <strong>{b.vehicle}</strong></div>
              <div><span>TOTAL</span> <strong style={{ color: '#047857' }}>₹{b.totalPaid}</strong></div>
            </div>

            {b.status === 'Confirmed' && (() => {
              const [start, end] = toRange(b.date, b.startTime, b.hours);
              const checkInOpen = now >= start - 15 * 60000 && now < end;
              return (
                <div className={`booking-status-note ${checkInOpen ? 'parked' : 'awaiting'}`}>
                  <strong>{checkInOpen ? 'Your check-in window is open.' : 'Not parked yet.'}</strong>{' '}
                  {checkInOpen
                    ? 'Tap “I’ve parked” when you arrive.'
                    : `Check-in opens at ${fmtTime(start - 15 * 60000)} (15 minutes before your slot).`}
                </div>
              );
            })()}

            {b.status === 'Parked' && (
              <div className="booking-status-note parked">
                <strong>Parked and checked in.</strong> This booking will be marked completed when the slot ends.
              </div>
            )}

            {b.status === 'Cancelled' && b.violation && (
              <div className="booking-status-note missed">
                <strong>Not parked.</strong> This slot was missed and has been recorded as a violation.
              </div>
            )}

            {b.needValet && (
              <div style={{ fontSize: 13, color: '#4338ca', marginTop: 8 }}>
                🔑 Valet pickup: <strong>{b.valetPickup}</strong> → {b.spotName} ({b.valetKm} km, ₹{b.valetFee})
              </div>
            )}

            <div style={{ fontSize: 13, color: '#475569', marginTop: 8 }}>
              Services:{' '}
              {[
                b.needValet && '🔑 Captain Valet',
                b.needEV && `⚡ EV charging${b.freeEV ? ' (free)' : ''}`,
                b.needWash && `✨ ${b.vehicleType} wash${b.freeWash ? ' (free)' : ''}`
              ]
                .filter(Boolean)
                .join(', ') || 'None'}
            </div>

            {b.status === 'Cancelled' && b.cancelReason && (
              <div
                style={{
                  marginTop: 10,
                  padding: '10px 12px',
                  borderRadius: 10,
                  background: '#fef2f2',
                  border: '1px solid #fecaca',
                  color: '#991b1b',
                  fontSize: 13
                }}
              >
                <strong>Cancelled:</strong> {b.cancelReason}
              </div>
            )}

            {b.status === 'Parked' && (
              <>
                <div
                  style={{
                    marginTop: 10,
                    padding: '10px 12px',
                    borderRadius: 10,
                    background: '#eff6ff',
                    border: '1px solid #bfdbfe',
                    color: '#1e40af',
                    fontSize: 13
                  }}
                >
                  🅿️ Parked since {fmtTime(b.parkedAt)}. This slot ends at {fmtTime(toRange(b.date, b.startTime, b.hours)[1])}.
                </div>

                <button
                  type="button"
                  className="complete-slot-button"
                  onClick={() => onCompleteSlot?.(b.id)}
                >
                  ✓ Complete Slot
                </button>
              </>
            )}

            {b.status === 'Completed' && (
              <>
                <div style={{ marginTop: 10, padding: '10px 12px', borderRadius: 10, background: '#f1f5f9', color: '#334155', fontSize: 13 }}>
                  ✓ Parking completed. The full booking amount has been credited to the host.
                </div>

                {(() => {
                  const submitted = feedbacks.find((feedback) => feedback.bookingId === b.id);
                  if (submitted) {
                    return <div className="booking-feedback-done">✓ Feedback submitted: {submitted.rating}/5 ★</div>;
                  }
                  if (feedbackBookingId !== b.id) {
                    return (
                      <button className="booking-feedback-open" onClick={() => setFeedbackBookingId(b.id)}>
                        Share your experience
                      </button>
                    );
                  }

                  return (
                    <div className="booking-feedback-form">
                      <strong>How was your experience?</strong>
                      <div className="booking-feedback-stars" role="radiogroup" aria-label="Rate your completed parking">
                        {[1, 2, 3, 4, 5].map((rating) => (
                          <button
                            type="button"
                            key={rating}
                            className={rating <= feedbackRating ? 'on' : ''}
                            onClick={() => setFeedbackRating(rating)}
                            aria-label={`${rating} star`}
                          >
                            ★
                          </button>
                        ))}
                      </div>
                      <textarea
                        rows="3"
                        value={feedbackComment}
                        onChange={(event) => setFeedbackComment(event.target.value)}
                        placeholder="Tell us about the parking space, host, safety or service."
                      />
                      <div>
                        <button
                          className="btn-primary"
                          disabled={feedbackComment.trim().length < 5}
                          onClick={() => submitFeedback(b.id)}
                        >
                          Submit feedback
                        </button>
                        <button
                          className="booking-feedback-cancel"
                          onClick={() => {
                            setFeedbackBookingId(null);
                            setFeedbackComment('');
                          }}
                        >
                          Not now
                        </button>
                      </div>
                    </div>
                  );
                })()}
              </>
            )}

            {b.status === 'Confirmed' && editingId === b.id && draft && (() => {
              const spot = spots.find((s) => s.name === b.spotName);
              const isBike = b.vehicleType === 'Bike';
              const evOk =
                spot?.amenities.evCharging &&
                (spot.amenities.evChargingVehicles || ['Car', 'Bike']).includes(isBike ? 'Bike' : 'Car');
              const washOk = isBike
                ? spot?.amenities.bikeWash ?? spot?.amenities.carWash
                : spot?.amenities.carWash ?? spot?.amenities.bikeWash;
              const availability = spot
                ? getAvailability(spot, draft.date, draft.startTime, draft.hours, bookings.filter((booking) => booking.id !== b.id))
                : { free: 0, total: 0, status: 'filled' };
              const [selectedStart, selectedEnd] = toRange(draft.date, draft.startTime, draft.hours);
              const canSaveTime = availability.free > 0 && selectedEnd > now;

              return (
                <div style={{ marginTop: 12, display: 'flex', flexDirection: 'column', gap: 10 }}>
                  <div className="booking-time-editor">
                    <label>
                      Parking date
                      <input
                        type="date"
                        min={todayStr()}
                        value={draft.date}
                        onChange={(event) => setDraft({ ...draft, date: event.target.value })}
                      />
                    </label>

                    <label>
                      Start time
                      <select
                        value={draft.startTime}
                        onChange={(event) => setDraft({ ...draft, startTime: event.target.value })}
                      >
                        {TIME_OPTIONS.map((time) => (
                          <option key={time} value={time}>
                            {new Date(`2000-01-01T${time}`).toLocaleTimeString('en-IN', {
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </option>
                        ))}
                      </select>
                    </label>

                    <div className={`booking-availability ${canSaveTime ? 'available' : 'unavailable'}`}>
                      {selectedEnd <= now
                        ? 'This parking slot has already ended'
                        : availability.free > 0
                        ? selectedStart < now
                          ? `${availability.free} of ${availability.total} slots available now`
                          : `${availability.free} of ${availability.total} slots available`
                        : 'No slots available at this time'}
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                    <span style={{ fontSize: 13, color: '#64748b' }}>Duration:</span>
                    <button
                      className="btn-primary"
                      disabled={draft.hours <= 1}
                      onClick={() => setDraft({ ...draft, hours: draft.hours - 1 })}
                    >
                      −
                    </button>
                    <strong>{draft.hours} hr</strong>
                    <button
                      className="btn-primary"
                      disabled={draft.hours >= 24}
                      onClick={() => setDraft({ ...draft, hours: draft.hours + 1 })}
                    >
                      +
                    </button>
                  </div>

                  {evOk && (
                    <label>
                      <input
                        type="checkbox"
                        checked={draft.needEV}
                        onChange={(e) => setDraft({ ...draft, needEV: e.target.checked })}
                      />{' '}
                      ⚡ EV charging (+₹50) {draft.needEV ? '– added, untick to remove' : ''}
                    </label>
                  )}

                  {washOk && (
                    <label>
                      <input
                        type="checkbox"
                        checked={draft.needWash}
                        onChange={(e) => setDraft({ ...draft, needWash: e.target.checked })}
                      />{' '}
                      ✨ {isBike ? 'Bike' : 'Car'} wash (+₹{isBike ? 60 : 120}){' '}
                      {draft.needWash ? '– added, untick to remove' : ''}
                    </label>
                  )}

                  <label>
                    <input
                      type="checkbox"
                      checked={draft.needValet}
                      onChange={(e) =>
                        setDraft({
                          ...draft,
                          needValet: e.target.checked,
                          ...(e.target.checked ? {} : { valetPickup: '', valetKm: 0 })
                        })
                      }
                    />{' '}
                    🔑 Captain Valet (₹{PRICES.valetBase} base + ₹{PRICES.valetPerKm}/km){' '}
                    {draft.needValet ? '– added, untick to remove' : ''}
                  </label>

                  {draft.needValet && spot && (
                    <ValetPicker
                      spot={spot}
                      initialPickup={b.needValet ? b.valetPickup : ''}
                      initialKm={b.needValet ? b.valetKm : null}
                      onChange={(v) =>
                        setDraft((d) =>
                          d.valetPickup === (v?.pickup || '') && d.valetKm === (v?.km || 0)
                            ? d
                            : { ...d, valetPickup: v?.pickup || '', valetKm: v?.km || 0 }
                        )
                      }
                    />
                  )}

                  {onEstimate && (
                    <div style={{ fontSize: 14 }}>
                      Updated total: <strong style={{ color: '#047857' }}>₹{onEstimate(b.id, draft)}</strong>
                      {onEstimate(b.id, draft) !== b.totalPaid && (
                        <span style={{ color: '#64748b' }}> (currently ₹{b.totalPaid})</span>
                      )}
                    </div>
                  )}

                  <div style={{ display: 'flex', gap: 10 }}>
                    <button
                      className="btn-primary"
                      disabled={!canSaveTime || (draft.needValet && !draft.valetKm)}
                      onClick={() => saveEdit(b.id)}
                    >
                      Save Changes
                    </button>
                    <button
                      className="btn-primary"
                      style={{ background: '#64748b' }}
                      onClick={() => setEditingId(null)}
                    >
                      Discard
                    </button>
                  </div>
                </div>
              );
            })()}

            {b.status === 'Confirmed' && editingId !== b.id && (
              <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginTop: 12, flexWrap: 'wrap' }}>
                {(() => {
                  const [start, end] = toRange(b.date, b.startTime, b.hours);
                  const open = now >= start - 15 * 60000 && now < end;
                  return open ? (
                    <button
                      className="btn-primary"
                      style={{ background: '#2563eb' }}
                      onClick={() => onCheckIn?.(b.id)}
                    >
                      🅿️ I've parked (check in)
                    </button>
                  ) : (
                    <small style={{ color: '#64748b' }}>
                      Check-in opens at {fmtTime(start - 15 * 60000)}. Park within the slot or it is cancelled.
                    </small>
                  );
                })()}

                <button className="btn-primary" onClick={() => startEdit(b)}>
                  Modify Booking
                </button>
                <button
                  className="btn-primary"
                  style={{ background: '#dc2626', marginLeft: 'auto' }}
                  onClick={() => openCancellation(b.id)}
                >
                  Cancel Booking
                </button>
              </div>
            )}

            {b.status === 'Confirmed' && cancelBookingId === b.id && (
              <div className="booking-cancel-form">
                <strong>Why are you cancelling?</strong>
                <p>
                  This optional note helps us improve availability and the booking experience. Cancelling before your slot ends is not a violation.
                </p>
                <textarea
                  rows="3"
                  value={cancelReason}
                  onChange={(event) => setCancelReason(event.target.value)}
                  placeholder="For example: plans changed, found another ride, or time no longer works."
                />
                <div>
                  <button
                    className="btn-primary"
                    style={{ background: '#dc2626' }}
                    onClick={() => submitCancellation(b.id)}
                  >
                    Confirm cancellation
                  </button>
                  <button className="booking-feedback-cancel" onClick={() => setCancelBookingId(null)}>
                    Keep booking
                  </button>
                </div>
              </div>
            )}
          </div>
        ))
      )}
    </div>
  );
};

export default BookingsView;