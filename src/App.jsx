import React, { useEffect, useMemo, useRef, useState } from 'react';

import { useLocation, useNavigate } from 'react-router-dom';

import './App.css';

import {

  acknowledgePickup,

  acknowledgeParking,

} from './utils/Valet';

import Navbar from './components/Navbar';

import FindParking from './components/FindParking';

import Subscriptions from './components/Subscriptions';

import CaptainValet from './components/CaptainValet';

import HostListings from './components/HostListings';

import HostDashboard from './components/HostDashboard';

import BookingsView from './components/BookingsView';

import ServicesView from './components/ServicesView';

import HelpFeedback from './components/HelpFeedback';

import AccountView from './components/AccountView';

import BookingModal from './components/BookingModal';

import FeedbackModal from './components/FeedbackModal';

import AuthPortal from './components/AuthPortal';

import Footer from './components/Footer';

import CaptainDashboard from './components/CaptainDashboard';

import CaptainProfile from './components/CaptainProfile';

import HostValetManager from './components/HostValetManager';

import DriverValet from './components/DriverValet';



import { INITIAL_PARKING_SPOTS, INITIAL_HOST_BOOKINGS } from './data/mockData';

import { todayStr, toRange, fmtSlot, findConflict } from './utils/bookingTime';

import { PRICES, washPrice, valetFare } from './utils/plans';

import { getAvailability, nextSlotTime } from './utils/availability';

import { getViolationStatus, MAX_VIOLATIONS } from './utils/violations';

import useLocalStorage from './utils/useLocalStorage';

import { STATUS, createValetJob, updateJobInfo, raiseDispute } from './utils/Valet';

import {

  SEED_ACCOUNTS,

  DEMO_DRIVER_EMAIL,

  DEMO_HOST_EMAIL,

  accountKey,

  userKey,

  findAccount,

  authenticate,

  registerAccount,

  normalizeEmail,

  getCaptains,

  setCaptainAvailability,

  removeCaptainAccount,

  mergeSeedAccounts

} from './utils/auth';



const TAB_TO_PATH = {

  find: '/home',

  subscription: '/subscriptions',

  services: '/evcharging',

  captain: '/captainvalet',

  bookings: '/bookings',

  help: '/help',

  account: '/accountdetails',

  'host-listings': '/hostlistings',

  'host-dashboard': '/hostdashboard',

  'captain-dashboard': '/captaindashboard',

  'host-valet': '/hostvalet'

};



const PATH_TO_TAB = {

  '/': 'find',

  '/home': 'find',

  '/subscriptions': 'subscription',

  '/evcharging': 'services',

  '/captainvalet': 'captain',

  '/bookings': 'bookings',

  '/help': 'help',

  '/accountdetails': 'account',

  '/hostlistings': 'host-listings',

  '/hostdashboard': 'host-dashboard',

  '/captaindashboard': 'captain-dashboard',

  '/hostvalet': 'host-valet'

};



const DRIVER_ONLY_TABS = ['find', 'services', 'subscription', 'bookings'];

const HOST_ONLY_TABS = ['host-listings', 'host-dashboard', 'host-valet'];

const CAPTAIN_ONLY_TABS = ['captain-dashboard'];

// A captain can only open their dashboard, help and their profile.

const CAPTAIN_ALLOWED_TABS = ['captain-dashboard', 'help', 'account'];



const homeTabFor = (role) =>

  role === 'host' ? 'host-listings' : role === 'captain' ? 'captain-dashboard' : 'find';



const homePathFor = (role) => TAB_TO_PATH[homeTabFor(role)];



const isTabAllowed = (role, tab) => {

  if (role === 'captain') return CAPTAIN_ALLOWED_TABS.includes(tab);

  if (CAPTAIN_ONLY_TABS.includes(tab)) return false;

  if (role === 'host') return !DRIVER_ONLY_TABS.includes(tab);

  return !HOST_ONLY_TABS.includes(tab);

};



/* ------------------------------------------------------------------ */

/*  OUTER SHELL: accounts, login session, toast                       */

/* ------------------------------------------------------------------ */



