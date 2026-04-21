import AsyncStorage from '@react-native-async-storage/async-storage';
import { getApp, getApps, initializeApp } from 'firebase/app';
import { getReactNativePersistence, GoogleAuthProvider, initializeAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyAKelcldUbNu3cLqNhcgnVmZMIb0b_VZuc",
  authDomain: "glowcoach-fd959.firebaseapp.com",
  projectId: "glowcoach-fd959",
  storageBucket: "glowcoach-fd959.firebasestorage.app",
  messagingSenderId: "749485071221",
  appId: "1:749485071221:web:f78bde7dd9323c31f7113c",
  measurementId: "G-WNBGQ37BLB"
};

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

const db = getFirestore(app); 

let auth;
try {
  auth = initializeAuth(app, {
    persistence: getReactNativePersistence(AsyncStorage),
  });
} catch (e) {
  const { getAuth } = require('firebase/auth');
  auth = getAuth(app);
  console.warn("Mobile persistence failed to load, falling back to standard Auth.");
}

const googleProvider = new GoogleAuthProvider();

export { app, auth, db, googleProvider };

