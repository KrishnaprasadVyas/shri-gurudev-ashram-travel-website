const fs = require('fs');
const path = require('path');

const keysToAdd = {
  book: {
    bookYatra: "Book Yatra",
    bookTitle: "Book",
    setupYatra: "Setup your Yatra",
    completeReservation: "Complete your pilgrimage reservation",
    step1: "Step 1 of 4",
    step2: "Step 2 of 4",
    step3: "Step 3 of 4",
    step4: "Step 4 of 4",
    transportType: "Transport Type",
    trainClass: "Train Class",
    roomType: "Room Type",
    select: "Select...",
    male: "Male",
    female: "Female",
    other: "Other",
    attachOptionalSeva: "Attach Optional Seva (Devotional Offering)",
    optional: "Optional",
    sevaDesc: "Enhance your Yatra experience by attaching an auspicious Seva offering to your pilgrimage booking.",
    noAttachedSeva: "No Attached Seva",
    standardYatraDesc: "Standard Yatra travel booking only",
    sacredAshramSeva: "Sacred Ashram Seva",
    sevaDate: "Seva Performing Date",
    travelers: "Travelers",
    seatsLeft: "seats left",
    yatra: "Yatra (",
    sevaFeeLabel: "+ Seva: ₹",
    totalBaseAmount: "Total Base Amount",
    gatewayFeeAdd: "+ 2.36% Gateway Fee",
    continue: "Continue",
    passengerDetails: "Passenger Details",
    passenger: "Passenger",
    primary: "Primary",
    fullName: "Full Name",
    gender: "Gender",
    dob: "Date of Birth",
    phone: "Phone",
    aadhaarNumber: "Aadhaar Number",
    address: "Address",
    back: "Back",
    docUploads: "Document Uploads",
    docInfo: "Please provide ID proof for each passenger (JPG, PNG, PDF &lt; 5MB).",
    sDocs: "'s Documents",
    upload: "Upload",
    reviewSubmit: "Review & Submit",
    bookingSummary: "Booking Summary",
    package: "Package",
    transport: "Transport",
    room: "Room",
    attachedSeva: "Attached Seva",
    travelerStr: "traveler",
    sevaLabel: "Seva (",
    paymentGatewayFeeAdded: "Payment Gateway Fee (2.36%) will be added",
    totalSubtotal: "Total Subtotal",
    confirmPay: "Confirm & Proceed to Pay"
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