const App = () => {

  const navigate = useNavigate();

  const location = useLocation();



  const [accounts, setAccounts] = useLocalStorage('ps_accounts', SEED_ACCOUNTS);

  const [session, setSession] = useLocalStorage('ps_session', null);

  const [authIntent, setAuthIntent] = useState(null);

  const [toast, setToast] = useState(null);

  const toastTimer = useRef(null);



  const showToast = (msg) => {

    setToast(msg);

    clearTimeout(toastTimer.current);

    toastTimer.current = setTimeout(() => setToast(null), 4000);

  };



  const account = session ? findAccount(accounts, session.role, session.email) : null;



  // Demo captain accounts must exist even in browsers that saved "ps_accounts" before captains were added.

  useEffect(() => {

    setAccounts((prev) => mergeSeedAccounts(prev));

  }, []);



  // Captains are simply the accounts whose role is "captain".

  const captains = useMemo(() => getCaptains(accounts), [accounts]);



  const handleAddCaptain = ({ name, email, phone, password, serviceArea }) => {

    const result = registerAccount(accounts, { name, email, role: 'captain', phone, serviceArea }, password);

    if (result.ok) setAccounts(result.accounts);

    return result;

  };



  const handleSetCaptainAvailability = (captainEmail, available) =>

    setAccounts((prev) => setCaptainAvailability(prev, captainEmail, available));



  const handleRemoveCaptain = (captainEmail) =>

    setAccounts((prev) => removeCaptainAccount(prev, captainEmail));



  const handleLogin = (role, email, password) => {

    const result = authenticate(accounts, role, email, password);

    if (result.ok) {

      setAuthIntent(null);

      setSession({ role: result.account.role, email: result.account.email });

      navigate(homePathFor(result.account.role), { replace: true });

    }

    return result;

  };



  const handleSignup = (profile, password) => {

    const result = registerAccount(accounts, profile, password);

    if (result.ok) {

      setAccounts(result.accounts);

      setAuthIntent(null);

      setSession({ role: result.account.role, email: result.account.email });

      navigate(homePathFor(result.account.role), { replace: true });

    }

    return result;

  };



  const handleLogout = () => {

    setSession(null);

    setAuthIntent(null);

    navigate('/login', { replace: true });

    showToast('You have been logged out. Please log in again.');

  };



  const handleBecomeHost = () => {

    setSession(null);

    setAuthIntent({ role: 'host', mode: 'signup' });

    showToast('📝 Drivers require a dedicated host account. Please register.');

  };



  const handleProfileChange = (resolved) => {

    if (!account) return;

    const key = accountKey(account.role, account.email);

    setAccounts((prev) =>

      prev.map((a) =>

        accountKey(a.role, a.email) === key

          ? { ...a, profile: { ...a.profile, ...resolved, role: a.role, email: a.profile.email } }

          : a

      )

    );

  };



  // Route protection

  useEffect(() => {

    if (!account) {

      if (location.pathname !== '/login') {

        navigate('/login', { replace: true });

      }

      return;

    }



    if (location.pathname === '/' || location.pathname === '/login') {

      navigate(homePathFor(account.role), { replace: true });

    }

  }, [account, location.pathname, navigate]);



  if (!account) {

    return (

      <div className="app-wrapper">

        {toast && <div className="toast-banner">{toast}</div>}

        <main className="main-content">

          <AuthPortal

            key={authIntent ? 'intent' : 'default'}

            onLogin={handleLogin}

            onSignup={handleSignup}

            showToast={showToast}

            initialRole={authIntent?.role || 'driver'}

            initialMode={authIntent?.mode || 'login'}

          />

        </main>

      </div>

    );

  }



  return (

    <>

      {toast && <div className="toast-banner">{toast}</div>}

      <ParkSphereApp

        key={accountKey(account.role, account.email)}

        user={account.profile}

        onProfileChange={handleProfileChange}

        onLogout={handleLogout}

        onBecomeHost={handleBecomeHost}

        showToast={showToast}

        captains={captains}

        onAddCaptain={handleAddCaptain}

        onToggleCaptain={(id) =>

          handleSetCaptainAvailability(id, captains.find((c) => c.id === id)?.available === false)

        }

        onRemoveCaptain={handleRemoveCaptain}

        onSetCaptainAvailability={handleSetCaptainAvailability}

      />

    </>

  );

};



/* ------------------------------------------------------------------ */

/*  LOGGED-IN APP: all data below belongs to the logged-in account     */

/* ------------------------------------------------------------------ */



