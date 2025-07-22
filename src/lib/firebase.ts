
import { initializeApp, getApp, getApps } from 'firebase/app';
import { getDatabase } from 'firebase/database';

// Your web app's Firebase configuration
const firebaseConfig = {
  projectId: "keuanganku-gb3jq",
  appId: "1:412793971786:web:ea534f2dab27e05dbb72b3",
  storageBucket: "keuanganku-gb3jq.firebasestorage.app",
  apiKey: "AIzaSyDDlBhrPEGz_COSBA-Ly1TkeIPsc-iWwOY",
  authDomain: "keuanganku-gb3jq.firebaseapp.com",
  messagingSenderId: "412793971786",
  databaseURL: "https://keuanganku-gb3jq.firebaseio.com"
};

// Initialize Firebase
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const database = getDatabase(app);

export { app, database };
