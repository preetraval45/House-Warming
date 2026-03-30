/* =============================================
   FIREBASE CONFIGURATION

   INSTRUCTIONS:
   1. Go to https://console.firebase.google.com/
   2. Click "Create a project" (or "Add project")
   3. Name it something like "housewarming-rsvp"
   4. Disable Google Analytics (not needed) and click "Create Project"
   5. Once created, click the web icon (</>) to add a web app
   6. Register the app with a nickname (e.g., "housewarming")
   7. Copy YOUR config values below (replace the placeholder values)
   8. Go to "Realtime Database" in the left sidebar
   9. Click "Create Database" → choose your region → Start in TEST MODE
   10. You're done! RSVPs will now save to Firebase.

   IMPORTANT: The config below has PLACEHOLDER values.
   Replace them with your actual Firebase project config.
   ============================================= */

const firebaseConfig = {
    apiKey: "YOUR_API_KEY_HERE",
    authDomain: "YOUR_PROJECT_ID.firebaseapp.com",
    databaseURL: "https://YOUR_PROJECT_ID-default-rtdb.firebaseio.com",
    projectId: "YOUR_PROJECT_ID",
    storageBucket: "YOUR_PROJECT_ID.appspot.com",
    messagingSenderId: "YOUR_SENDER_ID",
    appId: "YOUR_APP_ID"
};

// Initialize Firebase (only if config is set up)
if (firebaseConfig.apiKey !== "YOUR_API_KEY_HERE") {
    firebase.initializeApp(firebaseConfig);
    console.log('Firebase initialized successfully.');
} else {
    console.warn(
        'Firebase is not configured. RSVPs will be saved to localStorage.\n' +
        'To enable Firebase, update firebase-config.js with your project credentials.\n' +
        'See the instructions in firebase-config.js or README.md for setup steps.'
    );
}
