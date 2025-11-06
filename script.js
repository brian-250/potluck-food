import { initializeApp } from "https://www.gstatic.com/firebasejs/9.22.0/firebase-app.js";
import { getDatabase, ref, set, onValue } from "https://www.gstatic.com/firebasejs/9.22.0/firebase-database.js";

// 🔥 Replace this with your own Firebase project config
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_PROJECT.firebaseapp.com",
  databaseURL: "https://YOUR_PROJECT.firebaseio.com",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_PROJECT.appspot.com",
  messagingSenderId: "YOUR_SENDER_ID",
  appId: "YOUR_APP_ID"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

// Load all cells and listen for updates
window.addEventListener("DOMContentLoaded", () => {
  const cells = document.querySelectorAll("td[contenteditable]");

  cells.forEach(cell => {
    const id = cell.id;

    // Load value from database
    onValue(ref(db, "sheet/" + id), (snapshot) => {
      const val = snapshot.val();
      if (val !== null && val !== cell.textContent) {
        cell.textContent = val;
      }
    });

    // Auto-save on edit
    cell.addEventListener("input", () => {
      const value = cell.textContent.trim();
      set(ref(db, "sheet/" + id), value);
    });
  });
});
