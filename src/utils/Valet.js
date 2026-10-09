
/* ------------------------------------------------------------------
   Captain Valet: data model + workflow rules
   File: src/utils/valet.js
------------------------------------------------------------------- */

export const PICKUP_SHOTS = [
  { key: 'front', label: 'Front' },
  { key: 'rear', label: 'Rear' },
  { key: 'left', label: 'Left side' },
  { key: 'right', label: 'Right side' },
  { key: 'dashboard', label: 'Dashboard / odometer' },
];

export const PARKING_SHOTS = [
  { key: 'parkingArea', label: 'Parking bay / slot' },
  { key: 'afterFront', label: 'After parking: front' },
  { key: 'afterRear', label: 'After parking: rear' },
  { key: 'afterLeft', label: 'After parking: left' },
  { key: 'afterRight', label: 'After parking: right' },
];

export const STATUS = {
  REQUESTED: 'requested',
  ASSIGNED: 'assigned',
  ACCEPTED: 'accepted',
  PICKUP_REVIEW: 'pickup_review',
  HANDED_OVER: 'handed_over',
  PARKING_REVIEW: 'parking_review',
  COMPLETED: 'completed',
};

export const STATUS_LABEL = {
  requested: 'Finding a captain',
  assigned: 'Captain assigned',
  accepted: 'Captain on the way',
  pickup_review: 'Pickup photos awaiting acknowledgement',
  handed_over: 'Vehicle picked up',
  parking_review: 'Parking evidence awaiting acknowledgement',
  completed: 'Parking acknowledged',
};

export const SEED_CAPTAINS = [
  {
    id: 'cap-1',
    name: 'Ravi Kumar',
    phone: '+91 90000 00001',
    available: true,
  },
  {
    id: 'cap-2',
    name: 'Suresh Reddy',
    phone: '+91 90000 00002',
    available: true,
  },
];

const nowIso = () => new Date().toISOString();

const addHistory = (job, status, note = '') => ({
  ...job,
  status,
  history: [
    ...(job.history || []),
    { status, note, at: nowIso() },
  ],
});

const isPhotoPresent = (photo) =>
  Boolean(photo && (typeof photo === 'string' || photo.src));

const photoMapHas = (photos, key) =>
  isPhotoPresent(photos?.[key]);

/* ----------------------------- creation ---------------------------- */

export const activeCount = (jobs, captainId) =>
  Object.values(jobs || {}).filter(
    (job) =>
      job.captain?.id === captainId &&
      job.status !== STATUS.COMPLETED
  ).length;

/** Available captain with the fewest active jobs. */
export const pickCaptain = (captains = [], jobs = {}) => {
  const free = captains.filter((captain) => captain.available);

  if (!free.length) return null;

  return [...free].sort(
    (a, b) =>
      activeCount(jobs, a.id) - activeCount(jobs, b.id)
  )[0];
};

/** Called when a driver books a slot with Captain Valet. */
export const createValetJob = (
  booking,
  captains = [],
  jobs = {},
  info = {}
) => {
  const createdAt = nowIso();

  const job = {
    bookingId: booking.id,
    info,
    status: STATUS.REQUESTED,
    createdAt,
    captain: null,
    assignedAt: null,

    pickup: {
      photos: {},
      damagePhotos: [],
      noDamage: false,
      damageNotes: '',
      submittedAt: null,
      acknowledgedAt: null,
      acknowledgedBy: null,
      handoverAt: null,
    },

    parking: {
      slot: '',
      photos: {},
      submittedAt: null,
      parkedAt: null,
      acknowledgedAt: null,
      acknowledgedBy: null,
    },

    completedAt: null,
    dispute: null,

    history: [
      {
        status: STATUS.REQUESTED,
        note: 'Captain Valet requested',
        at: createdAt,
      },
    ],
  };

  const captain = pickCaptain(captains, jobs);

  return captain ? assignCaptain(job, captain) : job;
};

/* ----------------------------- assignment -------------------------- */

export const assignCaptain = (job, captain) => {
  if (
    !job ||
    !captain ||
    [STATUS.HANDED_OVER, STATUS.PARKING_REVIEW, STATUS.COMPLETED]
      .includes(job.status)
  ) {
    return job;
  }

  return {
    ...addHistory(
      job,
      STATUS.ASSIGNED,
      `Assigned to ${captain.name}`
    ),
    captain: {
      id: captain.id,
      name: captain.name,
      phone: captain.phone,
    },
    assignedAt: nowIso(),
  };
};

export const acceptJob = (job) => {
  if (!job || job.status !== STATUS.ASSIGNED) return job;

  return addHistory(
    job,
    STATUS.ACCEPTED,
    'Captain accepted the booking'
  );
};

