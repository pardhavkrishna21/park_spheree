

/* ------------------------------------------------------------------

   Captain Dashboard

   File: src/components/CaptainDashboard.jsx

\------------------------------------------------------------------- */



import React, { useState } from 'react';

import PhotoCapture from './PhotoCapture';

import ValetEvidence from './ValetEvidence';



import {

  PICKUP_SHOTS,

  PARKING_SHOTS,

  STATUS,

  STATUS_LABEL,

  acceptJob,

  rejectJob,

  setPickupPhoto,

  addDamagePhoto,

  removeDamagePhoto,

  setDamageInfo,

  pickupProblems,

  confirmHandover,

  setParkingPhoto,

  setSlot,

  parkingProblems,

  completeJob,

} from '../utils/Valet';



import './valet.css';



const pickupMapsUrl = (info) => {
  if (!info?.valetPickup) return '';
  const hasCoordinates =
    info.valetPickupLat !== null && info.valetPickupLat !== undefined && info.valetPickupLat !== '' &&
    info.valetPickupLng !== null && info.valetPickupLng !== undefined && info.valetPickupLng !== '' &&
    Number.isFinite(Number(info.valetPickupLat)) && Number.isFinite(Number(info.valetPickupLng));
  const destination = hasCoordinates
    ? `${Number(info.valetPickupLat)},${Number(info.valetPickupLng)}`
    : info.valetPickup;
  return `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(destination)}&travelmode=driving`;
};

const JobInfo = ({ info }) => {

  if (!info) return null;



  return (

    <div className="cv-info">

      <div>

        <span>Parking spot</span>

        <strong>{info.spotName || 'Not specified'}</strong>

      </div>



      <div>

        <span>Time slot</span>

        <strong>{info.timeSlot || 'Not specified'}</strong>

      </div>



      <div>

        <span>Vehicle</span>

        <strong>{info.vehicle || 'Not specified'}</strong>

      </div>



      {info.valetPickup && (
        <div>
          <span>Driver pickup location</span>
          <a
            href={pickupMapsUrl(info)}
            target="_blank"
            rel="noreferrer"
            title="Open pickup location in Google Maps"
            style={{ color: 'var(--primary)', fontWeight: 700, textDecoration: 'underline', overflowWrap: 'anywhere' }}
          >
            {info.valetPickup}
          </a>
          <a
            href={pickupMapsUrl(info)}
            target="_blank"
            rel="noreferrer"
            style={{ display: 'inline-flex', alignItems: 'center', gap: 5, marginTop: 5, fontSize: 13, fontWeight: 700, color: 'var(--primary)', textDecoration: 'none' }}
          >
            Open directions in Google Maps ↗
          </a>
          {info.valetPickupLat != null && info.valetPickupLng != null && (
            <small style={{ color: 'var(--muted)', marginTop: 3 }}>
              GPS: {Number(info.valetPickupLat).toFixed(6)}, {Number(info.valetPickupLng).toFixed(6)}
            </small>
          )}
        </div>
      )}



      {info.driverName && (

        <div>

          <span>Driver</span>

          <strong>{info.driverName}</strong>

        </div>

      )}



      {info.driverPhone && (

        <div>

          <span>Call driver</span>

          <a href={`tel:${String(info.driverPhone).replace(/\s/g, '')}`}>

            {info.driverPhone}

          </a>

        </div>

      )}



      {info.driverEmail && (

        <div>

          <span>Driver email</span>

          <strong>{info.driverEmail}</strong>

        </div>

      )}

    </div>

  );

};



const SectionMessage = ({ children }) => (

  <p

    style={{

      padding: 12,

      borderRadius: 8,

      background: '#f1f5f9',

      color: '#334155',

      fontSize: 14,

    }}

  >

    {children}

  </p>

);



