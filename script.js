import { initializeApp } from "https://www.gstatic.com/firebasejs/12.5.0/firebase-app.js";
import { getDatabase, ref, set, onValue } from "https://www.gstatic.com/firebasejs/12.5.0/firebase-database.js";

// --- Firebase Config ---
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

// --- Saved Indicator Setup ---
const footer = document.querySelector("footer");
const status = document.createElement("span");
status.id = "save-status";
status.textContent = "";
status.style.marginLeft = "8px";
footer.appendChild(status);

function showSavedMessage(message = "Guardado ✅") {
  status.textContent = message;
  status.style.color = "#188038";
  status.style.opacity = "1";
  clearTimeout(showSavedMessage.timeout);
  showSavedMessage.timeout = setTimeout(() => {
    status.style.transition = "opacity 0.6s ease";
    status.style.opacity = "0";
  }, 1200);
}

// --- Hybrid Sync Logic ---
const cells = document.querySelectorAll("[contenteditable][id]");

cells.forEach(cell => {
  const id = cell.id;
  const cellRef = ref(db, "cells/" + id);

  // Load from localStorage first
  const localValue = localStorage.getItem(id);
  if (localValue !== null) {
    cell.innerText = localValue;
  }

  // Load from Firebase (real-time)
  onValue(cellRef, snapshot => {
    const firebaseValue = snapshot.val();
    if (firebaseValue !== null && firebaseValue !== cell.innerText) {
      cell.innerText = firebaseValue;
      localStorage.setItem(id, firebaseValue);
    }
  });

  // Save changes locally + to Firebase
  let saveTimeout;
  cell.addEventListener("input", () => {
    const value = cell.innerText;
    localStorage.setItem(id, value);
    showSavedMessage("Guardando...");

    // Debounce Firebase updates
    clearTimeout(saveTimeout);
    saveTimeout = setTimeout(() => {
      set(cellRef, value)
        .then(() => showSavedMessage("Guardado ✅"))
        .catch(() => showSavedMessage("⚠️ Error al guardar"));
    }, 500);
  });
});

console.log("✅ Hybrid sync (local + Firebase) + visual save indicator active");