export const rejectJob = (job) => {
  if (
    !job ||
    ![STATUS.ASSIGNED, STATUS.ACCEPTED].includes(job.status)
  ) {
    return job;
  }

  return {
    ...addHistory(
      job,
      STATUS.REQUESTED,
      `${job.captain?.name || 'Captain'} declined`
    ),
    captain: null,
    assignedAt: null,
  };
};

/** Update booking details only before vehicle pickup starts. */
export const updateJobInfo = (job, patch) => {
  if (
    !job ||
    [
      STATUS.PICKUP_REVIEW,
      STATUS.HANDED_OVER,
      STATUS.PARKING_REVIEW,
      STATUS.COMPLETED,
    ].includes(job.status)
  ) {
    return job;
  }

  return {
    ...job,
    info: { ...job.info, ...patch },
  };
};

/* ----------------------------- pickup ------------------------------ */

export const setPickupPhoto = (job, key, photo) => {
  if (
    !job ||
    !PICKUP_SHOTS.some((shot) => shot.key === key) ||
    ![STATUS.ACCEPTED, STATUS.PICKUP_REVIEW].includes(job.status)
  ) {
    return job;
  }

  // Submitted evidence is locked until the Driver acknowledges it.
  if (job.status === STATUS.PICKUP_REVIEW) return job;

  return {
    ...job,
    pickup: {
      ...job.pickup,
      photos: {
        ...job.pickup.photos,
        [key]: photo,
      },
    },
  };
};

export const addDamagePhoto = (job, photo) => {
  if (
    !job ||
    job.status !== STATUS.ACCEPTED ||
    !isPhotoPresent(photo)
  ) {
    return job;
  }

  return {
    ...job,
    pickup: {
      ...job.pickup,
      noDamage: false,
      damagePhotos: [...(job.pickup.damagePhotos || []), photo],
    },
  };
};

export const removeDamagePhoto = (job, index) => {
  if (!job || job.status !== STATUS.ACCEPTED) return job;

  return {
    ...job,
    pickup: {
      ...job.pickup,
      damagePhotos: (job.pickup.damagePhotos || []).filter(
        (_, i) => i !== index
      ),
    },
  };
};

export const setDamageInfo = (job, patch) => {
  if (!job || job.status !== STATUS.ACCEPTED) return job;

  return {
    ...job,
    pickup: {
      ...job.pickup,
      ...patch,
    },
  };
};

export const pickupProblems = (job) => {
  const problems = [];

  PICKUP_SHOTS.forEach((shot) => {
    if (!photoMapHas(job?.pickup?.photos, shot.key)) {
      problems.push(`${shot.label} photo`);
    }
  });

  const pickup = job?.pickup || {};
  const damagePhotos = pickup.damagePhotos || [];
  const damageNotes = (pickup.damageNotes || '').trim();

  if (!pickup.noDamage && (!damagePhotos.length || !damageNotes)) {
    problems.push(
      'damage photos and notes, or confirm "No visible damage"'
    );
  }

  return problems;
};

/** Captain submits the initial vehicle-condition evidence. */
export const confirmHandover = (job) => {
  if (!job || job.status !== STATUS.ACCEPTED) {
    return {
      ok: false,
      error: 'Accept the booking before submitting pickup evidence.',
    };
  }

  const problems = pickupProblems(job);

  if (problems.length) {
    return {
      ok: false,
      error: `Still needed: ${problems.join(', ')}`,
    };
  }

  const submittedAt = nowIso();

  return {
    ok: true,
    job: {
      ...addHistory(
        job,
        STATUS.PICKUP_REVIEW,
        'Captain submitted pickup photos; awaiting Driver acknowledgement'
      ),
      pickup: {
        ...job.pickup,
        submittedAt,
      },
    },
  };
};

/** Driver acknowledges initial photos before the Captain takes custody. */
export const acknowledgePickup = (job, driverEmail) => {
  if (!job || job.status !== STATUS.PICKUP_REVIEW) {
    return {
      ok: false,
      error: 'Pickup evidence is not awaiting acknowledgement.',
    };
  }

  if (!driverEmail || driverEmail !== job.info?.driverEmail) {
    return {
      ok: false,
      error: 'Only the booking Driver can acknowledge these photos.',
    };
  }

  const acknowledgedAt = nowIso();

  return {
    ok: true,
    job: {
      ...addHistory(
        job,
        STATUS.HANDED_OVER,
        'Driver acknowledged pickup evidence; vehicle handed over to Captain'
      ),
      pickup: {
        ...job.pickup,
        acknowledgedAt,
        acknowledgedBy: driverEmail,
        handoverAt: acknowledgedAt,
      },
    },
  };
};

