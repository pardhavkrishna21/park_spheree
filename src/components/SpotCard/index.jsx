import React from 'react';
import { IconMapPin, IconStar, IconZap, IconSparkles, IconShield } from '../Icons';
import './index.css';

export default function SpotCard({ spot, selectedVehicle, availability, onBook }) {
  const totalHourly = selectedVehicle === 'Bike' ? spot.basePriceBike : spot.basePriceCar;
  const { total, free } = availability;
  const STATUS_LABELS = { available: 'Available', fast: 'Fast Filling', almost: 'Almost Filled', filled: 'Filled' };
  const status = { label: STATUS_LABELS[availability.status], cls: availability.status };
  const landmark = (spot.destinationNear || spot.address).split('/')[0].trim();
  const mapUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${landmark}, Hyderabad`)}`;
  const evVehicles = spot.amenities.evChargingVehicles || ['Car', 'Bike'];
  const washForCar = spot.amenities.carWash;
  const washForBike = spot.amenities.bikeWash ?? spot.amenities.carWash;

  return (
    <article className={`spot-card ${availability.mine > 0 ? 'booked-by-me' : ''}`}>
      <div className="spot-media">
        {availability.mine > 0 && <div className="badge-booked">✓ You booked</div>}
        <img src={spot.image} alt={spot.name} loading="lazy" />
        <div className="badge-dist">📍 {spot.distanceMeters}m walk</div>
        <div className="badge-rating">
          <IconStar size={13} /> {spot.rating} ({spot.reviewsCount})
        </div>
      </div>

      <div className="spot-content">
        <h3 className="spot-name">
          <a className="map-hover" href={mapUrl} target="_blank" rel="noopener noreferrer">{spot.name}</a>
        </h3>
        <p className="spot-location">
          <IconMapPin size={13} color="#64748b" />
          <a className="map-hover" href={mapUrl} target="_blank" rel="noopener noreferrer">{spot.address}</a>
        </p>

        <div className="tags-container">
          <span className="amenity-chip">🏢 {spot.hostType}</span>
          {spot.amenities.evCharging && (
            <span className="amenity-chip ev">
              ⚡ {spot.amenities.evChargerType || 'EV charging'} · {evVehicles.map((type) => type === 'Bike' ? 'e-bikes' : 'e-cars').join(', ')}
            </span>
          )}
          {washForCar && <span className="amenity-chip wash">✨ Car wash</span>}
          {washForBike && <span className="amenity-chip wash">✨ Bike wash</span>}
          {spot.amenities.basicService && <span className="amenity-chip service">🛠 Basic servicing</span>}
          {spot.amenities.cctv && <span className="amenity-chip">🛡️ 24/7 CCTV</span>}
        </div>

        {spot.amenities.serviceDetails && (
          <p className="spot-service-note">Vehicle care: {spot.amenities.serviceDetails}</p>
        )}

        <div className="capacity-note">
          <strong>Capacity:</strong> Max {spot.maxCarCapacity ?? 2} Cars, {spot.maxBikeCapacity ?? 2} Bikes • Verified Bay
        </div>

        <div className="spot-card-footer">
          <div>
            <div className="hourly-rate">₹{totalHourly}</div>
            <span className="rate-period">per hour</span>
          </div>

          <button className="btn-primary" disabled={free === 0} onClick={() => onBook(spot)}>
            {free === 0 ? 'Filled' : 'Book Slot →'}
          </button>
        </div>

        <div className={`fill-panel ${status.cls}`}>
          <div className="fill-ring" style={{ '--pct': `${((total - free) / total) * 100}%` }}>
            <div className="fill-ring-inner">
              <strong>{free}</strong>
              <span>free</span>
            </div>
          </div>
          <div className="fill-info">
            <span className="fill-pill"><i className="fill-dot" /> {status.label}</span>
            <p>{free === 0 ? 'No spots left right now' : status.cls === 'almost' ? `Almost full - only ${free} spot${free > 1 ? 's' : ''} left!` : status.cls === 'fast' ? `Filling fast - ${free} spots left` : `${free} of ${total} spots open`}</p>
            <div className="fill-bars">
              {Array.from({ length: Math.min(total, 12) }, (_, i) => (
                <span key={i} className={i < total - free ? 'taken' : 'open'} title={i < total - free ? `P${i + 1} occupied` : `P${i + 1} free`} />
              ))}
            </div>
          </div>
        </div>
      </div>
    </article>
  );
}
