// ============================================
// Firebase Configuration — НЕ РЕДАКТИРОВАТЬ
// ============================================
const firebaseConfig = {
  apiKey: "AIzaSyCLHJZKgKS_6tk-B9dGuc-Z2NAseleUviU",
  authDomain: "sea-photo-center.firebaseapp.com",
  projectId: "sea-photo-center",
  storageBucket: "sea-photo-center.firebasestorage.app",
  messagingSenderId: "609803140063",
  appId: "1:609803140063:web:d5bf1af63d2bd3d945e26a"
};

// Init Firebase
firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();
