# Housewarming Celebration - Invitation & RSVP Website

A beautiful, fully responsive housewarming invitation website with a built-in RSVP system and admin dashboard.

## Features

- Elegant invitation page with countdown timer
- Interactive RSVP form with validation
- Firebase Realtime Database for storing RSVPs
- Admin dashboard to view all RSVPs in a table
- CSV export for guest list
- Search, filter, and sort RSVPs
- Fully responsive (mobile, tablet, laptop, desktop, ultra-wide)
- Smooth scroll animations
- Dark mode support
- Reduced motion support for accessibility
- Print-friendly styles

## Project Structure

```text
├── index.html          # Main invitation page
├── styles.css          # All styles (responsive)
├── script.js           # Invitation page logic
├── admin.html          # RSVP admin dashboard
├── admin.js            # Admin dashboard logic
├── firebase-config.js  # Firebase configuration (update with your keys)
└── README.md
```

## Setup Instructions

### Step 1: Set Up Firebase (Free - 5 minutes)

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click **"Create a project"**
3. Name it `housewarming-rsvp` (or anything you like)
4. **Disable** Google Analytics (not needed) → Click **"Create Project"**
5. Once created, click the **web icon** (`</>`) on the project overview page
6. Register the app with nickname `housewarming` → Click **"Register app"**
7. **Copy the config object** — you'll need these values
8. In the left sidebar, go to **"Build" → "Realtime Database"**
9. Click **"Create Database"** → Select your region → Choose **"Start in test mode"**
10. Click **"Enable"**

### Step 2: Update Firebase Config

Open `firebase-config.js` and replace the placeholder values with your Firebase config:

```javascript
const firebaseConfig = {
    apiKey: "AIzaSy...",               // Your actual API key
    authDomain: "your-project.firebaseapp.com",
    databaseURL: "https://your-project-default-rtdb.firebaseio.com",
    projectId: "your-project",
    storageBucket: "your-project.appspot.com",
    messagingSenderId: "123456789",
    appId: "1:123456789:web:abc123"
};
```

### Step 3: Deploy to Vercel

1. Push this repo to GitHub
2. Go to [vercel.com](https://vercel.com) and sign in with GitHub
3. Click **"Add New" → "Project"**
4. Import your `House-Warming` repository
5. **Framework Preset**: Select `Other` (this is a static site)
6. Click **"Deploy"**
7. Your site will be live at `https://your-project.vercel.app`

That's it! Every time you push to GitHub, Vercel auto-deploys.

### Optional: Custom Domain

In Vercel dashboard → Your project → **Settings** → **Domains** → Add your custom domain.

## Viewing RSVPs

- Go to `https://your-site.vercel.app/admin.html`
- View all RSVPs in a sortable, searchable table
- Filter by attendance status (Attending / Declined / Maybe)
- Export all data as CSV for spreadsheets
- Delete individual RSVPs if needed

## Firebase Security (Important)

The test mode rules expire after 30 days. Since the party is on April 19, 2026, update your Firebase rules after the party or before they expire.

To update rules, go to Firebase Console → Realtime Database → Rules:

```json
{
  "rules": {
    "rsvps": {
      ".read": true,
      ".write": true
    }
  }
}
```

## Without Firebase (Fallback)

If you don't set up Firebase, the site still works! RSVPs save to the browser's `localStorage`. However, this means:

- Only RSVPs from that specific browser are stored
- Data is lost if the user clears their browser data
- The admin dashboard only shows locally stored RSVPs

**Recommendation:** Set up Firebase for the best experience — it takes 5 minutes and is free.

## Customization

- **Event time**: Edit the time in `index.html` (Details section) and `script.js` (countdown target date)
- **Colors**: Update CSS variables in `:root` at the top of `styles.css`
- **Content**: Edit text directly in `index.html`
- **FAQ**: Add/remove FAQ items in the FAQ section of `index.html`
