import {loadJSON, pickDaily, norm, escapeHTML, clamp} from "../utils.js";

const MAX_TRIES = 10;

export async function mountSilhouette(ctx){
  const {characters, stage, input, btn} = ctx;
  let state = ctx.state;

  const silhouettes = await loadJSON("./data/silhouettes.json");
  const item = pickDaily(silhouettes, "silhouette");
  const targetName = item.character;

  function findByName(name){
    const n = norm(name);
    return characters.find(c=>norm(c.name)===n);
  }

  function zoomForTry(tries){
    // 0 => 3.2x (très zoom), 9 => 1.0x (dézoom complet)
    const t = clamp(tries, 0, MAX_TRIES-1);
    return 3.2 - (2.2 * (t/(MAX_TRIES-1)));
  }

  function render(){
    const tries = state.guesses.length;
    const zoom = zoomForTry(tries);

    const guessBadges = state.guesses.map((g,i)=>{
      const ok = norm(g.name)===norm(targetName);
      const dot = ok ? "green" : "red";
      return `<span class="badge"><span class="dot ${dot}"></span>#${i+1} ${escapeHTML(g.name)}</span>`;
    }).join(" ");

    stage.innerHTML = `
      <div class="stageBox">
        <div class="mediaBox">
          <div class="media" style="width:340px">
            <div style="background:#000; position:relative">
              <img alt="Silhouette" src="${escapeHTML(item.src)}"
                   style="transform:scale(${zoom}); transform-origin:center; filter:brightness(0) contrast(1.2);
                          transition: transform .25s ease; display:block;"
                   onerror="this.src='./assets/img/silhouette_placeholder.png'"/>
            </div>
          </div>
          <div class="grow">
            <div class="badge"><span class="dot blue"></span>Essais: ${tries}/${MAX_TRIES}</div>
            <p class="help">Chaque essai dézoome un peu.</p>
            <div class="row gap" style="flex-wrap:wrap; margin-top:.6rem">${guessBadges || "<span class='help'>Aucune tentative.</span>"}</div>
          </div>
        </div>
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

  render();
}