const JobPanel = ({

  job,

  onUpdateJob,

  showToast,

}) => {

  const attempt = (result, successMessage) => {

    if (!result?.ok) {

      showToast?.(result?.error || 'Unable to update this job.');

      return;

    }



    onUpdateJob(result.job);



    if (successMessage) {

      showToast?.(successMessage);

    }

  };



  const pickup = job.pickup || {

    photos: {},

    damagePhotos: [],

    noDamage: false,

    damageNotes: '',

  };



  const parking = job.parking || {

    slot: '',

    photos: {},

  };



  const pickupProblemsLeft = pickupProblems(job);

  const parkingProblemsLeft = parkingProblems(job);



  if (job.status === STATUS.COMPLETED) {

    return (

      <div>

        <SectionMessage>

          This valet job is complete. The Driver has acknowledged the

          final parking evidence.

        </SectionMessage>



        <ValetEvidence job={job} />

      </div>

    );

  }



  if (job.status === STATUS.REQUESTED) {

    return (

      <SectionMessage>

        This booking is waiting for a Captain assignment. It will

        appear here when it is assigned to you.

      </SectionMessage>

    );

  }



  if (job.status === STATUS.ASSIGNED) {

    return (

      <div className="cv-actions">

        <button

          type="button"

          className="btn-primary"

          onClick={() =>

            attempt(

              { ok: true, job: acceptJob(job) },

              'Booking accepted. Start preparing for pickup.'

            )

          }

        >

          Accept booking

        </button>



        <button

          type="button"

          className="btn-secondary"

          onClick={() => {

            const nextJob = rejectJob(job);

            onUpdateJob(nextJob);

            showToast?.('Booking declined.');

          }}

        >

          Decline

        </button>

      </div>

    );

  }



  if (job.status === STATUS.PICKUP_REVIEW) {

    return (

      <div>

        <SectionMessage>

          Your pickup photos have been submitted. Wait for the Driver

          to review and acknowledge them. Vehicle handover and parking

          remain locked until then.

        </SectionMessage>



        <ValetEvidence job={job} />

      </div>

    );

  }



  if (job.status === STATUS.PARKING_REVIEW) {

    return (

      <div>

        <SectionMessage>

          Your final parking evidence has been submitted. The Driver

          must review and acknowledge it before the job is completed.

        </SectionMessage>



        <ValetEvidence job={job} />

      </div>

    );

  }



  const pickupLocked = job.status !== STATUS.ACCEPTED;

  const parkingLocked = job.status !== STATUS.HANDED_OVER;



  return (

    <>

      {/* STEP 1: VEHICLE CONDITION BEFORE PICKUP */}

      <section className="cv-step">

        <h4>

          Step 1: Vehicle condition before pickup

          {pickupLocked ? ' 🔒' : ''}

        </h4>



        <p className="banner-subtext">

          Photograph all sides of the vehicle and its dashboard before

          taking custody of the car.

        </p>



        <div className="pc-grid">

          {PICKUP_SHOTS.map((shot) => (

            <PhotoCapture

              key={shot.key}

              label={shot.label}

              required

              disabled={pickupLocked}

              photo={pickup.photos?.[shot.key] || null}

              onCapture={(photo) =>

                onUpdateJob(

                  setPickupPhoto(job, shot.key, photo)

                )

              }

            />

          ))}

        </div>



        <label className="cv-check">

          <input

            type="checkbox"

            disabled={pickupLocked}

            checked={Boolean(pickup.noDamage)}

            onChange={(e) =>

              onUpdateJob(

                setDamageInfo(

                  job,

                  e.target.checked

                    ? {

                        noDamage: true,

                        damagePhotos: [],

                        damageNotes: '',

                      }

                    : { noDamage: false }

                )

              )

            }

          />

          No visible damage on the vehicle

        </label>



        {!pickup.noDamage && (

          <>

            <h5>Existing damage evidence</h5>



            <div className="cv-damage-thumbs">

              {(pickup.damagePhotos || []).map((photo, index) => (

                <div key={`${photo.takenAt || 'photo'}-${index}`}>

                  <img

                    src={photo.src}

                    alt={`Existing vehicle damage ${index + 1}`}

                  />



                  {!pickupLocked && (

                    <button

                      type="button"

                      aria-label="Remove damage photo"

                      onClick={() =>

                        onUpdateJob(removeDamagePhoto(job, index))

                      }

                    >

                      ×

                    </button>

                  )}

                </div>

              ))}

            </div>



            <div className="pc-grid">

              <PhotoCapture

                label="Add damage photo"

                disabled={pickupLocked}

                photo={null}

                onCapture={(photo) =>

                  onUpdateJob(addDamagePhoto(job, photo))

                }

              />

            </div>



            <label

              htmlFor={`damage-notes-${job.bookingId}`}

              style={{ display: 'block', marginTop: 12 }}

            >

              Describe existing scratches or dents

            </label>



            <textarea

              id={`damage-notes-${job.bookingId}`}

              rows={3}

              disabled={pickupLocked}

              value={pickup.damageNotes || ''}

              onChange={(e) =>

                onUpdateJob(

                  setDamageInfo(job, {

                    damageNotes: e.target.value,

                  })

                )

              }

              placeholder="Describe the location and size of existing damage."

              style={{

                width: '100%',

                boxSizing: 'border-box',

                marginTop: 8,

              }}

            />

          </>

        )}



        {!pickupLocked && (

          <>

            {pickupProblemsLeft.length > 0 && (

              <p className="cv-todo">

                Still needed: {pickupProblemsLeft.join(', ')}

              </p>

            )}



            <div className="cv-actions">

              <button

                type="button"

                className="btn-primary"

                onClick={() =>

                  attempt(

                    confirmHandover(job),

                    'Pickup photos submitted. Waiting for Driver acknowledgement.'

                  )

                }

              >

                Submit pickup photos

              </button>

            </div>

          </>

        )}



        {job.pickup?.acknowledgedAt && (

          <SectionMessage>

            Pickup evidence acknowledged by the Driver.

          </SectionMessage>

        )}

      </section>



      {/* STEP 2: PARK THE VEHICLE */}

      <section

        className={`cv-step ${parkingLocked ? 'cv-locked' : ''}`}

        style={{

          marginTop: 20,

          opacity: parkingLocked ? 0.7 : 1,

        }}

      >

        <h4>

          Step 2: Park the vehicle

          {parkingLocked ? ' 🔒' : ''}

        </h4>



        {parkingLocked && (

          <SectionMessage>

            Parking is locked until the Driver acknowledges the initial

            pickup photos. You cannot mark the vehicle as parked yet.

          </SectionMessage>

        )}



        {!parkingLocked && (

          <p className="banner-subtext">

            Enter the assigned parking bay and photograph the parked

            vehicle and surrounding space.

          </p>

        )}



        <label

          htmlFor={`parking-slot-${job.bookingId}`}

          style={{ display: 'block', marginBottom: 6 }}

        >

          Parking bay / slot number

        </label>



        <input

          id={`parking-slot-${job.bookingId}`}

          className="cv-slot"

          disabled={parkingLocked}

          value={parking.slot || ''}

          onChange={(e) =>

            onUpdateJob(setSlot(job, e.target.value))

          }

          placeholder="Enter parking bay / slot number"

          style={{

            width: '100%',

            boxSizing: 'border-box',

            marginBottom: 12,

          }}

        />



        <div className="pc-grid">

          {PARKING_SHOTS.map((shot) => (

            <PhotoCapture

              key={shot.key}

              label={shot.label}

              required

              disabled={parkingLocked}

              photo={parking.photos?.[shot.key] || null}

              onCapture={(photo) =>

                onUpdateJob(

                  setParkingPhoto(job, shot.key, photo)

                )

              }

            />

          ))}

        </div>



        {!parkingLocked && (

          <>

            {parkingProblemsLeft.length > 0 && (

              <p className="cv-todo">

                Still needed: {parkingProblemsLeft.join(', ')}

              </p>

            )}



            <div className="cv-actions">

              <button

                type="button"

                className="btn-primary"

                onClick={() =>

                  attempt(

                    completeJob(job),

                    'Parking evidence submitted. Waiting for Driver acknowledgement.'

                  )

                }

              >

                Submit final parking evidence

              </button>

            </div>

          </>

        )}



        {job.parking?.acknowledgedAt && (

          <SectionMessage>

            Final parking evidence acknowledged by the Driver.

          </SectionMessage>

        )}

      </section>

    </>

  );

};



