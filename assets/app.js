let chars = [];
let secretId = null;
let mode = "daily"; // daily | random
let guesses = [];

const els = {
  guess: document.getElementById("guess"),
  suggest: document.getElementById("suggest"),
  submit: document.getElementById("submit"),
  rows: document.getElementById("rows"),
  msg: document.getElementById("msg"),
  newDaily: document.getElementById("newDaily"),
  newRandom: document.getElementById("newRandom"),
  reset: document.getElementById("reset"),
};

const FIELDS = ["sexe","race","age","taille","fruit","haki","prime","origine","premiere_apparition","equipage","role"];

function norm(s){
  return String(s ?? "").trim().toLowerCase();
}
function esc(s){
  return String(s ?? "").replace(/[&<>"']/g, m => ({
    "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"
  }[m]));
}
function formatNum(n){
  if (typeof n !== "number" || Number.isNaN(n)) return "—";
  return n.toLocaleString("fr-FR");
}
function getSecret(){
  return chars.find(c => c.id === secretId) || null;
}

function saveState(){
  localStorage.setItem("opdle_mode", mode);
  localStorage.setItem("opdle_secretId", String(secretId ?? ""));
  localStorage.setItem("opdle_guesses", JSON.stringify(guesses));
}
function loadState(){
  mode = localStorage.getItem("opdle_mode") || "daily";
  const sid = Number(localStorage.getItem("opdle_secretId"));
  secretId = Number.isFinite(sid) ? sid : null;
  try{
    const g = JSON.parse(localStorage.getItem("opdle_guesses") || "[]");
    guesses = Array.isArray(g) ? g : [];
  }catch{ guesses = []; }
}

