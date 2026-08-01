const fs = require('fs');
const path = require('path');

const keysToAdd = {
  portal: {
    title: "My Portal",
    devoteePortal: "Devotee Portal",
    greetingMorning: "Good Morning",
    greetingAfternoon: "Good Afternoon",
    greetingEvening: "Good Evening",
    heroDesc: "Continue your spiritual journey through sacred pilgrimages under Gurudev Ji's divine guidance.",
    verifyRequired: "Complete Identity Verification",
    required: "Required",
    verifyDesc: "Verify your identity before booking any sacred Yatra. Takes less than 3 minutes.",
    verifyNow: "Verify Now",
    verifyReview: "Verification Under Review",
    inProgress: "In Progress",
    verifyReviewDesc: "Your documents are being reviewed. We'll notify you within 24 to 48 hours.",
    verifyAction: "Verification Action Required",
    verifyActionDesc: "Your previous submission was not accepted. Please re-upload clearer identity documents.",
    resubmit: "Resubmit",
    verifySuccess: "Identity Verified ✓ — You can now book and attend all sacred Yatras.",
    statsVerify: "Verification",
    statsVerifyDone: "Identity confirmed ✓",
    statsVerifyReq: "Required for booking",
    statsBookings: "Total Bookings",
    statsBookingsSub: "Sacred journey passes",
    statsYatras: "Upcoming Yatras",
    statsYatrasSub: "Confirmed pilgrimages",
    statsProfile: "Profile Status",
    statsProfileDone: "Fully set up",
    statsProfileReq: "Finish setup",
    quickActions: "Quick Actions",
    actionBrowse: "Browse Yatras",
    actionBrowseDesc: "Explore upcoming pilgrimages & itineraries",
    actionBrowseCta: "Explore",
    actionBookings: "My Bookings",
    actionBookingsDesc: "View pilgrimage passes & payment receipts",
    actionBookingsCta: "View",
    actionProfile: "My Profile",
    actionProfileDesc: "Update personal information & contact info",
    actionProfileCta: "Edit",
    actionSupport: "Support",
    actionSupportDesc: "Get assistance from Ashram administration",
    actionSupportCta: "Contact",
    recentActivity: "Recent Activity",
    viewAll: "View All",
    loadingRecords: "Loading your records...",
    noActivity: "No recent activity",
    noActivityDesc: "Your pilgrimage reservations and boarding passes will appear here once booked.",
    yatraHash: "Yatra #",
    pilgrimageRes: "Pilgrimage Reservation",
    travelerS: "traveler(s)",
    confirmed: "Confirmed",
    cancelled: "Cancelled",
    pending: "Pending",
    quoteHeader: "॥ श्रद्धावान् लभते ज्ञानम् ॥",
    quoteText: "&ldquo;He who has faith attains true spiritual knowledge and divine peace.&rdquo;",
    ashramWisdom: "Ashram Wisdom"
  }
};

const localesDir = path.join(__dirname, 'src/i18n/locales');
['en', 'hi', 'mr'].forEach(lang => {
  const filePath = path.join(localesDir, lang, 'common.json');
  if (fs.existsSync(filePath)) {
    const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    data.portal = { ...data.portal, ...keysToAdd.portal };
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2) + '\n');
    console.log('Updated ' + lang + '/common.json');
  }
});