function ParkSphereApp({

  user,

  onProfileChange,

  onLogout,

  onBecomeHost,

  showToast,

  captains,

  onAddCaptain,

  onToggleCaptain,

  onRemoveCaptain,

  onSetCaptainAvailability

}) {

  const navigate = useNavigate();

  const location = useLocation();



  const activeRole = user.role;

  const email = user.email;

  const isDemoHost = email.toLowerCase() === DEMO_HOST_EMAIL;

  const isDemoDriver = email.toLowerCase() === DEMO_DRIVER_EMAIL;



  const setUser = (next) => {

    const resolved = typeof next === 'function' ? next(user) : next;

    onProfileChange(resolved);

  };



  // Derive tab directly from route

  const currentTab = useMemo(() => {

    const tabFromUrl = PATH_TO_TAB[location.pathname];

    if (tabFromUrl) return tabFromUrl;

    return homeTabFor(activeRole);

  }, [location.pathname, activeRole]);



  // Navigate when links trigger tab switches

  const setCurrentTab = (nextTab) => {

    if (nextTab === 'auth') {

      onLogout();

      return;

    }



    let targetTab = nextTab;

    if (!isTabAllowed(activeRole, targetTab)) {

      targetTab = homeTabFor(activeRole);

    }



    const nextPath = TAB_TO_PATH[targetTab];

    if (nextPath && location.pathname !== nextPath) {

      navigate(nextPath);

    }

    window.scrollTo({ top: 0, behavior: 'smooth' });

  };



  // Enforce role-based path validation on direct URL navigation

  useEffect(() => {

    const tabFromUrl = PATH_TO_TAB[location.pathname];



    if (!tabFromUrl || !isTabAllowed(activeRole, tabFromUrl)) {

      navigate(homePathFor(activeRole), { replace: true });

    }

  }, [location.pathname, activeRole, navigate]);



  const [spots, setSpots] = useLocalStorage('ps_spots', INITIAL_PARKING_SPOTS);

  const [hostBookings, setHostBookings] = useLocalStorage('ps_hostBookings', INITIAL_HOST_BOOKINGS);

  const [feedbacks, setFeedbacks] = useLocalStorage('ps_feedbacks', [

    {

      id: 'fb-1',

      name: 'Priya S.',

      spotName: 'ITC Kohenur Street Gated Driveway',

      rating: 5,

      comment: 'Reached 10 minutes early, checked in and the bay was exactly as shown. Super easy exit too.',

      date: '2026-09-28'

    },

    {

      id: 'fb-2',

      name: 'Rahul M.',

      spotName: 'Nexus Mall Safe Garage Spot',

      rating: 4,

      comment: 'Saved me a 30 minute parking hunt at the mall. The EV charger was ready when I arrived.',

      date: '2026-09-25'

    },

    {

      id: 'fb-3',

      name: 'Ananya K.',

      spotName: 'AMB Mall Kondapur Covered Bay',

      rating: 5,

      comment: 'Used Captain Valet for a weekend movie. Photos before and after parking gave me full confidence.',

      date: '2026-09-21'

    },

    {

      id: 'fb-4',

      name: 'Imran A.',

      spotName: 'HITEC City Cyber Towers Parking',

      rating: 4,

      comment: 'Clean, secure and fair price. Would love more slots in the evening.',

      date: '2026-09-17'

    }

  ]);



  const [hostSpots, setHostSpots] = useLocalStorage(

    userKey('ps_hostSpots', email),

    () => (isDemoHost ? [INITIAL_PARKING_SPOTS[0]] : [])

  );



  const [hostWithdrawals, setHostWithdrawals] = useLocalStorage(

    userKey('ps_withdrawals', email),

    () =>

      isDemoHost

        ? [

            {

              id: 'PO-20261003-001',

              amount: 2670,

              upi: 'vikram@okaxis',

              timestamp: new Date(2026, 9, 3, 9, 15).toISOString()

            }

          ]

        : []

  );



  const [usage, setUsage] = useLocalStorage(userKey('ps_usage', email), { wash: 0, ev: 0 });



  /* ---- Captain Valet: jobs are shared by driver, captain and host, so the key is NOT per-user ---- */

  const [valetJobs, setValetJobs] = useLocalStorage('ps_valet_jobs', {});

  const emailKey = normalizeEmail(email);



  const updateJob = (job) => setValetJobs((prev) => ({ ...prev, [job.bookingId]: job }));



const handleAcknowledgePickup = (job) => {

  if (activeRole !== 'driver') {

    return {

      ok: false,

      error: 'Only the driver can acknowledge pickup evidence.',

    };

  }



  const currentJob = valetJobs[job.bookingId] || job;



  if (

    normalizeEmail(currentJob.info?.driverEmail) !== emailKey

  ) {

    return {

      ok: false,

      error: 'You cannot acknowledge another driver’s booking.',

    };

  }



  const result = acknowledgePickup(

    currentJob,

    currentJob.info.driverEmail

  );



  if (result?.ok === false) {

    return result;

  }



  const updatedJob = result?.job || result;



  if (

    !updatedJob ||

    updatedJob.status === currentJob.status

  ) {

    return {

      ok: false,

      error: 'Pickup acknowledgement was not accepted. Please check the job status.',

    };

  }



  updateJob(updatedJob);

  showToast('Pickup evidence acknowledged successfully.');



  return { ok: true, job: updatedJob };

};



const handleAcknowledgeParking = (job) => {

  if (activeRole !== 'driver') {

    return {

      ok: false,

      error: 'Only the driver can acknowledge parking evidence.',

    };

  }



  const currentJob = valetJobs[job.bookingId] || job;



  if (

    normalizeEmail(currentJob.info?.driverEmail) !== emailKey

  ) {

    return {

      ok: false,

      error: 'You cannot acknowledge another driver’s booking.',

    };

  }



  const result = acknowledgeParking(

    currentJob,

    currentJob.info.driverEmail

  );



  if (result?.ok === false) {

    return result;

  }



  const updatedJob = result?.job || result;



  if (

    !updatedJob ||

    updatedJob.status === currentJob.status

  ) {

    return {

      ok: false,

      error: 'Parking acknowledgement was not accepted. Please check the job status.',

    };

  }



  updateJob(updatedJob);

  showToast('Parking evidence acknowledged. Valet job completed.');



  return { ok: true, job: updatedJob };

};





  const handleDispute = (job, reason) => {
    if (activeRole !== 'driver') {
      return { ok: false, error: 'Only the driver can report an issue.' };
    }

    const currentJob = valetJobs[job.bookingId] || job;

    if (normalizeEmail(currentJob.info?.driverEmail) !== emailKey) {
      return {
        ok: false,
        error: 'You cannot report an issue for another driver’s booking.',
      };
    }

    if (typeof reason !== 'string' || !reason.trim()) {
      return { ok: false, error: 'Please provide a reason for reporting the issue.' };
    }

    const result = raiseDispute(currentJob, reason.trim());
    if (result?.ok === false) return result;

    const updatedJob = result?.job || result;
    if (!updatedJob || !updatedJob.bookingId) {
      return { ok: false, error: 'Unable to report the issue. Please try again.' };
    }

    updateJob(updatedJob);
    showToast('Your issue has been reported successfully.');
    return { ok: true, job: updatedJob };
  };

  // Removes a job (booking cancelled or missed), unless the captain already has the vehicle.

  const dropValetJob = (bookingId) =>

    setValetJobs((prev) => {

      const job = prev[bookingId];

      if (!job || [STATUS.HANDED_OVER, STATUS.PARKING_REVIEW, STATUS.COMPLETED].includes(job.status)) return prev;

      const next = { ...prev };

      delete next[bookingId];

      return next;

    });



  const buildValetInfo = (b) => ({

    spotName: b.spotName,

    hostName: b.hostName,

    vehicle: b.vehicle,

    timeSlot: b.timeSlot,

    date: b.date,

    startTime: b.startTime,

    valetPickup: b.valetPickup || '',

    valetPickupLat: b.valetPickupLat ?? null,

    valetPickupLng: b.valetPickupLng ?? null,

    valetKm: b.valetKm || 0,

    driverName: user.name,

    driverPhone: user.phone || '',

    driverEmail: user.email

  });



  const describeValet = (bookingId) => {

    const j = valetJobs[bookingId];

    return j && j.info && j.info.spotName ? `${j.info.spotName} · ${j.info.timeSlot}` : `Booking #${bookingId}`;

  };



  const valetList = Object.values(valetJobs);



  const myCaptain =

    activeRole === 'captain'

      ? { id: emailKey, name: user.name, phone: user.phone, available: user.available !== false }

      : null;



  const captainActiveCount = valetList.filter(

    (j) => j.captain && j.captain.id === emailKey && j.status !== 'completed'

  ).length;

  const captainDoneCount = valetList.filter(

    (j) => j.captain && j.captain.id === emailKey && j.status === 'completed'

  ).length;



  // Host badge: jobs still waiting for a captain + open disputes

  const hostValetAlerts = valetList.filter(

    (j) => j.status === 'requested' || (j.dispute && !j.dispute.resolvedAt)

  ).length;



  // The driver's own valet jobs (shown under My Bookings)

  const myValetJobs = valetList

    .filter((j) => j.info && normalizeEmail(j.info.driverEmail) === emailKey)

    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));



  const [userBookings, setUserBookings] = useLocalStorage(userKey('ps_userBookings', email), () =>

    isDemoDriver

      ? [

          {

            id: 'PS-BOOK-8821',

            spotName: 'Nexus Mall Safe Garage Spot',

            hostName: 'Vikram Sharma',

            timeSlot: fmtSlot(todayStr(), '10:00', 2),

            date: todayStr(),

            startTime: '10:00',

            vehicle: 'Car (TS 09 EZ 4088)',

            totalPaid: 130,

            hours: 2,

            vehicleType: 'Car',

            addOnCost: 0,

            otpCode: '4928',

            status: 'Confirmed'

          }

        ]

      : []

  );



  const ownedSpotNames = useMemo(() => new Set(hostSpots.map((s) => s.name)), [hostSpots]);

  const visibleHostBookings = useMemo(() => {

    return activeRole !== 'host'

      ? []

      : hostBookings.filter((h) => ownedSpotNames.has(h.spotName) || (isDemoHost && !h.createdAt));

  }, [activeRole, hostBookings, ownedSpotNames, isDemoHost]);



  const [searchQuery, setSearchQuery] = useState('');

  const [selectedVehicle, setSelectedVehicle] = useState('Car');

  const [bookingHours, setBookingHours] = useState(2);

  const [searchDate, setSearchDate] = useState(todayStr());

  const [searchTime, setSearchTime] = useState(nextSlotTime());

  const [filterEV, setFilterEV] = useState(false);

  const [filterWash, setFilterWash] = useState(false);

  const [filterCovered, setFilterCovered] = useState(false);



  const [bookingModalSpot, setBookingModalSpot] = useState(null);

  const [feedbackBookingId, setFeedbackBookingId] = useState(null);

  const [now, setNow] = useState(Date.now());



  useEffect(() => {

    const id = setInterval(() => setNow(Date.now()), 30000);

    return () => clearInterval(id);

  }, []);



  useEffect(() => {

    const endOf = (b) => toRange(b.date, b.startTime, b.hours)[1];

    const missed = userBookings.filter((b) => b.status === 'Confirmed' && endOf(b) <= now);

    const finished = userBookings.filter((b) => b.status === 'Parked' && endOf(b) <= now);

    if (missed.length === 0 && finished.length === 0) return;



    const missedIds = missed.map((b) => b.id);

    const finishedIds = finished.map((b) => b.id);



    // A missed slot also cancels its valet job (unless the captain already has the car)

    missedIds.forEach((missedId) => dropValetJob(missedId));



    setUserBookings((prev) =>

      prev.map((b) => {

        if (missedIds.includes(b.id)) {

          return {

            ...b,

            status: 'Cancelled',

            violation: true,

            violationAt: now,

            cancelReason: 'You did not park during the booked slot. This counts as a violation.'

          };

        }

        if (finishedIds.includes(b.id)) return { ...b, status: 'Completed' };

        return b;

      })

    );



    setHostBookings((prev) =>

      prev.map((h) => {

        if (missedIds.includes(h.bookingId)) return { ...h, status: 'Cancelled (driver did not park)' };

        if (finishedIds.includes(h.bookingId)) return { ...h, status: 'Completed' };

        return h;

      })

    );



    if (finishedIds.length && activeRole === 'driver') setFeedbackBookingId(finishedIds[0]);



    const freed = missed.reduce(

      (acc, b) => ({

        wash: acc.wash + (b.freeWash ? 1 : 0),

        ev: acc.ev + (b.freeEV ? 1 : 0)

      }),

      { wash: 0, ev: 0 }

    );



    if (freed.wash || freed.ev) {

      setUsage((u) => ({ wash: u.wash - freed.wash, ev: u.ev - freed.ev }));

    }



    if (missed.length && activeRole === 'driver') {

      showToast(

        `Booking at ${missed[0].spotName} was cancelled because you did not park. This is a violation. Please cancel bookings you don't need.`

      );

    }

  }, [now, userBookings, activeRole]);



  const violationInfo = getViolationStatus(userBookings, now);

  const holdUntilText = violationInfo.holdUntil

    ? new Date(violationInfo.holdUntil).toLocaleDateString('en-IN', {

        day: 'numeric',

        month: 'long',

        year: 'numeric'

      })

    : '';



  const confirmedBookings = userBookings

    .filter((b) => b.status === 'Confirmed')

    .sort((a, b) => toRange(a.date, a.startTime, a.hours)[0] - toRange(b.date, b.startTime, b.hours)[0]);



  const activeBooking = confirmedBookings.find((b) => toRange(b.date, b.startTime, b.hours)[1] > now);

  const activeSpot = activeBooking && spots.find((s) => s.name === activeBooking.spotName);

  const parkedNow = userBookings.find((b) => b.status === 'Parked');

  const endOfBooking = (b) => toRange(b.date, b.startTime, b.hours)[1];

  const lastOutcome = userBookings

    .filter((b) => b.status === 'Completed' || b.status === 'Cancelled')

    .sort((a, b) => endOfBooking(b) - endOfBooking(a))[0];



  const feedbackBooking = feedbackBookingId

    ? userBookings.find(

        (b) => b.id === feedbackBookingId && b.status === 'Completed' && !feedbacks.some((f) => f.bookingId === b.id)

      )

    : null;



  const handleCheckIn = (id) => {

    const b = userBookings.find((x) => x.id === id);

    if (!b) return;

    const [start, end] = toRange(b.date, b.startTime, b.hours);

    if (Date.now() < start - 15 * 60000 || Date.now() >= end) {

      showToast('Check-in is only available from 15 minutes before your slot until it ends.');

      return;

    }

    setUserBookings((prev) =>

      prev.map((x) => (x.id === id ? { ...x, status: 'Parked', parkedAt: Date.now() } : x))

    );

    setHostBookings((prev) =>

      prev.map((x) => (x.bookingId === id ? { ...x, status: 'Active (Parked Now)' } : x))

    );

    showToast(`Parked at ${b.spotName}. Enjoy your stay!`);

  };



  const handleCompleteSlot = (id) => {

    const booking = userBookings.find((b) => b.id === id);

    if (!booking) return;

    if (booking.status !== 'Parked') {

      showToast('You can complete the slot only after you have parked.');

      return;

    }



    const completedAt = Date.now();



    setUserBookings((prev) =>

      prev.map((b) => (b.id === id ? { ...b, status: 'Completed', completedAt } : b))

    );



    setHostBookings((prev) =>

      prev.map((h) =>

        h.bookingId === id

          ? { ...h, status: 'Completed', completedAt: new Date(completedAt).toISOString() }

          : h

      )

    );



    setFeedbackBookingId(id);

    showToast('Slot completed. The full booking amount has been credited to the host.');

  };



  const calcTotal = (vehicleType, hours, addOnCost) => {

    const base = (vehicleType === 'Bike' ? 30 : 50) * hours;

    let fee = (vehicleType === 'Bike' ? 10 : 20) * hours;

    if (user?.subscription === 'Pro Plan') fee = Math.max(0, fee - 10);

    if (user?.subscription === 'Ultimate') fee = 0;

    return base + fee + addOnCost;

  };



  const handleOpenBooking = (spot) => {

    if (violationInfo.holdUntil) {

      showToast(`Your account is on hold until ${holdUntilText} because of ${MAX_VIOLATIONS} missed slots.`);

      return;

    }

    setBookingModalSpot(spot);

  };



  const handleCancelBooking = (id, reason = '') => {

    const b = userBookings.find((x) => x.id === id);

    if (!b || b.status !== 'Confirmed') {
      showToast('This booking can no longer be cancelled.');
      return;
    }

    const currentValetJob = valetJobs[id];
    const cancellationLockedStatuses = [STATUS.HANDED_OVER, STATUS.PARKING_REVIEW, STATUS.COMPLETED];
    if (b.needValet && currentValetJob && cancellationLockedStatuses.includes(currentValetJob.status)) {
      showToast('The Captain has already taken custody of the vehicle. This valet request can no longer be cancelled.');
      return;
    }

    if (b?.freeWash || b?.freeEV) {

      setUsage((u) => ({ wash: u.wash - (b.freeWash ? 1 : 0), ev: u.ev - (b.freeEV ? 1 : 0) }));

    }

    const cancellationReason = reason.trim() || 'Cancelled by you.';

    dropValetJob(id);

    setUserBookings((prev) =>

      prev.map((b) => (b.id === id ? { ...b, status: 'Cancelled', cancelReason: cancellationReason } : b))

    );

    setHostBookings((prev) =>

      prev.map((h) => (h.bookingId === id ? { ...h, status: 'Cancelled' } : h))

    );

    showToast('Booking cancelled.');

  };



  const handleFeedbackSubmit = ({ bookingId, rating, comment }) => {

    const booking = userBookings.find((b) => b.id === bookingId);

    if (!booking || booking.status !== 'Completed' || feedbacks.some((f) => f.bookingId === bookingId)) return;



    const stars = Number(rating) || 0;

    const cleanComment = (comment || '').trim();



    if (!stars && !cleanComment) {

      showToast('Slot completed. Thank you for parking with us!');

      return;

    }



    setFeedbacks((previous) => [

      {

        id: `fb-${Date.now()}`,

        bookingId,

        name: user.name,

        spotName: booking.spotName,

        rating: stars || null,

        comment: cleanComment,

        date: todayStr()

      },

      ...previous

    ]);

    showToast('Thanks for sharing your parking experience!');

  };



  const addOnsFor = (booking, { needEV, needWash, needValet, valetKm }) => {

    const keepFreeEV = Boolean(needEV && booking.freeEV);

    const keepFreeWash = Boolean(needWash && booking.freeWash);

    const valetFee = needValet && valetKm ? valetFare(valetKm) : 0;

    const addOnCost =

      (needEV && !keepFreeEV ? PRICES.ev : 0) +

      (needWash && !keepFreeWash ? washPrice(booking.vehicleType) : 0) +

      valetFee;

    return { keepFreeEV, keepFreeWash, valetFee, addOnCost };

  };



  const estimateModifiedTotal = (id, draft) => {

    const booking = userBookings.find((b) => b.id === id);

    if (!booking) return 0;

    return calcTotal(booking.vehicleType, draft.hours, addOnsFor(booking, draft).addOnCost);

  };



  const handleModifyBooking = (

    id,

    { date, startTime, hours, needEV, needWash, needValet, valetPickup, valetKm, valetPickupLat, valetPickupLng }

  ) => {

    if (hours < 1 || hours > 24) return;

    const booking = userBookings.find((b) => b.id === id);

    if (!booking) return;



    const updatedDate = date || booking.date;

    const updatedStartTime = startTime || booking.startTime;

    const [updatedStart, updatedEnd] = toRange(updatedDate, updatedStartTime, hours);



    if (updatedEnd <= Date.now()) {

      showToast('Choose a parking slot with time remaining.');

      return;

    }

    if (findConflict(userBookings, updatedDate, updatedStartTime, hours, id)) {

      showToast('That duration overlaps another booking of yours. Choose a shorter time.');

      return;

    }



    const spot = spots.find((s) => s.name === booking.spotName);

    if (

      !spot ||

      getAvailability(

        spot,

        updatedDate,

        updatedStartTime,

        hours,

        userBookings.filter((b) => b.id !== id)

      ).free === 0

    ) {

      showToast('That parking time is no longer available. Please choose another slot.');

      return;

    }



    const isBike = booking.vehicleType === 'Bike';

    const rate = isBike ? 30 : 50;

    const evChargingEarning = needEV ? PRICES.ev : 0;

    const washEarning = needWash ? washPrice(booking.vehicleType) : 0;

    const { keepFreeEV, keepFreeWash, valetFee, addOnCost } = addOnsFor(booking, {

      needEV,

      needWash,

      needValet,

      valetKm

    });



    if ((booking.freeEV && !keepFreeEV) || (booking.freeWash && !keepFreeWash)) {

      setUsage((u) => ({

        wash: u.wash - (booking.freeWash && !keepFreeWash ? 1 : 0),

        ev: u.ev - (booking.freeEV && !keepFreeEV ? 1 : 0)

      }));

    }



    setUserBookings((prev) =>

      prev.map((b) =>

        b.id === id

          ? {

              ...b,

              date: updatedDate,

              startTime: updatedStartTime,

              hours,

              needEV,

              needWash,

              freeEV: Boolean(keepFreeEV),

              freeWash: Boolean(keepFreeWash),

              needValet: Boolean(needValet),

              valetPickup: needValet ? valetPickup : '',

              valetPickupLat: needValet ? (valetPickupLat ?? b.valetPickupLat ?? null) : null,

              valetPickupLng: needValet ? (valetPickupLng ?? b.valetPickupLng ?? null) : null,

              valetKm: needValet ? valetKm : 0,

              valetFee,

              addOnCost,

              timeSlot: fmtSlot(updatedDate, updatedStartTime, hours),

              totalPaid: calcTotal(b.vehicleType, hours, addOnCost)

            }

          : b

      )

    );



    setHostBookings((prev) =>

      prev.map((h) => {

        if (h.bookingId !== id) return h;

        const parkingEarning = rate * hours;

        return {

          ...h,

          hoursBooked: hours,

          timestamp: new Date(updatedStart).toISOString(),

          startAt: new Date(updatedStart).toISOString(),

          endAt: new Date(updatedEnd).toISOString(),

          parkingEarning,

          evCharging: needEV,

          evChargerType: needEV

            ? spots.find((s) => s.name === booking.spotName)?.amenities.evChargerType || ''

            : '',

          evChargingEarning,

          washEarning,

          hostEarning: parkingEarning + evChargingEarning + washEarning

        };

      })

    );



    // Keep the valet job in step with the edited booking

    const slotLabel = fmtSlot(updatedDate, updatedStartTime, hours);

    const existingJob = valetJobs[id];

    if (needValet && !existingJob) {

      const merged = {

        ...booking,

        date: updatedDate,

        startTime: updatedStartTime,

        hours,

        timeSlot: slotLabel,

        valetPickup,

        valetPickupLat: valetPickupLat ?? booking.valetPickupLat ?? null,

        valetPickupLng: valetPickupLng ?? booking.valetPickupLng ?? null,

        valetKm

      };

      const job = createValetJob(merged, captains, valetJobs, buildValetInfo(merged));

      updateJob(job);

      showToast(

        job.captain

          ? `Booking updated. Captain ${job.captain.name} has been assigned.`

          : 'Booking updated. We are finding a captain for you.'

      );

      return;

    }

    if (!needValet && existingJob) dropValetJob(id);

    if (needValet && existingJob) {

      updateJob(

        updateJobInfo(existingJob, {

          timeSlot: slotLabel,

          date: updatedDate,

          startTime: updatedStartTime,

          valetPickup: valetPickup || '',

          valetPickupLat: valetPickupLat ?? existingJob.info?.valetPickupLat ?? null,

          valetPickupLng: valetPickupLng ?? existingJob.info?.valetPickupLng ?? null,

          valetKm: valetKm || 0

        })

      );

    }



    showToast('Booking updated.');

  };



  const handleBookingConfirm = ({

    grandTotal,

    addOnCost,

    needEV,

    needWash,

    needValet,

    valetPickup,

    valetPickupLat,

    valetPickupLng,

    valetKm,

    valetFee,

    freeEV,

    freeWash,

    date,

    startTime,

    hours: bookingHours

  }) => {

    if (violationInfo.holdUntil) {

      setBookingModalSpot(null);

      showToast(`Your account is on hold until ${holdUntilText}.`);

      return;

    }

    if (findConflict(userBookings, date, startTime, bookingHours)) {

      showToast('You already have a booking at that time. Pick another time.');

      return;

    }



    const [slotStart, slotEnd] = toRange(date, startTime, bookingHours);

    if (slotEnd <= Date.now()) {

      showToast('That parking slot has already ended. Choose a slot with time remaining.');

      return;

    }

    if (getAvailability(bookingModalSpot, date, startTime, bookingHours, userBookings).free === 0) {

      showToast('That parking slot is full. Please choose another available time.');

      return;

    }



    if (freeEV || freeWash) {

      setUsage((u) => ({ wash: u.wash + (freeWash ? 1 : 0), ev: u.ev + (freeEV ? 1 : 0) }));

    }



    const otp = Math.floor(1000 + Math.random() * 9000).toString();

    const newId = `PS-BOOK-${Math.floor(1000 + Math.random() * 9000)}`;



    const newBooking = {

      id: newId,

      createdAt: Date.now(),

      hours: bookingHours,

      vehicleType: selectedVehicle,

      addOnCost,

      needValet: Boolean(needValet),

      valetPickup: needValet ? valetPickup : '',

      valetPickupLat: needValet ? (valetPickupLat ?? null) : null,

      valetPickupLng: needValet ? (valetPickupLng ?? null) : null,

      valetKm: needValet ? valetKm : 0,

      valetFee: needValet ? valetFee : 0,

      needEV,

      needWash,

      freeEV,

      freeWash,

      spotName: bookingModalSpot.name,

      hostName: bookingModalSpot.hostName,

      timeSlot: fmtSlot(date, startTime, bookingHours),

      date,

      startTime,

      vehicle: `${selectedVehicle} (${user.vehiclePlate || 'Self'})`,

      totalPaid: grandTotal,

      otpCode: otp,

      status: 'Confirmed'

    };



    setUserBookings([newBooking, ...userBookings]);



    // Captain Valet: create the job and assign the available captain with the fewest active jobs

    let valetNote = '';

    if (needValet) {

      const job = createValetJob(newBooking, captains, valetJobs, buildValetInfo(newBooking));

      updateJob(job);

      valetNote = job.captain

        ? ` Captain ${job.captain.name} has been assigned.`

        : ' We are finding a captain for you.';

    }



    const hostRate = selectedVehicle === 'Bike' ? 30 : 50;

    const parkingEarning = hostRate * bookingHours;

    const evChargingEarning = needEV ? 50 : 0;

    const washEarning = needWash ? (selectedVehicle === 'Bike' ? 60 : 120) : 0;



    setHostBookings([

      {

        id: `HB-${Math.floor(100 + Math.random() * 900)}`,

        bookingId: newId,

        spotName: bookingModalSpot.name,

        vehiclePlate: user.vehiclePlate || 'TS 09 NEW',

        vehicleType: selectedVehicle,

        driverName: user.name,

        driverEmail: user.email,

        hoursBooked: bookingHours,

        rateApplied: hostRate,

        parkingEarning,

        evCharging: needEV,

        evChargerType: needEV ? bookingModalSpot.amenities.evChargerType : '',

        evChargingEarning,

        washEarning,

        hostEarning: parkingEarning + evChargingEarning + washEarning,

        status: 'Scheduled',

        timestamp: new Date(slotStart).toISOString(),

        startAt: new Date(slotStart).toISOString(),

        endAt: new Date(slotEnd).toISOString(),

        createdAt: new Date().toISOString()

      },

      ...hostBookings

    ]);



    setBookingModalSpot(null);

    showToast(`🎉 Parking Reserved! Your entry OTP is ${otp}.${valetNote} View in My Bookings.`);

    setCurrentTab('bookings');

  };



  return (

    <div className="app-wrapper">

      <Navbar

        currentTab={currentTab}

        setCurrentTab={setCurrentTab}

        user={user}

        bookingCount={userBookings.length}

        violationCount={violationInfo.count}

        hostBookingCount={visibleHostBookings.length}

        captainActiveCount={captainActiveCount}

        captainDoneCount={captainDoneCount}

        hostValetAlerts={hostValetAlerts}

        onToggleAvailability={() => onSetCaptainAvailability(email, user.available === false)}

        onLogout={onLogout}

      />



      <main className="main-content">

        {currentTab === 'find' && (

          <div>

            {parkedNow && (

              <div className="status-banner status-banner-info">

                <div>

                  <strong>🅿️ Parked now: {parkedNow.spotName}</strong>

                  <div className="banner-subtext">

                    {parkedNow.timeSlot} • {parkedNow.vehicle}

                  </div>

                </div>

                <button className="btn-primary" onClick={() => setCurrentTab('bookings')}>

                  View booking

                </button>

              </div>

            )}



            {lastOutcome?.violation && (

              <div className="status-banner-violation">

                <strong style={{ color: '#b91c1c', fontSize: 16 }}>

                  ⚠ Not parked: you booked {lastOutcome.spotName} but did not check in

                </strong>

                <div style={{ fontSize: 13, marginTop: 2 }}>

                  {lastOutcome.timeSlot} • The booking was cancelled automatically.

                </div>

                <div style={{ fontSize: 13, marginTop: 6 }}>

                  Violations: <strong>{violationInfo.count} of {MAX_VIOLATIONS}</strong>.{' '}

                  {MAX_VIOLATIONS} violations put your account on hold for 3 months. Cancel bookings you don't need instead of missing them.

                </div>

              </div>

            )}



            {lastOutcome && !lastOutcome.violation && (

              <div className={lastOutcome.status === 'Completed' ? 'status-banner status-banner-success' : 'status-banner-muted'}>

                {lastOutcome.status === 'Completed' ? (

                  <div>

                    <strong style={{ color: '#047857' }}>

                      ✓ Last completed parking: you checked in and completed this slot

                    </strong>

                    <div style={{ fontSize: 13, color: '#065f46', marginTop: 2 }}>

                      {lastOutcome.spotName} • {lastOutcome.timeSlot} • Completed

                    </div>

                  </div>

                ) : (

                  <div>

                    <strong style={{ color: '#334155' }}>

                      Booking cancelled: {lastOutcome.spotName}

                    </strong>

                    <div className="banner-subtext">

                      {lastOutcome.timeSlot} • {lastOutcome.cancelReason}

                    </div>

                  </div>

                )}

              </div>

            )}



            {violationInfo.holdUntil && (

              <div className="status-banner status-banner-warning">

                <strong>Account on hold until {holdUntilText}.</strong> You missed {MAX_VIOLATIONS} booked slots, so new bookings are paused for 3 months.

              </div>

            )}



            {activeBooking && (

              <div className="status-banner status-banner-success">

                <div>

                  <strong>Your active booking: {activeBooking.spotName}</strong>

                  <div className="banner-subtext">

                    {activeSpot?.address && <>{activeSpot.address} • </>}

                    {activeBooking.timeSlot} • {activeBooking.vehicle} • Entry OTP {activeBooking.otpCode}

                  </div>

                </div>

                <button className="btn-primary" onClick={() => setCurrentTab('bookings')}>

                  View / Modify

                </button>

              </div>

            )}



            <FindParking

              spots={spots}

              userBookings={userBookings}

              searchDate={searchDate}

              setSearchDate={setSearchDate}

              searchTime={searchTime}

              setSearchTime={setSearchTime}

              searchQuery={searchQuery}

              setSearchQuery={setSearchQuery}

              selectedVehicle={selectedVehicle}

              setSelectedVehicle={setSelectedVehicle}

              bookingHours={bookingHours}

              setBookingHours={setBookingHours}

              filterEV={filterEV}

              setFilterEV={setFilterEV}

              filterWash={filterWash}

              setFilterWash={setFilterWash}

              filterCovered={filterCovered}

              setFilterCovered={setFilterCovered}

              onBookSpot={handleOpenBooking}

              onPromptBecomeHost={onBecomeHost}

            />



            <div className="flow-divider">

              <div className="flow-line"></div>

              <div className="flow-badge">MEMBER SUBSCRIPTION PLANS</div>

              <div className="flow-line"></div>

            </div>



            <Subscriptions user={user} setUser={setUser} showToast={showToast} />



            <div className="flow-divider">

              <div className="flow-line"></div>

              <div className="flow-badge">CAPTAIN VALET SERVICE</div>

              <div className="flow-line"></div>

            </div>



            <CaptainValet showToast={showToast} bookings={userBookings} setCurrentTab={setCurrentTab} />

          </div>

        )}



        {currentTab === 'captain-dashboard' && activeRole === 'captain' && myCaptain && (

          <CaptainDashboard

            captain={myCaptain}

            jobs={valetList}

            describeBooking={describeValet}

            onUpdateJob={updateJob}

            showToast={showToast}

          />

        )}



        {currentTab === 'host-valet' && activeRole === 'host' && (

          <HostValetManager

            captains={captains}

            onAddCaptain={onAddCaptain}

            onToggleCaptain={onToggleCaptain}

            onRemoveCaptain={onRemoveCaptain}

            jobs={valetJobs}

            onUpdateJob={updateJob}

            showToast={showToast}

            describeBooking={describeValet}

          />

        )}



        {currentTab === 'host-listings' && (

          <HostListings

            user={user}

            spots={spots}

            setSpots={setSpots}

            hostSpots={hostSpots}

            setHostSpots={setHostSpots}

            showToast={showToast}

            setCurrentTab={setCurrentTab}

          />

        )}



        {currentTab === 'host-dashboard' && (

          <HostDashboard

            user={user}

            hostBookings={visibleHostBookings}

            hostSpots={hostSpots}

            setHostSpots={setHostSpots}

            withdrawals={hostWithdrawals}

            onWithdraw={({ amount, upi, timestamp }) =>

              setHostWithdrawals((previous) => [

                { id: `PO-${Date.now()}`, amount, upi, timestamp },

                ...previous

              ])

            }

            showToast={showToast}

            setCurrentTab={setCurrentTab}

          />

        )}



        {currentTab === 'subscription' && (

          <Subscriptions user={user} setUser={setUser} showToast={showToast} />

        )}



        {currentTab === 'services' && (

          <ServicesView

            user={user}

            spots={spots}

            usage={usage}

            bookings={userBookings}

            now={now}

            setCurrentTab={setCurrentTab}

          />

        )}



        {currentTab === 'captain' && (

          <CaptainValet showToast={showToast} bookings={userBookings} setCurrentTab={setCurrentTab} />

        )}



        {currentTab === 'bookings' && (

          <>

          <BookingsView

            bookings={userBookings}

            valetJobs={valetJobs}

            spots={spots}

            setCurrentTab={setCurrentTab}

            onCancel={handleCancelBooking}

            onCheckIn={handleCheckIn}

            onCompleteSlot={handleCompleteSlot}

            violations={violationInfo}

            holdUntilText={holdUntilText}

            now={now}

            onModify={handleModifyBooking}

            onEstimate={estimateModifiedTotal}

            feedbacks={feedbacks}

            onFeedback={handleFeedbackSubmit}

          />

          <DriverValet

             jobs={myValetJobs}

            onDispute={handleDispute}

             onAcknowledgePickup={handleAcknowledgePickup}

           onAcknowledgeParking={handleAcknowledgeParking}

            />

          </>

        )}



        {currentTab === 'help' && (

          <HelpFeedback

            user={user}

            isHost={activeRole === 'host'}

            feedbacks={[...feedbacks].sort((a, b) => b.date.localeCompare(a.date))}

            eligibleBookings={

              activeRole === 'host'

                ? []

                : userBookings.filter(

                    (b) => b.status === 'Completed' && !feedbacks.some((f) => f.bookingId === b.id)

                  )

            }

            onSubmit={handleFeedbackSubmit}

          />

        )}



        {currentTab === 'account' && activeRole === 'captain' && (

          <CaptainProfile

            user={user}

            setUser={setUser}

            stats={{ active: captainActiveCount, done: captainDoneCount }}

            onToggleAvailability={() => onSetCaptainAvailability(email, user.available === false)}

            setCurrentTab={setCurrentTab}

            showToast={showToast}

          />

        )}



        {currentTab === 'account' && activeRole !== 'captain' && (

          <AccountView

            user={user}

            bookings={userBookings}

            hostBookings={visibleHostBookings}

            hostSpots={hostSpots}

            violations={violationInfo}

            holdUntilText={holdUntilText}

            setCurrentTab={setCurrentTab}

          />

        )}

      </main>



      {bookingModalSpot && (

        <BookingModal

          spot={bookingModalSpot}

          selectedVehicle={selectedVehicle}

          bookingHours={bookingHours}

          user={user}

          usage={usage}

          initialDate={searchDate}

          initialTime={searchTime}

          existingBookings={userBookings}

          onClose={() => setBookingModalSpot(null)}

          onConfirm={handleBookingConfirm}

        />

      )}



      {feedbackBooking && (

        <FeedbackModal

          booking={feedbackBooking}

          onSubmit={({ rating, comment }) => {

            handleFeedbackSubmit({ bookingId: feedbackBooking.id, rating, comment });

            setFeedbackBookingId(null);

          }}

        />

      )}



      <Footer currentTab={currentTab} setCurrentTab={setCurrentTab} user={user} />

    </div>

  );

}



export default App;