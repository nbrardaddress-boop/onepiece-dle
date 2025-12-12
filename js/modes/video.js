import {loadJSON, pickDaily, norm, escapeHTML, clamp} from "../utils.js";

const MAX_TRIES = 10;

export async function mountVideo(ctx){
  const {characters, stage, input, btn} = ctx;
  let state = ctx.state;

  const videos = await loadJSON("./data/videos.json");
  const item = pickDaily(videos, "video");
  const targetName = item.character;

  function findByName(name){
    const n = norm(name);
    return characters.find(c=>norm(c.name)===n);
  }

  function blurForTry(tries){
    // 0 => 18px blur, 9 => 0px
    const t = clamp(tries, 0, MAX_TRIES-1);
    return 18 - (18 * (t/(MAX_TRIES-1)));
  }

  function render(){
    const tries = state.guesses.length;
    const blur = blurForTry(tries);

    const guessBadges = state.guesses.map((g,i)=>{
      const ok = norm(g.name)===norm(targetName);
      const dot = ok ? "green" : "red";
      return `<span class="badge"><span class="dot ${dot}"></span>#${i+1} ${escapeHTML(g.name)}</span>`;
    }).join(" ");

    stage.innerHTML = `
      <div class="stageBox">
        <div class="mediaBox">
          <div class="media" style="width:420px">
            <video controls playsinline preload="metadata"
                   style="filter: blur(${blur}px); transition: filter .25s ease;">
              <source src="${escapeHTML(item.src)}" type="video/mp4" />
            </video>
          </div>
          <div class="grow">
            <div class="badge"><span class="dot blue"></span>Essais: ${tries}/${MAX_TRIES}</div>
            <p class="help">Chaque essai défloute un peu.</p>
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
