const fs = require('fs');
const path = require('path');

const keysToAdd = {
  profile: {
    title: "My Profile",
    statusNotSubmitted: "Not Submitted",
    statusUnderReview: "Under Review",
    statusVerified: "Verified",
    statusRejected: "Rejected",
    desc: "Manage your devotee information and account security",
    memberSince: "Member since",
    recentlyJoined: "Recently joined",
    sacredSeeker: "Sacred Seeker",
    completion: "Profile Completion",
    acctCreated: "Account created",
    nameSet: "Name set",
    phoneAdded: "Phone added",
    idVerified: "Identity verified",
    personalInfo: "Personal Information",
    editDetails: "Edit Details",
    fullName: "Full Name",
    phoneNum: "Phone Number",
    email: "Email",
    saveChanges: "Save Changes",
    cancel: "Cancel",
    idVerification: "Identity Verification",
    submitAadhaar: "Submit your Aadhaar and selfie to unlock pilgrimage reservations.",
    verifyNow: "Verify Now",
    underReviewDesc: "Your verification is under review. We'll notify you within 24 to 48 hours.",
    verifiedDesc: "Your identity has been verified by Ashram administration. You can now book all sacred Yatras.",
    rejectedDesc: "Verification was rejected. Please re-upload clearer documents.",
    resubmitDocs: "Resubmit Documents"
  }
};

const localesDir = path.join(__dirname, 'src/i18n/locales');
['en', 'hi', 'mr'].forEach(lang => {
  const filePath = path.join(localesDir, lang, 'common.json');
  if (fs.existsSync(filePath)) {
    const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    data.profile = { ...data.profile, ...keysToAdd.profile };
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2) + '\n');
    console.log('Updated ' + lang + '/common.json');
  }
});