/* ----------------------------- parking ----------------------------- */

export const setParkingPhoto = (job, key, photo) => {
  if (
    !job ||
    job.status !== STATUS.HANDED_OVER ||
    !PARKING_SHOTS.some((shot) => shot.key === key)
  ) {
    return job;
  }

  return {
    ...job,
    parking: {
      ...job.parking,
      photos: {
        ...job.parking.photos,
        [key]: photo,
      },
    },
  };
};

export const setSlot = (job, slot) => {
  if (!job || job.status !== STATUS.HANDED_OVER) return job;

  return {
    ...job,
    parking: {
      ...job.parking,
      slot,
    },
  };
};

export const parkingProblems = (job) => {
  const problems = [];

  if (!(job?.parking?.slot || '').trim()) {
    problems.push('parking slot number');
  }

  PARKING_SHOTS.forEach((shot) => {
    if (!photoMapHas(job?.parking?.photos, shot.key)) {
      problems.push(shot.label);
    }
  });

  return problems;
};

/** Captain submits parking evidence. This does not finish the job yet. */
export const completeJob = (job) => {
  if (!job || job.status !== STATUS.HANDED_OVER) {
    return {
      ok: false,
      error: 'The Driver must acknowledge pickup evidence first.',
    };
  }

  const problems = parkingProblems(job);

  if (problems.length) {
    return {
      ok: false,
      error: `Still needed: ${problems.join(', ')}`,
    };
  }

  const submittedAt = nowIso();

  return {
    ok: true,
    job: {
      ...addHistory(
        job,
        STATUS.PARKING_REVIEW,
        `Captain submitted parking evidence for slot ${job.parking.slot.trim()}; awaiting Driver acknowledgement`
      ),
      parking: {
        ...job.parking,
        submittedAt,
        parkedAt: submittedAt,
      },
    },
  };
};

/** Driver acknowledges the final parking photos to finish the job. */
export const acknowledgeParking = (job, driverEmail) => {
  if (!job || job.status !== STATUS.PARKING_REVIEW) {
    return {
      ok: false,
      error: 'Parking evidence is not awaiting acknowledgement.',
    };
  }

  if (!driverEmail || driverEmail !== job.info?.driverEmail) {
    return {
      ok: false,
      error: 'Only the booking Driver can acknowledge parking evidence.',
    };
  }

  const acknowledgedAt = nowIso();

  return {
    ok: true,
    job: {
      ...addHistory(
        job,
        STATUS.COMPLETED,
        'Driver acknowledged final parking evidence'
      ),
      parking: {
        ...job.parking,
        acknowledgedAt,
        acknowledgedBy: driverEmail,
      },
      completedAt: acknowledgedAt,
    },
  };
};

/* ----------------------------- disputes ---------------------------- */

export const raiseDispute = (job, reason) => {
  if (!job || !reason?.trim()) {
    return job;
  }

  return {
    ...addHistory(
      job,
      job.status,
      'Driver raised a vehicle-condition or parking dispute'
    ),
    dispute: {
      reason: reason.trim(),
      raisedAt: nowIso(),
      resolvedAt: null,
      resolution: '',
    },
  };
};

export const resolveDispute = (job, resolution) => {
  if (!job?.dispute || !resolution?.trim()) return job;

  return {
    ...addHistory(job, job.status, 'Dispute resolved by host'),
    dispute: {
      ...job.dispute,
      resolvedAt: nowIso(),
      resolution: resolution.trim(),
    },
  };
};

/* ----------------------------- photos ------------------------------ */

/**
 * Compresses a camera photo for a prototype using localStorage.
 * Returns { src, takenAt }.
 */
export const compressImage = (file, maxSize = 720, quality = 0.65) =>
  new Promise((resolve, reject) => {
    if (!file) {
      reject(new Error('No image selected'));
      return;
    }

    const url = URL.createObjectURL(file);
    const img = new Image();

    img.onload = () => {
      try {
        const scale = Math.min(
          1,
          maxSize / Math.max(img.width, img.height)
        );

        const canvas = document.createElement('canvas');
        canvas.width = Math.max(1, Math.round(img.width * scale));
        canvas.height = Math.max(1, Math.round(img.height * scale));

        const context = canvas.getContext('2d');

        if (!context) {
          throw new Error('Could not process image');
        }

        context.drawImage(
          img,
          0,
          0,
          canvas.width,
          canvas.height
        );

        const photo = {
          src: canvas.toDataURL('image/jpeg', quality),
          takenAt: nowIso(),
        };

        URL.revokeObjectURL(url);
        resolve(photo);
      } catch (error) {
        URL.revokeObjectURL(url);
        reject(error);
      }
    };

    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Could not read image'));
    };

    img.src = url;
  });
