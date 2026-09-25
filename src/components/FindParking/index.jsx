import React, { useMemo } from 'react';
import SpotCard from '../SpotCard';
import { IconMapPin, IconCar, IconClock, IconZap, IconSparkles, IconShield } from '../Icons';
import './index.css';

export default function FindParking({
  spots,
  searchQuery,
  setSearchQuery,
  selectedVehicle,
  setSelectedVehicle,
  bookingHours,
  setBookingHours,
  filterEV,
  setFilterEV,
  filterWash,
  setFilterWash,
  filterCovered,
  setFilterCovered,
  onBookSpot,
  onPromptBecomeHost
}) {
  const filteredSpots = useMemo(() => {
    return spots.filter((spot) => {
      const matchSearch =
        spot.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        spot.destinationNear.toLowerCase().includes(searchQuery.toLowerCase()) ||
        spot.address.toLowerCase().includes(searchQuery.toLowerCase());

      const matchVehicle = spot.vehicleTypes.includes(selectedVehicle);
      const matchEV = filterEV ? spot.amenities.evCharging : true;
      const matchWash = filterWash ? spot.amenities.carWash : true;
      const matchCovered = filterCovered ? spot.amenities.covered : true;

      return matchSearch && matchVehicle && matchEV && matchWash && matchCovered;
    });
  }, [spots, searchQuery, selectedVehicle, filterEV, filterWash, filterCovered]);

  return (
    <div>
      <div className="host-cta-banner">
        <div>
          <strong>Own a vacant driveway or garage near popular areas?</strong>
          <span> Drivers cannot host on the same account. Register a dedicated Space Host profile.</span>
        </div>
        <button className="btn-primary" style={{ fontSize: 12, padding: '6px 14px' }} onClick={onPromptBecomeHost}>
          Register as Space Host →
        </button>
      </div>

      <section id="hero-banner">
        <div className="hero-badge">
          <IconShield size={16} /> Skip 40-minute mall parking queues
        </div>
        <h2 className="hero-title">
          Park near your destination in private, verified spaces. <span className="highlight-text">Easy in. Instant out.</span>
        </h2>
        <p className="hero-subtext">
          Heading to a packed mall or restaurant? Book verified driveways 50 to 120 meters away.
        </p>

        <div className="search-panel">
          <div className="search-grid">
            <div className="search-field">
              <label><IconMapPin size={15} color="#059669" /> Destination / Area</label>
              <input
                type="text"
                placeholder="e.g. Nexus Mall, Hitec City, Jubilee..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            <div className="search-field">
              <label><IconCar size={15} color="#059669" /> Vehicle Type</label>
              <select value={selectedVehicle} onChange={(e) => setSelectedVehicle(e.target.value)}>
                <option value="Car">Car / Sedan / Hatchback</option>
                <option value="Bike">Bike / Scooty</option>
                <option value="EV">Electric Vehicle (EV)</option>
                <option value="SUV">Large SUV</option>
              </select>
            </div>

            <div className="search-field">
              <label><IconClock size={15} color="#059669" /> Duration</label>
              <select value={bookingHours} onChange={(e) => setBookingHours(Number(e.target.value))}>
                <option value="1">1 Hour</option>
                <option value="2">2 Hours (Standard)</option>
                <option value="4">4 Hours (Shopping / Movie)</option>
                <option value="8">8 Hours (Full Day)</option>
              </select>
            </div>
          </div>

          <div className="filter-chips">
            <span className="filter-title">Filter Add-ons:</span>
            <button className={`chip-btn ${filterEV ? 'active' : ''}`} onClick={() => setFilterEV(!filterEV)}>
              <IconZap size={13} /> EV Fast Charging
            </button>
            <button className={`chip-btn ${filterWash ? 'active' : ''}`} onClick={() => setFilterWash(!filterWash)}>
              <IconSparkles size={13} /> Wash Available
            </button>
            <button className={`chip-btn ${filterCovered ? 'active' : ''}`} onClick={() => setFilterCovered(!filterCovered)}>
              🏢 Covered Garage
            </button>
          </div>
        </div>
      </section>

      <div className="section-bar">
        <h2>Verified Low-Congestion Spaces</h2>
        <span className="spots-count">Showing {filteredSpots.length} verified slots</span>
      </div>

      <div className="spots-grid">
        {filteredSpots.map((spot) => (
          <SpotCard
            key={spot.id}
            spot={spot}
            selectedVehicle={selectedVehicle}
            onBook={onBookSpot}
          />
        ))}
      </div>
    </div>
  );
}
