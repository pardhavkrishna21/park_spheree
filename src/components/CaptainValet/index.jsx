import React, { useState, useRef, useEffect } from 'react';
import { IconSparkles, IconShield, IconCamera, IconCheck } from '../Icons';
import './index.css';
import { PRICES } from '../../utils/plans';
import { toRange, fmtTime } from '../../utils/bookingTime';

const ASSIGN_LEAD_MS = 30 * 60 * 1000;

const formatCountdown = (ms) => {
  const mins = Math.max(1, Math.ceil(ms / 60000));
  const d = Math.floor(mins / 1440);
  const h = Math.floor((mins % 1440) / 60);
  const m = mins % 60;
  return [d && `${d}d`, h && `${h}h`, `${m}m`].filter(Boolean).join(' ');
};

function ValetScheduled({ booking, assignAt, now }) {
  const when = new Date(assignAt);
  return (
    <section className="cv-scheduled">
      <div className="cv-scheduled-icon">⏳</div>
      <div className="cv-scheduled-main">
        <span className="cv-scheduled-kicker">CAPTAIN NOT ASSIGNED YET</span>
        <h3>Your Captain is assigned 30 minutes before your booking</h3>
        <p>
          Booking {booking.id} at <strong>{booking.spotName}</strong> starts {booking.timeSlot}. Pickup: <strong>{booking.valetPickup}</strong>.
          Tracking and photos open once the Captain is assigned.
        </p>
        <div className="cv-scheduled-chips">
          <span>Assignment opens at <strong>{fmtTime(assignAt)}</strong>, {when.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</span>
          <span>In <strong>{formatCountdown(assignAt - now)}</strong></span>
        </div>
      </div>
    </section>
  );
}

const VALET_WORKFLOW_STEPS = [
  {
    title: 'Driver reaches the pickup point',
    description: 'The driver books a parking space, requests valet pickup, and meets the Captain at the agreed destination entrance with the vehicle ready for handover.'
  },
  {
    title: 'Inspect and photograph the vehicle',
    description: 'Before the vehicle moves, the Captain takes timestamped photos of the front, rear, driver side, and passenger side. The driver can review the condition record.'
  },
  {
    title: 'Confirm pickup with the OTP',
    description: 'After checking the photos and Captain, the driver shares the pickup OTP to authorize the handover. The Captain confirms it before starting the trip.'
  },
  {
    title: 'Follow the trip to the booked spot',
    description: 'The Captain drives directly to the selected parking lot. The driver can follow the live location and see the reserved destination.'
  },
  {
    title: 'Park and record the final position',
    description: 'At the destination, the Captain parks in the booked bay and takes new photos showing the vehicle safely positioned in that space.'
  },
  {
    title: 'Send parking confirmation',
    description: 'The driver receives the arrival alert and post-parking photos. A separate retrieval OTP is shared for when the driver is ready to collect the vehicle.'
  }
];

function PhotoCapture({ title, hint, sides, theme, onPost }) {
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const [cameraOn, setCameraOn] = useState(false);
  const [error, setError] = useState('');
  const [photos, setPhotos] = useState({});
  const [posted, setPosted] = useState(false);

  const stopCamera = () => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    setCameraOn(false);
  };

  useEffect(() => stopCamera, []);

  const startCamera = async () => {
    setError('');
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
      streamRef.current = stream;
      setCameraOn(true);
      requestAnimationFrame(() => {
        if (videoRef.current) videoRef.current.srcObject = stream;
      });
    } catch {
      setError('Camera access was blocked or is unavailable. Allow camera permission and try again.');
    }
  };

  const nextSide = sides.find((s) => !photos[s]);

  const capture = () => {
    const video = videoRef.current;
    if (!video || !nextSide || !video.videoWidth) return;
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas.getContext('2d').drawImage(video, 0, 0);
    setPhotos((prev) => ({ ...prev, [nextSide]: canvas.toDataURL('image/jpeg', 0.85) }));
    setPosted(false);
  };

  const allDone = sides.every((s) => photos[s]);

  const post = () => {
    stopCamera();
    setPosted(true);
    onPost();
  };

  const doneCount = sides.filter((s) => photos[s]).length;
  const pct = (doneCount / sides.length) * 100;

  return (
    <section className={`pc-card ${theme}`}>
      <div className="pc-head">
        <div className="pc-icon">{theme === 'after' ? '🅿️' : '🚗'}</div>
        <div className="pc-head-text">
          <span className="pc-kicker">{theme === 'after' ? 'STEP 2 · AFTER PARKING' : 'STEP 1 · BEFORE HANDOVER'}</span>
          <h3>{title}</h3>
          <p>{hint}</p>
        </div>
        <div className="pc-count"><strong>{doneCount}/{sides.length}</strong><span>photos</span></div>
      </div>

      <div className="pc-progress"><div style={{ width: `${pct}%` }} /></div>

      {cameraOn ? (
        <div className="pc-viewfinder">
          <video ref={videoRef} autoPlay playsInline muted />
          <div className="pc-frame"><i /><i /><i /><i /></div>
          {nextSide && <div className="pc-prompt">Capture: {nextSide}</div>}
          <div className="pc-controls">
            <button className="pc-shutter" disabled={!nextSide} onClick={capture} aria-label="Capture photo" />
            <button className="pc-close" onClick={stopCamera}>Close camera</button>
          </div>
        </div>
      ) : (
        !allDone && <button className="pc-open" onClick={startCamera}><IconCamera size={18} /> Open camera</button>
      )}
      {error && <p className="pc-error">{error}</p>}

      <div className="pc-grid">
        {sides.map((side, i) => (
          <div key={side} className={`pc-tile ${photos[side] ? 'done' : ''} ${!photos[side] && nextSide === side ? 'next' : ''}`}>
            {photos[side] ? (
              <img src={photos[side]} alt={side} />
            ) : (
              <div className="pc-empty"><span>{i + 1}</span><small>{nextSide === side ? 'Up next' : 'Waiting'}</small></div>
            )}
            <div className="pc-tile-foot">
              <strong>{side}</strong>
              {photos[side] && (
                <button onClick={() => { setPhotos((p) => ({ ...p, [side]: undefined })); setPosted(false); }}>Retake</button>
              )}
            </div>
            {photos[side] && <span className="pc-check">✓</span>}
          </div>
        ))}
      </div>

      {allDone && (
        <button className="pc-post" disabled={posted} onClick={post}>
          {posted ? '✓ Photos posted to owner' : 'Post photos as record'}
        </button>
      )}
    </section>
  );
}
function LiveTracker({ showToast, booking }) {
  const [status, setStatus] = useState('idle');
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    if (status !== 'transit') return undefined;
    const id = setInterval(() => {
      setProgress((p) => Math.min(100, p + 1.5));
    }, 120);
    return () => clearInterval(id);
  }, [status]);

  useEffect(() => {
    if (status === 'transit' && progress >= 100) {
      setStatus('reached');
      showToast('🔔 Your vehicle has reached the bay and is parked safely.');
    }
  }, [progress, status, showToast]);

  const start = () => {
    setProgress(0);
    setStatus('transit');
  };

  const left = (booking.valetKm * (1 - progress / 100)).toFixed(1);
  const eta = status === 'reached' ? 0 : Math.max(1, Math.ceil(8 * (1 - progress / 100)));
  const label = status === 'idle' ? 'Waiting for Captain' : status === 'transit' ? 'In transit' : 'Reached bay';

  const timeline = [
    { title: 'Handover & 4-side photos', note: 'Vehicle condition recorded with timestamps', done: status !== 'idle' },
    { title: 'Captain departed pickup point', note: 'Pickup OTP verified, trip started', done: status !== 'idle' },
    { title: 'En route to the bay', note: `${left} km to go · live GPS`, done: status === 'reached', active: status === 'transit' },
    { title: 'Reached bay & parked', note: `Parked at ${booking.spotName} · post-parking photos sent to you`, done: status === 'reached' }
  ];

  return (
    <section className={`lt-card ${status}`}>
      <div className="lt-top">
        <div>
          <span className="lt-kicker">LIVE VEHICLE TRACKING · {booking.id}</span>
          <h3>{booking.vehicle}</h3>
          <small style={{ color: '#94a3b8' }}>{booking.spotName} · {booking.timeSlot}</small>
        </div>
        <div className={`lt-status ${status}`}>
          <i /> {label}
        </div>
      </div>

      <div className="lt-map">
        <div className="lt-grid" />
        <div className="lt-track">
          <div className="lt-trail" style={{ width: `${progress}%` }} />
          <div className="lt-car" style={{ left: `${progress}%` }}>🚗</div>
        </div>
        <div className="lt-point start"><span>📍</span><small>{booking.valetPickup}</small></div>
        <div className={`lt-point end ${status === 'reached' ? 'arrived' : ''}`}><span>{status === 'reached' ? '✅' : '🅿️'}</span><small>{booking.spotName}</small></div>
      </div>

      <div className="lt-stats">
        <div><strong>{status === 'reached' ? '0.0' : left} km</strong><span>Distance left</span></div>
        <div><strong>{status === 'idle' ? '--' : status === 'reached' ? 'Arrived' : `${eta} min`}</strong><span>ETA</span></div>
        <div><strong>{status === 'transit' ? '24 km/h' : '0 km/h'}</strong><span>Speed</span></div>
        <div><strong>{Math.round(progress)}%</strong><span>Trip complete</span></div>
      </div>

      <div className="lt-actions">
        <button className="lt-btn" onClick={start} disabled={status === 'transit'}>
          {status === 'idle' ? '▶ Simulate trip (demo)' : status === 'transit' ? 'Tracking…' : '↻ Run demo again'}
        </button>
        <div className="lt-captain">
          <span>🧑‍✈️</span>
          <div><strong>Captain assigned</strong><small>On the way to your pickup · Aadhaar &amp; DL verified</small></div>
        </div>
      </div>

      <div className="lt-timeline">
        {timeline.map((t, i) => (
          <div key={t.title} className={`lt-step ${t.done ? 'done' : ''} ${t.active ? 'active' : ''}`}>
            <div className="lt-dot">{t.done ? '✓' : i + 1}</div>
            <div>
              <strong>{t.title}</strong>
              <small>{t.note}</small>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

export default function CaptainValet({ showToast, bookings = [], setCurrentTab }) {
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 30000);
    return () => clearInterval(id);
  }, []);

  const valetBookings = bookings
    .filter((b) => ['Confirmed', 'Parked'].includes(b.status) && b.needValet)
    .sort((a, b) => `${a.date} ${a.startTime}`.localeCompare(`${b.date} ${b.startTime}`));
  const valetBooking = valetBookings.find((b) => toRange(b.date, b.startTime, b.hours)[1] > now) || valetBookings[0];
  const assignAt = valetBooking ? toRange(valetBooking.date, valetBooking.startTime, 0)[0] - ASSIGN_LEAD_MS : 0;
  const captainAssigned = Boolean(valetBooking) && now >= assignAt;
  const [simStep, setSimStep] = useState(1);
  const [activeRoadStep, setActiveRoadStep] = useState(2);

  const selectRoadStep = (stepNumber) => {
    setActiveRoadStep(stepNumber);
    setSimStep(Math.max(1, stepNumber - 2));
  };

  const advanceSimulation = () => {
    if (simStep === 1) {
      setSimStep(2);
      setActiveRoadStep(4);
      showToast('🚗 Captain completed 4-side inspection and initiated live transit!');
    } else if (simStep === 2) {
      setSimStep(3);
      setActiveRoadStep(5);
      showToast('📸 Vehicle safely placed in garage! Post-parking photos uploaded.');
    } else if (simStep === 3) {
      setSimStep(4);
      setActiveRoadStep(6);
      showToast('🔔 Notification Dispatched to owner with photos and retrieval code!');
    } else {
      setSimStep(1);
      setActiveRoadStep(2);
    }
  };

  return (
    <div className="captain-root">
      <section className="cv-hero">
        <div className="cv-hero-text">
          <span className="cv-pill"><IconSparkles size={14} /> AVAILABLE SERVICE</span>
          <h2>Hand over the keys.<br /><span>We'll handle the parking.</span></h2>
          <p>
            A vetted Captain meets you at the door, photographs your car on all four sides, drives it to your reserved bay and sends proof the moment it's parked.
          </p>
          <div className="cv-trust">
            <span>🛡️ Aadhaar &amp; DL verified</span>
            <span>📸 4-side photo audit</span>
            <span>📍 Live GPS tracking</span>
            <span>🔐 OTP secured</span>
          </div>
        </div>

        <div className="cv-scene" aria-hidden="true">
          <div className="cv-sun" />
          <div className="cv-skyline"><i /><i /><i /><i /><i /></div>
          <div className="cv-road"><span className="cv-lane" /></div>
          <div className="cv-car">🚗</div>
          <div className="cv-captain">🧑‍✈️</div>
          <div className="cv-pin">📍</div>
        </div>
      </section>

      <section className="cv-stats">
        <div><strong>4</strong><span>sides photographed</span></div>
        <div><strong>2</strong><span>separate OTP codes</span></div>
        <div><strong>Live</strong><span>trip tracking</span></div>
        <div><strong>0</strong><span>parking stress</span></div>
      </section>

      <div className="valet-interactive-box">
        <div className="valet-top-bar">
          <div>
            <span className="badge-preview">SAMPLE WALKTHROUGH</span>
            <h3>How Car Owners Stay 100% Safe in Real-Time</h3>
            <small style={{ color: '#94a3b8' }}>Illustration only. It does not show your vehicle or any real booking.</small>
          </div>
          <button className="btn-primary" onClick={advanceSimulation}>
            {simStep === 1 && 'Simulate: Handover & 4-Side Photo Record'}
            {simStep === 2 && 'Simulate: Live Car Navigation to Bay'}
            {simStep === 3 && 'Simulate: Safe Park & Photo Submission'}
            {simStep === 4 && 'Reset Simulation Workflow'}
          </button>
        </div>

        <div className="sim-steps-row">
          <div className={`step-card ${simStep >= 1 ? 'active' : ''}`}>
            <strong>1. 4-SIDE PHOTO CHECK</strong>
            <p>Front, rear, and sides documented with timestamp.</p>
          </div>
          <div className={`step-card ${simStep >= 2 ? 'active' : ''}`}>
            <strong>2. LIVE GPS TRACKING</strong>
            <p>Owner tracks car transit directly to the private garage.</p>
          </div>
          <div className={`step-card ${simStep >= 3 ? 'active' : ''}`}>
            <strong>3. POST-PARK PROOF</strong>
            <p>Photos inside bay uploaded to confirm safe positioning.</p>
          </div>
          <div className={`step-card ${simStep >= 4 ? 'active' : ''}`}>
            <strong>4. OWNER NOTIFICATION</strong>
            <p>Alert delivered with photos and 1-tap return OTP.</p>
          </div>
        </div>

        <div className="sim-screen-monitor">
          {simStep === 1 && (
            <div>
              <div className="step-title"><IconCamera size={16} /> STEP 1: PRE-HANDOVER 4-SIDE CONDITION AUDIT</div>
              <div className="audit-grid">
                <div>✓ Front Bumper & Bonnet</div>
                <div>✓ Rear Bumper & Trunk</div>
                <div>✓ Driver Side Panels</div>
                <div>✓ Passenger Side Doors</div>
              </div>
            </div>
          )}
          {simStep === 2 && (
            <div>
              <div className="step-title" style={{ color: '#38bdf8' }}>🛰️ STEP 2: LIVE OWNER GPS TRACKING (SPEED: 12 KM/H)</div>
              <div className="cv-route"><span className="cv-route-car">🚗</span><span className="cv-route-end">🏁</span></div>
              <div className="transit-meta">
                <span>📍 Mall Entrance Handover</span>
                <span>🏁 Your reserved bay</span>
              </div>
            </div>
          )}
          {simStep >= 3 && (
            <div>
              <div className="step-title" style={{ color: '#4ade80' }}>
                <IconCheck size={18} /> {simStep === 4 ? '🔔 PUSH ALERT RECEIVED ON OWNER PHONE' : 'STEP 3: POST-PARKING PHOTO SUBMITTED'}
              </div>
              <div className="alert-box">
                <strong>"Your vehicle is safely stationed at your reserved bay!"</strong>
                <p>Slot number and Captain details appear here • Captain Aadhaar &amp; DL verified</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {valetBooking && !captainAssigned && (
        <ValetScheduled booking={valetBooking} assignAt={assignAt} now={now} />
      )}

      {valetBooking && captainAssigned ? (
        <>
          <LiveTracker key={valetBooking.id} showToast={showToast} booking={valetBooking} />

          <PhotoCapture
            theme="before"
            title="Before taking charge of the car"
            hint="Photograph all four sides of the vehicle before the Captain takes charge, and post them as the handover record."
            sides={['Front', 'Rear', 'Driver side', 'Passenger side']}
            onPost={() => showToast('📸 Pre-handover photos posted.')}
          />

          <PhotoCapture
            theme="after"
            title="After parking"
            hint="Once the car is parked in the bay, take photos showing its final position and post them to the owner."
            sides={['Parked position', 'Front', 'Rear', 'Driver side', 'Passenger side']}
            onPost={() => showToast('📸 Post-parking photos posted.')}
          />
        </>
      ) : !valetBooking && (
        <section className="cv-empty">
          <div className="cv-empty-icon">🔑</div>
          <div>
            <h3>No Captain Valet booking yet</h3>
            <p>
              Tracking and parking photos only appear for bookings that include Captain Valet. Choose the Captain Valet option when you reserve a slot (₹{PRICES.valetBase} base + ₹{PRICES.valetPerKm} per km from your pickup point) and your trip details will show up here.
            </p>
          </div>
          <button className="btn-primary" onClick={() => setCurrentTab?.('find')}>Find a spot with valet →</button>
        </section>
      )}

      <section className="valet-supporting" aria-labelledby="valet-workflow-heading">
        <div className="valet-supporting-heading">
          <div>
            <span className="valet-supporting-kicker">THE HANDOVER</span>
            <h3 id="valet-workflow-heading">How Captain Valet works, step by step</h3>
            <p className="valet-supporting-intro">This is the service flow, step by step.</p>
          </div>
          <span className="valet-preview-status">AVAILABLE</span>
        </div>

        <ol className={`valet-road-map active-step-${activeRoadStep}`} aria-label="Captain Valet steps">
          {VALET_WORKFLOW_STEPS.map((step, index) => {
            const stepNumber = index + 1;
            const stepState = stepNumber === activeRoadStep ? 'active' : stepNumber < activeRoadStep ? 'complete' : 'upcoming';

            return (
              <li
                key={step.title}
                className={`valet-workflow-step road-step-${stepNumber} ${stepState}`}
              >
                <button
                  type="button"
                  className="valet-workflow-button"
                  aria-current={stepState === 'active' ? 'step' : undefined}
                  aria-label={`Select step ${stepNumber}: ${step.title}`}
                  onClick={() => selectRoadStep(stepNumber)}
                >
                  <span className="valet-workflow-marker">{String(stepNumber).padStart(2, '0')}</span>
                  <span className="valet-workflow-copy">
                    <span className="valet-workflow-label">STEP {stepNumber}</span>
                    <span className="valet-workflow-title">{step.title}</span>
                    <span className="valet-workflow-description">{step.description}</span>
                  </span>
                </button>
              </li>
            );
          })}
        </ol>

        <div className="valet-otp-note">
          <IconShield size={19} />
          <p><strong>Two codes, two purposes:</strong> the pickup OTP confirms the initial handover; the retrieval OTP is for the later return. The retrieval code is not the signal that parking is complete; the post-park photos and arrival notification provide that confirmation.</p>
        </div>
      </section>

      <section className="valet-benefits" aria-labelledby="valet-benefits-heading">
        <span className="valet-supporting-kicker">WHY USE THE SERVICE</span>
        <h3 id="valet-benefits-heading">Benefits for drivers and space hosts</h3>
        <div className="valet-benefit-grid">
          <div className="valet-benefit-group">
            <h4>For drivers</h4>
            <ul>
              <li><strong>Skip the parking search.</strong> Go to the pickup point and let the Captain drive to your reserved bay.</li>
              <li><strong>See the handover record.</strong> Compare before-and-after photos and follow the trip during transit.</li>
              <li><strong>Know when the car is parked.</strong> Get an arrival alert, bay photos, and a separate code for retrieval.</li>
            </ul>
          </div>
          <div className="valet-benefit-group">
            <h4>For space hosts</h4>
            <ul>
              <li><strong>Receive a vehicle for a reserved bay.</strong> The booking connects the driver’s handover to the selected parking destination.</li>
              <li><strong>Have arrival evidence.</strong> Post-parking photos help confirm the vehicle reached the listed space.</li>
              <li><strong>Offer a more convenient option.</strong> Valet pickup can add a doorstep handover option to a host’s parking listing.</li>
            </ul>
          </div>
        </div>
      </section>
    </div>
  );
}
