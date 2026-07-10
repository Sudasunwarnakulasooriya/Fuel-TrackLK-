# FuelTrack LK — Mobile App (Frontend)

React Native (Expo) implementation of the FuelTrack LK UI/UX, themed after the
provided design reference, built for the Frontend & UI/UX responsibility area
of the project proposal.

## Run it

```bash
npm install
npx expo start
```

Scan the QR code with the **Expo Go** app (Android/iOS) to open it on your phone.

## What's included

All screens use **mock data** (`src/data/mockData.js`) — no backend/Firebase
required yet, so you can demo it immediately.

- **Auth flow**: Splash → Onboarding → Sign Up / Log In → OTP Verify → Success
- **Home Dashboard**: location header, search, fuel-type filters, AI promo banner, nearby stations list
- **Nearby Fuel Stations**: filterable full list
- **Fuel Station Details**: hero image, live availability per fuel type, queue info, AI best-time tip
- **Queue Reporting UI**: community report form (queue length + fuel availability)
- **Track Queue**: live map-style ETA/queue tracking screen
- **Fuel Analytics / Predictions**: busy-hour chart, queue trend list, demand insights
- **Profile & Settings**: account menu, saved addresses, sign out
- **Notifications**: fuel alerts and report confirmations

## Next steps (when you're ready)

- Swap `src/data/mockData.js` for real Firebase Realtime Database reads
- Wire `AuthContext` login/signup to Firebase Authentication
- Replace the static map mockups in `TrackQueueScreen` with `react-native-maps` + Google Maps API
- Connect the AI prediction screens to your TensorFlow Lite / Python ML model output

## Project structure

```
src/
  theme/        design tokens (colors, spacing, radii)
  data/         mock fuel station / user data
  context/      AuthContext (mock login state)
  components/   shared UI: buttons, inputs, cards, header
  navigation/   stack + custom bottom tab bar
  screens/      all app screens
```
