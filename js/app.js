import {qs, loadJSON, pickDaily, readState, saveState, resetState, norm, uniqueBy} from "./utils.js";
import {mountClassic} from "./modes/classic.js";
import {mountFruit} from "./modes/fruit.js";
import {mountQuote} from "./modes/quote.js";
import {mountSilhouette} from "./modes/silhouette.js";
import {mountVideo} from "./modes/video.js";

const mode = (qs("mode") || "classic").toLowerCase();
const modes = {
  classic: {title:"Classic", sub:"Deviner un personnage", mount: mountClassic, salt:"classic"},
  fruit: {title:"Fruit du démon", sub:"Deviner le possesseur", mount: mountFruit, salt:"fruit"},
  quote: {title:"Citation", sub:"Deviner qui parle", mount: mountQuote, salt:"quote"},
  silhouette: {title:"Silhouette", sub:"Dézoom progressif", mount: mountSilhouette, salt:"silhouette"},
  video: {title:"Vidéo", sub:"Défloutage progressif", mount: mountVideo, salt:"video"},
};

const cfg = modes[mode] || modes.classic;
document.getElementById("modeTitle").textContent = `Onepiecedle • ${cfg.title}`;
document.getElementById("modeSub").textContent = cfg.sub;
document.getElementById("footerLine").textContent = `${cfg.title} • ${new Date().toLocaleDateString("fr-FR")}`;

const input = document.getElementById("guessInput");
const btn = document.getElementById("guessBtn");
const hintBtn = document.getElementById("hintBtn");
const resetBtn = document.getElementById("resetBtn");
const stage = document.getElementById("stage");
const historyEl = document.getElementById("history");
const helpLine = document.getElementById("helpLine");
const namesList = document.getElementById("namesList");

function renderHistory(state){
  if(!state?.guesses?.length){
    historyEl.innerHTML = "<div class='help'>Aucune tentative pour le moment.</div>";
    return;
  }
  const items = state.guesses.map((g,i)=>`<div class="badge"><span class="dot blue"></span>#${i+1} ${g.name}</div>`).join(" ");
  historyEl.innerHTML = `<div class="row gap" style="flex-wrap:wrap">${items}</div>`;
}

function setAutocomplete(characters){
  const opts = uniqueBy(characters, c=>norm(c.name)).map(c=>`<option value="${c.name}"></option>`).join("");
  namesList.innerHTML = opts;
}

(async function init(){
  try{
    const characters = await loadJSON("./data/characters.json");
    setAutocomplete(characters);

    const state = readState(mode) || {guesses:[], done:false, win:false};
    renderHistory(state);

    const target = pickDaily(characters, cfg.salt);

    const ctx = {
      mode,
      cfg,
      characters,
      target,
      state,
      stage,
      input,
      btn,
      hintBtn,
      resetBtn,
      helpLine,
      onStateChange(next){
        saveState(mode, next);
        renderHistory(next);
      }
    };

    cfg.mount(ctx);

  } catch (e){
    stage.innerHTML = `<div class="note">❌ ${e.message}<br/><br/>Vérifie que <code>/data/characters.json</code> est bien présent (et accessible sur GitHub Pages).</div>`;
    console.error(e);
  }
})();