function hashToIndex(str, mod){
  // petit hash déterministe
  let h = 2166136261;
  for (let i=0;i<str.length;i++){
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  h >>>= 0;
  return h % mod;
}

function pickDailySecret(){
  const d = new Date();
  const key = d.getFullYear() + "-" + String(d.getMonth()+1).padStart(2,"0") + "-" + String(d.getDate()).padStart(2,"0");
  const idx = hashToIndex(key, chars.length);
  return chars[idx].id;
}
function pickRandomSecret(){
  return chars[Math.floor(Math.random()*chars.length)].id;
}

function setMessage(text, kind="info"){
  els.msg.textContent = text;
  els.msg.style.color = kind === "error" ? "var(--bad)" : (kind === "ok" ? "var(--ok)" : "var(--muted)");
}

function openSuggest(items){
  if (!items.length){ els.suggest.classList.remove("open"); els.suggest.innerHTML=""; return; }
  els.suggest.innerHTML = items.map(c => `
    <div class="sItem" data-id="${c.id}">
      <div>${esc(c.name)}</div>
      <div class="sMeta">${esc([c.equipage, c.role].filter(Boolean).join(" • ") || "—")}</div>
    </div>
  `).join("");
  els.suggest.classList.add("open");

  els.suggest.querySelectorAll(".sItem").forEach(el => {
    el.addEventListener("click", () => {
      const id = Number(el.dataset.id);
      const c = chars.find(x => x.id === id);
      if (c) {
        els.guess.value = c.name;
        els.suggest.classList.remove("open");
      }
      els.guess.focus();
    });
  });
}

function updateSuggest(){
  const q = norm(els.guess.value);
  if (!q){ openSuggest([]); return; }
  const items = chars
    .filter(c => norm(c.name).includes(q))
    .slice(0, 8);
  openSuggest(items);
}

function compareExact(a, b){
  return norm(a) === norm(b);
}

function compareNumber(guess, secret){
  if (typeof guess !== "number" || typeof secret !== "number" || Number.isNaN(guess) || Number.isNaN(secret)){
    return { cls:"bad", txt:"—", arrow:"" };
  }
  if (guess === secret) return { cls:"ok", txt: formatNum(guess), arrow:"" };
  const arrow = guess < secret ? "⬆️" : "⬇️";
  return { cls:"bad", txt: formatNum(guess), arrow };
}

function compareHaki(guessArr, secretArr){
  const g = Array.isArray(guessArr) ? guessArr.map(norm).filter(Boolean) : [];
  const s = Array.isArray(secretArr) ? secretArr.map(norm).filter(Boolean) : [];
  if (!g.length && !s.length) return { cls:"ok", txt:"Aucun", arrow:"" };
  const inter = g.filter(x => s.includes(x));
  if (inter.length && inter.length === s.length && g.length === s.length) {
    return { cls:"ok", txt: g.map(x => x.charAt(0).toUpperCase()+x.slice(1)).join(", "), arrow:"" };
  }
  if (inter.length) {
    return { cls:"mid", txt: inter.map(x => x.charAt(0).toUpperCase()+x.slice(1)).join(", "), arrow:"" };
  }
  return { cls:"bad", txt: (g.length ? g.join(", ") : "Aucun"), arrow:"" };
}

function compareField(field, guess, secret){
  if (field === "age" || field === "taille" || field === "prime") return compareNumber(guess[field], secret[field]);
  if (field === "haki") return compareHaki(guess.haki, secret.haki);

  const g = guess[field];
  const s = secret[field];

  if (compareExact(g, s)) return { cls:"ok", txt: String(g ?? "—"), arrow:"" };
  return { cls:"bad", txt: String(g ?? "—"), arrow:"" };
}

function makeCell(result){
  const arrow = result.arrow ? `<span class="arrow">${result.arrow}</span>` : "";
  return `<span class="badge ${result.cls}">${esc(result.txt)} ${arrow}</span>`;
}

function render(){
  els.rows.innerHTML = guesses.map(id => {
    const guess = chars.find(c => c.id === id);
    const secret = getSecret();
    if (!guess || !secret) return "";

    const sex = compareField("sexe", guess, secret);
    const race = compareField("race", guess, secret);
    const age = compareField("age", guess, secret);
    const taille = compareField("taille", guess, secret);
    const fruit = compareField("fruit", guess, secret);
    const haki = compareField("haki", guess, secret);
    const prime = compareField("prime", guess, secret);
    const origine = compareField("origine", guess, secret);
    const app = compareField("premiere_apparition", guess, secret);
    const eq = compareField("equipage", guess, secret);
    const role = compareField("role", guess, secret);

    return `
      <tr>
        <td class="nameCell">${esc(guess.name)}</td>
        <td>${makeCell(sex)}</td>
        <td>${makeCell(race)}</td>
        <td>${makeCell(age)}</td>
        <td>${makeCell(taille)}</td>
        <td>${makeCell(fruit)}</td>
        <td>${makeCell(haki)}</td>
        <td>${makeCell(prime)}</td>
        <td>${makeCell(origine)}</td>
        <td>${makeCell(app)}</td>
        <td>${makeCell(eq)}</td>
        <td>${makeCell(role)}</td>
      </tr>
    `;
  }).join("");
}

function findByName(input){
  const q = norm(input);
  if (!q) return null;
  // match exact first
  const exact = chars.find(c => norm(c.name) === q);
  if (exact) return exact;
  // then contains
  return chars.find(c => norm(c.name).includes(q)) || null;
}

function isWin(guess){
  const secret = getSecret();
  if (!secret) return false;
  return guess.id === secret.id;
}

function startNew(which){
  mode = which;
  secretId = (which === "daily") ? pickDailySecret() : pickRandomSecret();
  guesses = [];
  saveState();
  render();
  setMessage(which === "daily" ? "Perso du jour chargé ✅" : "Perso aléatoire chargé ✅", "ok");
}

function resetAll(){
  localStorage.removeItem("opdle_mode");
  localStorage.removeItem("opdle_secretId");
  localStorage.removeItem("opdle_guesses");
  mode = "daily";
  secretId = null;
  guesses = [];
  render();
  setMessage("Reset OK ✅", "ok");
  // relance daily
  startNew("daily");
}

async function loadData(){
  const url = `characters.json?v=${Date.now()}`;
  try{
    const res = await fetch(url, { cache:"no-store" });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    if (!data || !Array.isArray(data.characters)) throw new Error("JSON invalide (attendu: {characters:[...]})");

    // normalize
    chars = data.characters.map(c => ({
      id: Number(c.id),
      name: String(c.name ?? "").trim(),
      sexe: c.sexe ?? "",
      race: c.race ?? "",
      age: (c.age === null || c.age === undefined || c.age === "") ? NaN : Number(c.age),
      taille: (c.taille === null || c.taille === undefined || c.taille === "") ? NaN : Number(c.taille),
      fruit: c.fruit ?? "Aucun",
      haki: Array.isArray(c.haki) ? c.haki : (c.haki ? [c.haki] : []),
      prime: (c.prime === null || c.prime === undefined || c.prime === "") ? NaN : Number(c.prime),
      origine: c.origine ?? "",
      premiere_apparition: c.premiere_apparition ?? "",
      equipage: c.equipage ?? "",
      role: c.role ?? ""
    })).filter(c => Number.isFinite(c.id) && c.name);

    loadState();

    if (!secretId || !chars.some(c => c.id === secretId)) {
      secretId = (mode === "random") ? pickRandomSecret() : pickDailySecret();
    }
    // clean guesses
    guesses = guesses.filter(id => chars.some(c => c.id === id));
    saveState();

    render();
    setMessage("Prêt. Fais ton premier guess 👇", "info");
  }catch(e){
    console.error(e);
    setMessage("Erreur chargement JSON : " + e.message, "error");
  }
}

// Events
els.guess.addEventListener("input", updateSuggest);
els.guess.addEventListener("focus", updateSuggest);
document.addEventListener("click", (e) => {
  if (!els.suggest.contains(e.target) && e.target !== els.guess) {
    els.suggest.classList.remove("open");
  }
});

function submitGuess(){
  const c = findByName(els.guess.value);
  if (!c) { setMessage("Perso introuvable. Tape un nom (ou clique une suggestion).", "error"); return; }
  if (guesses.includes(c.id)) { setMessage("Tu l’as déjà tenté 🙂", "info"); return; }

  guesses.unshift(c.id);
  saveState();
  render();

  if (isWin(c)) {
    setMessage(`GG ! C’était ${c.name} 🟩`, "ok");
  } else {
    setMessage("Pas encore… continue 😈", "info");
  }
  els.guess.value = "";
  els.suggest.classList.remove("open");
  els.guess.focus();
}

els.submit.addEventListener("click", submitGuess);
els.guess.addEventListener("keydown", (e) => {
  if (e.key === "Enter") submitGuess();
});

els.newDaily.addEventListener("click", () => startNew("daily"));
els.newRandom.addEventListener("click", () => startNew("random"));
els.reset.addEventListener("click", resetAll);

loadData();
