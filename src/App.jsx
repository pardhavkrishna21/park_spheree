import React, { useState } from 'react';
import Navbar from './components/Navbar';
import FindParking from './components/FindParking';
import Subscriptions from './components/Subscriptions';
import CaptainValet from './components/CaptainValet';
import HostListings from './components/HostListings';
import HostDashboard from './components/HostDashboard';
import BookingsView from './components/BookingsView';
import BookingModal from './components/BookingModal';
import AuthPortal from './components/AuthPortal';
import Footer from './components/Footer';

import { INITIAL_PARKING_SPOTS, INITIAL_HOST_BOOKINGS } from './data/mockData';

export default function App() {
  const [user, setUser] = useState({
    name: 'Arjun Rao',
    email: 'arjun@parksphere.io',
    role: 'driver', // 'driver' or 'host'
    vehiclePlate: 'TS 09 EZ 4088',
    subscription: 'Pro Plan'
  });

  const [currentTab, setCurrentTab] = useState('find');
  const [spots, setSpots] = useState(INITIAL_PARKING_SPOTS);
  const [hostSpots, setHostSpots] = useState([INITIAL_PARKING_SPOTS[0]]);
  const [hostBookings, setHostBookings] = useState(INITIAL_HOST_BOOKINGS);

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedVehicle, setSelectedVehicle] = useState('Car');
  const [bookingHours, setBookingHours] = useState(2);
  const [filterEV, setFilterEV] = useState(false);
  const [filterWash, setFilterWash] = useState(false);
  const [filterCovered, setFilterCovered] = useState(false);

  const [bookingModalSpot, setBookingModalSpot] = useState(null);
  const [userBookings, setUserBookings] = useState([
    {
      id: 'PS-BOOK-8821',
      spotName: 'Nexus Mall Safe Garage Spot',
      hostName: 'Vikram Sharma',
      timeSlot: 'Today (2 Hours)',
      vehicle: 'Car (TS 09 EZ 4088)',
      totalPaid: 130,
      otpCode: '4928',
      status: 'Confirmed'
    }
  ]);

  const [toast, setToast] = useState(null);

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(null), 4000);
  };

  const handleBookingConfirm = ({ grandTotal, needEV, needWash }) => {
    const otp = Math.floor(1000 + Math.random() * 9000).toString();

    const newBooking = {
      id: `PS-BOOK-${Math.floor(1000 + Math.random() * 9000)}`,
      spotName: bookingModalSpot.name,
      hostName: bookingModalSpot.hostName,
      timeSlot: `Upcoming (${bookingHours} Hours)`,
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
        status: 'Active (Parked Now)',
        timestamp: new Date().toISOString()
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
      />

      {toast && <div className="toast-banner">{toast}</div>}

      <main className="main-content">
        {/* DRIVER FLOW: 1. Spots -> 2. Subscriptions -> 3. Upcoming Captain Valet */}
        {currentTab === 'find' && (
          <div>
            <FindParking
              spots={spots}
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
              onBookSpot={(s) => setBookingModalSpot(s)}
              onPromptBecomeHost={() => {
                setUser({ ...user, role: 'host' });
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
              <div className="flow-badge">UPCOMING VALET SERVICES</div>
              <div className="flow-line"></div>
            </div>

            <CaptainValet showToast={showToast} />
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
            showToast={showToast}
            setCurrentTab={setCurrentTab}
          />
        )}

        {/* INDIVIDUAL TABS */}
        {currentTab === 'subscription' && (
          <Subscriptions user={user} setUser={setUser} showToast={showToast} />
        )}

        {currentTab === 'captain' && (
          <CaptainValet showToast={showToast} />
        )}

        {currentTab === 'bookings' && (
          <BookingsView bookings={userBookings} setCurrentTab={setCurrentTab} />
        )}

        {currentTab === 'auth' && (
          <AuthPortal user={user} setUser={setUser} setCurrentTab={setCurrentTab} showToast={showToast} />
        )}
      </main>

      {/* CHECKOUT MODAL */}
      {bookingModalSpot && (
        <BookingModal
          spot={bookingModalSpot}
          selectedVehicle={selectedVehicle}
          bookingHours={bookingHours}
          user={user}
          onClose={() => setBookingModalSpot(null)}
          onConfirm={handleBookingConfirm}
        />
      )}

      <Footer />
    </div>
  );
}
