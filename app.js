const API = "https://script.google.com/macros/s/AKfycbw-JT6d9sVkxXSB9-oBDTGauDjg_UV5f9AG3ZofAH9sq5UWh4ohXOZd9y0LbcOn0Y3CHw/exec";
let ingredientsData = [];

document.addEventListener("DOMContentLoaded", () => {
  // Wire up buttons
  document.getElementById("calc-btn")
          .addEventListener("click", calc);
  document.getElementById("add-ingredient-btn")
          .addEventListener("click", addIngredient);
  document.getElementById("calc-total-btn")
          .addEventListener("click", calculateTotal);

  // Preload ingredients list
  fetch(API)
    .then(res => {
      if (!res.ok) throw new Error(`Fetch failed: ${res.status}`);
      return res.json();
    })
    .then(data => {
      ingredientsData = data;
      addIngredient(); // start with one row
    })
    .catch(err => console.error("Error loading ingredients:", err));
});

function calc() {
  const name     = document.getElementById("name").value.trim();
  const qty      = parseFloat(document.getElementById("qty").value);
  const margin   = parseFloat(document.getElementById("margin").value);
  const currency = document.getElementById("currency").value.trim();

  // Build safe query string
  const params = new URLSearchParams({ name, qty, margin, currency });

  fetch(`${API}?${params}`)
    .then(r => {
      if (!r.ok) throw new Error(`Server error: ${r.status}`);
      return r.json();
    })
    .then(data => {
      document.getElementById("result").innerHTML =
        `Cost: ${currency} ${data.cost.toFixed(2)}<br/>` +
        `Gross: ${currency} ${data.gross.toFixed(2)}<br/>` +
        `Net:   ${currency} ${data.net.toFixed(2)}`;
    })
    .catch(err => {
      console.error("Calculation error:", err);
      document.getElementById("result").innerText = "Error calculating cost.";
    });
}

function addIngredient() {
  const div = document.createElement("div");
  div.style.marginBottom = "0.5em";

  const select = document.createElement("select");
  ingredientsData.forEach(i => {
    const opt = document.createElement("option");
    opt.value     = i.name;
    opt.innerText = i.name;
    select.appendChild(opt);
  });

  const qtyInput = document.createElement("input");
  qtyInput.type        = "number";
  qtyInput.placeholder = "Qty";
  qtyInput.style.width = "4em";
  qtyInput.style.marginLeft = "0.5em";

  div.appendChild(select);
  div.appendChild(qtyInput);
  document.getElementById("ingredient-list").appendChild(div);
}

function calculateTotal() {
  const yieldVal = Number(document.getElementById("yield").value);
  const wastage  = Number(document.getElementById("wastage").value);
  let totalCost  = 0;

  const rows = document.querySelectorAll("#ingredient-list > div");
  rows.forEach(row => {
    const name = row.querySelector("select").value;
    const qty  = Number(row.querySelector("input").value) || 0;
    const ingredient = ingredientsData.find(i => i.name === name);
    if (ingredient) {
      totalCost += qty * ingredient.costPerUnit;
    }
  });

  const adjusted    = totalCost / (1 - (wastage / 100) || 1);
  const portionCost = adjusted / (yieldVal || 1);

  document.getElementById("total-output").innerText =
    `Total Cost:           $${totalCost.toFixed(2)}\n` +
    `Adjusted (w/ wastage): $${adjusted.toFixed(2)}\n` +
    `Cost per Portion:     $${portionCost.toFixed(2)}`;
}
