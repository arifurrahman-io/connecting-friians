import AsyncStorage from "@react-native-async-storage/async-storage";
import { Platform } from "react-native";

import { getApp, getApps, initializeApp } from "firebase/app";

import {
  getAuth,
  getReactNativePersistence,
  initializeAuth,
} from "firebase/auth";

import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyDvNVHv7pH6LSSyIEvX7heO3TYTYwzjpyA",
  authDomain: "connecting-friians.firebaseapp.com",
  projectId: "connecting-friians",
  storageBucket: "connecting-friians.firebasestorage.app",
  messagingSenderId: "837225831576",
  appId: "1:837225831576:web:2d7019a0d0f90340f844ed",
};

const app = getApps().length ? getApp() : initializeApp(firebaseConfig);

let auth;

if (Platform.OS === "web") {
  auth = getAuth(app);
} else {
  try {
    auth = initializeAuth(app, {
      persistence: getReactNativePersistence(AsyncStorage),
    });
  } catch (error) {
    auth = getAuth(app);
  }
}

const db = getFirestore(app);

export { app, auth, db };
