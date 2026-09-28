import React, { useState } from 'react';
import { IconSparkles, IconShield, IconCamera, IconCheck } from '../Icons';
import './index.css';

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
    description: 'The Captain drives directly to the selected parking lot. The driver can follow the planned live location and see the reserved destination.'
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

export default function CaptainValet({ showToast }) {
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
      <section className="captain-banner">
        <div className="upcoming-pill">
          <IconSparkles size={14} /> UPCOMING SERVICE INNOVATION
        </div>
        <h2>ParkSphere Captain: 100% Secure Doorstep Valet</h2>
        <p>
          Never circle crowded lots. A vetted Captain handles porch handover, 4-side photographic condition audit, live GPS navigation, and post-parking photo notification.
        </p>
      </section>

      <div className="valet-interactive-box">
        <div className="valet-top-bar">
          <div>
            <span className="badge-preview">FEATURE PREVIEW</span>
            <h3>How Car Owners Stay 100% Safe in Real-Time</h3>
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
              <div className="tracking-bar"><div className="tracking-bar-fill" style={{ width: '65%' }}></div></div>
              <div className="transit-meta">
                <span>📍 Mall Entrance Handover</span>
                <span>🏁 Reserved Spot: Nexus Safe Garage</span>
              </div>
            </div>
          )}
          {simStep >= 3 && (
            <div>
              <div className="step-title" style={{ color: '#4ade80' }}>
                <IconCheck size={18} /> {simStep === 4 ? '🔔 PUSH ALERT RECEIVED ON OWNER PHONE' : 'STEP 3: POST-PARKING PHOTO SUBMITTED'}
              </div>
              <div className="alert-box">
                <strong>"Vehicle TS 09 EZ 4088 safely stationed at Nexus Mall Safe Garage Spot!"</strong>
                <p>Parked in Slot #2B • Captain Ramesh Patel (Aadhaar & DL Verified)</p>
              </div>
            </div>
          )}
        </div>
      </div>

      <section className="valet-supporting" aria-labelledby="valet-workflow-heading">
        <div className="valet-supporting-heading">
          <div>
            <span className="valet-supporting-kicker">THE PLANNED HANDOVER</span>
            <h3 id="valet-workflow-heading">How Captain Valet works, step by step</h3>
            <p className="valet-supporting-intro">This is the planned service flow shown for preview. Captain Valet is not yet available for live bookings.</p>
          </div>
          <span className="valet-preview-status">PREVIEW ONLY</span>
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
              <li><strong>Offer a more convenient option.</strong> Valet pickup can add a doorstep handover option to a host’s parking listing when the service launches.</li>
            </ul>
          </div>
        </div>
      </section>
    </div>
  );
}
