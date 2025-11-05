// Import Firebase SDK modules
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.5.0/firebase-app.js";
import { getDatabase, ref, set, onValue } from "https://www.gstatic.com/firebasejs/12.5.0/firebase-database.js";

// Your Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyAeW2l6pPe2sEm9Xc-G_oeiebYMcineq8Q",
  authDomain: "convivio-notes.firebaseapp.com",
  projectId: "convivio-notes",
  storageBucket: "convivio-notes.firebasestorage.app",
  messagingSenderId: "428688982425",
  appId: "1:428688982425:web:240718e4b7a109657c9308",
  databaseURL: "https://convivio-notes-default-rtdb.firebaseio.com/"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

// Reference to the shared text
const textArea = document.getElementById("sharedText");
const textRef = ref(db, "sharedText");

// Save text when user types
textArea.addEventListener("input", () => {
  set(textRef, textArea.value);
});

// Load and sync text in real-time
onValue(textRef, (snapshot) => {
  const text = snapshot.val();
  if (text !== null && text !== textArea.value) {
    textArea.value = text;
  }
});
