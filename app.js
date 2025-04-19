// ─── Firebase Initialization & Auth ───────────────────────────────────────
import { initializeApp } from 'https://www.gstatic.com/firebasejs/9.22.1/firebase-app.js';
import {
  getAuth,
  onAuthStateChanged,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  GoogleAuthProvider,
  signInWithPopup
} from 'https://www.gstatic.com/firebasejs/9.22.1/firebase-auth.js';  // :contentReference[oaicite:13]{index=13}

const firebaseConfig = {
  apiKey: "AIzaSyC2doueYN-9dX1WS_GjuujleSW1lrXUSqc",
  authDomain: "easy-costing.firebaseapp.com",
  projectId: "easy-costing"
};
initializeApp(firebaseConfig);
const auth = getAuth();

// Auth UI Elements
const emailEl   = document.getElementById('email'),
      passEl    = document.getElementById('password'),
      loginBtn  = document.getElementById('loginBtn'),
      signupBtn = document.getElementById('signupBtn'),
      googleBtn = document.getElementById('googleBtn'),
      authUI    = document.getElementById('authUI');

// Email/Password Sign‑Up
signupBtn.onclick = () =>
  createUserWithEmailAndPassword(auth, emailEl.value, passEl.value)
    .then(u=>alert('Signed up: '+u.user.email))
    .catch(e=>alert('Sign‑up error: '+e.message));  :contentReference[oaicite:14]{index=14}

// Email/Password Log‑In
loginBtn.onclick = () =>
  signInWithEmailAndPassword(auth, emailEl.value, passEl.value)
    .then(u=>alert('Logged in: '+u.user.email))
    .catch(e=>alert('Log‑in error: '+e.message));  :contentReference[oaicite:15]{index=15}

// Google Sign‑In
googleBtn.onclick = () => {
  const provider = new GoogleAuthProvider();
  signInWithPopup(auth, provider)
    .then(r=>alert('Google signed in: '+r.user.email))
    .catch(e=>alert('Google sign‑in error: '+e.message));  :contentReference[oaicite:16]{index=16}
};

// Toggle Auth UI
onAuthStateChanged(auth, user => {
  authUI.style.display = user ? 'none' : 'block';
});

// ─── Main App Logic ────────────────────────────────────────────────────────
const API = "https://script.google.com/macros/s/AKfycbx…/exec";
let ingredients = [], currencies = [];

// Load initial data
window.onload = async () => {
  [ingredients, currencies] = await Promise.all([
    fetch(`${API}?list=ingredients`).then(r=>r.json()),
    fetch('https://api.exchangerate.host/symbols')        // :contentReference[oaicite:17]{index=17}
      .then(r=>r.json()).then(j=>Object.keys(j.symbols))
  ]);
  populateCurrency(currencies);
  addRow();
};

// Populate currency selector
function populateCurrency(list) {
  const cur = document.getElementById('currency');
  list.forEach(c=> cur.append(new Option(c,c)));
}

// Add a new ingredient row
function addRow() {
  const container = document.getElementById('ingredient-list');
  const row = document.createElement('div');
  row.className = 'row';
  const sel = document.createElement('select');
  ingredients.forEach(i=> sel.add(new Option(`${i.name} (${i.unit})`, i.name)));
  new TomSelect(sel,{create:false});                    :contentReference[oaicite:18]{index=18}
  const qty  = document.createElement('input'); qty.type='number'; qty.placeholder='Qty';
  const unit = document.createElement('select');
  sel.onchange = ()=> populateUnits(sel, unit);
  populateUnits(sel, unit);
  row.append(sel, qty, unit);
  container.append(row);
}

// Populate unit dropdown based on ingredient
function populateUnits(sel, unitSel) {
  const ing = ingredients.find(i=>i.name===sel.value);
  unitSel.innerHTML = '';
  const opts = ing.unit.match(/kg|g|mg/) 
    ? ['kg','g','mg'] 
    : ['l','ml','cup','tbsp','tsp'];
  opts.forEach(u=> unitSel.add(new Option(u,u)));
}

// Calculate cost & show results
async function calculate() {
  const items = [...document.querySelectorAll('.row')].map(r=>({
    name: r.querySelector('select').value,
    qty:  Number(r.querySelector('input').value),
    unit: r.querySelectorAll('select')[1].value
  }));
  const payload = {
    items,
    margin:      Number(document.getElementById('margin').value),
    wastage:     Number(document.getElementById('wastage').value),
    countryCode: document.getElementById('country').value,
    currency:    document.getElementById('currency').value
  };
  const res = await fetch(
    `${API}?calculate=1&calculate=${encodeURIComponent(JSON.stringify(payload))}`
  );
  const data = await res.json();
  document.getElementById('results').innerText = JSON.stringify(data, null, 2);
}

// Save recipe (only for authenticated users)
async function submitRecipe() {
  const user = auth.currentUser;
  if (!user) return alert('Please log in first!');
  const items = [...document.querySelectorAll('.row')].map(r=>({
    name: r.querySelector('select').value,
    qty:  Number(r.querySelector('input').value),
    unit: r.querySelectorAll('select')[1].value
  }));
  const recipe = {
    userEmail: user.email,
    name:      prompt('Recipe name?'),
    items,
    yield:     Number(document.getElementById('yield').value),
    wastage:   Number(document.getElementById('wastage').value)
  };
  await fetch(`${API}?list=saveRecipe`, {
    method: 'POST',
    body: JSON.stringify(recipe)
  });
  alert('Recipe saved!');
}

// Modal controls
function showModal(){ document.getElementById('modal').classList.remove('hidden'); }
function hideModal(){ document.getElementById('modal').classList.add('hidden'); }
function saveNewIngredient(){
  const item = {
    name:        document.getElementById('newName').value,
    costPerUnit: Number(document.getElementById('newCost').value),
    unit:        document.getElementById('newUnit').value,
    vendor:      document.getElementById('newVendor').value
  };
  fetch(`${API}?list=addIngredient`, {
    method: 'POST',
    body: JSON.stringify(item)
  }).then(()=> {
    ingredients.push(item);
    hideModal();
  });
}

// Photo upload
function uploadPhoto(){
  const file = document.getElementById('photo').files[0];
  const fr   = new FileReader();
  fr.onload = async e => {
    const bytes = Array.from(new Uint8Array(e.target.result));
    const qs = new URLSearchParams({
      list:     'uploadPhoto',
      filename: file.name,
      mime:     file.type
    });
    const res = await fetch(`${API}?${qs}`, {
      method: 'POST',
      body: JSON.stringify({ bytes })
    });
    const { url } = await res.json();
    document.getElementById('photoUrl').innerHTML =
      `<a href="${url}" target="_blank">View Photo</a>`;
  };
  fr.readAsArrayBuffer(file);
}
