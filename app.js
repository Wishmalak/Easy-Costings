// ✅ Replace with your Google Apps Script Web App URL
const API_URL = "https://script.google.com/macros/s/AKfycbw-JT6d9sVkxXSB9-oBDTGauDjg_UV5f9AG3ZofAH9sq5UWh4ohXOZd9y0LbcOn0Y3CHw/exec";

let ingredientsData = [];

// ── Maps for converting any unit → base unit (kg or l) ────────────────
const weightToKg = {
  kg: 1,
  g:  1/1000,
  mg: 1/1e6,
  lb: 0.453592,
  oz: 0.0283495
};
const volumeToL  = {
  l:     1,
  ml:    1/1000,
  cup:   0.24,
  tbsp:  0.015,
  tsp:   0.005,
  "fl oz": 0.0295735
};

// ── Fetch ingredients when page loads ───────────────────────────────
document.addEventListener("DOMContentLoaded", () => {
  fetch(`${API_URL}?list=ingredients`)
    .then(res => {
      if (!res.ok) throw new Error(`Fetch failed: ${res.status}`);
      return res.json();
    })
    .then(data => {
      ingredientsData = data;
      addIngredient();  // Add the first ingredient row
    })
    .catch(err => console.error("Error loading ingredients:", err));
});

// ── Add a new ingredient row (name select + qty input + unit select) ─
function addIngredient() {
  const container = document.getElementById("ingredient-list");
  const row = document.createElement("div");
  row.classList.add("ingredient-row");

  // 1️⃣ Create Name dropdown
  const nameSel = document.createElement("select");
  nameSel.className = "ingredient-select";
  ingredientsData.forEach(({ name, unit }) => {
    const opt = document.createElement("option");
    opt.value = name;
    opt.textContent = `${name} (${unit})`;
    nameSel.appendChild(opt);
  });
  row.appendChild(nameSel);

  // 2️⃣ Qty field
  const qtyInput = document.createElement("input");
  qtyInput.type = "number";
  qtyInput.placeholder = "Qty";
  qtyInput.className = "qty-input";
  row.appendChild(qtyInput);

  // 3️⃣ Unit dropdown
  const unitSel = document.createElement("select");
  unitSel.className = "unit-select";
  // Populate units based on first ingredient or default
  Object.keys(weightToKg).forEach(u => {
    const o = document.createElement("option");
    o.value = u;
    o.textContent = u;
    unitSel.appendChild(o);
  });
  row.appendChild(unitSel);

  // 4️⃣ Now that everything’s in the DOM, initialize Tom Select
  container.appendChild(row);
  new TomSelect(nameSel, {
    create: false,
    sortField: { field: "text", direction: "asc" },
    placeholder: "Select an ingredient..."
  });
}
  // Determine base unit from first ingredient in list
  const baseUnit = ingredientsData[0]?.unit.toLowerCase() || "kg";
  // But we'll update choices once user picks an ingredient
  function populateUnits() {
    const ing = ingredientsData.find(i => i.name === nameSel.value);
    const bu = ing.unit.toLowerCase();
    unitSel.innerHTML = ""; // clear
    const opts = (bu === "kg" || bu === "g" || bu === "mg")
      ? Object.keys(weightToKg)
      : Object.keys(volumeToL);
    opts.forEach(u => {
      const o = document.createElement("option");
      o.value = u;
      o.textContent = u;
      unitSel.appendChild(o);
    });
  }
  nameSel.addEventListener("change", populateUnits);
  populateUnits(); // initial fill

  // Put it all together
  row.append(nameSel, qtyInput, unitSel);
  container.appendChild(row);
}

// ── Convert any qty[fromUnit] → baseUnitQty (kg or l) ──────────────
function convertToBase(qty, fromUnit, baseUnit) {
  const u = fromUnit.trim().toLowerCase();
  if (["kg","g","mg","lb","oz"].includes(u) && ["kg","g","mg","lb","oz"].includes(baseUnit)) {
    // we want qty in baseUnit ➔ convert to kg then, if baseUnit != kg convert further
    const qtyInKg = (weightToKg[u] || 0) * qty;
    return baseUnit === "kg"
      ? qtyInKg
      : baseUnit === "g"
        ? qtyInKg * 1000
        : baseUnit === "mg"
          ? qtyInKg * 1e6
          : 0;
  }
  if (["l","ml","cup","tbsp","tsp","fl oz"].includes(u) && ["l","ml","cup","tbsp","tsp","fl oz"].includes(baseUnit)) {
    const qtyInL = (volumeToL[u] || 0) * qty;
    return baseUnit === "l"
      ? qtyInL
      : baseUnit === "ml"
        ? qtyInL * 1000
        : 0;
  }
  // fallback: no conversion
  return qty;
}

// ── Format a base‑unit qty into neat metric display (g or ml) ───────
function formatMetricDisplay(baseQty, baseUnit) {
  // use our old convert‑to‑metric map for display
  const metric = convertToMetric(baseQty, baseUnit);
  return `${metric.qty.toFixed(2)} ${metric.unit}`;
}

// ── Calculate total, show line‑items & final numbers ────────────────
function calculateTotal() {
  const yieldVal = Number(document.getElementById("yield").value) || 1;
  const wastage  = (Number(document.getElementById("wastage").value) || 0) / 100;
  let totalCost = 0;
  let output    = "";

  document.querySelectorAll("#ingredient-list > .ingredient-row").forEach(row => {
    const name       = row.querySelector(".ingredient-select").value;
    const rawQty     = Number(row.querySelector(".qty-input").value) || 0;
    const pickUnit   = row.querySelector(".unit-select").value;
    const ing        = ingredientsData.find(i => i.name === name);
    if (!ing) return;

    const baseQty    = convertToBase(rawQty, pickUnit, ing.unit.toLowerCase());
    const lineCost   = baseQty * ing.costPerUnit;
    totalCost       += lineCost;

    // display in nice metric units
    const disp       = formatMetricDisplay(baseQty, ing.unit.toLowerCase());
    output += `${name}: ${disp} × $${ing.costPerUnit.toFixed(2)} = $${lineCost.toFixed(2)}\n`;
  });

  const adjusted   = totalCost / (1 - wastage);
  const perPortion = adjusted / yieldVal;

  output += `\nTotal Cost: $${totalCost.toFixed(2)}\n`;
  output += `Adjusted (with wastage): $${adjusted.toFixed(2)}\n`;
  output += `Cost per Portion: $${perPortion.toFixed(2)}`;

  document.getElementById("total-output").textContent = output;
}
