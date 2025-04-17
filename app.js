const API = "https://script.google.com/macros/s/AKfycbw-JT6d9sVkxXSB9-oBDTGauDjg_UV5f9AG3ZofAH9sq5UWh4ohXOZd9y0LbcOn0Y3CHw/exec";

function calc() {
  const name     = document.getElementById("name").value;
  const qty      = document.getElementById("qty").value;
  const margin   = document.getElementById("margin").value;
  const currency = document.getElementById("currency").value;

  fetch(`${API}?name=${name}&qty=${qty}&margin=${margin}&currency=${currency}`)
    .then(r => r.json())
    .then(data => {
      document.getElementById("result").innerText =
        `Cost: ${currency} ${data.cost.toFixed(2)}\n` +
        `Gross: ${currency} ${data.gross.toFixed(2)}\n` +
        `Net: ${currency} ${data.net.toFixed(2)}`;
    });
}
let ingredientsData = [];

fetch("https://script.google.com/macros/s/AKfycbw-JT6d9sVkxXSB9-oBDTGauDjg_UV5f9AG3ZofAH9sq5UWh4ohXOZd9y0LbcOn0Y3CHw/exec")
  .then(res => res.json())
  .then(data => {
    ingredientsData = data;
    addIngredient(); // start with one row
  });

function addIngredient() {
  const div = document.createElement("div");
  const select = document.createElement("select");
  ingredientsData.forEach(i => {
    const opt = document.createElement("option");
    opt.value = i.name;
    opt.innerText = i.name;
    select.appendChild(opt);
  });

  const qtyInput = document.createElement("input");
  qtyInput.placeholder = "Qty";
  qtyInput.type = "number";

  div.appendChild(select);
  div.appendChild(qtyInput);
  document.getElementById("ingredient-list").appendChild(div);
}

function calculateTotal() {
  const yieldVal = Number(document.getElementById("yield").value);
  const wastage = Number(document.getElementById("wastage").value);
  let totalCost = 0;

  const rows = document.querySelectorAll("#ingredient-list > div");
  rows.forEach(row => {
    const name = row.querySelector("select").value;
    const qty = Number(row.querySelector("input").value);
    const ingredient = ingredientsData.find(i => i.name === name);
    if (ingredient) totalCost += qty * ingredient.costPerUnit;
  });

  const adjusted = totalCost / (1 - (wastage / 100));
  const portionCost = adjusted / yieldVal;

  document.getElementById("total-output").innerText =
    `Total Cost: $${totalCost.toFixed(2)}\n` +
    `Adjusted (with wastage): $${adjusted.toFixed(2)}\n` +
    `Cost per Portion: $${portionCost.toFixed(2)}`;
}
