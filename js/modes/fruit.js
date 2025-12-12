import {norm, escapeHTML, clamp} from "../utils.js";

const MAX_TRIES = 10;

export function mountFruit(ctx){
  const {characters, target, stage, input, btn, hintBtn} = ctx;
  let state = ctx.state;

  // Pour ce mode, on prend un perso qui a un fruit (sinon c'est nul).
  // On choisit un target "daily" déjà, mais si pas de fruit on repioche de manière stable.
  let fruitTarget = target;
  if(!fruitTarget.fruit){
    const withFruit = characters.filter(c=>c.fruit && c.fruit.name);
    fruitTarget = withFruit[(withFruit.length + (target.id||0)) % withFruit.length];
  }

  const fruitImg = fruitTarget.fruit?.filename
    ? `./assets/fruits/${fruitTarget.fruit.filename}`
    : "./assets/img/fruit_placeholder.png";

  function render(){
    const tries = state.guesses.length;
    const typeUnlocked = tries >= 4;
    const nameUnlocked = tries >= 8;

    const fruitType = typeUnlocked ? (fruitTarget.fruit?.type || "—") : "🔒";
    const fruitName = nameUnlocked ? (fruitTarget.fruit?.name || "—") : "🔒";

    const guessBadges = state.guesses.map((g,i)=>{
      const ok = norm(g.name)===norm(fruitTarget.name);
      const dot = ok ? "green" : "red";
      return `<span class="badge"><span class="dot ${dot}"></span>#${i+1} ${escapeHTML(g.name)}</span>`;
    }).join(" ");

    stage.innerHTML = `
      <div class="stageBox">
        <div class="mediaBox">
          <div class="media">
            <img alt="Fruit du démon" src="${fruitImg}" onerror="this.src='./assets/img/fruit_placeholder.png'" />
          </div>
          <div class="grow">
            <div class="badge"><span class="dot blue"></span>Essais: ${tries}/${MAX_TRIES}</div>
            <p class="help">Devine à qui appartient ce fruit.</p>
            <div class="note">
              <b>Indices</b><br/>
              • Type (4 essais): <b>${escapeHTML(fruitType)}</b><br/>
              • Nom (8 essais): <b>${escapeHTML(fruitName)}</b>
            </div>
            <div class="row gap" style="flex-wrap:wrap; margin-top:.6rem">${guessBadges || "<span class='help'>Aucune tentative.</span>"}</div>
          </div>
        </div>
      </div>
    `;

    if(state.done){
      const win = state.win;
      const msg = win
        ? `✅ GG ! C’était <b>${escapeHTML(fruitTarget.name)}</b>.`
        : `❌ Perdu… C’était <b>${escapeHTML(fruitTarget.name)}</b>.`;
      stage.innerHTML += `<div class="note" style="margin-top:.8rem">${msg}</div>`;
      input.disabled = true; btn.disabled = true;
    }
  }

  function commit(next){
    state = next;
    ctx.onStateChange(state);
    render();
  }

  function findByName(name){
    const n = norm(name);
    return characters.find(c=>norm(c.name)===n);
  }

  function guess(){
    if(state.done) return;
    const name = input.value.trim();
    if(!name) return;
    const c = findByName(name);
    if(!c) return;
    if(state.guesses.some(g=>norm(g.name)===norm(c.name))) return;

    const nextGuesses = [...state.guesses, c];
    const win = norm(c.name) === norm(fruitTarget.name);
    const done = win || nextGuesses.length >= MAX_TRIES;
    commit({guesses: nextGuesses, done, win});
    input.value = "";
  }

  btn.addEventListener("click", guess);
  input.addEventListener("keydown", (e)=>{ if(e.key==="Enter") guess(); });

  hintBtn.addEventListener("click", ()=>{
    const tries = state.guesses.length;
    const typeUnlocked = tries >= 4;
    const nameUnlocked = tries >= 8;
    const lines = [
      `Type: ${typeUnlocked ? "✅" : "🔒 (4 essais)"}`,
      `Nom du fruit: ${nameUnlocked ? "✅" : "🔒 (8 essais)"}`
    ];
    ctx.helpLine.textContent = lines.join(" • ");
  });

  render();
}
