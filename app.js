 const API = "https://script.google.com/macros/s/AKfycbxN4pb34MfDWdsNKpNGYACfDpX0g0nSWCx-LAm3maBxkA46w0YUy95D9EmTPzEf4ehn1A/exec"; // from Deploy
    let ingredients=[];

    // Fetch ingredients + currencies + geolocation on load
    window.onload = async () => {
      [ingredients, currencies] = await Promise.all([
        fetch(`${API}?list=ingredients`).then(r=>r.json()),
        fetch(`https://api.exchangerate.host/symbols`).then(r=>r.json()).then(j=>Object.keys(j.symbols))
      ]);
      populateCurrency(currencies);
      addRow();
      // Attempt geolocation
      fetch("http://ip-api.com/json/?fields=countryCode") // :contentReference[oaicite:11]{index=11}
        .then(r=>r.json()).then(j=>document.getElementById("country").value=j.countryCode)
        .catch(()=>{}); 
    };

    function populateCurrency(list){
      const cur = document.getElementById("currency");
      list.forEach(c=>{
        const o=document.createElement("option");
        o.value=c; o.innerText=c;
        cur.appendChild(o);
      });
    }

    function addRow(){
      const container = document.getElementById("ingredient-list");
      const row = document.createElement("div"); row.className="row";
      const select = document.createElement("select");
      ingredients.forEach(i=>{
        const o=document.createElement("option");
        o.value=i.name; o.text=i.name+` (${i.unit})`;
        select.appendChild(o);
      });
      const qty = document.createElement("input"); qty.type="number"; qty.placeholder="Qty";
      const unit = document.createElement("select");
      // populate unit based on first ingredient
      new TomSelect(select,{}); select.onchange = ()=>populateUnits(select,unit);
      populateUnits(select,unit);
      row.append(select,qty,unit);
      container.append(row);
    }

    function populateUnits(sel,unitSel){
      const ing = ingredients.find(i=>i.name===sel.value);
      unitSel.innerHTML="";
      const units = ing.unit.match(/kg|g|mg/)?["kg","g","mg"]:["l","ml","cup","tbsp","tsp"];
      units.forEach(u=>unitSel.add(new Option(u,u)));
    }

    // Gather rows and call calculate endpoint
    async function calculate(){
      const items = [...document.querySelectorAll("#ingredient-list .row")].map(r=>({
        name: r.querySelector("select").value,
        qty:  Number(r.querySelector("input").value),
        unit: r.querySelectorAll("select")[1].value
      }));
      const payload = {
        items,
        margin: Number(document.getElementById("margin").value),
        wastage: Number(document.getElementById("wastage").value),
        countryCode: document.getElementById("country").value,
        currency: document.getElementById("currency").value
      };
      const res = await fetch(`${API}?calculate=1&calculateData=${encodeURIComponent(JSON.stringify(payload))}`);
      const j   = await res.json();
      document.getElementById("results").innerText = JSON.stringify(j, null, 2);
    }

    // Save recipe
    async function submitRecipe(){
      const name = prompt("Recipe name?");
      if(!name) return;
      const items = [...document.querySelectorAll("#ingredient-list .row")].map(r=>({
        name: r.querySelector("select").value,
        qty:  Number(r.querySelector("input").value),
        unit: r.querySelectorAll("select")[1].value
      }));
      const recipe={ userEmail:"user@example.com", name, items,
                     yield:Number(document.getElementById("yield").value),
                     wastage:Number(document.getElementById("wastage").value)
                   };
      await fetch(`${API}?list=saveRecipe&saveRecipe=${encodeURIComponent(JSON.stringify(recipe))}`);
      alert("Recipe saved!");
    }

    // Photo upload
    function uploadPhoto(){
      const file = document.getElementById("photo").files[0];
      const fr   = new FileReader();
      fr.onload = async e=>{
        const blobArr = [...new Int8Array(e.target.result)];
        const qs = new URLSearchParams({
          list:"uploadPhoto",
          filename:file.name,
          mimeType:file.type
        });
        const res = await fetch(`${API}?${qs}`, {
          method:"POST",
          body: JSON.stringify(blobArr)
        });
        const j = await res.json();
        document.getElementById("photoUrl").innerHTML =
          `<a href="${j.url}" target="_blank">View Photo</a>`;
      };
      fr.readAsArrayBuffer(file);
    }
