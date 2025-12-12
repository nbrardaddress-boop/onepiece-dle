import {norm, moneyToInt, sizeToCm, compareText, compareNumber, cellHTML, escapeHTML} from "../utils.js";

const MAX_TRIES = 12;

// Colonnes (on affiche certaines seulement après X essais)
const COLUMNS = [
  {key:"gender", label:"Genre", unlock:0, type:"text"},
  {key:"affiliation", label:"Affiliation", unlock:10, type:"text"},
  {key:"fruitType", label:"Fruit", unlock:0, type:"text"},
  {key:"haki", label:"Haki", unlock:0, type:"text"},
  {key:"bounty", label:"Prime", unlock:0, type:"bounty"},
  {key:"height", label:"Taille", unlock:0, type:"height"},
  {key:"origin", label:"Origine", unlock:0, type:"text"},
  {key:"firstSaga", label:"Saga", unlock:5, type:"text"},
  {key:"firstArc", label:"Arc", unlock:0, type:"text"},
  {key:"race", label:"Race", unlock:0, type:"text"},
  {key:"role", label:"Rôle", unlock:0, type:"text"},
];

function getField(c, key){
  const m = c.meta || {};
  if(key === "gender") return m.gender;
  if(key === "race") return m.race;
  if(key === "origin") return m.origin;
  if(key === "firstArc") return m.firstArc;
  if(key === "firstSaga") return m.firstSaga;
  if(key === "haki") return (m.haki || []).join(", ") || null;
  if(key === "role") return m.role;
  if(key === "affiliation") return m.affiliation || c.crew?.name || null;
  if(key === "fruitType") return c.fruit?.type || m.fruitType || (c.fruit ? "?" : null);
  if(key === "bounty") return c.bounty || m.bounty || null;
  if(key === "height") return c.size || m.height || null;
  return m[key] ?? null;
}

function compareCell(key, guess, target){
  const g = getField(guess, key);
  const t = getField(target, key);

  if(key === "bounty"){
    const gi = moneyToInt(g);
    const ti = moneyToInt(t);
    const r = compareNumber(gi, ti);
    // label: on garde le format d'origine si possible
    const label = g ?? "—";
    return {state:r.state, label: (gi==null||ti==null) ? "—" : `${label} ${r.label.endsWith("↑")||r.label.endsWith("↓") ? r.label.slice(-1) : ""}`.trim()};
  }

  if(key === "height"){
    const gi = sizeToCm(g);
    const ti = sizeToCm(t);
    const r = compareNumber(gi, ti);
    const label = g ?? "—";
    return {state:r.state, label: (gi==null||ti==null) ? "—" : `${label} ${r.label.endsWith("↑")||r.label.endsWith("↓") ? r.label.slice(-1) : ""}`.trim()};
  }

  return compareText(g, t);
}

function renderTable(guesses, target, tries){
  const head = COLUMNS.map(c=>`<th>${escapeHTML(c.label)}</th>`).join("");
  const rows = guesses.map((g, idx)=>{
    const cells = COLUMNS.map(col=>{
      if(tries < col.unlock){
        return `<td class="cell small"><span class="dot blue"></span> ?</td>`;
      }
      const {state,label} = compareCell(col.key, g, target);
      return cellHTML(label, state, true);
    }).join("");
    return `<tr>${cells}</tr>`;
  }).join("");

  return `
    <div class="stageBox">
      <div class="row gap small" style="justify-content:space-between; align-items:center">
        <div class="badge"><span class="dot blue"></span>Essais: ${tries}/${MAX_TRIES}</div>
        <div class="badge"><span class="dot blue"></span>Objectif: <b>${escapeHTML(target.name)}</b> (caché)</div>
      </div>
      <div class="tableWrap" style="margin-top:.7rem">
        <table class="table">
          <thead><tr>${head}</tr></thead>
          <tbody>${rows}</tbody>
        </table>
      </div>
    </div>
  `;
}

export function mountClassic(ctx){
  const {characters, target, stage, input, btn, hintBtn, resetBtn, helpLine} = ctx;
  let state = ctx.state;

  function findByName(name){
    const n = norm(name);
    return characters.find(c=>norm(c.name)===n);
  }

  function render(){
    const tries = state.guesses.length;
    stage.innerHTML = renderTable(state.guesses, target, tries);

    if(state.done){
      const win = state.win;
      const msg = win
        ? `✅ GG ! C’était <b>${escapeHTML(target.name)}</b>.`
        : `❌ Perdu… C’était <b>${escapeHTML(target.name)}</b>.`;
      stage.innerHTML += `<div class="note" style="margin-top:.8rem">${msg}</div>`;
      input.disabled = true; btn.disabled = true;
    }else{
      input.disabled = false; btn.disabled = false;
    }

    const nextUnlockSaga = 5 - tries;
    const nextUnlockAff = 10 - tries;
    const hints = [];
    if(nextUnlockSaga>0) hints.push(`Saga à ${nextUnlockSaga} essai(s)`);
    if(nextUnlockAff>0) hints.push(`Affiliation à ${nextUnlockAff} essai(s)`);
    helpLine.textContent = hints.length ? `Indices à venir: ${hints.join(" • ")}` : "Tous les indices sont débloqués.";
  }

  function commit(next){
    state = next;
    ctx.onStateChange(state);
    render();
  }

  function guess(){
    if(state.done) return;
    const name = input.value.trim();
    if(!name) return;
    const c = findByName(name);
    if(!c){
      helpLine.textContent = "Perso introuvable dans la base. (Vérifie l’orthographe ou ajoute-le dans data.)";
      return;
    }
    if(state.guesses.some(g=>norm(g.name)===norm(c.name))){
      helpLine.textContent = "Tu l’as déjà tenté 😉";
      return;
    }
    const nextGuesses = [...state.guesses, c];
    const win = norm(c.name) === norm(target.name);
    const done = win || nextGuesses.length >= MAX_TRIES;
    commit({guesses: nextGuesses, done, win});
    input.value = "";
  }

  btn.addEventListener("click", guess);
  input.addEventListener("keydown", (e)=>{ if(e.key==="Enter") guess(); });

  hintBtn.addEventListener("click", ()=>{
    const tries = state.guesses.length;
    const sagaUnlocked = tries >= 5;
    const affUnlocked = tries >= 10;
    const lines = [
      `Saga: ${sagaUnlocked ? "✅" : "🔒 (5 essais)"}`,
      `Affiliation: ${affUnlocked ? "✅" : "🔒 (10 essais)"}`,
      `Haki / Fruit / Prime / Taille / Origine: ✅`,
    ];
    helpLine.textContent = lines.join(" • ");
  });

  resetBtn.addEventListener("click", ()=>{
    if(confirm("Reset ce mode pour aujourd’hui ?")){
      localStorage.removeItem(`onepiecedle:classic:${new Date().toISOString().slice(0,10)}`);
      location.reload();
    }
  });

  render();
}
