import React, { useState } from 'react';
import { IconSparkles, IconShield, IconCamera, IconCheck } from '../Icons';
import './index.css';

export default function CaptainValet({ showToast }) {
  const [simStep, setSimStep] = useState(1);

  const advanceSimulation = () => {
    if (simStep === 1) {
      setSimStep(2);
      showToast('🚗 Captain completed 4-side inspection and initiated live transit!');
    } else if (simStep === 2) {
      setSimStep(3);
      showToast('📸 Vehicle safely placed in garage! Post-parking photos uploaded.');
    } else if (simStep === 3) {
      setSimStep(4);
      showToast('🔔 Notification Dispatched to owner with photos and retrieval code!');
    } else {
      setSimStep(1);
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
    </div>
  );
}
