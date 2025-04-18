
const API_URL = "https://script.google.com/macros/s/AKfycbw-JT6d9sVkxXSB9-oBDTGauDjg_UV5f9AG3ZofAH9sq5UWh4ohXOZd9y0LbcOn0Y3CHw/exec";

let ingredientsData = [];

// ── Convert various units to metric (grams or millilitres) ─────────
function convertToMetric(qty, unit) {
  const u = unit.trim().toLowerCase();
  const conversions = {
    // Imperial → Metric
    "oz":    { qty: qty *   28.35, unit: "g"  },
    "lb":    { qty: qty *  453.59, unit: "g"  },
    "fl oz": { qty: qty *   29.57, unit: "ml" },
    "cup":   { qty: qty *  240.00, unit: "ml" },
    "tbsp":  { qty: qty *   15.00, unit: "ml" },
    "tsp":   { qty: qty *    5.00, unit: "ml" },
    // Metric → Metric
    "kg":    { qty: qty * 1000.00, unit: "g"  },
    "g":     { qty: qty,           unit: "g"  },
    "mg":    { qty: qty / 1000.00, unit: "g"  },
    "l":     { qty: qty * 1000.00, unit: "ml" },
    "ml":    { qty: qty,           unit: "ml" }
  };
  return conversions[u] || { qty, unit };
}

// ── Fetch ingredients when page loads ───────────────────────────────
document.addEventListener("DOMContentLoaded", () => {
  fetch(`${API_URL}?list=ingredients`)
    .then(res => {
      if (!res.ok) throw new Error(`Fetch failed: ${res.status}`);
      return res.json();
    })
    .then(data => {
      ingredientsData = data;
      addIngredient();  // Add initial row
    })
    .catch(err => console.error("Error loading ingredients:", err));
});

// ── Add a new ingredient row with Tom Select dropdown ──────────────
function addIngredient() {
  const container = document.getElementById("ingredient-list");
  const row = document.createElement("div");
  row.classList.add("ingredient-row");

  // Create and populate <select>
  const select = document.createElement("select");
  select.className = "ingredient-select";
  ingredientsData.forEach(({ name, unit }) => {
    const opt = document.createElement("option");
    opt.value = name;
    opt.textContent = `${name} (${unit})`;
    select.appendChild(opt);
  });

  // Quantity input
  const qtyInput = document.createElement("input");
  qtyInput.type = "number";
  qtyInput.placeholder = "Qty";
  qtyInput.className = "qty-input";

  row.append(select, qtyInput);
  container.appendChild(row);

  // Initialize Tom Select on the select
  new TomSelect(select, {
    create: false,
    sortField: { field: "text", direction: "asc" },
    placeholder: "Select an ingredient..."
  });
}

// ── Calculate total, line-item, adjusted & per-portion costs ───────
function calculateTotal() {
  const yieldVal = Number(document.getElementById("yield").value) || 1;
  const wastage  = (Number(document.getElementById("wastage").value) || 0) / 100;
  let totalCost = 0;
  let output    = "";

  document.querySelectorAll("#ingredient-list > .ingredient-row").forEach(row => {
    const name    = row.querySelector("select").value;
    const rawQty  = Number(row.querySelector("input").value) || 0;
    const ing     = ingredientsData.find(i => i.name === name);
    if (!ing) return;

    // Convert to metric units
    const { qty: mQty, unit: mUnit } = convertToMetric(rawQty, ing.unit);
    const lineCost = mQty * ing.costPerUnit;
    totalCost += lineCost;

    output += `${name}: ${mQty.toFixed(2)} ${mUnit} × $${ing.costPerUnit.toFixed(2)} = $${lineCost.toFixed(2)}\n`;
  });

  const adjusted   = totalCost 
    ? totalCost / (1 - wastage) 
    : 0;
  const perPortion = adjusted / yieldVal;

  output += `\nTotal Cost: $${totalCost.toFixed(2)}\n`;
  output += `Adjusted (w/ wastage): $${adjusted.toFixed(2)}\n`;
  output += `Cost per Portion: $${perPortion.toFixed(2)}`;

  document.getElementById("total-output").textContent = output;
}
