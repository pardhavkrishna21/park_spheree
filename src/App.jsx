import React, { useEffect, useState } from 'react';
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
import AuthPortal from './components/AuthPortal';
import Footer from './components/Footer';

import { INITIAL_PARKING_SPOTS, INITIAL_HOST_BOOKINGS } from './data/mockData';
import { todayStr, toRange, fmtSlot, findConflict } from './utils/bookingTime';
import { PRICES, washPrice, valetFare } from './utils/plans';
import { getAvailability, nextSlotTime } from './utils/availability';
import { getViolationStatus, MAX_VIOLATIONS } from './utils/violations';

export default function App() {
  // Driver and host are separate accounts; each keeps its own profile data.
  const [driverProfile, setDriverProfile] = useState({
    name: 'Arjun Rao',
    email: 'arjun@parksphere.io',
    role: 'driver',
    phone: '+91 98765 43210',
    vehiclePlate: 'TS 09 EZ 4088',
    subscription: 'Pro Plan'
  });
  const [hostProfile, setHostProfile] = useState({
    name: 'Vikram Sharma',
    email: 'vikram@host.io',
    role: 'host',
    phone: '+91 99887 66554',
    companyName: 'Smart Bay Homes'
  });
  const [activeRole, setActiveRole] = useState('driver');
  const user = activeRole === 'host' ? hostProfile : driverProfile;
  const setUser = (next) => {
    const resolved = typeof next === 'function' ? next(user) : next;
    if (resolved.role === 'host') {
      setHostProfile(resolved);
      setActiveRole('host');
    } else {
      setDriverProfile(resolved);
      setActiveRole('driver');
    }
  };

  const [currentTab, setCurrentTab] = useState('find');
  const [spots, setSpots] = useState(INITIAL_PARKING_SPOTS);
  const [hostSpots, setHostSpots] = useState([INITIAL_PARKING_SPOTS[0]]);
  const [hostBookings, setHostBookings] = useState(INITIAL_HOST_BOOKINGS);
  // Payouts are part of the host ledger, not a display-only wallet number. The
  // seeded host has withdrawn all earnings recorded before this session.
  const [hostWithdrawals, setHostWithdrawals] = useState([
    { id: 'PO-20261003-001', amount: 2670, upi: 'vikram@okaxis', timestamp: new Date(2026, 9, 3, 9, 15).toISOString() }
  ]);

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedVehicle, setSelectedVehicle] = useState('Car');
  const [bookingHours, setBookingHours] = useState(2);
  const [searchDate, setSearchDate] = useState(todayStr());
  const [searchTime, setSearchTime] = useState(nextSlotTime());
  const [filterEV, setFilterEV] = useState(false);
  const [filterWash, setFilterWash] = useState(false);
  const [filterCovered, setFilterCovered] = useState(false);

  const [bookingModalSpot, setBookingModalSpot] = useState(null);
  const [usage, setUsage] = useState({ wash: 0, ev: 0 });
  const [feedbacks, setFeedbacks] = useState([
    { id: 'fb-1', name: 'Priya S.', spotName: 'ITC Kohenur Street Gated Driveway', rating: 5, comment: 'Reached 10 minutes early, checked in and the bay was exactly as shown. Super easy exit too.', date: '2026-09-28' },
    { id: 'fb-2', name: 'Rahul M.', spotName: 'Nexus Mall Safe Garage Spot', rating: 4, comment: 'Saved me a 30 minute parking hunt at the mall. The EV charger was ready when I arrived.', date: '2026-09-25' },
    { id: 'fb-3', name: 'Ananya K.', spotName: 'AMB Mall Kondapur Covered Bay', rating: 5, comment: 'Used Captain Valet for a weekend movie. Photos before and after parking gave me full confidence.', date: '2026-09-21' },
    { id: 'fb-4', name: 'Imran A.', spotName: 'HITEC City Cyber Towers Parking', rating: 4, comment: 'Clean, secure and fair price. Would love more slots in the evening.', date: '2026-09-17' }
  ]);
  const [userBookings, setUserBookings] = useState([
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
  ]);

  const [toast, setToast] = useState(null);
  const [now, setNow] = useState(Date.now());

  // Never leave a role on a page that belongs to the other role.
  useEffect(() => {
    const driverTabs = ['find', 'subscription', 'bookings', 'services'];
    const hostTabs = ['host-listings', 'host-dashboard'];
    if (activeRole === 'host' && driverTabs.includes(currentTab)) setCurrentTab('host-listings');
    if (activeRole === 'driver' && hostTabs.includes(currentTab)) setCurrentTab('find');
  }, [activeRole, currentTab]);

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 30000);
    return () => clearInterval(id);
  }, []);

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(null), 4000);
  };

  // Keep booking status in sync with the clock: no-shows are cancelled, finished stays complete.
  useEffect(() => {
    const endOf = (b) => toRange(b.date, b.startTime, b.hours)[1];
    const missed = userBookings.filter((b) => b.status === 'Confirmed' && endOf(b) <= now);
    const finished = userBookings.filter((b) => b.status === 'Parked' && endOf(b) <= now);
    if (missed.length === 0 && finished.length === 0) return;

    const missedIds = missed.map((b) => b.id);
    const finishedIds = finished.map((b) => b.id);
    setUserBookings((prev) => prev.map((b) => {
      if (missedIds.includes(b.id)) {
        return { ...b, status: 'Cancelled', violation: true, violationAt: now, cancelReason: 'You did not park during the booked slot. This counts as a violation.' };
      }
      if (finishedIds.includes(b.id)) return { ...b, status: 'Completed' };
      return b;
    }));
    setHostBookings((prev) => prev.map((h) => {
      if (missedIds.includes(h.bookingId)) return { ...h, status: 'Cancelled (driver did not park)' };
      if (finishedIds.includes(h.bookingId)) return { ...h, status: 'Completed' };
      return h;
    }));
    const freed = missed.reduce((acc, b) => ({ wash: acc.wash + (b.freeWash ? 1 : 0), ev: acc.ev + (b.freeEV ? 1 : 0) }), { wash: 0, ev: 0 });
    if (freed.wash || freed.ev) setUsage((u) => ({ wash: u.wash - freed.wash, ev: u.ev - freed.ev }));
    if (missed.length && activeRole === 'driver') showToast(`Booking at ${missed[0].spotName} was cancelled because you did not park. This is a violation. Please cancel bookings you don't need.`);
  }, [now, userBookings]);

  const violationInfo = getViolationStatus(userBookings, now);
  const holdUntilText = violationInfo.holdUntil
    ? new Date(violationInfo.holdUntil).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })
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

  const handleCheckIn = (id) => {
    const b = userBookings.find((x) => x.id === id);
    if (!b) return;
    const [start, end] = toRange(b.date, b.startTime, b.hours);
    if (Date.now() < start - 15 * 60000 || Date.now() >= end) {
      showToast('Check-in is only available from 15 minutes before your slot until it ends.');
      return;
    }
    setUserBookings((prev) => prev.map((x) => (x.id === id ? { ...x, status: 'Parked', parkedAt: Date.now() } : x)));
    setHostBookings((prev) => prev.map((x) => (x.bookingId === id ? { ...x, status: 'Active (Parked Now)' } : x)));
    showToast(`Parked at ${b.spotName}. Enjoy your stay!`);
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
    if (b?.freeWash || b?.freeEV) {
      setUsage((u) => ({ wash: u.wash - (b.freeWash ? 1 : 0), ev: u.ev - (b.freeEV ? 1 : 0) }));
    }
    const cancellationReason = reason.trim() || 'Cancelled by you.';
    setUserBookings((prev) => prev.map((b) => (b.id === id ? { ...b, status: 'Cancelled', cancelReason: cancellationReason } : b)));
    setHostBookings((prev) => prev.map((h) => (h.bookingId === id ? { ...h, status: 'Cancelled' } : h)));
    showToast('Booking cancelled.');
  };

  const handleFeedbackSubmit = ({ bookingId, rating, comment }) => {
    const booking = userBookings.find((b) => b.id === bookingId);
    if (!booking || booking.status !== 'Completed' || feedbacks.some((f) => f.bookingId === bookingId)) return;
    setFeedbacks((previous) => [{ id: `fb-${Date.now()}`, bookingId, name: user.name, spotName: booking.spotName, rating, comment, date: todayStr() }, ...previous]);
    showToast('Thanks for sharing your parking experience!');
  };

  const addOnsFor = (booking, { needEV, needWash, needValet, valetKm }) => {
    const keepFreeEV = Boolean(needEV && booking.freeEV);
    const keepFreeWash = Boolean(needWash && booking.freeWash);
    const valetFee = needValet && valetKm ? valetFare(valetKm) : 0;
    const addOnCost = (needEV && !keepFreeEV ? PRICES.ev : 0) + (needWash && !keepFreeWash ? washPrice(booking.vehicleType) : 0) + valetFee;
    return { keepFreeEV, keepFreeWash, valetFee, addOnCost };
  };

  const estimateModifiedTotal = (id, draft) => {
    const booking = userBookings.find((b) => b.id === id);
    if (!booking) return 0;
    return calcTotal(booking.vehicleType, draft.hours, addOnsFor(booking, draft).addOnCost);
  };

  const handleModifyBooking = (id, { date, startTime, hours, needEV, needWash, needValet, valetPickup, valetKm }) => {
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
    if (!spot || getAvailability(spot, updatedDate, updatedStartTime, hours, userBookings.filter((b) => b.id !== id)).free === 0) {
      showToast('That parking time is no longer available. Please choose another slot.');
      return;
    }
    const isBike = booking.vehicleType === 'Bike';
    const rate = isBike ? 30 : 50;
    const evChargingEarning = needEV ? PRICES.ev : 0;
    const washEarning = needWash ? washPrice(booking.vehicleType) : 0;
    const { keepFreeEV, keepFreeWash, valetFee, addOnCost } = addOnsFor(booking, { needEV, needWash, needValet, valetKm });
    if ((booking.freeEV && !keepFreeEV) || (booking.freeWash && !keepFreeWash)) {
      setUsage((u) => ({ wash: u.wash - (booking.freeWash && !keepFreeWash ? 1 : 0), ev: u.ev - (booking.freeEV && !keepFreeEV ? 1 : 0) }));
    }
    setUserBookings((prev) => prev.map((b) => (b.id === id ? {
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
      valetKm: needValet ? valetKm : 0,
      valetFee,
      addOnCost,
      timeSlot: fmtSlot(updatedDate, updatedStartTime, hours),
      totalPaid: calcTotal(b.vehicleType, hours, addOnCost)
    } : b)));
    setHostBookings((prev) => prev.map((h) => {
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
        evChargerType: needEV ? (spots.find((s) => s.name === booking.spotName)?.amenities.evChargerType || '') : '',
        evChargingEarning,
        washEarning,
        hostEarning: parkingEarning + evChargingEarning + washEarning
      };
    }));
    showToast('Booking updated.');
  };

  const handleBookingConfirm = ({ grandTotal, addOnCost, needEV, needWash, needValet, valetPickup, valetKm, valetFee, freeEV, freeWash, date, startTime, hours: bookingHours }) => {
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

    // Push into host telemetry
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
        // Keep the booking's scheduled slot distinct from when it was made.
        // A future booking must never appear as an already-earned payment.
        status: 'Scheduled',
        timestamp: new Date(slotStart).toISOString(),
        startAt: new Date(slotStart).toISOString(),
        endAt: new Date(slotEnd).toISOString(),
        createdAt: new Date().toISOString()
      },
      ...hostBookings
    ]);

    setBookingModalSpot(null);
    showToast(`🎉 Parking Reserved! Your entry OTP is ${otp}. View in My Bookings.`);
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
        hostBookingCount={hostBookings.length}
        onLogout={() => {
          setCurrentTab('auth');
          showToast('You have been logged out. Please log in again.');
        }}
      />

      {toast && <div className="toast-banner">{toast}</div>}

      <main className="main-content">
        {/* DRIVER FLOW: 1. Spots -> 2. Subscriptions -> 3. Captain Valet */}
        {currentTab === 'find' && (
          <div>
            {parkedNow && (
              <div style={{ background: '#eff6ff', border: '1px solid #93c5fd', borderRadius: 12, padding: '14px 18px', marginBottom: 20, display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
                <div>
                  <strong>🅿️ Parked now: {parkedNow.spotName}</strong>
                  <div style={{ fontSize: 13, color: '#475569' }}>{parkedNow.timeSlot} • {parkedNow.vehicle}</div>
                </div>
                <button className="btn-primary" onClick={() => setCurrentTab('bookings')}>View booking</button>
              </div>
            )}
            {lastOutcome?.violation && (
              <div style={{ background: '#fee2e2', border: '2px solid #dc2626', borderLeftWidth: 8, borderRadius: 12, padding: '14px 18px', marginBottom: 20, color: '#7f1d1d' }}>
                <strong style={{ color: '#b91c1c', fontSize: 16 }}>⚠ Not parked: you booked {lastOutcome.spotName} but did not check in</strong>
                <div style={{ fontSize: 13, marginTop: 2 }}>{lastOutcome.timeSlot} • The booking was cancelled automatically.</div>
                <div style={{ fontSize: 13, marginTop: 6 }}>
                  Violations: <strong>{violationInfo.count} of {MAX_VIOLATIONS}</strong>. {MAX_VIOLATIONS} violations put your account on hold for 3 months. Cancel bookings you don't need instead of missing them.
                </div>
              </div>
            )}
            {lastOutcome && !lastOutcome.violation && (
              <div
                style={{
                  background: lastOutcome.status === 'Completed' ? '#ecfdf5' : '#f8fafc',
                  border: `1px solid ${lastOutcome.status === 'Completed' ? '#6ee7b7' : '#cbd5e1'}`,
                  borderRadius: 12,
                  padding: '14px 18px',
                  marginBottom: 20
                }}
              >
                {lastOutcome.status === 'Completed' ? (
                  <>
                    <strong style={{ color: '#047857' }}>✓ Last completed parking: you checked in and completed this slot</strong>
                    <div style={{ fontSize: 13, color: '#065f46' }}>{lastOutcome.spotName} • {lastOutcome.timeSlot} • Completed</div>
                  </>
                ) : (
                  <>
                    <strong style={{ color: '#334155' }}>Booking cancelled: {lastOutcome.spotName}</strong>
                    <div style={{ fontSize: 13, color: '#475569' }}>{lastOutcome.timeSlot} • {lastOutcome.cancelReason}</div>
                  </>
                )}
              </div>
            )}
            {violationInfo.holdUntil && (
              <div style={{ background: '#fef2f2', border: '1px solid #f87171', borderRadius: 12, padding: '14px 18px', marginBottom: 20, color: '#991b1b' }}>
                <strong>Account on hold until {holdUntilText}.</strong> You missed {MAX_VIOLATIONS} booked slots, so new bookings are paused for 3 months.
              </div>
            )}
            {activeBooking && (
              <div className="active-booking-banner" style={{ background: '#ecfdf5', border: '1px solid #6ee7b7', borderRadius: 12, padding: '14px 18px', marginBottom: 20, display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
                <div>
                  <strong>Your active booking: {activeBooking.spotName}</strong>
                  <div style={{ fontSize: 13, color: '#475569' }}>
                    {activeSpot?.address && <>{activeSpot.address} • </>}{activeBooking.timeSlot} • {activeBooking.vehicle} • Entry OTP {activeBooking.otpCode}
                  </div>
                </div>
                <button className="btn-primary" onClick={() => setCurrentTab('bookings')}>View / Modify</button>
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
              onPromptBecomeHost={() => {
                setActiveRole('host');
                setCurrentTab('auth');
                showToast('📝 Drivers require a dedicated host account. Please register.');
              }}
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

        {/* SPACE HOST VIEWS */}
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
            hostBookings={hostBookings}
            hostSpots={hostSpots}
            setHostSpots={setHostSpots}
            withdrawals={hostWithdrawals}
            onWithdraw={({ amount, upi, timestamp }) => setHostWithdrawals((previous) => [
              { id: `PO-${Date.now()}`, amount, upi, timestamp },
              ...previous
            ])}
            showToast={showToast}
            setCurrentTab={setCurrentTab}
          />
        )}

        {/* INDIVIDUAL TABS */}
        {currentTab === 'subscription' && (
          <Subscriptions user={user} setUser={setUser} showToast={showToast} />
        )}

        {currentTab === 'services' && (
          <ServicesView user={user} spots={spots} usage={usage} bookings={userBookings} now={now} setCurrentTab={setCurrentTab} />
        )}

        {currentTab === 'captain' && (
          <CaptainValet showToast={showToast} bookings={userBookings} setCurrentTab={setCurrentTab} />
        )}

        {currentTab === 'bookings' && (
          <BookingsView
            bookings={userBookings}
            spots={spots}
            setCurrentTab={setCurrentTab}
            onCancel={handleCancelBooking}
            onCheckIn={handleCheckIn}
            violations={violationInfo}
            holdUntilText={holdUntilText}
            now={now}
            onModify={handleModifyBooking}
            onEstimate={estimateModifiedTotal}
            feedbacks={feedbacks}
            onFeedback={handleFeedbackSubmit}
          />
        )}

        {currentTab === 'help' && (
          <HelpFeedback
            user={user}
            isHost={activeRole === 'host'}
            feedbacks={[...feedbacks].sort((a, b) => b.date.localeCompare(a.date))}
            eligibleBookings={activeRole === 'host' ? [] : userBookings.filter((b) => b.status === 'Completed' && !feedbacks.some((f) => f.bookingId === b.id))}
            onSubmit={handleFeedbackSubmit}
          />
        )}

        {currentTab === 'account' && (
          <AccountView
            user={user}
            bookings={userBookings}
            hostBookings={hostBookings}
            hostSpots={hostSpots}
            violations={violationInfo}
            holdUntilText={holdUntilText}
            setCurrentTab={setCurrentTab}
          />
        )}

        {currentTab === 'auth' && (
          <AuthPortal user={user} profiles={{ driver: driverProfile, host: hostProfile }} setUser={setUser} setCurrentTab={setCurrentTab} showToast={showToast} />
        )}
      </main>

      {/* CHECKOUT MODAL */}
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

      <Footer />
    </div>
  );
}
