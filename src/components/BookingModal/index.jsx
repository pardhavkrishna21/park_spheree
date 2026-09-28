import React, { useState } from 'react';
import './index.css';

export default function BookingModal({ spot, selectedVehicle, bookingHours, user, onClose, onConfirm }) {
  const [needEV, setNeedEV] = useState(false);
  const [needWash, setNeedWash] = useState(false);

  if (!spot) return null;

  const chargingVehicles = spot.amenities.evChargingVehicles || ['Car', 'Bike'];
  const chargingType = selectedVehicle === 'Bike' ? 'Bike' : 'Car';
  const canChargeSelectedVehicle = spot.amenities.evCharging && chargingVehicles.includes(chargingType);
  const canWashSelectedVehicle = selectedVehicle === 'Bike'
    ? (spot.amenities.bikeWash ?? spot.amenities.carWash)
    : (spot.amenities.carWash ?? spot.amenities.bikeWash);

  const baseRate = selectedVehicle === 'Bike' ? 30 : 50;
  const platRate = selectedVehicle === 'Bike' ? 10 : 20;

  const subtotal = baseRate * bookingHours;
  let platformFee = platRate * bookingHours;
  if (user?.subscription === 'Pro Plan') platformFee = Math.max(0, platformFee - 10);
  if (user?.subscription === 'Ultimate') platformFee = 0;

  const addOnCost = (needEV ? 50 : 0) + (needWash ? (selectedVehicle === 'Bike' ? 60 : 120) : 0);
  const grandTotal = subtotal + platformFee + addOnCost;

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-card" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>Confirm Parking Slot Reservation</h3>
          <button className="close-btn" onClick={onClose}>✕</button>
        </div>

        <div className="modal-body">
          <h4>{spot.name}</h4>
          <p style={{ fontSize: 13, color: '#64748b' }}>{spot.address}</p>

          <div className="summary-box">
            <div>Vehicle: <strong>{selectedVehicle}</strong></div>
            <div>Duration: <strong>{bookingHours} Hours</strong></div>
          </div>

          <div className="addon-options">
            {canChargeSelectedVehicle && (
              <label>
                <input type="checkbox" checked={needEV} onChange={(e) => setNeedEV(e.target.checked)} />
                ⚡ EV charging add-on (+₹50)
                {spot.amenities.evChargerType && <small className="addon-detail">{spot.amenities.evChargerType} · check your vehicle connector before booking</small>}
              </label>
            )}
            {canWashSelectedVehicle && (
              <label>
                <input type="checkbox" checked={needWash} onChange={(e) => setNeedWash(e.target.checked)} />
                ✨ {selectedVehicle === 'Bike' ? 'Bike' : 'Car'} wash (+₹{selectedVehicle === 'Bike' ? 60 : 120})
              </label>
            )}
          </div>

          <div className="price-lines">
            <div><span>Parking Rate:</span> <span>₹{subtotal}</span></div>
            <div><span>Platform Fee:</span> <span>₹{platformFee}</span></div>
            {addOnCost > 0 && <div><span>Add-ons:</span> <span>₹{addOnCost}</span></div>}
            <div className="total-line"><span>Total:</span> <span>₹{grandTotal}</span></div>
          </div>

          <button
            className="btn-primary"
            style={{ width: '100%', justifyContent: 'center', marginTop: 14 }}
            onClick={() => onConfirm({ grandTotal, needEV, needWash })}
          >
            Pay & Reserve Slot (₹{grandTotal})
          </button>
        </div>
      </div>
    </div>
  );
}