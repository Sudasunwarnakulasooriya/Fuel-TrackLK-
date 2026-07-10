const path = require("path");
const fs = require("fs");
require("dotenv").config();

const { initializeApp, getApps, cert } = require("firebase-admin/app");
const { getDatabase } = require("firebase-admin/database");
const { getAuth } = require("firebase-admin/auth");
const { getMessaging } = require("firebase-admin/messaging");

let serviceAccount;

try {
  serviceAccount = require(path.join(__dirname, "../serviceAccountKey.json"));
} catch (error) {
  console.warn("WARNING: serviceAccountKey.json not found. Falling back to local mock database & mock authentication.");
  serviceAccount = null;
}

if (serviceAccount && getApps().length === 0) {
  initializeApp({
    credential: cert(serviceAccount),
    databaseURL: process.env.FIREBASE_DATABASE_URL,
  });

  console.log("Firebase Admin initialized successfully");
}

let db;
let auth;
let messaging;

if (serviceAccount) {
  db = getDatabase();
  auth = getAuth();
  messaging = getMessaging();
} else {
  // --- Start of Mock Fallback ---
  const dbFilePath = path.join(__dirname, "../mock_db.json");

  // Pre-seed mock database if not exists
  const initialDb = {
    "fuelStations": {
      "st1": {
        "id": "st1",
        "name": "Ceylon Petroleum - Rajagiriya",
        "brand": "CPC",
        "address": "142 Nawala Rd, Rajagiriya",
        "location": { "lat": 6.9097, "lng": 79.8920 },
        "rating": 4.5,
        "reviews": 212,
        "isOpen": true,
        "queue": "LOW",
        "queueCount": 6,
        "waitMinutes": 8,
        "lastUpdated": "5 min ago",
        "availability": {
          "petrol92": true,
          "petrol95": true,
          "diesel": true,
          "superdiesel": false,
          "kerosene": true
        },
        "image": "https://images.unsplash.com/photo-1545262810-77515befe149?w=900&q=80"
      },
      "st2": {
        "id": "st2",
        "name": "Lanka IOC - Battaramulla",
        "brand": "LIOC",
        "address": "88 Pannipitiya Rd, Battaramulla",
        "location": { "lat": 6.9034, "lng": 79.9183 },
        "rating": 4.2,
        "reviews": 154,
        "isOpen": true,
        "queue": "MEDIUM",
        "queueCount": 18,
        "waitMinutes": 22,
        "lastUpdated": "12 min ago",
        "availability": {
          "petrol92": true,
          "petrol95": false,
          "diesel": true,
          "superdiesel": true,
          "kerosene": false
        },
        "image": "https://images.unsplash.com/photo-1605164598578-4e9b91f5d264?w=900&q=80"
      },
      "st3": {
        "id": "st3",
        "name": "Sino Lanka Filling Station",
        "brand": "Sino Lanka",
        "address": "23 Kotte Rd, Pita Kotte",
        "location": { "lat": 6.8898, "lng": 79.9027 },
        "rating": 3.9,
        "reviews": 88,
        "isOpen": true,
        "queue": "HIGH",
        "queueCount": 41,
        "waitMinutes": 45,
        "lastUpdated": "3 min ago",
        "availability": {
          "petrol92": false,
          "petrol95": true,
          "diesel": true,
          "superdiesel": false,
          "kerosene": true
        },
        "image": "https://images.unsplash.com/photo-1518600506278-4e8ef466b810?w=900&q=80"
      },
      "st4": {
        "id": "st4",
        "name": "Ceylon Petroleum - Nugegoda",
        "brand": "CPC",
        "address": "5 High Level Rd, Nugegoda",
        "location": { "lat": 6.8649, "lng": 79.8997 },
        "rating": 4.6,
        "reviews": 301,
        "isOpen": false,
        "queue": "LOW",
        "queueCount": 0,
        "waitMinutes": 0,
        "lastUpdated": "1 hr ago",
        "availability": {
          "petrol92": false,
          "petrol95": false,
          "diesel": false,
          "superdiesel": false,
          "kerosene": false
        },
        "image": "https://images.unsplash.com/photo-1597328289392-86b3194b3e92?w=900&q=80"
      },
      "st5": {
        "id": "st5",
        "name": "Lanka IOC - Kotte",
        "brand": "LIOC",
        "address": "67 Kotte Rd, Kotte",
        "location": { "lat": 6.8924, "lng": 79.9087 },
        "rating": 4.1,
        "reviews": 132,
        "isOpen": true,
        "queue": "MEDIUM",
        "queueCount": 15,
        "waitMinutes": 18,
        "lastUpdated": "9 min ago",
        "availability": {
          "petrol92": true,
          "petrol95": true,
          "diesel": false,
          "superdiesel": false,
          "kerosene": true
        },
        "image": "https://images.unsplash.com/photo-1542362567-b07e54358753?w=900&q=80"
      }
    },
    "mock_auth_users": {
      "mock_uid_owner": {
        "uid": "mock_uid_owner",
        "email": "wsudasun@gmail.com",
        "displayName": "Sudasun Warnakulasooriya"
      },
      "mock_uid_driver": {
        "uid": "mock_uid_driver",
        "email": "chamindusandeepa88@gmail.com",
        "displayName": "Sandeepa Gunathunga"
      }
    },
    "users": {
      "mock_uid_owner": {
        "email": "wsudasun@gmail.com",
        "displayName": "Sudasun Warnakulasooriya",
        "role": "station",
        "city": "Colombo",
        "registrationNumber": "ST-9988",
        "location": "Rajagiriya",
        "createdAt": "2026-07-10T00:00:00.000Z"
      },
      "mock_uid_driver": {
        "email": "chamindusandeepa88@gmail.com",
        "displayName": "Sandeepa Gunathunga",
        "role": "driver",
        "createdAt": "2026-07-10T00:00:00.000Z"
      }
    }
  };

  let localDb = {};
  if (fs.existsSync(dbFilePath)) {
    try {
      localDb = JSON.parse(fs.readFileSync(dbFilePath, "utf8"));
    } catch (e) {
      localDb = { ...initialDb };
      fs.writeFileSync(dbFilePath, JSON.stringify(localDb, null, 2), "utf8");
    }
  } else {
    localDb = { ...initialDb };
    fs.writeFileSync(dbFilePath, JSON.stringify(localDb, null, 2), "utf8");
  }

  function saveDb() {
    fs.writeFileSync(dbFilePath, JSON.stringify(localDb, null, 2), "utf8");
  }

  function getByPath(obj, pathParts) {
    let current = obj;
    for (const part of pathParts) {
      if (current === null || current === undefined) return undefined;
      current = current[part];
    }
    return current;
  }

  function setByPath(obj, pathParts, value) {
    let current = obj;
    for (let i = 0; i < pathParts.length - 1; i++) {
      const part = pathParts[i];
      if (!(part in current) || typeof current[part] !== "object" || current[part] === null) {
        current[part] = {};
      }
      current = current[part];
    }
    if (pathParts.length > 0) {
      current[pathParts[pathParts.length - 1]] = value;
    }
  }

  function updateByPath(obj, pathParts, value) {
    let current = obj;
    for (let i = 0; i < pathParts.length - 1; i++) {
      const part = pathParts[i];
      if (!(part in current) || typeof current[part] !== "object" || current[part] === null) {
        current[part] = {};
      }
      current = current[part];
    }
    if (pathParts.length > 0) {
      const lastPart = pathParts[pathParts.length - 1];
      if (typeof current[lastPart] !== "object" || current[lastPart] === null || typeof value !== "object" || value === null) {
        current[lastPart] = value;
      } else {
        current[lastPart] = { ...current[lastPart], ...value };
      }
    }
  }

  function removeByPath(obj, pathParts) {
    let current = obj;
    for (let i = 0; i < pathParts.length - 1; i++) {
      const part = pathParts[i];
      if (current === null || current === undefined) return;
      current = current[part];
    }
    if (current && pathParts.length > 0) {
      delete current[pathParts[pathParts.length - 1]];
    }
  }

  function getFromDatabase(pathStr) {
    const parts = pathStr.split("/").filter(p => p.length > 0);
    return getByPath(localDb, parts);
  }

  function setInDatabase(pathStr, val) {
    const parts = pathStr.split("/").filter(p => p.length > 0);
    setByPath(localDb, parts, val);
    saveDb();
  }

  function updateInDatabase(pathStr, val) {
    const parts = pathStr.split("/").filter(p => p.length > 0);
    updateByPath(localDb, parts, val);
    saveDb();
  }

  function removeFromDatabaseHelper(pathStr) {
    const parts = pathStr.split("/").filter(p => p.length > 0);
    removeByPath(localDb, parts);
    saveDb();
  }

  class MockSnapshot {
    constructor(key, value) {
      this.key = key;
      this._value = value;
    }
    exists() {
      return this._value !== undefined && this._value !== null;
    }
    val() {
      return this._value;
    }
    forEach(callback) {
      if (this._value && typeof this._value === "object") {
        Object.entries(this._value).forEach(([key, val]) => {
          callback(new MockSnapshot(key, val));
        });
      }
    }
  }

  class MockRef {
    constructor(pathStr, filters = []) {
      this.path = pathStr;
      this.filters = filters;
    }

    orderByChild(field) {
      return new MockRef(this.path, [...this.filters, { type: "orderByChild", field }]);
    }

    equalTo(value) {
      const newFilters = [...this.filters];
      if (newFilters.length > 0) {
        newFilters[newFilters.length - 1].value = value;
      }
      return new MockRef(this.path, newFilters);
    }

    async set(val) {
      setInDatabase(this.path, val);
    }

    async update(val) {
      updateInDatabase(this.path, val);
    }

    async remove() {
      removeFromDatabaseHelper(this.path);
    }

    push() {
      const newKey = "mock_key_" + Math.random().toString(36).substr(2, 9);
      const newPath = this.path ? `${this.path}/${newKey}` : newKey;
      const ref = new MockRef(newPath);
      ref.key = newKey;
      return ref;
    }

    async once(eventType) {
      if (eventType !== "value") throw new Error("Only value event type is mocked");
      let val = getFromDatabase(this.path);

      if (this.filters.length > 0 && val && typeof val === "object") {
        const filtered = {};
        Object.entries(val).forEach(([key, item]) => {
          let match = true;
          for (const filter of this.filters) {
            if (filter.type === "orderByChild" && filter.value !== undefined) {
              if (!item || item[filter.field] !== filter.value) {
                match = false;
                break;
              }
            }
          }
          if (match) {
            filtered[key] = item;
          }
        });
        val = filtered;
      }

      const key = this.path.split("/").pop() || null;
      return new MockSnapshot(key, val);
    }
  }

  const mockDatabase = () => ({
    ref: (pathStr) => new MockRef(pathStr || "")
  });

  const mockAuth = () => ({
    async createUser(params) {
      const users = localDb.mock_auth_users || {};
      const existing = Object.values(users).find(u => u.email === params.email);
      if (existing) {
        const error = new Error("The email address is already in use by another account.");
        error.code = "auth/email-already-exists";
        throw error;
      }
      const uid = "mock_uid_" + Math.random().toString(36).substr(2, 9);
      const userRecord = {
        uid,
        email: params.email,
        displayName: params.displayName || "",
      };
      if (!localDb.mock_auth_users) localDb.mock_auth_users = {};
      localDb.mock_auth_users[uid] = userRecord;
      saveDb();
      return userRecord;
    },
    async getUserByEmail(email) {
      const users = localDb.mock_auth_users || {};
      const existing = Object.values(users).find(u => u.email === email);
      if (!existing) {
        const error = new Error("No user record found for the provided email.");
        error.code = "auth/user-not-found";
        throw error;
      }
      return existing;
    },
    async updateUser(uid, params) {
      if (!localDb.mock_auth_users || !localDb.mock_auth_users[uid]) {
        const error = new Error("No user record found for the provided uid.");
        error.code = "auth/user-not-found";
        throw error;
      }
      const user = localDb.mock_auth_users[uid];
      if (params.email) user.email = params.email;
      if (params.displayName) user.displayName = params.displayName;
      saveDb();
      return user;
    }
  });

  const mockMessaging = () => ({
    async send(message) {
      console.log("Mock notification sent to token:", message.token, "Title:", message.notification.title, "Body:", message.notification.body);
      return "mock_message_id_" + Math.random().toString(36).substr(2, 9);
    }
  });

  db = mockDatabase();
  auth = mockAuth();
  messaging = mockMessaging();
}

module.exports = {
  db,
  auth,
  messaging,
};