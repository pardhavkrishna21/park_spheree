import React from "react";
import { PICKUP_SHOTS, PARKING_SHOTS, STATUS_LABEL } from "../utils/Valet.js";
import "./valet.css";

const getPhotoSource = (photo) => {
  if (typeof photo === "string") return photo;
  if (!photo || typeof photo !== "object") return "";
  return photo.src || photo.url || photo.preview || "";
};

const getPhotoTime = (photo) => {
  if (!photo || typeof photo !== "object") return "";
  const value = photo.takenAt || photo.capturedAt || photo.timestamp || "";
  if (!value) return "";

  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "" : date.toLocaleString();
};

const PhotoGrid = ({ title, shots, photos }) => {
  const items = shots
    .map((shot) => ({
      key: shot.key,
      label: shot.label,
      photo: photos?.[shot.key],
    }))
    .filter((item) => getPhotoSource(item.photo));

  if (!items.length) return null;

  return (
    <section className="ve-section">
      <h4 className="ve-title">{title}</h4>
      <div className="ve-grid">
        {items.map(({ key, label, photo }) => (
          <figure className="ve-shot" key={key}>
            <a
              href={getPhotoSource(photo)}
              target="_blank"
              rel="noreferrer"
              aria-label={`Open ${label} photo`}
            >
              <img src={getPhotoSource(photo)} alt={label} loading="lazy" />
            </a>
            <figcaption>
              <span>{label}</span>
              {getPhotoTime(photo) && <small>{getPhotoTime(photo)}</small>}
            </figcaption>
          </figure>
        ))}
      </div>
    </section>
  );
};

const DamagePhotos = ({ photos = [] }) => {
  const validPhotos = photos.filter((photo) => getPhotoSource(photo));
  if (!validPhotos.length) return null;

  return (
    <section className="ve-section">
      <h4 className="ve-title">Existing damage evidence</h4>
      <div className="ve-grid">
        {validPhotos.map((photo, index) => (
          <figure className="ve-shot" key={photo.takenAt || photo.id || index}>
            <a
              href={getPhotoSource(photo)}
              target="_blank"
              rel="noreferrer"
              aria-label={`Open existing damage photo ${index + 1}`}
            >
              <img
                src={getPhotoSource(photo)}
                alt={`Existing vehicle damage ${index + 1}`}
                loading="lazy"
              />
            </a>
            <figcaption>
              <span>Damage photo {index + 1}</span>
              {getPhotoTime(photo) && <small>{getPhotoTime(photo)}</small>}
            </figcaption>
          </figure>
        ))}
      </div>
    </section>
  );
};

const LegacyPhotos = ({ photos }) => {
  if (!Array.isArray(photos) || !photos.length) return null;

  const validPhotos = photos.filter((photo) => getPhotoSource(photo));
  if (!validPhotos.length) return null;

  return (
    <section className="ve-section">
      <h4 className="ve-title">Vehicle inspection photos</h4>
      <div className="ve-grid">
        {validPhotos.map((photo, index) => (
          <figure className="ve-shot" key={photo.id || index}>
            <a
              href={getPhotoSource(photo)}
              target="_blank"
              rel="noreferrer"
              aria-label={`Open vehicle inspection photo ${index + 1}`}
            >
              <img
                src={getPhotoSource(photo)}
                alt={photo.type || `Vehicle inspection ${index + 1}`}
                loading="lazy"
              />
            </a>
            <figcaption>
              <span>{photo.type || `Vehicle photo ${index + 1}`}</span>
              {getPhotoTime(photo) && <small>{getPhotoTime(photo)}</small>}
            </figcaption>
          </figure>
        ))}
      </div>
    </section>
  );
};

const ValetEvidence = ({ job, photos }) => {
  // Backward compatibility for any older component that passes `photos`.
  if (!job) {
    return (
      <div className="ve-wrap">
        <LegacyPhotos photos={photos} />
        {(!photos || photos.length === 0) && (
          <p className="cv-empty">No vehicle inspection photos uploaded yet.</p>
        )}
      </div>
    );
  }

  const pickupPhotos = job.pickup?.photos || {};
  const parkingPhotos = job.parking?.photos || {};
  const hasPickupPhotos = PICKUP_SHOTS.some(
    (shot) => getPhotoSource(pickupPhotos[shot.key])
  );
  const hasParkingPhotos = PARKING_SHOTS.some(
    (shot) => getPhotoSource(parkingPhotos[shot.key])
  );
  const hasDamagePhotos = (job.pickup?.damagePhotos || []).some(
    (photo) => getPhotoSource(photo)
  );

  return (
    <div className="ve-wrap">
      <div className="ve-head">
        <div>
          <h3>Vehicle Evidence</h3>
          <p className="ve-note">
            Booking #{job.bookingId}
            {job.status ? ` · ${STATUS_LABEL[job.status] || job.status}` : ""}
          </p>
        </div>
        {job.parking?.slot && (
          <span className="ve-chip">Bay: {job.parking.slot}</span>
        )}
      </div>

      {hasPickupPhotos ? (
        <PhotoGrid
          title="1. Before pickup"
          shots={PICKUP_SHOTS}
          photos={pickupPhotos}
        />
      ) : (
        <p className="cv-empty">Pickup inspection photos have not been saved.</p>
      )}

      {job.pickup?.noDamage ? (
        <p className="ve-note">Captain reported no visible damage before pickup.</p>
      ) : (
        <>
          {hasDamagePhotos && <DamagePhotos photos={job.pickup?.damagePhotos} />}
          {job.pickup?.damageNotes && (
            <p className="ve-note">
              <strong>Damage notes:</strong> {job.pickup.damageNotes}
            </p>
          )}
        </>
      )}

      {hasParkingPhotos ? (
        <PhotoGrid
          title="2. After parking"
          shots={PARKING_SHOTS}
          photos={parkingPhotos}
        />
      ) : (
        <p className="cv-empty">Final parking photos have not been saved yet.</p>
      )}

      <div className="ve-timestamps">
        {job.pickup?.submittedAt && (
          <p className="ve-note">
            Pickup evidence submitted:{" "}
            {new Date(job.pickup.submittedAt).toLocaleString()}
          </p>
        )}
        {job.pickup?.acknowledgedAt && (
          <p className="ve-note">
            Pickup evidence acknowledged:{" "}
            {new Date(job.pickup.acknowledgedAt).toLocaleString()}
          </p>
        )}
        {job.parking?.submittedAt && (
          <p className="ve-note">
            Parking evidence submitted:{" "}
            {new Date(job.parking.submittedAt).toLocaleString()}
          </p>
        )}
        {job.parking?.acknowledgedAt && (
          <p className="ve-note">
            Parking evidence acknowledged:{" "}
            {new Date(job.parking.acknowledgedAt).toLocaleString()}
          </p>
        )}
      </div>
    </div>
  );
};

export default ValetEvidence;
