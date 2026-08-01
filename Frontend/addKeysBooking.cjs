const fs = require('fs');
const path = require('path');

const keysToAdd = {
  bookingDetail: {
    title: "Booking Detail",
    failedLoad: "Failed to load booking details.",
    backToBookings: "Back to Bookings",
    notFound: "Booking not found.",
    yatraPackage: "Yatra Package",
    departure: "Departure:",
    bookingHash: "Booking #",
    summary: "Reservation details & payment summary",
    cancelBooking: "Cancel Booking",
    pay: "Pay ₹",
    travelerInfo: "Traveler Information",
    traveler: "Traveler",
    primary: "Primary",
    name: "Name",
    genderAge: "Gender/Age",
    phone: "Phone",
    aadhaar: "Aadhaar",
    legacyFormat: "Legacy booking format.",
    travelPrefs: "Travel Preferences",
    transport: "Transport",
    trainClass: "Train Class",
    roomType: "Room Type",
    travelers: "Travelers",
    person: "person",
    persons: "persons",
    attachedSeva: "Attached Seva",
    specialNotes: "Special Notes",
    paymentSummary: "Payment Summary",
    baseFare: "Base Fare",
    roomUpgrade: "Room Upgrade",
    gatewayFee: "Gateway Fee",
    totalAmount: "Total Amount",
    bookedOn: "Booked On"
  }
};

const localesDir = path.join(__dirname, 'src/i18n/locales');
['en', 'hi', 'mr'].forEach(lang => {
  const filePath = path.join(localesDir, lang, 'common.json');
  if (fs.existsSync(filePath)) {
    const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    data.portal = { ...data.portal, ...keysToAdd };
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2) + '\n');
    console.log('Updated ' + lang + '/common.json');
  }
});
