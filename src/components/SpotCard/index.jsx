import React from 'react';
import { IconMapPin, IconStar, IconZap, IconSparkles, IconShield } from '../Icons';
import './index.css';

export default function SpotCard({ spot, selectedVehicle, onBook }) {
  const platformHourlyFee = selectedVehicle === 'Bike' ? 10 : 20;
  const baseRate = selectedVehicle === 'Bike' ? spot.basePriceBike : spot.basePriceCar;
  const totalHourly = baseRate + platformHourlyFee;

  return (
    <article className="spot-card">
      <div className="spot-media">
        <img src={spot.image} alt={spot.name} loading="lazy" />
        <div className="badge-dist">📍 {spot.distanceMeters}m walk</div>
        <div className="badge-rating">
          <IconStar size={13} /> {spot.rating} ({spot.reviewsCount})
        </div>
      </div>

      <div className="spot-content">
        <h3 className="spot-name">{spot.name}</h3>
        <p className="spot-location">
          <IconMapPin size={13} color="#64748b" /> {spot.address}
        </p>

        <div className="tags-container">
          <span className="amenity-chip">🏢 {spot.hostType}</span>
          {spot.amenities.evCharging && <span className="amenity-chip ev">⚡ EV Socket</span>}
          {spot.amenities.carWash && <span className="amenity-chip wash">✨ Wash Station</span>}
          {spot.amenities.cctv && <span className="amenity-chip">🛡️ 24/7 CCTV</span>}
        </div>

        <div className="capacity-note">
          <strong>Capacity:</strong> Max {spot.maxCarCapacity || 2} Cars, {spot.maxBikeCapacity || 2} Bikes • Verified Bay
        </div>

        <div className="spot-card-footer">
          <div>
            <div className="hourly-rate">₹{totalHourly}</div>
            <span className="rate-period">per hour total</span>
          </div>

          <button className="btn-primary" onClick={() => onBook(spot)}>
            Book Slot →
          </button>
        </div>
      </div>
    </article>
  );
}
