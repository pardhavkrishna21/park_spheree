import React, { useState } from 'react';
import { IconCar, IconFileText, IconTrendingUp } from '../Icons';
import './index.css';

export default function HostListings({ user, spots, setSpots, hostSpots, setHostSpots, showToast, setCurrentTab }) {
  const [title, setTitle] = useState('');
  const [nearLandmark, setNearLandmark] = useState('');
  const [address, setAddress] = useState('');
  const [spaceType, setSpaceType] = useState('Private Covered Garage');
  const [maxCars, setMaxCars] = useState(2);
  const [maxBikes, setMaxBikes] = useState(3);
  const [photoUrl, setPhotoUrl] = useState('');
  const [docType, setDocType] = useState('Electricity Bill');
  const [docProofName, setDocProofName] = useState('');
  const [ownerLegalName, setOwnerLegalName] = useState(user.name || '');

  const [hours, setHours] = useState(6);
  const [days, setDays] = useState(26);

  const FIXED_CAR = 50;
  const projectedMonthly = FIXED_CAR * hours * days;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!title || !address || !docProofName) {
      showToast('⚠️ Title, address, and ownership document proof are mandatory.');
      return;
    }

    const newSpot = {
      id: `spot-${Date.now()}`,
      name: title,
      destinationNear: nearLandmark,
      address,
      hostName: ownerLegalName,
      hostEmail: user.email,
      rating: 5.0,
      reviewsCount: 1,
      distanceMeters: 60,
      vehicleTypes: ['Car', 'Bike', 'EV'],
      basePriceBike: 30, // Platform guaranteed fixed rate
      basePriceCar: 50,  // Platform guaranteed fixed rate
      image: photoUrl || 'https://images.unsplash.com/photo-1590674899484-d5640e854abe?auto=format&fit=crop&w=700&q=80',
      amenities: { evCharging: true, carWash: false, cctv: true, covered: true },
      maxCarCapacity: Number(maxCars),
      maxBikeCapacity: Number(maxBikes),
      totalSlots: Number(maxCars) + Number(maxBikes),
      availableSlots: Number(maxCars),
      ownershipDocument: `${docType}: ${docProofName}`,
      hostType: spaceType
    };

    setSpots([newSpot, ...spots]);
    setHostSpots([newSpot, ...hostSpots]);
    showToast('🎉 Parking Spot Made Available! Opening Revenue Telemetry.');
    setCurrentTab('host-dashboard');
  };

  return (
    <div className="host-listings-root">
      <div className="host-header-bar">
        <div>
          <span className="badge-host">SPACE HOST CONSOLE</span>
          <h2>Make Your Spot Available for Drivers</h2>
          <p>Provide space capacity, photos, and legal proof. Guaranteed fixed rates: <strong>₹50/hr (Car)</strong> & <strong>₹30/hr (Bike)</strong>.</p>
        </div>
        <button className="btn-primary" onClick={() => setCurrentTab('host-dashboard')}>
          View Revenue Generated →
        </button>
      </div>

      <div className="host-split">
        <form className="host-form" onSubmit={handleSubmit}>
          <h3>Register Space & Capacity</h3>
          <div className="input-group">
            <label>Space Title / Name</label>
            <input type="text" placeholder="e.g. Safe Covered Bay near Nexus Mall" value={title} onChange={(e) => setTitle(e.target.value)} required />
          </div>

          <div className="input-group">
            <label>Destination / Landmark Nearby</label>
            <input type="text" placeholder="e.g. 50m from Nexus Mall West Exit" value={nearLandmark} onChange={(e) => setNearLandmark(e.target.value)} required />
          </div>

          <div className="input-group">
            <label>Physical Address</label>
            <input type="text" placeholder="House/Plot #, Road Name" value={address} onChange={(e) => setAddress(e.target.value)} required />
          </div>

          <div className="capacity-box">
            <label><IconCar size={16} color="#059669" /> Maximum Number of Vehicles</label>
            <div className="cap-inputs">
              <div>
                <span>🚗 Max Cars:</span>
                <input type="number" min="1" max="20" value={maxCars} onChange={(e) => setMaxCars(Number(e.target.value))} required />
              </div>
              <div>
                <span>🏍️ Max Bikes:</span>
                <input type="number" min="0" max="30" value={maxBikes} onChange={(e) => setMaxBikes(Number(e.target.value))} required />
              </div>
            </div>
          </div>

          <div className="doc-box">
            <label><IconFileText size={16} color="#059669" /> Legal Ownership Proof</label>
            <input type="text" placeholder="Owner Legal Full Name" value={ownerLegalName} onChange={(e) => setOwnerLegalName(e.target.value)} required />
            <div className="doc-row">
              <select value={docType} onChange={(e) => setDocType(e.target.value)}>
                <option value="Electricity Bill">Electricity Bill</option>
                <option value="Property Tax Receipt">Property Tax Receipt</option>
                <option value="Sale Deed / Lease">Sale Deed / Lease Agreement</option>
              </select>
              <input type="text" placeholder="Document / Meter Number" value={docProofName} onChange={(e) => setDocProofName(e.target.value)} required />
            </div>
          </div>

          <button type="submit" className="btn-primary" style={{ width: '100%', justifyContent: 'center' }}>
            Publish Spot & Open for Drivers
          </button>
        </form>

        <div className="host-calc-side">
          <div className="calc-card">
            <div className="calc-title"><IconTrendingUp size={18} /> ESTIMATED MONTHLY RETURN</div>
            <div className="calc-number">₹{projectedMonthly.toLocaleString('en-IN')}</div>
            <p>Direct payout at fixed ₹50/hr per car</p>

            <div className="slider-row">
              <label>Occupied Hours/Day: <strong>{hours} hrs</strong></label>
              <input type="range" min="2" max="14" value={hours} onChange={(e) => setHours(Number(e.target.value))} />

              <label>Active Days/Month: <strong>{days} days</strong></label>
              <input type="range" min="10" max="30" value={days} onChange={(e) => setDays(Number(e.target.value))} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
