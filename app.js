 // Replace with your own Apps Script URL (no trailing query)
  const API = "https://script.google.com/macros/s/AKfycbw-JT6d9sVkxXSB9-oBDTGauDjg_UV5f9AG3ZofAH9sq5UWh4ohXOZd9y0LbcOn0Y3CHw/exec";

  let ingredientsData = [];

  // 1. Fetch ingredients on page load, then add one row
  fetch(`${API_URL}?list=ingredients`)
    .then(res => {
      if (!res.ok) throw new Error(`Fetch failed: ${res.status}`);
      return res.json();
    })
    .then(data => {
      ingredientsData = data;
      addIngredient();
    })
    .catch(err => console.error("Error loading ingredients:", err));

  // 2. Add a new ingredient row
  function addIngredient() {
    const container = document.getElementById("ingredient-list");
    const row = document.createElement("div");
    row.style.marginBottom = "10px";

    // Dropdown
    const select = document.createElement("select");
    ingredientsData.forEach(({ name, unit }) => {
      const opt = document.createElement("option");
      opt.value = name;
      opt.textContent = `${name} (${unit})`;
      select.appendChild(opt);
    });

    // Qty input
    const qtyInput = document.createElement("input");
    qtyInput.type = "number";
    qtyInput.placeholder = "Qty";
    qtyInput.style.marginLeft = "5px";

    row.append(select, qtyInput);
    container.appendChild(row);
  }

  // 3. Calculate totals
  function calculateTotal() {
    const yieldVal = Number(document.getElementById("yield").value) || 1;
    const wastage = Number(document.getElementById("wastage").value) / 100 || 0;
    let totalCost = 0;

    document.querySelectorAll("#ingredient-list > div").forEach(row => {
      const name = row.querySelector("select").value;
      const qty = Number(row.querySelector("input").value) || 0;
      const ingredient = ingredientsData.find(i => i.name === name);
      if (ingredient) totalCost += qty * ingredient.costPerUnit;
    });

    const adjusted = totalCost / (1 - wastage);
    const perPortion = adjusted / yieldVal;

    document.getElementById("total-output").textContent =
      `Total Cost: $${totalCost.toFixed(2)}\n` +
      `Adjusted (with wastage): $${adjusted.toFixed(2)}\n` +
      `Cost per Portion: $${perPortion.toFixed(2)}`;
  }
