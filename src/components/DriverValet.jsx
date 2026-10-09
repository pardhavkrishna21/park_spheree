/* ------------------------------------------------------------------
   Driver Valet: booking updates and evidence acknowledgement
   File: src/components/DriverValet.jsx
------------------------------------------------------------------- */

import React, { useEffect, useState } from 'react';
import ValetEvidence from './ValetEvidence';
import { STATUS, STATUS_LABEL } from '../utils/valet';
import './valet.css';

const DriverValet = ({
  jobs = [],
  onDispute,
  onAcknowledgePickup,
  onAcknowledgeParking,
}) => {
  const [openId, setOpenId] = useState(null);
  const [confirmId, setConfirmId] = useState(null);
  const [error, setError] = useState('');

  // Automatically open a job as soon as the Captain submits evidence for review.
  // ValetEvidence is inside the expanded card, so without this the photos stay hidden.
  useEffect(() => {
    const pendingReview = jobs.find(
      (job) =>
        job.status === STATUS.PICKUP_REVIEW ||
        job.status === STATUS.PARKING_REVIEW
    );

    if (pendingReview) {
      setOpenId(pendingReview.bookingId);
    }
  }, [jobs]);

  if (!jobs.length) return null;

  const toggleJob = (bookingId) => {
    setOpenId((current) => (current === bookingId ? null : bookingId));
    setError('');
    setConfirmId(null);
  };

  const handleAcknowledge = async (job, stage) => {
    setError('');

    const callback =
      stage === 'pickup' ? onAcknowledgePickup : onAcknowledgeParking;

    if (typeof callback !== 'function') {
      setError(
        'Acknowledgement is not connected yet. The app needs the corresponding App.jsx handler.'
      );
      return;
    }

    try {
      const result = await callback(job);

      if (result?.ok === false) {
        setError(result.error || 'Could not acknowledge this evidence.');
        return;
      }

      setConfirmId(null);
      setError('');
    } catch (err) {
      setError(err?.message || 'Something went wrong. Please try again.');
    }
  };

  const needsPickupAcknowledgement = (job) =>
    job.status === STATUS.PICKUP_REVIEW;

  const needsParkingAcknowledgement = (job) =>
    job.status === STATUS.PARKING_REVIEW;

  return (
    <section className="dv-wrap">
      <h3 className="dv-title">Captain Valet updates</h3>

      <p className="banner-subtext">
        Track your Captain, review vehicle-condition photos, and acknowledge the
        pickup and final parking evidence.
      </p>

      {jobs.map((job) => {
        const expanded = openId === job.bookingId;
        const pickupReview = needsPickupAcknowledgement(job);
        const parkingReview = needsParkingAcknowledgement(job);
        const needsAcknowledgement = pickupReview || parkingReview;
        const confirmKey = `${job.bookingId}-${pickupReview ? 'pickup' : 'parking'}`;

        return (
          <article className="cv-card" key={job.bookingId}>
            <button
              type="button"
              className="cv-card-head"
              onClick={() => toggleJob(job.bookingId)}
              aria-expanded={expanded}
              style={{
                width: '100%',
                textAlign: 'left',
                border: 0,
                background: 'transparent',
                color: 'inherit',
                cursor: 'pointer',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                gap: 12,
              }}
            >
              <div>
                <strong>
                  {job.info?.spotName || `Booking #${job.bookingId}`}
                </strong>

                <div className="banner-subtext">
                  {job.info?.timeSlot ? `${job.info.timeSlot} · ` : ''}
                  {job.captain
                    ? `Captain ${job.captain.name}`
                    : 'Finding a captain…'}
                </div>

                {job.captain?.phone && (
                  <div className="banner-subtext">
                    Captain phone: {job.captain.phone}
                  </div>
                )}
              </div>

              <span
                className={`ve-chip ve-${job.status}`}
                style={{ flexShrink: 0 }}
              >
                {STATUS_LABEL[job.status] || job.status}
              </span>
            </button>

            {needsAcknowledgement && (
              <div
                style={{
                  marginTop: 12,
                  padding: 12,
                  borderRadius: 10,
                  background: '#fffbeb',
                  border: '1px solid #fcd34d',
                }}
              >
                <strong>
                  {pickupReview
                    ? 'Review pickup evidence'
                    : 'Review final parking evidence'}
                </strong>

                <p style={{ margin: '6px 0 0', fontSize: 13 }}>
                  {pickupReview
                    ? 'Check the initial vehicle photos and any recorded damage before confirming that the Captain may take custody.'
                    : 'Check the parking-space photo and all final vehicle photos before acknowledging that the valet service is complete.'}
                </p>
              </div>
            )}

            {expanded && (
              <div style={{ marginTop: 14 }}>
                <ValetEvidence
                  job={job}
                  canDispute
                  onDispute={(reason) => {
                    if (typeof onDispute !== 'function') {
                      setError('Reporting issues is not connected yet.');
                      return;
                    }

                    onDispute(job, reason);
                  }}
                />

                {job.info?.vehicle && (
                  <p className="banner-subtext">
                    Vehicle: {job.info.vehicle}
                  </p>
                )}

                {job.info?.valetPickup && (
                  <p className="banner-subtext">
                    Pickup point: {job.info.valetPickup}
                  </p>
                )}

                {job.pickup?.acknowledgedAt && (
                  <p className="banner-subtext">
                    Pickup evidence acknowledged:{' '}
                    {new Date(job.pickup.acknowledgedAt).toLocaleString()}
                  </p>
                )}

                {job.parking?.slot && (
                  <p className="banner-subtext">
                    Parking slot: {job.parking.slot}
                  </p>
                )}

                {job.parking?.acknowledgedAt && (
                  <p className="banner-subtext">
                    Parking evidence acknowledged:{' '}
                    {new Date(job.parking.acknowledgedAt).toLocaleString()}
                  </p>
                )}

                {needsAcknowledgement && (
                  <div style={{ marginTop: 16 }}>
                    {confirmId !== confirmKey ? (
                      <button
                        type="button"
                        className="btn-primary"
                        onClick={() => {
                          setError('');
                          setConfirmId(confirmKey);
                        }}
                      >
                        {pickupReview
                          ? 'Acknowledge pickup photos'
                          : 'Acknowledge parking evidence'}
                      </button>
                    ) : (
                      <div
                        style={{
                          border: '1px solid #d1d5db',
                          borderRadius: 10,
                          padding: 14,
                        }}
                      >
                        <strong>Confirm your acknowledgement</strong>

                        <p className="banner-subtext">
                          {pickupReview
                            ? 'I have reviewed the initial vehicle photos and any listed damage. The acknowledgement records that I reviewed the evidence; it does not waive my right to report a problem.'
                            : 'I have reviewed the final parking and vehicle photos. I can still report an issue if I notice a problem.'}
                        </p>

                        <div
                          style={{
                            display: 'flex',
                            gap: 8,
                            flexWrap: 'wrap',
                          }}
                        >
                          <button
                            type="button"
                            className="btn-primary"
                            onClick={() =>
                              handleAcknowledge(
                                job,
                                pickupReview ? 'pickup' : 'parking'
                              )
                            }
                          >
                            Confirm acknowledgement
                          </button>

                          <button
                            type="button"
                            onClick={() => {
                              setConfirmId(null);
                              setError('');
                            }}
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {error && (
                  <p
                    role="alert"
                    style={{
                      marginTop: 12,
                      padding: 10,
                      borderRadius: 8,
                      color: '#991b1b',
                      background: '#fee2e2',
                    }}
                  >
                    {error}
                  </p>
                )}

                {job.dispute && (
                  <div
                    style={{
                      marginTop: 12,
                      padding: 12,
                      borderRadius: 8,
                      background: '#fff7ed',
                      border: '1px solid #fdba74',
                    }}
                  >
                    <strong>Issue reported</strong>
                    <p style={{ marginBottom: 4 }}>{job.dispute.reason}</p>
                    <small>
                      {job.dispute.resolvedAt
                        ? `Resolved: ${job.dispute.resolution}`
                        : 'Awaiting resolution'}
                    </small>
                  </div>
                )}

                {job.history?.length > 0 && (
                  <div style={{ marginTop: 16 }}>
                    <h4>Job timeline</h4>

                    <ul>
                      {job.history
                        .slice()
                        .reverse()
                        .map((entry, index) => (
                          <li key={`${entry.at}-${index}`}>
                            <strong>
                              {STATUS_LABEL[entry.status] || entry.status}
                            </strong>
                            {entry.note && ` — ${entry.note}`}
                            <div className="banner-subtext">
                              {entry.at
                                ? new Date(entry.at).toLocaleString()
                                : ''}
                            </div>
                          </li>
                        ))}
                    </ul>
                  </div>
                )}
              </div>
            )}
          </article>
        );
      })}
    </section>
  );
};

export default DriverValet;