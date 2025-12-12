// Same logic as previous rich DLE version
let DB=[], secret=null;

const els={
  input:document.getElementById('guessInput'),
  btn:document.getElementById('guessBtn'),
  rows:document.getElementById('rows'),
  status:document.getElementById('status'),
  sugg:document.getElementById('suggestions'),
  reset:document.getElementById('reset'),
  reveal:document.getElementById('reveal'),
};

function dayKey(){
  const base=new Date('2020-01-01');
  return Math.floor((Date.now()-base)/86400000);
}

function compareExact(a,b){
  if(!a||!b) return {c:'bad',t:'?'};
  return a===b?{c:'ok',t:a}:{c:'bad',t:a};
}
function compareNum(a,b){
  if(a==null||b==null) return {c:'bad',t:'?'};
  if(a===b) return {c:'ok',t:a};
  return {c:'bad',t:a,arr:a<b?'⬆':'⬇'};
}
function compareHaki(a,b){
  a=a||[];b=b||[];
  if(!a.length&&!b.length) return {c:'ok',t:'Aucun'};
  const common=a.filter(x=>b.includes(x));
  if(common.length===a.length&&a.length===b.length) return {c:'ok',t:a.join(', ')};
  if(common.length) return {c:'partial',t:a.join(', ')};
  return {c:'bad',t:a.join(', ')||'Aucun'};
}

function cell(cls,txt,arr){
  return `<div class="cell ${cls}">${txt}${arr||''}</div>`;
}

function rowHTML(g){
  return `<div class="row">
    <div class="cell name">
      <div class="avatar">${g.image?`<img src="${g.image}">`:''}</div>
      ${g.name}
    </div>
    ${(()=>{const x=compareExact(g.sexe,secret.sexe);return cell(x.c,x.t)})()}
    ${(()=>{const x=compareExact(g.race,secret.race);return cell(x.c,x.t)})()}
    ${(()=>{const x=compareNum(g.age,secret.age);return cell(x.c,x.t,x.arr)})()}
    ${(()=>{const x=compareNum(g.taille,secret.taille);return cell(x.c,x.t,x.arr)})()}
    ${(()=>{const x=compareExact(g.fruit,secret.fruit);return cell(x.c,x.t)})()}
    ${(()=>{const x=compareHaki(g.haki,secret.haki);return cell(x.c,x.t)})()}
    ${(()=>{const x=compareNum(g.prime,secret.prime);return cell(x.c,x.t,x.arr)})()}
    ${(()=>{const x=compareExact(g.origine,secret.origine);return cell(x.c,x.t)})()}
    ${(()=>{const x=compareExact(g.premiere_apparition,secret.premiere_apparition);return cell(x.c,x.t)})()}
    ${(()=>{const x=compareExact(g.equipage,secret.equipage);return cell(x.c,x.t)})()}
    ${(()=>{const x=compareExact(g.role,secret.role);return cell(x.c,x.t)})()}
  </div>`;
}

function renderGuess(g){
  els.rows.insertAdjacentHTML('afterbegin',rowHTML(g));
}

function findByName(q){
  q=q.toLowerCase();
  return DB.filter(p=>p.name.toLowerCase().includes(q)).slice(0,8);
}

els.input.oninput=()=>{
  const q=els.input.value.trim();
  if(!q){els.sugg.classList.remove('open');return;}
  const res=findByName(q);
  els.sugg.innerHTML=res.map(p=>`<div class="sug">${p.name}</div>`).join('');
  els.sugg.classList.add('open');
  [...els.sugg.children].forEach((el,i)=>{
    el.onclick=()=>{els.input.value=res[i].name;els.sugg.classList.remove('open');};
  });
};

els.btn.onclick=()=>{
  const g=DB.find(p=>p.name.toLowerCase()===els.input.value.toLowerCase());
  if(!g) return;
  renderGuess(g);
  if(g.id===secret.id) els.status.textContent='GG ! 🎉';
  els.input.value='';
};

els.reset.onclick=()=>{els.rows.innerHTML='';els.status.textContent='';};
els.reveal.onclick=()=>{renderGuess(secret);};

fetch('characters.json')
  .then(r=>r.json())
  .then(d=>{
    DB=d.characters;
    secret=DB[dayKey()%DB.length];
  });
