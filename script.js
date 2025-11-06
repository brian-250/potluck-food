// Import Firebase SDK
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.5.0/firebase-app.js";
import { getDatabase, ref, set, onValue, update } from "https://www.gstatic.com/firebasejs/12.5.0/firebase-database.js";

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyAelW16pPe2sEm9Xc-G_oeiebyMcineq8Q",
  authDomain: "convivio-notes.firebaseapp.com",
  projectId: "convivio-notes",
  storageBucket: "convivio-notes.appspot.com",
  messagingSenderId: "42868898425",
  appId: "1:42868898425:web:240718e4b7a109657c9308",
  databaseURL: "https://convivio-notes-default-rtdb.firebaseio.com/"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

// Container for text areas
const container = document.getElementById("notesContainer");
const totalBoxes = 180;

// Create text areas dynamically
for (let i = 1; i <= totalBoxes; i++) {
  const textarea = document.createElement("textarea");
  textarea.id = `sharedText${i}`;
  textarea.placeholder = `Escribe aquí... (#${i})`;
  textarea.rows = 5;
  textarea.dataset.loaded = "false";
  container.appendChild(textarea);
}

// One listener for all text
const notesRef = ref(db, "notes");

// Cache of current data
let notesCache = {};

// Sync all notes in real-time
onValue(notesRef, (snapshot) => {
  const data = snapshot.val() || {};
  notesCache = data;

  // Update only visible boxes
  document.querySelectorAll("textarea[data-loaded='true']").forEach((ta) => {
    const index = ta.id.replace("sharedText", "");
    if (data[index] !== undefined && ta.value !== data[index]) {
      ta.value = data[index];
    }
  });
});

// Lazy-load boxes when they appear on screen
const observer = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        const textarea = entry.target;
        const index = textarea.id.replace("sharedText", "");
        textarea.dataset.loaded = "true";

        // Fill with existing Firebase data
        if (notesCache[index] !== undefined) {
          textarea.value = notesCache[index];
        }

        // Attach input listener with throttling
        let timer;
        textarea.addEventListener("input", () => {
          clearTimeout(timer);
          timer = setTimeout(() => {
            update(ref(db, "notes"), {
              [index]: textarea.value
            });
          }, 400); // Save 400ms after typing stops
        });

        // Stop observing this element (only initialize once)
        observer.unobserve(textarea);
      }
    });
  },
  {
    rootMargin: "100px", // preload a bit before it's visible
    threshold: 0.1,
  }
);

// Observe all text areas
document.querySelectorAll("textarea").forEach((ta) => observer.observe(ta));