const CaptainDashboard = ({

  captain,

  jobs = [],

  describeBooking = (id) => `Booking #${id}`,

  onUpdateJob,

  showToast,

}) => {

  const [openId, setOpenId] = useState(null);



  const mine = jobs

    .filter(

      (job) =>

        job.captain &&

        job.captain.id === captain.id

    )

    .sort((a, b) =>

      (b.assignedAt || '').localeCompare(a.assignedAt || '')

    );



  const done = mine.filter(

    (job) => job.status === STATUS.COMPLETED

  );



  const active = mine.filter(

    (job) => job.status !== STATUS.COMPLETED

  );



  const renderJob = (job) => {

    const expanded = openId === job.bookingId;



    return (

      <article className="cv-card" key={job.bookingId}>

        <button

          type="button"

          className="cv-card-head"

          onClick={() =>

            setOpenId(expanded ? null : job.bookingId)

          }

          aria-expanded={expanded}

          style={{

            width: '100%',

            display: 'flex',

            alignItems: 'center',

            justifyContent: 'space-between',

            gap: 12,

            textAlign: 'left',

            cursor: 'pointer',

            color: 'inherit',

          }}

        >

          <strong>{describeBooking(job.bookingId)}</strong>



          <span className={`ve-chip ve-${job.status}`}>

            {STATUS_LABEL[job.status] || job.status}

          </span>

        </button>



        {expanded && (

          <div style={{ marginTop: 14 }}>

            <JobInfo info={job.info} />



            <JobPanel

              job={job}

              onUpdateJob={onUpdateJob}

              showToast={showToast}

            />

          </div>

        )}

      </article>

    );

  };



  return (

    <main className="cv-wrap">

      <h2 className="cv-heading">Captain Valet — My Jobs</h2>



      <p className="banner-subtext">

        Signed in as {captain.name}. Accept assignments, document

        vehicle condition, and submit parking evidence.

      </p>



      <section>

        <h3>Assigned to you ({active.length})</h3>



        {active.length > 0 ? (

          active.map(renderJob)

        ) : (

          <p className="cv-empty">

            No active assignments right now.

          </p>

        )}

      </section>



      {done.length > 0 && (

        <section style={{ marginTop: 24 }}>

          <h3>Completed jobs ({done.length})</h3>

          {done.map(renderJob)}

        </section>

      )}

    </main>

  );

};



export default CaptainDashboard;
