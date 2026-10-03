import React, { useState } from 'react';
import { IconCar, IconFileText, IconTrendingUp, IconClock, IconCamera, IconMapPin, IconCheck } from '../Icons';
import './index.css';

export default function HostListings({ user, spots, setSpots, hostSpots, setHostSpots, showToast, setCurrentTab }) {
  const [title, setTitle] = useState('');
  const [nearLandmark, setNearLandmark] = useState('');
  const [address, setAddress] = useState('');
  const [spaceType, setSpaceType] = useState('Private Covered Garage');
  const [maxCars, setMaxCars] = useState(2);
  const [maxBikes, setMaxBikes] = useState(3);
  const [evCharging, setEvCharging] = useState(false);
  const [evChargingVehicles, setEvChargingVehicles] = useState(['Car']);
  const [evChargerType, setEvChargerType] = useState('Type 2 AC');
  const [carWash, setCarWash] = useState(false);
  const [bikeWash, setBikeWash] = useState(false);
  const [basicService, setBasicService] = useState(false);
  const [serviceDetails, setServiceDetails] = useState('');
  const [photoUrl, setPhotoUrl] = useState('');
  const [docType, setDocType] = useState('Electricity Bill');
  const [docProofName, setDocProofName] = useState('');
  const [ownerLegalName, setOwnerLegalName] = useState(user.name || '');

  const [hours, setHours] = useState(6);
  const [days, setDays] = useState(26);

  const [vehicleMode, setVehicleMode] = useState('Car');
  const [bookedBays, setBookedBays] = useState({});

  const FIXED_CAR = 50;
  const FIXED_BIKE = 30;
  const projectedMonthly = FIXED_CAR * hours * days;
  const modeRate = vehicleMode === 'Car' ? FIXED_CAR : FIXED_BIKE;
  const modeSlots = vehicleMode === 'Car' ? Number(maxCars) : Number(maxBikes);
  const perDay = modeRate * hours;
  const perMonthAll = perDay * days * modeSlots;
  const perYearAll = perMonthAll * 12;
  const bookedCount = Array.from({ length: Math.min(modeSlots, 30) }, (_, i) => bookedBays[`${vehicleMode}-${i}`]).filter(Boolean).length;
  const weeklyBars = [0.6, 0.75, 0.7, 0.85, 1, 0.95, 0.8];
  const weekDays = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

  const toggleEVVehicle = (vehicleType) => {
    setEvChargingVehicles((current) => current.includes(vehicleType)
      ? current.filter((type) => type !== vehicleType)
      : [...current, vehicleType]);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!title || !address || !docProofName) {
      showToast('⚠️ Title, address, and ownership document proof are mandatory.');
      return;
    }
    if (evCharging && evChargingVehicles.length === 0) {
      showToast('⚠️ Select whether this charger supports electric cars, bikes, or both.');
      return;
    }

    const carCapacity = Number(maxCars);
    const bikeCapacity = Number(maxBikes);
    if (carCapacity + bikeCapacity === 0) {
      showToast('⚠️ Add capacity for at least one car or bike.');
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
      vehicleTypes: [
        ...(carCapacity > 0 ? ['Car', 'EV', 'SUV'] : []),
        ...(bikeCapacity > 0 ? ['Bike'] : [])
      ],
      basePriceBike: 30, // Platform guaranteed fixed rate
      basePriceCar: 50,  // Platform guaranteed fixed rate
      image: photoUrl || 'https://images.unsplash.com/photo-1590674899484-d5640e854abe?auto=format&fit=crop&w=700&q=80',
      amenities: {
        evCharging,
        evChargerType: evCharging ? evChargerType : '',
        evChargingVehicles: evCharging ? evChargingVehicles : [],
        carWash,
        bikeWash,
        basicService,
        serviceDetails: serviceDetails.trim(),
        cctv: true,
        covered: spaceType.toLowerCase().includes('covered')
      },
      maxCarCapacity: carCapacity,
      maxBikeCapacity: bikeCapacity,
      totalSlots: carCapacity + bikeCapacity,
      availableSlots: carCapacity + bikeCapacity,
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

          <div className="input-group">
            <label>Type of parking space</label>
            <select value={spaceType} onChange={(e) => setSpaceType(e.target.value)}>
              <option>Private Covered Garage</option>
              <option>Open Residential Driveway</option>
              <option>Dedicated Parking Plot</option>
              <option>Covered Commercial Garage</option>
            </select>
          </div>

          <div className="capacity-box">
            <label><IconCar size={16} color="#059669" /> Maximum Number of Vehicles</label>
            <div className="cap-inputs">
              <div>
                <span>🚗 Max Cars:</span>
                <input type="number" min="0" max="20" value={maxCars} onChange={(e) => setMaxCars(Number(e.target.value))} required />
              </div>
              <div>
                <span>🏍️ Max Bikes:</span>
                <input type="number" min="0" max="30" value={maxBikes} onChange={(e) => setMaxBikes(Number(e.target.value))} required />
              </div>
            </div>
          </div>

          <section className="host-offerings-box" aria-labelledby="host-offerings-heading">
            <div className="host-offerings-heading">
              <h4 id="host-offerings-heading">EV charging and vehicle care</h4>
              <p>Select only facilities you can provide at this location.</p>
            </div>

            <label className="offering-toggle">
              <input type="checkbox" checked={evCharging} onChange={(e) => setEvCharging(e.target.checked)} />
              <span><strong>EV charging available</strong><small>Show charging details to drivers and offer charging at booking.</small></span>
            </label>

            {evCharging && (
              <div className="ev-charger-details">
                <fieldset className="offering-choices">
                  <legend>Compatible electric vehicles</legend>
                  <label><input type="checkbox" checked={evChargingVehicles.includes('Car')} onChange={() => toggleEVVehicle('Car')} /> Electric cars</label>
                  <label><input type="checkbox" checked={evChargingVehicles.includes('Bike')} onChange={() => toggleEVVehicle('Bike')} /> Electric bikes / scooters</label>
                </fieldset>

                <div className="input-group">
                  <label htmlFor="ev-charger-type">Charger or outlet type</label>
                  <select id="ev-charger-type" value={evChargerType} onChange={(e) => setEvChargerType(e.target.value)}>
                    <option value="Type 2 AC">Type 2 AC charger</option>
                    <option value="CCS2 DC fast">CCS2 DC fast charger</option>
                    <option value="Dedicated 2-wheeler charger">Dedicated 2-wheeler charger</option>
                    <option value="15A outlet">15A outlet with compatible portable charger</option>
                  </select>
                </div>

                <div className="charger-guide">
                  <strong>Charger types at a glance</strong>
                  <p><b>Type 2 AC:</b> common at public and destination car chargers; charging speed depends on the car and supply.</p>
                  <p><b>CCS2 DC:</b> fast charging for compatible electric cars, usually found at dedicated charging sites.</p>
                  <p><b>2-wheeler charger / 15A outlet:</b> compatibility varies by make and model. Confirm the vehicle supports the connector and use manufacturer-approved equipment.</p>
                </div>
              </div>
            )}

            <div className="offering-divider" />
            <p className="offering-subheading">Vehicle care offered at this spot</p>
            <div className="offering-check-grid">
              <label><input type="checkbox" checked={carWash} onChange={(e) => setCarWash(e.target.checked)} /> Car wash</label>
              <label><input type="checkbox" checked={bikeWash} onChange={(e) => setBikeWash(e.target.checked)} /> Bike wash</label>
              <label><input type="checkbox" checked={basicService} onChange={(e) => setBasicService(e.target.checked)} /> Basic vehicle servicing</label>
            </div>
            {(carWash || bikeWash || basicService) && (
              <div className="input-group service-details-field">
                <label htmlFor="service-details">Service details for drivers (optional)</label>
                <input id="service-details" type="text" maxLength="100" placeholder="e.g. exterior wash, tyre air, basic checks" value={serviceDetails} onChange={(e) => setServiceDetails(e.target.value)} />
                <small>Service pricing and arrangements are confirmed with the host; only washes are selectable as a booking add-on.</small>
              </div>
            )}
          </section>

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

          <div className="potential-card">
            <div className="potential-head">
              <strong>Your full-space potential</strong>
              <div className="potential-toggle" role="tablist">
                {['Car', 'Bike'].map((mode) => (
                  <button type="button" key={mode} className={vehicleMode === mode ? 'active' : ''} onClick={() => setVehicleMode(mode)}>
                    {mode === 'Car' ? '🚗 Cars' : '🏍️ Bikes'}
                  </button>
                ))}
              </div>
            </div>

            <div className="potential-stats">
              <div><span>Per day / slot</span><strong>₹{perDay.toLocaleString('en-IN')}</strong></div>
              <div><span>Monthly ({modeSlots} {vehicleMode.toLowerCase()} slots)</span><strong>₹{perMonthAll.toLocaleString('en-IN')}</strong></div>
              <div className="wide"><span>Yearly potential</span><strong>₹{perYearAll.toLocaleString('en-IN')}</strong></div>
            </div>

            <div className="bay-sim">
              <div className="bay-sim-title">
                <span>Tap bays to simulate bookings</span>
                <strong>{bookedCount}/{modeSlots} booked · ₹{(bookedCount * perDay).toLocaleString('en-IN')}/day</strong>
              </div>
              <div className="bay-grid">
                {Array.from({ length: Math.min(modeSlots, 30) }, (_, i) => {
                  const key = `${vehicleMode}-${i}`;
                  return (
                    <button type="button" key={key} className={`bay${bookedBays[key] ? ' booked' : ''}`} onClick={() => setBookedBays((b) => ({ ...b, [key]: !b[key] }))}>
                      {bookedBays[key] ? (vehicleMode === 'Car' ? '🚗' : '🏍️') : i + 1}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="potential-bars" aria-label="Typical weekly demand">
              {weeklyBars.map((v, i) => (
                <div key={i} className="bar-col" title={`₹${Math.round(perDay * modeSlots * v).toLocaleString('en-IN')}`}>
                  <div className="bar" style={{ height: `${v * 64}px` }} />
                  <span>{weekDays[i]}</span>
                </div>
              ))}
            </div>
            <p className="potential-note">Weekends and office hours tend to see the highest demand. Hover a bar for the day's estimate.</p>

            <ul className="potential-tips">
              <li><IconCheck size={14} /> Add EV charging to attract more bookings</li>
              <li><IconCheck size={14} /> Clear photos get noticed faster</li>
              <li><IconCheck size={14} /> Payouts go straight to your UPI</li>
            </ul>
          </div>
        </div>
      </div>

      <section className="host-guide host-earnings-guide">
        <div className="host-guide-heading">
          <span className="host-guide-kicker">YOUR SPACE, WORKING FOR YOU</span>
          <h3>How your parking spot earns</h3>
          <p>Drivers book an available bay by the hour. Your earnings grow with each occupied booking.</p>
        </div>

        <div className="earning-flow">
          <div className="earning-step">
            <span className="earning-step-number">01</span>
            <h4>Publish your space</h4>
            <p>Add your location, capacity, and ownership proof so drivers can find and book your spot.</p>
          </div>
          <div className="earning-step">
            <span className="earning-step-number">02</span>
            <h4>Earn by the hour</h4>
            <p>Current fixed rates are <strong>₹50/hour per car</strong> and <strong>₹30/hour per bike</strong>.</p>
          </div>
          <div className="earning-step">
            <span className="earning-step-number">03</span>
            <h4>Track and withdraw</h4>
            <p>Follow bookings in Revenue Generated and request a payout to your UPI account.</p>
          </div>
        </div>

        <div className="earning-example">
          <IconTrendingUp size={20} color="#047857" />
          <p><strong>Example:</strong> A 4-hour booking is ₹200 for a car or ₹120 for a bike, using the current fixed hourly rates.</p>
        </div>
      </section>

      <section className="host-guide valet-guide">
        <div className="host-guide-heading valet-guide-heading">
          <div>
            <span className="host-guide-kicker">A FUTURE PARKSPHERE SERVICE</span>
            <h3>How Captain valet parking will work</h3>
            <p>A vetted Captain can collect a booked vehicle, drive it to its reserved bay, and confirm safe parking.</p>
          </div>
          <span className="valet-upcoming-label">UPCOMING</span>
        </div>

        <div className="valet-flow">
          <div className="valet-step">
            <span className="valet-step-icon"><IconCheck size={19} /></span>
            <span className="valet-step-number">STEP 1</span>
            <h4>Book a spot and request pickup</h4>
            <p>The driver books a bay and requests a Captain for the vehicle handover.</p>
          </div>
          <div className="valet-step">
            <span className="valet-step-icon"><IconCamera size={19} /></span>
            <span className="valet-step-number">STEP 2</span>
            <h4>Inspect and hand over</h4>
            <p>The Captain records the vehicle’s condition with timestamped photos before driving.</p>
          </div>
          <div className="valet-step">
            <span className="valet-step-icon"><IconMapPin size={19} /></span>
            <span className="valet-step-number">STEP 3</span>
            <h4>Drive to the reserved bay</h4>
            <p>The driver can follow the trip while the Captain navigates to the booked parking space.</p>
          </div>
          <div className="valet-step">
            <span className="valet-step-icon"><IconClock size={19} /></span>
            <span className="valet-step-number">STEP 4</span>
            <h4>Confirm parking and return</h4>
            <p>Parking photos and a notification confirm arrival; a retrieval code supports vehicle return.</p>
          </div>
        </div>
      </section>
    </div>
  );
}
