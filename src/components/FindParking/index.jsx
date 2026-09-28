import React, { useEffect, useMemo, useState } from 'react';
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
  const [spotPage, setSpotPage] = useState(0);

  const filteredSpots = useMemo(() => {
    return spots.filter((spot) => {
      const matchSearch =
        spot.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        spot.destinationNear.toLowerCase().includes(searchQuery.toLowerCase()) ||
        spot.address.toLowerCase().includes(searchQuery.toLowerCase());

      const matchVehicle = spot.vehicleTypes.includes(selectedVehicle);
      const chargingVehicles = spot.amenities.evChargingVehicles || ['Car', 'Bike'];
      const chargingType = selectedVehicle === 'Bike' ? 'Bike' : 'Car';
      const matchEV = filterEV
        ? spot.amenities.evCharging && chargingVehicles.includes(chargingType)
        : true;
      const washAvailable = selectedVehicle === 'Bike'
        ? (spot.amenities.bikeWash ?? spot.amenities.carWash)
        : (spot.amenities.carWash ?? spot.amenities.bikeWash);
      const matchWash = filterWash ? washAvailable : true;
      const matchCovered = filterCovered ? spot.amenities.covered : true;

      return matchSearch && matchVehicle && matchEV && matchWash && matchCovered;
    });
  }, [spots, searchQuery, selectedVehicle, filterEV, filterWash, filterCovered]);

  useEffect(() => {
    setSpotPage(0);
  }, [spots, searchQuery, selectedVehicle, filterEV, filterWash, filterCovered]);

  const spotsPerPage = 6;
  const pageCount = Math.ceil(filteredSpots.length / spotsPerPage);
  const currentPage = Math.min(spotPage, Math.max(pageCount - 1, 0));
  const visibleSpots = filteredSpots.slice(currentPage * spotsPerPage, (currentPage + 1) * spotsPerPage);
  const firstVisibleSpot = filteredSpots.length === 0 ? 0 : currentPage * spotsPerPage + 1;
  const lastVisibleSpot = Math.min((currentPage + 1) * spotsPerPage, filteredSpots.length);

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
        <span className="spots-count">{filteredSpots.length} verified places</span>
      </div>

      <div className="spots-grid">
        {visibleSpots.map((spot) => (
          <SpotCard
            key={spot.id}
            spot={spot}
            selectedVehicle={selectedVehicle}
            onBook={onBookSpot}
          />
        ))}
      </div>

      {filteredSpots.length === 0 && (
        <p className="spots-empty">No parking places match these filters. Try a different area or vehicle type.</p>
      )}

      <div className="spots-pagination" aria-label="Parking places pages">
        <p aria-live="polite">Showing <strong>{firstVisibleSpot}–{lastVisibleSpot}</strong> of <strong>{filteredSpots.length}</strong> places</p>
        <div className="spots-page-controls">
          <button type="button" onClick={() => setSpotPage((page) => Math.max(0, page - 1))} disabled={currentPage === 0}>
            ← Previous
          </button>
          <span>Page {pageCount === 0 ? 0 : currentPage + 1} of {pageCount}</span>
          <button type="button" onClick={() => setSpotPage((page) => Math.min(pageCount - 1, page + 1))} disabled={currentPage >= pageCount - 1}>
            Next →
          </button>
        </div>
      </div>
    </div>
  );
}
