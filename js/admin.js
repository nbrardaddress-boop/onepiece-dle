import {loadJSON, norm, escapeHTML} from "./utils.js";

const out = document.getElementById("out");
const checkBtn = document.getElementById("checkBtn");
const exportBtn = document.getElementById("exportBtn");
const filter = document.getElementById("filter");
const tableWrap = document.getElementById("tableWrap");

let lastErrors = [];

function validateCharacters(chars){
  const errors = [];
  if(!Array.isArray(chars)) errors.push({type:"fatal", msg:"characters.json doit être un tableau"});
  const seen = new Map();
  chars.forEach((c,i)=>{
    if(!c || typeof c !== "object") return errors.push({type:"item", i, msg:"item non-objet"});
    if(!c.name) errors.push({type:"field", i, msg:"name manquant"});
    const key = norm(c.name);
    if(seen.has(key)) errors.push({type:"dup", i, msg:`doublon name avec index ${seen.get(key)}`});
    else seen.set(key, i);

    if(c.fruit && !c.fruit.type) errors.push({type:"field", i, msg:"fruit.type manquant"});
    if(c.crew && !c.crew.name) errors.push({type:"field", i, msg:"crew.name manquant"});
  });
  return errors;
}

function renderTable(chars, q){
  const qq = norm(q);
  const filtered = !qq ? chars : chars.filter(c=>{
    const parts = [
      c.name,
      c.crew?.name,
      c.fruit?.name,
      c.fruit?.type,
      c.meta?.origin,
      c.meta?.firstSaga,
      c.meta?.firstArc,
      c.meta?.role,
    ].filter(Boolean).join(" ");
    return norm(parts).includes(qq);
  });

  const rows = filtered.slice(0, 200).map(c=>{
    return `<tr>
      <td class="cell left">${escapeHTML(c.name)}</td>
      <td class="cell left">${escapeHTML(c.crew?.name || c.meta?.affiliation || "—")}</td>
      <td class="cell left">${escapeHTML(c.fruit?.name || "—")}</td>
      <td class="cell">${escapeHTML(c.bounty || "—")}</td>
      <td class="cell">${escapeHTML(c.size || "—")}</td>
      <td class="cell left">${escapeHTML(c.meta?.firstArc || "—")}</td>
    </tr>`;
  }).join("");

  tableWrap.innerHTML = `
    <table class="table">
      <thead>
        <tr>
          <th>Nom</th><th>Affiliation</th><th>Fruit</th><th>Prime</th><th>Taille</th><th>1er arc</th>
        </tr>
      </thead>
      <tbody>${rows}</tbody>
    </table>
    <div class="help">Affiché: ${Math.min(filtered.length,200)} / ${filtered.length}</div>
  `;
}

async function run(){
  out.textContent = "Chargement…";
  lastErrors = [];
  try{
    const chars = await loadJSON("./data/characters.json");
    const errors = validateCharacters(chars);
    lastErrors = errors;

    out.textContent = errors.length
      ? `❌ ${errors.length} erreur(s)\n` + errors.slice(0,50).map(e=>`- [${e.type}] #${e.i ?? "?"}: ${e.msg}`).join("\n")
      : "✅ OK: characters.json";
    renderTable(chars, filter.value);

  }catch(e){
    lastErrors = [{type:"fatal", msg:e.message}];
    out.textContent = `❌ ${e.message}`;
  }
}

checkBtn.addEventListener("click", run);
filter.addEventListener("input", async ()=>{
  try{
    const chars = await loadJSON("./data/characters.json");
    renderTable(chars, filter.value);
  }catch{}
});

exportBtn.addEventListener("click", ()=>{
  const blob = new Blob([JSON.stringify(lastErrors, null, 2)], {type:"application/json"});
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = "data_errors.json";
  a.click();
  URL.revokeObjectURL(a.href);
});
