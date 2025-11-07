// script.js
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.5.0/firebase-app.js";
import { getDatabase, ref, set, onValue, get, child } from "https://www.gstatic.com/firebasejs/12.5.0/firebase-database.js";

/* ======= CONFIG ======= */
const firebaseConfig = {
  apiKey: "AIzaSyAwel2Io6pe2sm9Xc-G_oeiebYMcineq8Q",
  authDomain: "convivio-notes.firebaseapp.com",
  projectId: "convivio-notes",
  storageBucket: "convivio-notes.appspot.com",
  messagingSenderId: "42860898425",
  appId: "1:42860898425:web:24071e84b7a109675c908",
  databaseURL: "https://convivio-notes-default-rtdb.firebaseio.com/"
};

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);
const SHEET_PATH = 'sheets/1'; // change if you want multiple sheets

/* ======= UI GRID SETUP ======= */
const ROWS = 40;   // change how many rows you want (e.g., 190)
const COLS = 10;   // change columns (A..J). Increase as needed.

const table = document.getElementById('sheetTable');

/* helper: convert column number to A,B,...Z,AA style */
function colLabel(n) {
  let s = '';
  while (n > 0) {
    const m = (n - 1) % 26;
    s = String.fromCharCode(65 + m) + s;
    n = Math.floor((n - 1) / 26);
  }
  return s;
}

/* create table header and body */
function buildSheet(rows, cols) {
  table.innerHTML = '';

  // thead
  const thead = document.createElement('thead');
  const headRow = document.createElement('tr');

  // corner cell
  const corner = document.createElement('th');
  corner.className = 'corner';
  corner.textContent = ''; // could put sheet name
  headRow.appendChild(corner);

  for (let c = 1; c <= cols; c++) {
    const th = document.createElement('th');
    th.textContent = colLabel(c);
    headRow.appendChild(th);
  }
  thead.appendChild(headRow);
  table.appendChild(thead);

  // tbody
  const tbody = document.createElement('tbody');

  for (let r = 1; r <= rows; r++) {
    const tr = document.createElement('tr');

    // first column label (row number)
    const rowHeader = document.createElement('th');
    rowHeader.textContent = r;
    tr.appendChild(rowHeader);

    for (let c = 1; c <= cols; c++) {
      const td = document.createElement('td');

      // inner editable div (gives better styling control than making td contenteditable)
      const cellDiv = document.createElement('div');
      cellDiv.contentEditable = 'true';
      cellDiv.className = 'cell';
      cellDiv.dataset.row = r;
      cellDiv.dataset.col = c;
      cellDiv.id = `cell-${r}-${c}`;
      cellDiv.setAttribute('role', 'textbox');
      cellDiv.setAttribute('aria-label', `Cell ${colLabel(c)}${r}`);

      td.appendChild(cellDiv);
      tr.appendChild(td);
    }
    tbody.appendChild(tr);
  }
  table.appendChild(tbody);
}

/* ======= SYNC LOGIC ======= */

/* Simple debounce helper that returns a debounced function and a cancel method */
function makeDebounced(fn, delay = 300) {
  let timer = null;
  const debounced = (...args) => {
    if (timer) clearTimeout(timer);
    timer = setTimeout(() => {
      timer = null;
      fn(...args);
    }, delay);
  };
  debounced.cancel = () => { if (timer) { clearTimeout(timer); timer = null; } };
  return debounced;
}

/* Save a single cell to Firebase path: sheets/1/{r}_{c} -> value */
function saveCellToFirebase(r, c, value) {
  const key = `${r}_${c}`;
  const p = ref(db, `${SHEET_PATH}/${key}`);
  set(p, value).catch(err => console.error('Save failed', err));
}

/* We'll keep a map of debounced functions per cell id so rapid typing won't spam writes */
const debounceMap = new Map();

/* attach listeners to all cells */
function attachCellListeners() {
  const cells = table.querySelectorAll('.cell');
  cells.forEach(cell => {
    const r = cell.dataset.row;
    const c = cell.dataset.col;
    const key = `${r}_${c}`;

    // create or reuse a debounced writer for this cell
    let writer = debounceMap.get(key);
    if (!writer) {
      writer = makeDebounced((val) => {
        saveCellToFirebase(r, c, val);
      }, 400); // 400ms debounce
      debounceMap.set(key, writer);
    }

    // on input, call debounced writer
    cell.addEventListener('input', (e) => {
      // strip trailing newlines and keep single-line behavior (or allow multi-line if you prefer)
      const text = cell.textContent;
      writer(text);
    });

    // optional: save on blur immediately
    cell.addEventListener('blur', () => {
      writer.cancel(); // cancel pending, do immediate write
      saveCellToFirebase(r, c, cell.textContent);
    });

    // optional: keyboard navigation (Enter moves down, Tab moves right)
    cell.addEventListener('keydown', (ev) => {
      if (ev.key === 'Enter') {
        ev.preventDefault();
        const next = document.getElementById(`cell-${parseInt(r,10)+1}-${c}`);
        if (next) next.focus();
      } else if (ev.key === 'Tab') {
        ev.preventDefault();
        const nextCol = parseInt(c,10) + (ev.shiftKey ? -1 : 1);
        const next = document.getElementById(`cell-${r}-${nextCol}`);
        if (next) next.focus();
      }
    });
  });
}

/* populate cells from a snapshot object: { "1_1": "abc", "1_2":"..." } */
function populateFromObject(obj) {
  if (!obj) return;
  Object.entries(obj).forEach(([key, value]) => {
    const [r, c] = key.split('_');
    const el = document.getElementById(`cell-${r}-${c}`);
    if (el && el.textContent !== value) {
      el.textContent = value;
    }
  });
}

/* Listen to whole sheet and update any cell when remote changes occur */
function hookRealtimeUpdates() {
  const sheetRef = ref(db, SHEET_PATH);
  onValue(sheetRef, (snapshot) => {
    const data = snapshot.val();
    if (data) populateFromObject(data);
  });
}

/* initial one-time load (also covered by onValue) */
async function initialLoad() {
  const rootRef = ref(db);
  try {
    const snap = await get(child(rootRef, SHEET_PATH));
    const obj = snap.exists() ? snap.val() : null;
    populateFromObject(obj);
  } catch (err) {
    console.error('Initial load failed', err);
  }
}

/* ======= BOOT ======= */
buildSheet(ROWS, COLS);
attachCellListeners();
hookRealtimeUpdates();
initialLoad();
