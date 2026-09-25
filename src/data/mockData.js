export const INITIAL_PARKING_SPOTS = [
  {
    id: 'spot-101',
    name: 'Nexus Mall Safe Garage Spot',
    destinationNear: 'Nexus Mall / Inorbit',
    address: '50m from Nexus Main Exit, Madhapur Road',
    hostName: 'Vikram Sharma',
    hostEmail: 'vikram@host.io',
    rating: 4.9,
    reviewsCount: 84,
    distanceMeters: 90,
    vehicleTypes: ['Car', 'Bike', 'EV', 'SUV'],
    basePriceBike: 30, // Guaranteed fixed rate
    basePriceCar: 50,  // Guaranteed fixed rate
    image: 'https://images.unsplash.com/photo-1590674899484-d5640e854abe?auto=format&fit=crop&w=700&q=80',
    amenities: { evCharging: true, carWash: true, cctv: true, covered: true },
    maxCarCapacity: 2,
    maxBikeCapacity: 3,
    totalSlots: 5,
    availableSlots: 2,
    ownershipDocument: 'Electricity Bill: EB-098231',
    hostType: 'Private Covered Garage'
  },
  {
    id: 'spot-102',
    name: 'ITC Kohenur Street Gated Driveway',
    destinationNear: 'ITC Kohenur / Durgam Cheruvu',
    address: 'Plot 12, Jubilee Enclave Gate 2',
    hostName: 'Sneha Reddy',
    hostEmail: 'sneha@host.io',
    rating: 4.8,
    reviewsCount: 42,
    distanceMeters: 140,
    vehicleTypes: ['Car', 'EV'],
    basePriceBike: 30,
    basePriceCar: 50,
    image: 'https://images.unsplash.com/photo-1506521781263-d8422e82f27a?auto=format&fit=crop&w=700&q=80',
    amenities: { evCharging: true, carWash: false, cctv: true, covered: false },
    maxCarCapacity: 2,
    maxBikeCapacity: 1,
    totalSlots: 3,
    availableSlots: 1,
    ownershipDocument: 'Property Tax: PT-2025-44',
    hostType: 'Residential Driveway'
  },
  {
    id: 'spot-103',
    name: 'Bawarchi Bistro Quick Park Yard',
    destinationNear: 'Bawarchi Grand / RTC Cross Roads',
    address: 'Lane opp. Grand Hotel, Safe Compound',
    hostName: 'Ramesh Patel',
    hostEmail: 'ramesh@host.io',
    rating: 4.6,
    reviewsCount: 65,
    distanceMeters: 40,
    vehicleTypes: ['Bike', 'Car'],
    basePriceBike: 30,
    basePriceCar: 50,
    image: 'https://images.unsplash.com/photo-1573348722427-f1d6819fdf98?auto=format&fit=crop&w=700&q=80',
    amenities: { evCharging: false, carWash: true, cctv: true, covered: true },
    maxCarCapacity: 3,
    maxBikeCapacity: 5,
    totalSlots: 8,
    availableSlots: 4,
    ownershipDocument: 'Registered Sale Deed: RD-4091',
    hostType: 'Dedicated Plot'
  }
];

export const INITIAL_HOST_BOOKINGS = [
  {
    id: 'HB-901',
    spotName: 'Nexus Mall Safe Garage Spot',
    vehiclePlate: 'TS 09 EZ 4088',
    vehicleType: 'Car',
    driverName: 'Arjun Rao',
    hoursBooked: 3,
    rateApplied: 50,
    hostEarning: 150,
    status: 'Active (Parked Now)',
    timestamp: 'Today, 2:15 PM'
  },
  {
    id: 'HB-902',
    spotName: 'Nexus Mall Safe Garage Spot',
    vehiclePlate: 'AP 28 AX 9102',
    vehicleType: 'Car',
    driverName: 'Karthik N',
    hoursBooked: 2,
    rateApplied: 50,
    hostEarning: 100,
    status: 'Completed',
    timestamp: 'Today, 11:30 AM'
  }
];
