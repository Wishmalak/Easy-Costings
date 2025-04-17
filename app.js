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
