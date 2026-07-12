import { initializeApp } from 'firebase/app';
import { getDatabase } from 'firebase/database';
import { getAuth } from 'firebase/auth';

const firebaseConfig = {
  // TODO: Replace with your actual Firebase Web Config
  apiKey: "AIzaSyDaozflkHHaMXHejzdeD4OEyU_6AF1ZKeo",
  authDomain: "fuel-tracker-app-19a70.firebaseapp.com",
  databaseURL: "https://fuel-tracker-app-19a70-default-rtdb.firebaseio.com",
  projectId: "fuel-tracker-app-19a70",
  storageBucket: "fuel-tracker-app-19a70.firebasestorage.app",
  messagingSenderId: "44029653221",
  appId: "1:44029653221:web:deb710717a31d98adee40c"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getDatabase(app);
