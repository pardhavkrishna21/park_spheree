import React from 'react';
import './index.css';

export default function Footer() {
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
}