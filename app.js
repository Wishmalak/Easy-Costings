const API = "https://script.google.com/macros/s/AKfycbw-JT6d9sVkxXSB9-oBDTGauDjg_UV5f9AG3ZofAH9sq5UWh4ohXOZd9y0LbcOn0Y3CHw/exec";

function calc() {
  const name = document.getElementById("name").value;
  const qty  = document.getElementById("qty").value;

  fetch(`${API}?name=${name}&qty=${qty}`)
    .then(r => r.json())
    .then(data => {
      document.getElementById("result").innerText =
        "Cost: $" + data.cost.toFixed(2);
    })
    .catch(err => {
      document.getElementById("result").innerText =
        "Error: " + err.message;
    });
}
