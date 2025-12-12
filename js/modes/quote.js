import {loadJSON, pickDaily, norm, escapeHTML} from "../utils.js";

const MAX_TRIES = 10;

export async function mountQuote(ctx){
  const {characters, stage, input, btn, hintBtn} = ctx;
  let state = ctx.state;

  const quotes = await loadJSON("./data/quotes.json");
  const quote = pickDaily(quotes, "quote");
  const targetName = quote.speaker;

  function findByName(name){
    const n = norm(name);
    return characters.find(c=>norm(c.name)===n);
  }

  function render(){
    const tries = state.guesses.length;
    const recUnlocked = tries >= 4;
    const sagaUnlocked = tries >= 8;

    const rec = recUnlocked ? (quote.recipients?.join(", ") || "—") : "🔒";
    const saga = sagaUnlocked ? (quote.saga || "—") : "🔒";

    const guessBadges = state.guesses.map((g,i)=>{
      const ok = norm(g.name)===norm(targetName);
      const dot = ok ? "green" : "red";
      return `<span class="badge"><span class="dot ${dot}"></span>#${i+1} ${escapeHTML(g.name)}</span>`;
    }).join(" ");

    stage.innerHTML = `
      <div class="stageBox">
        <div class="note" style="font-size:1.05rem">
          “${escapeHTML(quote.text)}”
        </div>
        <div class="row gap small" style="margin-top:.6rem; flex-wrap:wrap">
          <div class="badge"><span class="dot blue"></span>Essais: ${tries}/${MAX_TRIES}</div>
          <div class="badge"><span class="dot blue"></span>Mode: Citation</div>
        </div>
        <div class="note" style="margin-top:.6rem">
          <b>Indices</b><br/>
          • Destinataire(s) (4 essais): <b>${escapeHTML(rec)}</b><br/>
          • Saga (8 essais): <b>${escapeHTML(saga)}</b>
        </div>
        <div class="row gap" style="flex-wrap:wrap; margin-top:.6rem">${guessBadges || "<span class='help'>Aucune tentative.</span>"}</div>
      </div>
    `;

    if(state.done){
      const win = state.win;
      const msg = win
        ? `✅ GG ! C’était <b>${escapeHTML(targetName)}</b>.`
        : `❌ Perdu… C’était <b>${escapeHTML(targetName)}</b>.`;
      stage.innerHTML += `<div class="note" style="margin-top:.8rem">${msg}</div>`;
      input.disabled = true; btn.disabled = true;
    }
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
    if(!c) return;
    if(state.guesses.some(g=>norm(g.name)===norm(c.name))) return;

    const nextGuesses = [...state.guesses, c];
    const win = norm(c.name) === norm(targetName);
    const done = win || nextGuesses.length >= MAX_TRIES;
    commit({guesses: nextGuesses, done, win});
    input.value = "";
  }

  btn.addEventListener("click", guess);
  input.addEventListener("keydown", (e)=>{ if(e.key==="Enter") guess(); });

  hintBtn.addEventListener("click", ()=>{
    const tries = state.guesses.length;
    ctx.helpLine.textContent =
      `Destinataire(s): ${tries>=4?"✅":"🔒 (4 essais)"} • Saga: ${tries>=8?"✅":"🔒 (8 essais)"}`;
  });

  render();
}
