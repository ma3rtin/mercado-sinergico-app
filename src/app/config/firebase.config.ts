import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getAnalytics, type Analytics } from 'firebase/analytics';

export const firebaseConfig = {
  apiKey: 'AIzaSyCsG4fb6fg9S9Kau8gy8qrKbGe_hL8GHdI',
  authDomain: 'mercadosinergico.firebaseapp.com',
  projectId: 'mercadosinergico',
  storageBucket: 'mercadosinergico.firebasestorage.app',
  messagingSenderId: '383513574653',
  appId: '1:383513574653:web:1652cbd123266ad9fc5294',
  measurementId: 'G-4MCVC0H2VK',
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);

export const analytics: Analytics | null =
  typeof window !== 'undefined' ? getAnalytics(app) : null;

export default app;