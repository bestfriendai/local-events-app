import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyDZ9gUwRbGWYfZFQEOZA-aFPcQQ_3Vp8w8",
  authDomain: "dateai-app.firebaseapp.com",
  projectId: "dateai-app",
  storageBucket: "dateai-app.appspot.com",
  messagingSenderId: "901234567890",
  appId: "1:901234567890:web:abc123def456"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);