const path = require("path");
require("dotenv").config();

const { initializeApp, getApps, cert } = require("firebase-admin/app");
const { getDatabase } = require("firebase-admin/database");
const { getAuth } = require("firebase-admin/auth");
const { getMessaging } = require("firebase-admin/messaging");

let serviceAccount;

try {
  serviceAccount = require(path.join(__dirname, "../serviceAccountKey.json"));
} catch (error) {
  console.warn("WARNING: serviceAccountKey.json not found.");
  serviceAccount = null;
}

if (serviceAccount && getApps().length === 0) {
  initializeApp({
    credential: cert(serviceAccount),
    databaseURL: process.env.FIREBASE_DATABASE_URL,
  });

  console.log("Firebase Admin initialized successfully");
}

const db = serviceAccount ? getDatabase() : null;
const auth = serviceAccount ? getAuth() : null;
const messaging = serviceAccount ? getMessaging() : null;

module.exports = {
  db,
  auth,
  messaging,
};