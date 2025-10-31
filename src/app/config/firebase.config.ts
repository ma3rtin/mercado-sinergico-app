import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getAnalytics } from 'firebase/analytics';

// Configuración de Firebase
const firebaseConfig = {
  apiKey: 'AIzaSyBtcTAMsMEd-X-E_63-ENUjVAf74yYei24',
  authDomain: 'sinergia-comercial-341ec.firebaseapp.com',
  projectId: 'sinergia-comercial-341ec',
  storageBucket: 'sinergia-comercial-341ec.firebasestorage.app',
  messagingSenderId: '738286713031',
  appId: '1:738286713031:web:6c47163419c51912c226e2',
  measurementId: 'G-8FZVYGMTJG'
};

// Inicializar Firebase
const app = initializeApp(firebaseConfig);

// Inicializar servicios de Firebase
export const auth = getAuth(app);

// Solo inicializar Analytics en el cliente (no en SSR)
export const analytics = typeof window !== 'undefined' ? getAnalytics(app) : null;

export default app;
